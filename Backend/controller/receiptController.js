import Receipt from "../model/receiptModel.js";
import Invoice from "../model/invoiceModel.js";
import Customer from "../model/customerModel.js";
import { getNextSequence } from "../model/counterModel.js";
import { isValidObjectId, isFiniteNumber } from "../utils/validators.js";
import { generateReceiptPdf } from "../utils/pdfGenerator.js";
import { withMongoTransaction } from "../utils/transaction.js";
import { logger } from "../utils/logger.js";

const money = (value) => Number(Number(value).toFixed(2));
const createWithSession = async (Model, doc, session) => {
  if (!session) return Model.create(doc);
  const [created] = await Model.create([doc], { session });
  return created;
};

const normalizeAllocations = (allocations) => {
  if (!Array.isArray(allocations) || allocations.length === 0) {
    throw Object.assign(new Error("At least one invoice allocation (invoice + amount) is required"), { statusCode: 400 });
  }
  const seen = new Set();
  return allocations.map((alloc) => {
    if (!alloc?.invoice || !isValidObjectId(alloc.invoice) || !isFiniteNumber(alloc.amount) || Number(alloc.amount) <= 0) {
      throw Object.assign(new Error("Each allocation requires a valid invoice and amount"), { statusCode: 400 });
    }
    const id = String(alloc.invoice);
    if (seen.has(id)) throw Object.assign(new Error("The same invoice cannot be allocated more than once in one receipt"), { statusCode: 400 });
    seen.add(id);
    return { invoice: id, amount: money(alloc.amount) };
  });
};

const validateInvoices = async (customerId, allocations, session) => {
  const ids = allocations.map((a) => a.invoice);
  let query = Invoice.find({ _id: { $in: ids } });
  if (session) query = query.session(session);
  const invoices = await query;
  if (invoices.length !== ids.length) throw Object.assign(new Error("One or more invoices were not found"), { statusCode: 404 });
  const map = new Map(invoices.map((i) => [String(i._id), i]));

  for (const alloc of allocations) {
    const invoice = map.get(String(alloc.invoice));
    if (String(invoice.customer) !== String(customerId)) {
      throw Object.assign(new Error(`Invoice ${invoice.invoiceNo} does not belong to the selected customer`), { statusCode: 400 });
    }
    if (invoice.status !== "Active") {
      throw Object.assign(new Error(`Invoice ${invoice.invoiceNo} is cancelled or inactive`), { statusCode: 400 });
    }
    if (alloc.amount > Number(invoice.balanceAmount) + 0.001) {
      throw Object.assign(new Error(`Amount exceeds the pending balance (${invoice.balanceAmount}) for invoice ${invoice.invoiceNo}`), { statusCode: 400 });
    }
  }
  return map;
};

const applyValidatedPayments = async (allocations, invoiceMap, session) => {
  for (const alloc of allocations) {
    const invoice = invoiceMap.get(String(alloc.invoice));
    invoice.paidAmount = money(Number(invoice.paidAmount || 0) + alloc.amount);
    invoice.balanceAmount = Math.max(0, money(Number(invoice.totalAmount) - invoice.paidAmount));
    invoice.paymentStatus = invoice.balanceAmount <= 0.001 ? "Paid" : invoice.paidAmount > 0 ? "Partially Paid" : "Unpaid";
    await invoice.save(session ? { session } : undefined);
  }
};

const attachReceiptPdf = async (receipt, customer, title, paymentMode) => {
  const populated = await Receipt.findById(receipt._id)
    .populate("allocations.invoice", "invoiceNo balanceAmount totalAmount paidAmount")
    .populate("createdBy", "name esignUrl");
  const pdfPath = await generateReceiptPdf({
    receipt: populated || receipt,
    customer,
    allocations: populated?.allocations || [],
    paymentMode,
    receiptType: receipt.type || title,
    createdBy: populated?.createdBy || null,
  });
  receipt.pdfUrl = `/${pdfPath}`;
  await receipt.save();
};

