import express from "express";
import {
  createCategory,
  getAllCategories,
  updateCategory,
  deleteCategory,
} from "../controller/categoryController.js";
import { verifyUser, authorize } from "../helper/userAuth.js";

const router = express.Router();

router.use(verifyUser);

router
  .route("/")
  .get(authorize("products", "view"), getAllCategories)
  .post(authorize("products", "create"), createCategory);

router
  .route("/:id")
  .put(authorize("products", "modify"), updateCategory)
  .delete(authorize("products", "modify"), deleteCategory);

export default router;
