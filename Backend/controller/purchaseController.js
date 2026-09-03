import Purchase from "../model/purchaseModel.js";
import Product from "../model/productModel.js";
import { getNextSequence } from "../model/counterModel.js";
import { calculateLineItems, sumItems, computeGrandTotal } from "../utils/calculateTotals.js";
import { validateLineItems, isValidObjectId } from "../utils/validators.js";

// @desc   New purchase
// @route  POST /api/v1/purchases
export const createPurchase = async (req, res, next) => {
  try {
    const { dateOfPurchase, vendorName, invoiceNumber, items, vatPercent } = req.body;

    if (!dateOfPurchase || !vendorName || !invoiceNumber) {
      return res.status(400).json({
        success: false,
        message: "Date of purchase, vendor name and invoice number are required",
      });
    }

    const parsedItems = typeof items === "string" ? JSON.parse(items) : items;
    const validationError = validateLineItems(parsedItems, "cost");
    if (validationError) {
      return res.status(400).json({ success: false, message: validationError });
    }

    // Confirm every referenced product actually exists.
    const productIds = parsedItems.map((i) => i.product);
    const foundCount = await Product.countDocuments({ _id: { $in: productIds } });
    if (foundCount !== new Set(productIds).size) {
      return res.status(400).json({ success: false, message: "One or more products are invalid" });
    }

    const lineItems = calculateLineItems(parsedItems, "cost");
    const subTotalCost = sumItems(lineItems, "totalCost");
    const { vatAmount, totalAmount: totalCost } = computeGrandTotal({
      subTotal: subTotalCost,
      vatPercent: vatPercent || 0,
    });

    const purchaseNo = await getNextSequence("purchase", "PUR-");

    const purchase = await Purchase.create({
      purchaseNo,
      dateOfPurchase,
      vendorName,
      invoiceNumber,
      invoiceFileUrl: req.file ? `/uploads/${req.file.filename}` : undefined,
      items: lineItems,
      subTotalCost,
      vatPercent: vatPercent || 0,
      vatAmount,
      totalCost,
      createdBy: req.user._id,
    });

    res.status(201).json({ success: true, message: "Purchase created successfully", data: purchase });
  } catch (err) {
    next(err);
  }
};

// @desc   Upload invoice file for an existing purchase
// @route  PUT /api/v1/purchases/:id/upload-invoice
export const uploadPurchaseInvoice = async (req, res, next) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid purchase id" });
    }
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No file uploaded" });
    }

    const purchase = await Purchase.findByIdAndUpdate(
      req.params.id,
      { invoiceFileUrl: `/uploads/${req.file.filename}` },
      { new: true }
    );

    if (!purchase) {
      return res.status(404).json({ success: false, message: "Purchase not found" });
    }

    res.status(200).json({ success: true, message: "Invoice uploaded successfully", data: purchase });
  } catch (err) {
    next(err);
  }
};

// @desc   List purchases / period report (choose period from-to)
// @route  GET /api/v1/purchases?from=&to=
export const getAllPurchases = async (req, res, next) => {
  try {
    const { from, to, vendorName } = req.query;
    const filter = {};
    if (vendorName) filter.vendorName = new RegExp(vendorName, "i");
    if (from || to) {
      filter.dateOfPurchase = {};
      if (from) filter.dateOfPurchase.$gte = new Date(from);
      if (to) filter.dateOfPurchase.$lte = new Date(to);
    }

    const purchases = await Purchase.find(filter)
      .populate("items.product", "name itemCode")
      .sort({ dateOfPurchase: -1 });

    res.status(200).json({ success: true, message: "Purchases fetched", data: purchases });
  } catch (err) {
    next(err);
  }
};

// @desc   Get single purchase
// @route  GET /api/v1/purchases/:id
export const getPurchaseById = async (req, res, next) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid purchase id" });
    }
    const purchase = await Purchase.findById(req.params.id).populate(
      "items.product",
      "name itemCode"
    );
    if (!purchase) {
      return res.status(404).json({ success: false, message: "Purchase not found" });
    }
    res.status(200).json({ success: true, message: "Purchase fetched", data: purchase });
  } catch (err) {
    next(err);
  }
};