const tryAttachReceiptPdf = async (...args) => {
  try { await attachReceiptPdf(...args); return null; }
  catch (error) {
    logger.error("Receipt PDF generation failed", { receiptId: String(args[0]?._id || ""), error: error.message });
    return "Receipt was created, but PDF generation failed.";
  }
};

export const createAdvanceReceipt = async (req, res, next) => {
  try {
    const { customer: customerId, amount, paymentMode } = req.body;
    if (!customerId || !isValidObjectId(customerId)) return res.status(400).json({ success: false, message: "A valid customer is required" });
    if (!isFiniteNumber(amount) || Number(amount) <= 0) return res.status(400).json({ success: false, message: "A valid amount is required" });
    if (!["Cash", "Bank"].includes(paymentMode)) return res.status(400).json({ success: false, message: "Mode of payment must be Cash or Bank" });

    const customer = await Customer.findById(customerId);
    if (!customer || customer.status !== "Active") return res.status(404).json({ success: false, message: "Active customer not found" });

    const receiptNo = await getNextSequence("receipt", "RCT-");
    const receipt = await Receipt.create({ receiptNo, type: "Advance", customer: customerId, amount: money(amount), paymentMode, remainingAdvance: money(amount), createdBy: req.user._id });
    const warning = await tryAttachReceiptPdf(receipt, customer, "ADVANCE RECEIPT", paymentMode);
    res.status(201).json({ success: true, message: "Advance receipt created successfully", data: receipt, ...(warning ? { warning } : {}) });
  } catch (err) { next(err); }
};

export const getPendingInvoices = async (req, res, next) => {
  try {
    const { customerId } = req.params;
    if (!isValidObjectId(customerId)) return res.status(400).json({ success: false, message: "Invalid customer id" });
    const invoices = await Invoice.find({ customer: customerId, status: "Active", balanceAmount: { $gt: 0.001 } }).sort({ invoiceDate: 1 });
    res.status(200).json({ success: true, message: "Pending invoices fetched", data: invoices });
  } catch (err) { next(err); }
};

export const createCollectionReceipt = async (req, res, next) => {
  try {
    const { customer: customerId, paymentMode } = req.body;
    if (!customerId || !isValidObjectId(customerId)) return res.status(400).json({ success: false, message: "A valid customer is required" });
    if (!["Cash", "Bank"].includes(paymentMode)) return res.status(400).json({ success: false, message: "Mode of payment must be Cash or Bank" });
    const allocations = normalizeAllocations(req.body.allocations);

    const customer = await Customer.findById(customerId);
    if (!customer || customer.status !== "Active") return res.status(404).json({ success: false, message: "Active customer not found" });

    const receiptId = await withMongoTransaction(async (session) => {
      const invoiceMap = await validateInvoices(customerId, allocations, session);
      await applyValidatedPayments(allocations, invoiceMap, session);
      const receiptNo = await getNextSequence("receipt", "RCT-", session);
      const receipt = await createWithSession(Receipt, {
        receiptNo,
        type: "Collection",
        customer: customerId,
        amount: money(allocations.reduce((sum, a) => sum + a.amount, 0)),
        paymentMode,
        allocations,
        createdBy: req.user._id,
      }, session);
      return receipt._id;
    });

    const receipt = await Receipt.findById(receiptId);
    const warning = await tryAttachReceiptPdf(receipt, customer, "COLLECTION RECEIPT", paymentMode);
    res.status(201).json({ success: true, message: "Collection receipt created successfully", data: receipt, ...(warning ? { warning } : {}) });
  } catch (err) { next(err); }
};

export const getAdvanceBalance = async (req, res, next) => {
  try {
    const { customerId } = req.params;
    if (!isValidObjectId(customerId)) return res.status(400).json({ success: false, message: "Invalid customer id" });
    const advanceReceipts = await Receipt.find({ customer: customerId, type: "Advance", status: "Active", remainingAdvance: { $gt: 0.001 } }).sort({ createdAt: 1 });
    const totalAdvance = money(advanceReceipts.reduce((sum, r) => sum + Number(r.remainingAdvance), 0));
    res.status(200).json({ success: true, message: "Advance balance fetched", data: { advanceReceipts, totalAdvance } });
  } catch (err) { next(err); }
};

