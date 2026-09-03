import mongoose from "mongoose";
import Invoice from "../model/invoiceModel.js";
import Quotation from "../model/quotationModel.js";
import Customer from "../model/customerModel.js";
import Product from "../model/productModel.js";
import { getNextSequence } from "../model/counterModel.js";
import { calculateLineItems, sumItems, computeGrandTotal } from "../utils/calculateTotals.js";
import { validateLineItems, isValidObjectId } from "../utils/validators.js";
import { generateDocumentPdf } from "../utils/pdfGenerator.js";

const buildInvoicePdf = async ({ invoice, customer, items, discount, vatPercent, totals }) => {
  const productMap = new Map(items.map((i) => [String(i.product), i.name]));
  const pdfPath = await generateDocumentPdf({
    title: "TAX INVOICE",
    docNumber: invoice.invoiceNo,
    fileNamePrefix: "invoice",
    metaLines: [
      { label: "Date", value: new Date(invoice.invoiceDate).toDateString() },
      { label: "Reference No", value: invoice.referenceNo || "-" },
    ],
    customer: {
      companyName: customer.companyName,
      contactPersonName: customer.contactPersonName,
      companyAddress: customer.companyAddress,
      mobileNumber: customer.mobileNumber,
    },
    items: items.map((i) => ({
      name: productMap.get(String(i.product)) || "Product",
      qty: i.qty,
      price: i.price,
      total: i.totalPrice,
    })),
    summaryLines: [
      { label: "Subtotal", value: totals.subTotal.toFixed(2) },
      { label: "Discount", value: Number(discount || 0).toFixed(2) },
      { label: `VAT (${vatPercent || 0}%)`, value: totals.vatAmount.toFixed(2) },
      { label: "Total", value: totals.totalAmount.toFixed(2) },
    ],
  });
  return `/${pdfPath}`;
};

// @desc   Generate invoice automatically from an existing quotation
// @route  POST /api/v1/invoices/from-quotation/:quotationId
export const createInvoiceFromQuotation = async (req, res, next) => {
  try {
    const { quotationId } = req.params;
    if (!isValidObjectId(quotationId)) {
      return res.status(400).json({ success: false, message: "Invalid quotation id" });
    }

    const quotation = await Quotation.findById(quotationId).populate("customer");
    if (!quotation) {
      return res.status(404).json({ success: false, message: "Quotation not found" });
    }
    if (quotation.status !== "Open") {
      return res.status(400).json({
        success: false,
        message: `Quotation is ${quotation.status.toLowerCase()} and cannot be converted`,
      });
    }

    const products = await Product.find({ _id: { $in: quotation.items.map((i) => i.product) } });
    const productMap = new Map(products.map((p) => [String(p._id), p.name]));

    const invoiceNo = await getNextSequence("invoice", "INV-");
    const totals = {
      subTotal: quotation.subTotal,
      vatAmount: quotation.vatAmount,
      totalAmount: quotation.totalAmount,
    };

    const invoice = await Invoice.create({
      invoiceNo,
      customer: quotation.customer._id,
      invoiceDate: new Date(),
      quotation: quotation._id,
      items: quotation.items,
      discount: quotation.discount,
      subTotal: quotation.subTotal,
      vatPercent: quotation.vatPercent,
      vatAmount: quotation.vatAmount,
      totalAmount: quotation.totalAmount,
      paidAmount: 0,
      balanceAmount: quotation.totalAmount,
      salesPerson: quotation.salesPerson,
      createdBy: req.user._id,
    });

    invoice.pdfUrl = await buildInvoicePdf({
      invoice,
      customer: quotation.customer,
      items: quotation.items.map((i) => ({ ...i.toObject?.() ?? i, name: productMap.get(String(i.product)) })),
      discount: quotation.discount,
      vatPercent: quotation.vatPercent,
      totals,
    });
    await invoice.save();

    quotation.status = "Converted";
    await quotation.save();

    res.status(201).json({ success: true, message: "Invoice generated from quotation successfully", data: invoice });
  } catch (err) {
    next(err);
  }
};

