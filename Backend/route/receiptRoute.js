import express from "express";
import {
  createAdvanceReceipt,
  createCollectionReceipt,
  getPendingInvoices,
  getAdvanceBalance,
  createAdvanceAdjustment,
  getAllReceipts,
  getReceiptById,
} from "../controller/receiptController.js";
import { verifyUser, authorize } from "../helper/userAuth.js";

const router = express.Router();

router.use(verifyUser);

router.get("/pending-invoices/:customerId", authorize("receipts", "view"), getPendingInvoices);
router.get("/advance-balance/:customerId", authorize("receipts", "view"), getAdvanceBalance);

router.post("/advance", authorize("receipts", "create"), createAdvanceReceipt);
router.post("/collection", authorize("receipts", "create"), createCollectionReceipt);
router.post("/advance-adjustment", authorize("receipts", "create"), createAdvanceAdjustment);

router.get("/", authorize("receipts", "view"), getAllReceipts);
router.get("/:id", authorize("receipts", "view"), getReceiptById);

export default router;
