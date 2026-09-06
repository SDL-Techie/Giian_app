import mongoose from "mongoose";
import Invoice from "../model/invoiceModel.js";
import Quotation from "../model/quotationModel.js";
import Customer from "../model/customerModel.js";
import Product from "../model/productModel.js";
import { getNextSequence } from "../model/counterModel.js";
import { calculateLineItems, sumItems, computeGrandTotal } from "../utils/calculateTotals.js";
import { validateLineItems, isValidObjectId, validateCommercialTotalsInput, isValidDateValue } from "../utils/validators.js";
import { generateBrandedPdf } from "../utils/pdfGenerator.js";
import { withMongoTransaction } from "../utils/transaction.js";
import { logger } from "../utils/logger.js";

const buildInvoicePdfs = async ({ invoice, customer, items, discount, vatPercent, totals }) => {
  const pdfItems = items.map((i) => ({ name: i.name || "Product", imageUrl: i.imageUrl || i.productImageUrl, qty: i.qty, price: i.price, total: i.totalPrice }));
  const dubaiUrl = await generateBrandedPdf({ title:"TAX INVOICE", docNumber:invoice.invoiceNo, fileNamePrefix:"invoice", region:"dubai", date:invoice.invoiceDate, referenceNo:invoice.referenceNo, customer, items:pdfItems, discount:discount||0, vatPercent:vatPercent||0, subTotal:totals.subTotal, vatAmount:totals.vatAmount, totalAmount:totals.totalAmount, currency:"AED" });
  return { dubaiUrl };
};

// @desc   Generate invoice automatically from an existing quotation
// @route  POST /api/v1/invoices/from-quotation/:quotationId
export const createInvoiceFromQuotation = async (req, res, next) => {
  try {
    const { quotationId } = req.params;
    if (!isValidObjectId(quotationId)) {
      return res.status(400).json({ success: false, message: "Invalid quotation id" });
    }
    if (req.body?.invoiceDate && !isValidDateValue(req.body.invoiceDate)) {
      return res.status(400).json({ success: false, message: "Invalid invoice date" });
    }

    const invoiceId = await withMongoTransaction(async (session) => {
      let q = Quotation.findById(quotationId);
      if (session) q = q.session(session);
      const quotation = await q;
      if (!quotation) throw Object.assign(new Error("Quotation not found"), { statusCode: 404 });
      if (quotation.status !== "Open") {
        throw Object.assign(new Error(`Quotation is ${quotation.status.toLowerCase()} and cannot be converted`), { statusCode: 400 });
      }

      // Atomic claim prevents two concurrent requests from converting the same quotation.
      const claimFilter = { _id: quotationId, status: "Open" };
      const claimUpdate = { $set: { status: "Converted" } };
      let claimed = Quotation.findOneAndUpdate(claimFilter, claimUpdate, { new: true });
      if (session) claimed = claimed.session(session);
      const converted = await claimed;
      if (!converted) throw Object.assign(new Error("Quotation has already been converted or is no longer open"), { statusCode: 409 });

      const invoiceNo = await getNextSequence("invoice", "INV-", session);
      const doc = {
        invoiceNo,
        customer: quotation.customer,
invoiceDate: req.body?.invoiceDate || new Date(),
referenceNo: req.body?.referenceNo || undefined,
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
      };
      const invoice = session ? (await Invoice.create([doc], { session }))[0] : await Invoice.create(doc);
      return invoice._id;
    });

    const invoice = await Invoice.findById(invoiceId).populate("customer");
    const products = await Product.find({ _id: { $in: invoice.items.map((i) => i.product) } });
    const productMap = new Map(products.map((p) => [String(p._id), p]));
    const totals = { subTotal: invoice.subTotal, vatAmount: invoice.vatAmount, totalAmount: invoice.totalAmount };
    let pdfWarning;
    try {
      const pdfs = await buildInvoicePdfs({
        invoice, customer: invoice.customer,
        items: invoice.items.map((i) => ({ ...(i.toObject?.() ?? i), name: productMap.get(String(i.product))?.name, imageUrl: productMap.get(String(i.product))?.productImageUrl })),
        discount: invoice.discount, vatPercent: invoice.vatPercent, totals,
      });
      invoice.pdfDubaiUrl = pdfs.dubaiUrl;
      invoice.pdfUrl = pdfs.dubaiUrl;
      await invoice.save();
    } catch (pdfError) {
      pdfWarning = "Invoice was created, but PDF generation failed. Use the PDF endpoint to regenerate it.";
      logger.error("Invoice PDF generation failed", { invoiceId: String(invoice._id), error: pdfError.message });
    }

    res.status(201).json({ success: true, message: "Invoice generated from quotation successfully", data: invoice, ...(pdfWarning ? { warning: pdfWarning } : {}) });
  } catch (err) { next(err); }
};

