import Receipt from "../model/receiptModel.js";
import Invoice from "../model/invoiceModel.js";
import Customer from "../model/customerModel.js";
import { getNextSequence } from "../model/counterModel.js";
import { isValidObjectId } from "../utils/validators.js";
import { generateDocumentPdf } from "../utils/pdfGenerator.js";

const applyPaymentToInvoice = async (invoiceId, amount) => {
  const invoice = await Invoice.findById(invoiceId);
  if (!invoice) {
    throw Object.assign(new Error(`Invoice ${invoiceId} not found`), { statusCode: 404 });
  }
  if (invoice.status === "Cancelled") {
    throw Object.assign(new Error(`Invoice ${invoice.invoiceNo} is cancelled`), { statusCode: 400 });
  }
  if (amount > invoice.balanceAmount + 0.001) {
    throw Object.assign(
      new Error(`Amount exceeds the pending balance (${invoice.balanceAmount}) for invoice ${invoice.invoiceNo}`),
      { statusCode: 400 }
    );
  }

  invoice.paidAmount = Number((invoice.paidAmount + amount).toFixed(2));
  invoice.balanceAmount = Number((invoice.totalAmount - invoice.paidAmount).toFixed(2));
  invoice.paymentStatus =
    invoice.balanceAmount <= 0.001 ? "Paid" : invoice.paidAmount > 0 ? "Partially Paid" : "Unpaid";
  await invoice.save();
  return invoice;
};

// @desc   Create an Advance receipt (no invoice allocation yet)
// @route  POST /api/v1/receipts/advance
export const createAdvanceReceipt = async (req, res, next) => {
  try {
    const { customer: customerId, amount, paymentMode } = req.body;

    if (!customerId || !isValidObjectId(customerId)) {
      return res.status(400).json({ success: false, message: "A valid customer is required" });
    }
    if (!amount || Number(amount) <= 0) {
      return res.status(400).json({ success: false, message: "A valid amount is required" });
    }
    if (!["Cash", "Bank"].includes(paymentMode)) {
      return res.status(400).json({ success: false, message: "Mode of payment must be Cash or Bank" });
    }

    const customer = await Customer.findById(customerId);
    if (!customer) {
      return res.status(404).json({ success: false, message: "Customer not found" });
    }

    const receiptNo = await getNextSequence("receipt", "RCT-");

    const receipt = await Receipt.create({
      receiptNo,
      type: "Advance",
      customer: customerId,
      amount,
      paymentMode,
      remainingAdvance: amount,
      createdBy: req.user._id,
    });

    const pdfPath = await generateDocumentPdf({
      title: "ADVANCE RECEIPT",
      docNumber: receiptNo,
      fileNamePrefix: "advance-receipt",
      metaLines: [
        { label: "Date", value: new Date().toDateString() },
        { label: "Mode of Payment", value: paymentMode },
      ],
      customer: { companyName: customer.companyName, contactPersonName: customer.contactPersonName },
      summaryLines: [{ label: "Amount Received", value: Number(amount).toFixed(2) }],
    });

    receipt.pdfUrl = `/${pdfPath}`;
    await receipt.save();

    res.status(201).json({ success: true, message: "Advance receipt created successfully", data: receipt });
  } catch (err) {
    next(err);
  }
};

// @desc   Get pending invoices for a customer (used before creating a Collection receipt)
// @route  GET /api/v1/receipts/pending-invoices/:customerId
export const getPendingInvoices = async (req, res, next) => {
  try {
    const { customerId } = req.params;
    if (!isValidObjectId(customerId)) {
      return res.status(400).json({ success: false, message: "Invalid customer id" });
    }
    const invoices = await Invoice.find({
      customer: customerId,
      status: "Active",
      balanceAmount: { $gt: 0 },
    }).sort({ invoiceDate: 1 });

    res.status(200).json({ success: true, message: "Pending invoices fetched", data: invoices });
  } catch (err) {
    next(err);
  }
};

// @desc   Create a Collection receipt applied (fully or partially) against pending invoice(s)
// @route  POST /api/v1/receipts/collection
export const createCollectionReceipt = async (req, res, next) => {
  try {
    const { customer: customerId, paymentMode, allocations } = req.body;

    if (!customerId || !isValidObjectId(customerId)) {
      return res.status(400).json({ success: false, message: "A valid customer is required" });
    }
    if (!["Cash", "Bank"].includes(paymentMode)) {
      return res.status(400).json({ success: false, message: "Mode of payment must be Cash or Bank" });
    }
    if (!Array.isArray(allocations) || allocations.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one invoice allocation (invoice + amount) is required",
      });
    }

    const customer = await Customer.findById(customerId);
    if (!customer) {
      return res.status(404).json({ success: false, message: "Customer not found" });
    }

    let totalAmount = 0;
    for (const alloc of allocations) {
      if (!alloc.invoice || !isValidObjectId(alloc.invoice) || !alloc.amount || Number(alloc.amount) <= 0) {
        return res.status(400).json({ success: false, message: "Each allocation requires a valid invoice and amount" });
      }
      totalAmount += Number(alloc.amount);
    }

    // Apply payments to each invoice (validates balances / ownership by customer implicitly via invoice lookup).
    for (const alloc of allocations) {
      const invoice = await applyPaymentToInvoice(alloc.invoice, Number(alloc.amount));
      if (String(invoice.customer) !== String(customerId)) {
        return res.status(400).json({
          success: false,
          message: `Invoice ${invoice.invoiceNo} does not belong to the selected customer`,
        });
      }
    }

    const receiptNo = await getNextSequence("receipt", "RCT-");

    const receipt = await Receipt.create({
      receiptNo,
      type: "Collection",
      customer: customerId,
      amount: Number(totalAmount.toFixed(2)),
      paymentMode,
      allocations: allocations.map((a) => ({ invoice: a.invoice, amount: Number(a.amount) })),
      createdBy: req.user._id,
    });

    const pdfPath = await generateDocumentPdf({
      title: "COLLECTION RECEIPT",
      docNumber: receiptNo,
      fileNamePrefix: "collection-receipt",
      metaLines: [
        { label: "Date", value: new Date().toDateString() },
        { label: "Mode of Payment", value: paymentMode },
      ],
      customer: { companyName: customer.companyName, contactPersonName: customer.contactPersonName },
      summaryLines: [{ label: "Total Amount Collected", value: receipt.amount.toFixed(2) }],
    });

    receipt.pdfUrl = `/${pdfPath}`;
    await receipt.save();

    res.status(201).json({ success: true, message: "Collection receipt created successfully", data: receipt });
  } catch (err) {
    next(err);
  }
};

