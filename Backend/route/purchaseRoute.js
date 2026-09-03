import express from "express";
import {
  createPurchase,
  uploadPurchaseInvoice,
  getAllPurchases,
  getPurchaseById,
} from "../controller/purchaseController.js";
import { verifyUser, authorize } from "../helper/userAuth.js";
import upload from "../middleware/upload.js";

const router = express.Router();

router.use(verifyUser);

router
  .route("/")
  .get(authorize("purchase", "view"), getAllPurchases)
  .post(authorize("purchase", "create"), upload.single("invoiceFile"), createPurchase);

router.get("/:id", authorize("purchase", "view"), getPurchaseById);
router.put(
  "/:id/upload-invoice",
  authorize("purchase", "modify"),
  upload.single("invoiceFile"),
  uploadPurchaseInvoice
);

export default router;