// @desc   Create a new invoice without a quotation
// @route  POST /api/v1/invoices
export const createInvoiceWithoutQuotation = async (req, res, next) => {
  try {
    const { customer: customerId, invoiceDate, referenceNo, items, discount, vatPercent } = req.body;

    if (!customerId || !isValidObjectId(customerId)) {
      return res.status(400).json({ success: false, message: "A valid customer is required" });
    }
    if (!invoiceDate) {
      return res.status(400).json({ success: false, message: "Invoice date is required" });
    }

    const customer = await Customer.findById(customerId);
    if (!customer) {
      return res.status(404).json({ success: false, message: "Customer not found" });
    }

    const validationError = validateLineItems(items, "price");
    if (validationError) {
      return res.status(400).json({ success: false, message: validationError });
    }

    const productIds = items.map((i) => i.product);
    const products = await Product.find({ _id: { $in: productIds } });
    if (products.length !== new Set(productIds).size) {
      return res.status(400).json({ success: false, message: "One or more products are invalid" });
    }
    const productMap = new Map(products.map((p) => [String(p._id), p.name]));

    const lineItems = calculateLineItems(items, "price");
    const subTotal = sumItems(lineItems, "totalPrice");
    const totals = computeGrandTotal({ subTotal, discount: discount || 0, vatPercent: vatPercent || 0 });

    const invoiceNo = await getNextSequence("invoice", "INV-");

    const invoice = await Invoice.create({
      invoiceNo,
      customer: customerId,
      invoiceDate,
      referenceNo,
      items: lineItems,
      discount: discount || 0,
      subTotal: totals.subTotal,
      vatPercent: vatPercent || 0,
      vatAmount: totals.vatAmount,
      totalAmount: totals.totalAmount,
      paidAmount: 0,
      balanceAmount: totals.totalAmount,
      salesPerson: req.body.salesPerson || req.user._id,
      createdBy: req.user._id,
    });

    invoice.pdfUrl = await buildInvoicePdf({
      invoice,
      customer,
      items: lineItems.map((i) => ({ ...i, name: productMap.get(String(i.product)) })),
      discount,
      vatPercent,
      totals,
    });
    await invoice.save();

    res.status(201).json({ success: true, message: "Invoice created successfully", data: invoice });
  } catch (err) {
    next(err);
  }
};

// @desc   Cancel an invoice
// @route  PUT /api/v1/invoices/:id/cancel
export const cancelInvoice = async (req, res, next) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid invoice id" });
    }
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) {
      return res.status(404).json({ success: false, message: "Invoice not found" });
    }
    if (invoice.status === "Cancelled") {
      return res.status(400).json({ success: false, message: "Invoice is already cancelled" });
    }
    if (invoice.paidAmount > 0) {
      return res.status(400).json({
        success: false,
        message: "Cannot cancel an invoice that already has receipts applied against it",
      });
    }

    invoice.status = "Cancelled";
    invoice.cancelledAt = new Date();
    invoice.cancelledReason = req.body.reason || "";
    await invoice.save();

    res.status(200).json({ success: true, message: "Invoice cancelled successfully", data: invoice });
  } catch (err) {
    next(err);
  }
};

// @desc   List invoices
// @route  GET /api/v1/invoices
export const getAllInvoices = async (req, res, next) => {
  try {
    const { status, customerId } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (customerId) filter.customer = customerId;

    const invoices = await Invoice.find(filter)
      .populate("customer", "companyName")
      .populate("salesPerson", "name")
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, message: "Invoices fetched", data: invoices });
  } catch (err) {
    next(err);
  }
};

// @desc   Get single invoice
// @route  GET /api/v1/invoices/:id
export const getInvoiceById = async (req, res, next) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid invoice id" });
    }
    const invoice = await Invoice.findById(req.params.id)
      .populate("customer")
      .populate("salesPerson", "name")
      .populate("items.product", "name itemCode");
    if (!invoice) {
      return res.status(404).json({ success: false, message: "Invoice not found" });
    }
    res.status(200).json({ success: true, message: "Invoice fetched", data: invoice });
  } catch (err) {
    next(err);
  }
};