export const createAdvanceAdjustment = async (req, res, next) => {
  try {
    const { customer: customerId } = req.body;
    if (!customerId || !isValidObjectId(customerId)) return res.status(400).json({ success: false, message: "A valid customer is required" });
    const allocations = normalizeAllocations(req.body.allocations);
    const customer = await Customer.findById(customerId);
    if (!customer || customer.status !== "Active") return res.status(404).json({ success: false, message: "Active customer not found" });

    const receiptId = await withMongoTransaction(async (session) => {
      const invoiceMap = await validateInvoices(customerId, allocations, session);
      let advanceQuery = Receipt.find({ customer: customerId, type: "Advance", status: "Active", remainingAdvance: { $gt: 0.001 } }).sort({ createdAt: 1 });
      if (session) advanceQuery = advanceQuery.session(session);
      const advanceReceipts = await advanceQuery;
      const totalRequested = money(allocations.reduce((sum, a) => sum + a.amount, 0));
      const totalAvailable = money(advanceReceipts.reduce((sum, r) => sum + Number(r.remainingAdvance), 0));
      if (totalRequested > totalAvailable + 0.001) {
        throw Object.assign(new Error(`Requested adjustment (${totalRequested}) exceeds available advance balance (${totalAvailable})`), { statusCode: 400 });
      }

      await applyValidatedPayments(allocations, invoiceMap, session);

      let remainingToDraw = totalRequested;
      for (const advReceipt of advanceReceipts) {
        if (remainingToDraw <= 0.001) break;
        const draw = Math.min(Number(advReceipt.remainingAdvance), remainingToDraw);
        advReceipt.remainingAdvance = money(Number(advReceipt.remainingAdvance) - draw);
        remainingToDraw = money(remainingToDraw - draw);
        await advReceipt.save(session ? { session } : undefined);
      }

      const receiptNo = await getNextSequence("receipt", "RCT-", session);
      const receipt = await createWithSession(Receipt, {
        receiptNo,
        type: "AdvanceAdjustment",
        customer: customerId,
        amount: totalRequested,
        allocations,
        sourceAdvanceReceipt: advanceReceipts[0]?._id || null,
        createdBy: req.user._id,
      }, session);
      return receipt._id;
    });

    const receipt = await Receipt.findById(receiptId);
    const warning = await tryAttachReceiptPdf(receipt, customer, "ADVANCE ADJUSTMENT", null);
    res.status(201).json({ success: true, message: "Advance adjusted successfully", data: receipt, ...(warning ? { warning } : {}) });
  } catch (err) { next(err); }
};

export const getAllReceipts = async (req, res, next) => {
  try {
    const { customerId, type } = req.query;
    const filter = {};
    if (customerId) {
      if (!isValidObjectId(customerId)) return res.status(400).json({ success: false, message: "Invalid customer id" });
      filter.customer = customerId;
    }
    if (type) filter.type = type;
    const receipts = await Receipt.find(filter).populate("customer", "companyName").populate("allocations.invoice", "invoiceNo").sort({ createdAt: -1 });
    res.status(200).json({ success: true, message: "Receipts fetched", data: receipts });
  } catch (err) { next(err); }
};

export const getReceiptById = async (req, res, next) => {
  try {
    if (!isValidObjectId(req.params.id)) return res.status(400).json({ success: false, message: "Invalid receipt id" });
    const receipt = await Receipt.findById(req.params.id).populate("customer").populate("allocations.invoice");
    if (!receipt) return res.status(404).json({ success: false, message: "Receipt not found" });
    res.status(200).json({ success: true, message: "Receipt fetched", data: receipt });
  } catch (err) { next(err); }
};