// @desc   Show advance balance available for a customer (step 1 of Advance Adjustment)
// @route  GET /api/v1/receipts/advance-balance/:customerId
export const getAdvanceBalance = async (req, res, next) => {
  try {
    const { customerId } = req.params;
    if (!isValidObjectId(customerId)) {
      return res.status(400).json({ success: false, message: "Invalid customer id" });
    }

    const advanceReceipts = await Receipt.find({
      customer: customerId,
      type: "Advance",
      status: "Active",
      remainingAdvance: { $gt: 0 },
    }).sort({ createdAt: 1 });

    const totalAdvance = advanceReceipts.reduce((sum, r) => sum + r.remainingAdvance, 0);

    res.status(200).json({
      success: true,
      message: "Advance balance fetched",
      data: { advanceReceipts, totalAdvance: Number(totalAdvance.toFixed(2)) },
    });
  } catch (err) {
    next(err);
  }
};

// @desc   Adjust a customer's advance against pending invoice(s)
// @route  POST /api/v1/receipts/advance-adjustment
export const createAdvanceAdjustment = async (req, res, next) => {
  try {
    const { customer: customerId, allocations } = req.body;

    if (!customerId || !isValidObjectId(customerId)) {
      return res.status(400).json({ success: false, message: "A valid customer is required" });
    }
    if (!Array.isArray(allocations) || allocations.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one invoice allocation (invoice + amount) is required",
      });
    }

    const totalRequested = allocations.reduce((sum, a) => sum + Number(a.amount || 0), 0);

    const advanceReceipts = await Receipt.find({
      customer: customerId,
      type: "Advance",
      status: "Active",
      remainingAdvance: { $gt: 0 },
    }).sort({ createdAt: 1 });

    const totalAvailable = advanceReceipts.reduce((sum, r) => sum + r.remainingAdvance, 0);
    if (totalRequested > totalAvailable + 0.001) {
      return res.status(400).json({
        success: false,
        message: `Requested adjustment (${totalRequested}) exceeds available advance balance (${totalAvailable})`,
      });
    }

    // Apply to invoices first.
    for (const alloc of allocations) {
      if (!alloc.invoice || !isValidObjectId(alloc.invoice) || !alloc.amount || Number(alloc.amount) <= 0) {
        return res.status(400).json({ success: false, message: "Each allocation requires a valid invoice and amount" });
      }
      const invoice = await applyPaymentToInvoice(alloc.invoice, Number(alloc.amount));
      if (String(invoice.customer) !== String(customerId)) {
        return res.status(400).json({
          success: false,
          message: `Invoice ${invoice.invoiceNo} does not belong to the selected customer`,
        });
      }
    }

    // Draw down the oldest advance receipts first (FIFO) until totalRequested is covered.
    let remainingToDraw = totalRequested;
    for (const advReceipt of advanceReceipts) {
      if (remainingToDraw <= 0) break;
      const draw = Math.min(advReceipt.remainingAdvance, remainingToDraw);
      advReceipt.remainingAdvance = Number((advReceipt.remainingAdvance - draw).toFixed(2));
      remainingToDraw = Number((remainingToDraw - draw).toFixed(2));
      await advReceipt.save();
    }

    const receiptNo = await getNextSequence("receipt", "RCT-");
    const receipt = await Receipt.create({
      receiptNo,
      type: "AdvanceAdjustment",
      customer: customerId,
      amount: Number(totalRequested.toFixed(2)),
      allocations: allocations.map((a) => ({ invoice: a.invoice, amount: Number(a.amount) })),
      sourceAdvanceReceipt: advanceReceipts[0]?._id || null,
      createdBy: req.user._id,
    });

    res.status(201).json({ success: true, message: "Advance adjusted successfully", data: receipt });
  } catch (err) {
    next(err);
  }
};

// @desc   List receipts
// @route  GET /api/v1/receipts?customerId=&type=
export const getAllReceipts = async (req, res, next) => {
  try {
    const { customerId, type } = req.query;
    const filter = {};
    if (customerId) filter.customer = customerId;
    if (type) filter.type = type;

    const receipts = await Receipt.find(filter)
      .populate("customer", "companyName")
      .populate("allocations.invoice", "invoiceNo")
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, message: "Receipts fetched", data: receipts });
  } catch (err) {
    next(err);
  }
};

// @desc   Get single receipt
// @route  GET /api/v1/receipts/:id
export const getReceiptById = async (req, res, next) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid receipt id" });
    }
    const receipt = await Receipt.findById(req.params.id)
      .populate("customer")
      .populate("allocations.invoice");
    if (!receipt) {
      return res.status(404).json({ success: false, message: "Receipt not found" });
    }
    res.status(200).json({ success: true, message: "Receipt fetched", data: receipt });
  } catch (err) {
    next(err);
  }
};
