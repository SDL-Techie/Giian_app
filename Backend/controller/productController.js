import Product from "../model/productModel.js";
import { isValidObjectId } from "../utils/validators.js";

// @desc   Create product
// @route  POST /api/v1/products
export const createProduct = async (req, res, next) => {
  try {
    const { name, itemCode, unitOfMeasure, category } = req.body;

    if (!name || !itemCode || !category) {
      return res
        .status(400)
        .json({ success: false, message: "Name, item code and category are required" });
    }
    if (!isValidObjectId(category)) {
      return res.status(400).json({ success: false, message: "Invalid category id" });
    }

    const product = await Product.create({
      name,
      itemCode,
      unitOfMeasure,
      category,
      productImageUrl: req.file ? `/uploads/${req.file.filename}` : undefined,
      createdBy: req.user._id,
    });

    res.status(201).json({ success: true, message: "Product created successfully", data: product });
  } catch (err) {
    next(err);
  }
};

// @desc   List products
// @route  GET /api/v1/products
export const getAllProducts = async (req, res, next) => {
  try {
    const { search, category, status } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (category) filter.category = category;
    if (search) filter.$text = { $search: search };

    const products = await Product.find(filter)
      .populate("category", "name")
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, message: "Products fetched", data: products });
  } catch (err) {
    next(err);
  }
};

// @desc   Get single product
// @route  GET /api/v1/products/:id
export const getProductById = async (req, res, next) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid product id" });
    }
    const product = await Product.findById(req.params.id).populate("category", "name");
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }
    res.status(200).json({ success: true, message: "Product fetched", data: product });
  } catch (err) {
    next(err);
  }
};

// @desc   Modify product
// @route  PUT /api/v1/products/:id
export const updateProduct = async (req, res, next) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid product id" });
    }
    const updates = { ...req.body };
    if (req.file) {
      updates.productImageUrl = `/uploads/${req.file.filename}`;
    }
    const product = await Product.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    });
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }
    res.status(200).json({ success: true, message: "Product updated successfully", data: product });
  } catch (err) {
    next(err);
  }
};

// @desc   Deactivate product
// @route  DELETE /api/v1/products/:id
export const deleteProduct = async (req, res, next) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid product id" });
    }
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { status: "Inactive" },
      { new: true }
    );
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }
    res.status(200).json({ success: true, message: "Product deactivated successfully" });
  } catch (err) {
    next(err);
  }
};

// @desc   Product report (list report referenced in PDF "Products" module)
// @route  GET /api/v1/products/reports/list
export const productListReport = async (req, res, next) => {
  try {
    const products = await Product.find().populate("category", "name").sort({ name: 1 });
    res.status(200).json({ success: true, message: "Report generated", data: products });
  } catch (err) {
    next(err);
  }
};
