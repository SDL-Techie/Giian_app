import Category from "../model/categoryModel.js";
import { isValidObjectId } from "../utils/validators.js";

// @desc   Create category / sub-category
// @route  POST /api/v1/categories
export const createCategory = async (req, res, next) => {
  try {
    const { name, parentCategory } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, message: "Category name is required" });
    }
    if (parentCategory && !isValidObjectId(parentCategory)) {
      return res.status(400).json({ success: false, message: "Invalid parent category id" });
    }

    const category = await Category.create({
      name,
      parentCategory: parentCategory || null,
      createdBy: req.user._id,
    });

    res.status(201).json({ success: true, message: "Category created successfully", data: category });
  } catch (err) {
    next(err);
  }
};

// @desc   List categories (list report) - optionally only top level or a given parent's children
// @route  GET /api/v1/categories
export const getAllCategories = async (req, res, next) => {
  try {
    const { parentCategory } = req.query;
    const filter = {};
    if (parentCategory === "root") {
      filter.parentCategory = null;
    } else if (parentCategory) {
      if (!isValidObjectId(parentCategory)) {
        return res.status(400).json({ success: false, message: "Invalid parent category id" });
      }
      filter.parentCategory = parentCategory;
    }

    const categories = await Category.find(filter)
      .populate("parentCategory", "name")
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, message: "Categories fetched", data: categories });
  } catch (err) {
    next(err);
  }
};

// @desc   Update category
// @route  PUT /api/v1/categories/:id
export const updateCategory = async (req, res, next) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid category id" });
    }
    const updated = await Category.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!updated) {
      return res.status(404).json({ success: false, message: "Category not found" });
    }
    res.status(200).json({ success: true, message: "Category updated successfully", data: updated });
  } catch (err) {
    next(err);
  }
};

// @desc   Delete category
// @route  DELETE /api/v1/categories/:id
export const deleteCategory = async (req, res, next) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid category id" });
    }
    const deleted = await Category.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: "Category not found" });
    }
    res.status(200).json({ success: true, message: "Category deleted successfully" });
  } catch (err) {
    next(err);
  }
};
