import Product from "../model/productModel.js";
import Category from "../model/categoryModel.js";
import { isValidObjectId } from "../utils/validators.js";
import { uploadImageToCloudinary } from "../utils/cloudinary.js";

const imageUrl = async (file) => file ? (await uploadImageToCloudinary(file)).secure_url : undefined;

const validateCategory = async (categoryId) => {
  if (!categoryId || !isValidObjectId(categoryId)) throw Object.assign(new Error("Invalid category id"), { statusCode: 400 });
  const category = await Category.findById(categoryId);
  if (!category || category.status !== "Active") throw Object.assign(new Error("Active category is required"), { statusCode: 400 });
};

export const createProduct = async (req, res, next) => {
  try {
    const { name, itemCode, unitOfMeasure, category } = req.body;
    if (!name || !itemCode || !category) return res.status(400).json({ success: false, message: "Name, item code and category are required" });
    await validateCategory(category);
    const product = await Product.create({
      name: name.trim(), itemCode: itemCode.trim(), unitOfMeasure, category,
      productImageUrl: await imageUrl(req.file), createdBy: req.user._id,
    });
    res.status(201).json({ success: true, message: "Product created successfully", data: product });
  } catch (e) { next(e); }
};

export const getAllProducts = async (req, res, next) => {
  try {
    const { search, category, status } = req.query;
    const f = {};
    if (search) f.$text = { $search: search };
    if (category) f.category = category;
    if (status) f.status = status;
    const data = await Product.find(f).populate("category", "name").sort({ createdAt: -1 });
    res.json({ success: true, message: "Products fetched", data });
  } catch (e) { next(e); }
};

export const getProductById = async (req, res, next) => {
  try {
    if (!isValidObjectId(req.params.id)) return res.status(400).json({ success: false, message: "Invalid product id" });
    const data = await Product.findById(req.params.id).populate("category", "name");
    if (!data) return res.status(404).json({ success: false, message: "Product not found" });
    res.json({ success: true, message: "Product fetched", data });
  } catch (e) { next(e); }
};

export const updateProduct = async (req, res, next) => {
  try {
    if (!isValidObjectId(req.params.id)) return res.status(400).json({ success: false, message: "Invalid product id" });
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: "Product not found" });
    const category = req.body.category ?? product.category;
    await validateCategory(category);
    const allowed = ["name", "itemCode", "unitOfMeasure", "category", "status"];
    for (const key of allowed) if (req.body[key] !== undefined) product[key] = req.body[key];
    if (req.file) product.productImageUrl = await imageUrl(req.file);
    await product.save();
    res.json({ success: true, message: "Product updated successfully", data: product });
  } catch (e) { next(e); }
};

export const setProductStatus = async (req, res, next) => {
  try {
    if (!isValidObjectId(req.params.id)) return res.status(400).json({ success: false, message: "Invalid product id" });
    if (!["Active", "Inactive"].includes(req.body.status)) return res.status(400).json({ success: false, message: "status must be Active or Inactive" });
    const data = await Product.findByIdAndUpdate(req.params.id, { status: req.body.status }, { returnDocument: 'after' });
    if (!data) return res.status(404).json({ success: false, message: "Product not found" });
    res.json({ success: true, message: `Product ${req.body.status === "Active" ? "activated" : "deactivated"} successfully`, data });
  } catch (e) { next(e); }
};

export const deleteProduct = async (req, res, next) => { req.body.status = "Inactive"; return setProductStatus(req, res, next); };
export const productListReport = async (_req, res, next) => {
  try {
    const data = await Product.find().populate("category", "name").sort({ name: 1 });
    res.json({ success: true, message: "Report generated", data });
  } catch (e) { next(e); }
};