// @desc   Create a new invoice without a quotation
// @route  POST /api/v1/invoices
export const createInvoiceWithoutQuotation = async (req, res, next) => {
  try {
    const { customer: customerId, invoiceDate, referenceNo, items, discount, vatPercent } = req.body;

    if (!customerId || !isValidObjectId(customerId)) {
      return res.status(400).json({ success: false, message: "A valid customer is required" });
    }
    if (!invoiceDate || !isValidDateValue(invoiceDate)) {
      return res.status(400).json({ success: false, message: "A valid invoice date is required" });
    }

    const customer = await Customer.findById(customerId);
    if (!customer || customer.status !== "Active") {
      return res.status(404).json({ success: false, message: "Active customer not found" });
    }

    const validationError = validateLineItems(items, "price");
    if (validationError) {
      return res.status(400).json({ success: false, message: validationError });
    }

    const productIds = items.map((i) => i.product);
    const products = await Product.find({ _id: { $in: productIds }, status: "Active" });
    if (products.length !== new Set(productIds).size) {
      return res.status(400).json({ success: false, message: "One or more products are invalid" });
    }
    const productMap = new Map(products.map((p) => [String(p._id), p]));

    const lineItems = calculateLineItems(items, "price");
    const subTotal = sumItems(lineItems, "totalPrice");
    const totalsValidation = validateCommercialTotalsInput({ subTotal, discount: discount || 0, vatPercent: vatPercent || 0 });
    if (totalsValidation) return res.status(400).json({ success: false, message: totalsValidation });
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

    let pdfWarning;
    try {
      const pdfs = await buildInvoicePdfs({
        invoice,
        customer,
        items: lineItems.map((i) => ({ ...i, name: productMap.get(String(i.product))?.name, imageUrl: productMap.get(String(i.product))?.productImageUrl })),
        discount, vatPercent, totals,
      });
      invoice.pdfDubaiUrl = pdfs.dubaiUrl; invoice.pdfUrl = pdfs.dubaiUrl;
      await invoice.save();
    } catch (pdfError) {
      pdfWarning = "Invoice was created, but PDF generation failed. Use the PDF endpoint to regenerate it.";
      logger.error("Invoice PDF generation failed", { invoiceId: String(invoice._id), error: pdfError.message });
    }

    res.status(201).json({ success: true, message: "Invoice created successfully", data: invoice, ...(pdfWarning ? { warning: pdfWarning } : {}) });
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
    if (customerId) {
      if (!isValidObjectId(customerId)) return res.status(400).json({ success: false, message: "Invalid customer id" });
      filter.customer = customerId;
    }

    const invoices = await Invoice.find(filter)
      .populate("customer", "companyName")
      .populate("salesPerson", "name")
      .populate("quotation", "quotationNo dateOfQuotation totalAmount status pdfDubaiUrl pdfUrl")
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
      .populate("items.product", "name itemCode")
      .populate({ path: "quotation", populate: [{ path: "customer" }, { path: "items.product", select: "name itemCode" }, { path: "salesPerson", select: "name" }] });
    if (!invoice) {
      return res.status(404).json({ success: false, message: "Invoice not found" });
    }
    res.status(200).json({ success: true, message: "Invoice fetched", data: invoice });
  } catch (err) {
    next(err);
  }
};


export const getOpenQuotationsForInvoice = async (_req, res, next) => {
  try {
    const data = await Quotation.find({ status: "Open" })
      .populate("customer", "companyName contactPersonName companyAddress mobileNumber")
      .populate("salesPerson", "name")
      .populate("items.product", "name itemCode")
      .sort({ createdAt: -1 });
    res.json({ success: true, message: "Open quotations fetched", data });
  } catch (e) { next(e); }
};

export const generateInvoicePdf = async (req, res, next) => {
  try {
    const pageSize = String(req.query.size || "A4").toUpperCase() === "A5" ? "A5" : "A4";
    if (!isValidObjectId(req.params.id)) return res.status(400).json({success:false,message:"Invalid invoice id"});
    const invoice = await Invoice.findById(req.params.id).populate("customer").populate("items.product", "name itemCode productImageUrl");
    if (!invoice) return res.status(404).json({success:false,message:"Invoice not found"});
    const items = invoice.items.map(i => ({ name:i.product?.name || "Product", imageUrl:i.product?.productImageUrl, qty:i.qty, price:i.price, total:i.totalPrice }));
    const url = await generateBrandedPdf({ title:"TAX INVOICE", docNumber:invoice.invoiceNo, fileNamePrefix:"invoice", region:"dubai", pageSize, date:invoice.invoiceDate, referenceNo:invoice.referenceNo, customer:invoice.customer, items, discount:invoice.discount||0, vatPercent:invoice.vatPercent||0, subTotal:invoice.subTotal, vatAmount:invoice.vatAmount, totalAmount:invoice.totalAmount, currency:"AED" });
    return res.json({success:true,message:`${pageSize} invoice generated`,data:{url,pageSize}});
  } catch (e) { next(e); }
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