// ---------- Sales Reports ----------

// @desc   Periodic sales report
// @route  GET /api/v1/invoices/reports/periodic?from=&to=
export const periodicSalesReport = async (req, res, next) => {
  try {
    const { from, to } = req.query;
    const filter = { status: "Active" };
    if (from || to) {
      filter.invoiceDate = {};
      if (from) filter.invoiceDate.$gte = new Date(from);
      if (to) filter.invoiceDate.$lte = new Date(to);
    }
    const invoices = await Invoice.find(filter)
      .populate("customer", "companyName")
      .sort({ invoiceDate: -1 });

    const totalSales = invoices.reduce((sum, inv) => sum + inv.totalAmount, 0);

    res.status(200).json({
      success: true,
      message: "Report generated",
      data: { invoices, totalSales, count: invoices.length },
    });
  } catch (err) {
    next(err);
  }
};

// @desc   Customer wise sales report
// @route  GET /api/v1/invoices/reports/customer-wise?customerId=&from=&to=
export const customerWiseSalesReport = async (req, res, next) => {
  try {
    const { customerId, from, to } = req.query;
    if (!customerId || !isValidObjectId(customerId)) {
      return res.status(400).json({ success: false, message: "A valid customerId is required" });
    }
    const filter = { customer: customerId, status: "Active" };
    if (from || to) {
      filter.invoiceDate = {};
      if (from) filter.invoiceDate.$gte = new Date(from);
      if (to) filter.invoiceDate.$lte = new Date(to);
    }
    const invoices = await Invoice.find(filter).sort({ invoiceDate: -1 });
    res.status(200).json({ success: true, message: "Report generated", data: invoices });
  } catch (err) {
    next(err);
  }
};

// @desc   Salesman wise sales report
// @route  GET /api/v1/invoices/reports/salesman-wise?salesPersonId=&from=&to=
export const salesmanWiseSalesReport = async (req, res, next) => {
  try {
    const { salesPersonId, from, to } = req.query;
    if (!salesPersonId || !isValidObjectId(salesPersonId)) {
      return res.status(400).json({ success: false, message: "A valid salesPersonId is required" });
    }
    const filter = { salesPerson: salesPersonId, status: "Active" };
    if (from || to) {
      filter.invoiceDate = {};
      if (from) filter.invoiceDate.$gte = new Date(from);
      if (to) filter.invoiceDate.$lte = new Date(to);
    }
    const invoices = await Invoice.find(filter)
      .populate("customer", "companyName")
      .sort({ invoiceDate: -1 });
    res.status(200).json({ success: true, message: "Report generated", data: invoices });
  } catch (err) {
    next(err);
  }
};

// @desc   Product wise sales report
// @route  GET /api/v1/invoices/reports/product-wise?productId=&from=&to=
export const productWiseSalesReport = async (req, res, next) => {
  try {
    const { productId, from, to } = req.query;
    if (!productId || !isValidObjectId(productId)) {
      return res.status(400).json({ success: false, message: "A valid productId is required" });
    }

    const matchStage = { status: "Active", "items.product": new mongoose.Types.ObjectId(productId) };
    if (from || to) {
      matchStage.invoiceDate = {};
      if (from) matchStage.invoiceDate.$gte = new Date(from);
      if (to) matchStage.invoiceDate.$lte = new Date(to);
    }

    const invoices = await Invoice.find(matchStage)
      .populate("customer", "companyName")
      .sort({ invoiceDate: -1 });

    // Flatten to just the matching product's line items per invoice for clarity.
    const rows = invoices.map((inv) => {
      const line = inv.items.find((i) => String(i.product) === String(productId));
      return {
        invoiceNo: inv.invoiceNo,
        invoiceDate: inv.invoiceDate,
        customer: inv.customer,
        qty: line?.qty,
        price: line?.price,
        totalPrice: line?.totalPrice,
      };
    });

    res.status(200).json({ success: true, message: "Report generated", data: rows });
  } catch (err) {
    next(err);
  }
};
