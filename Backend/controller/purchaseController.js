import Purchase from "../model/purchaseModel.js";
import Product from "../model/productModel.js";
import { getNextSequence } from "../model/counterModel.js";
import { calculateLineItems, sumItems, computeGrandTotal } from "../utils/calculateTotals.js";
import { validateLineItems, isValidObjectId, validateCommercialTotalsInput, isValidDateValue } from "../utils/validators.js";
import { saveBufferToGridFS } from "../utils/gridfs.js";

const saveFiles = async (files, user) => Promise.all((files || []).map((f) => saveBufferToGridFS(f, { module: "purchase", uploadedBy: String(user) })));

export const createPurchase = async (req, res, next) => {
  try {
    const { dateOfPurchase, vendorName, invoiceNumber, items, vatPercent } = req.body;
    if (!dateOfPurchase || !isValidDateValue(dateOfPurchase) || !String(vendorName || "").trim() || !String(invoiceNumber || "").trim()) {
      return res.status(400).json({ success: false, message: "Valid purchase date, vendor name and invoice number are required" });
    }

    let parsed;
    try { parsed = typeof items === "string" ? JSON.parse(items) : items; }
    catch { return res.status(400).json({ success: false, message: "Items must be valid JSON" }); }

    const error = validateLineItems(parsed, "cost");
    if (error) return res.status(400).json({ success: false, message: error });

    const ids = parsed.map((i) => String(i.product));
    const products = await Product.find({ _id: { $in: ids }, status: "Active" }).select("_id");
    if (products.length !== new Set(ids).size) return res.status(400).json({ success: false, message: "One or more products are invalid or inactive" });

    const line = calculateLineItems(parsed, "cost");
    const sub = sumItems(line, "totalCost");
    const totalsError = validateCommercialTotalsInput({ subTotal: sub, discount: 0, vatPercent: vatPercent || 0 });
    if (totalsError) return res.status(400).json({ success: false, message: totalsError });
    const totals = computeGrandTotal({ subTotal: sub, vatPercent: Number(vatPercent || 0) });
    const files = await saveFiles(req.files, req.user._id);
    const data = await Purchase.create({
      purchaseNo: await getNextSequence("purchase", "PUR-"),
      dateOfPurchase,
      vendorName: String(vendorName).trim(),
      invoiceNumber: String(invoiceNumber).trim(),
      invoiceFiles: files,
      invoiceFileUrl: files[0]?.url,
      items: line,
      subTotalCost: sub,
      vatPercent: Number(vatPercent || 0),
      vatAmount: totals.vatAmount,
      totalCost: totals.totalAmount,
      createdBy: req.user._id,
    });
    res.status(201).json({ success: true, message: "Purchase created successfully", data });
  } catch (e) { next(e); }
};

export const uploadPurchaseInvoice = async (req, res, next) => {
  try {
    if (!isValidObjectId(req.params.id)) return res.status(400).json({ success: false, message: "Invalid purchase id" });
    if (!req.files?.length) return res.status(400).json({ success: false, message: "No file uploaded" });
    const p = await Purchase.findById(req.params.id);
    if (!p) return res.status(404).json({ success: false, message: "Purchase not found" });
    const files = await saveFiles(req.files, req.user._id);
    p.invoiceFiles = [...(p.invoiceFiles || []), ...files];
    p.invoiceFileUrl = p.invoiceFiles[0]?.url;
    await p.save();
    res.json({ success: true, message: "Invoice files uploaded successfully", data: p });
  } catch (e) { next(e); }
};

export const getAllPurchases = async (req, res, next) => {
  try {
    const { from, to, vendorName } = req.query;
    const f = {};
    if (vendorName) f.vendorName = new RegExp(String(vendorName).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    if (from || to) {
      f.dateOfPurchase = {};
      if (from) f.dateOfPurchase.$gte = new Date(from);
      if (to) f.dateOfPurchase.$lte = new Date(to);
    }
    const data = await Purchase.find(f).populate("items.product", "name itemCode").sort({ dateOfPurchase: -1 });
    res.json({ success: true, message: "Purchases fetched", data });
  } catch (e) { next(e); }
};

export const getPurchaseById = async (req, res, next) => {
  try {
    if (!isValidObjectId(req.params.id)) return res.status(400).json({ success: false, message: "Invalid purchase id" });
    const data = await Purchase.findById(req.params.id).populate("items.product", "name itemCode");
    if (!data) return res.status(404).json({ success: false, message: "Purchase not found" });
    res.json({ success: true, message: "Purchase fetched", data });
  } catch (e) { next(e); }
};
