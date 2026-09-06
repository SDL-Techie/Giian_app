import express from "express";
import { createProduct, getAllProducts, getProductById, updateProduct, deleteProduct, setProductStatus, productListReport } from "../controller/productController.js";
import { verifyUser, authorize } from "../helper/userAuth.js";
import { imageUpload } from "../middleware/upload.js";
import { validateUploadedFileSignatures } from "../middleware/fileSignature.js";

const router = express.Router();
router.use(verifyUser);
router.get("/reports/list", authorize("products", "report"), productListReport);
router.route("/").get(authorize("products", "view"), getAllProducts).post(authorize("products", "create"), imageUpload.single("productImage"), validateUploadedFileSignatures, createProduct);
router.put("/:id/status", authorize("products", "modify"), setProductStatus);
router.route("/:id").get(authorize("products", "view"), getProductById).put(authorize("products", "modify"), imageUpload.single("productImage"), validateUploadedFileSignatures, updateProduct).delete(authorize("products", "modify"), deleteProduct);
export default router;
