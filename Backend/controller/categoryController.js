import Category from "../model/categoryModel.js";
import Product from "../model/productModel.js";
import { isValidObjectId } from "../utils/validators.js";

export const createCategory = async (req, res, next) => {
  try {
    const name = String(req.body.name || "").trim();
    if (!name) return res.status(400).json({ success: false, message: "Category name is required" });
    const c = await Category.create({ name, createdBy: req.user._id });
    res.status(201).json({ success: true, message: "Category created successfully", data: c });
  } catch (e) { next(e); }
};

export const getAllCategories = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    const data = await Category.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, message: "Categories fetched", data });
  } catch (e) { next(e); }
};

export const updateCategory = async (req, res, next) => {
  try {
    if (!isValidObjectId(req.params.id)) return res.status(400).json({ success: false, message: "Invalid category id" });
    const updates = {};
    if (req.body.name !== undefined) updates.name = String(req.body.name).trim();
    if (req.body.status !== undefined) {
      if (!["Active", "Inactive"].includes(req.body.status)) return res.status(400).json({ success: false, message: "Status must be Active or Inactive" });
      updates.status = req.body.status;
    }
    const data = await Category.findByIdAndUpdate(req.params.id, updates, { returnDocument: 'after', runValidators: true });
    if (!data) return res.status(404).json({ success: false, message: "Category not found" });
    res.json({ success: true, message: "Category updated successfully", data });
  } catch (e) { next(e); }
};

export const deleteCategory = async (req, res, next) => {
  try {
    if (!isValidObjectId(req.params.id)) return res.status(400).json({ success: false, message: "Invalid category id" });
    if (await Product.exists({ category: req.params.id, status: "Active" })) return res.status(400).json({ success: false, message: "Category is used by active products and cannot be deactivated" });
    const data = await Category.findByIdAndUpdate(req.params.id, { status: "Inactive" }, { returnDocument: 'after' });
    if (!data) return res.status(404).json({ success: false, message: "Category not found" });
    res.json({ success: true, message: "Category deactivated successfully", data });
  } catch (e) { next(e); }
};
