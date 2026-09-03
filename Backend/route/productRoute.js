import express from "express";
import {
  createProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  productListReport,
} from "../controller/productController.js";
import { verifyUser, authorize } from "../helper/userAuth.js";
import upload from "../middleware/upload.js";

const router = express.Router();

router.use(verifyUser);

router.get("/reports/list", authorize("products", "report"), productListReport);

router
  .route("/")
  .get(authorize("products", "view"), getAllProducts)
  .post(authorize("products", "create"), upload.single("productImage"), createProduct);

router
  .route("/:id")
  .get(authorize("products", "view"), getProductById)
  .put(authorize("products", "modify"), upload.single("productImage"), updateProduct)
  .delete(authorize("products", "modify"), deleteProduct);

export default router;
