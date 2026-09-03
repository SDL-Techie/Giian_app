import express from "express";
import {
  createQuotation,
  getAllQuotations,
  getQuotationById,
  cancelQuotation,
  customerWiseQuotationReport,
  salesmanWiseQuotationReport,
} from "../controller/quotationController.js";
import { verifyUser, authorize } from "../helper/userAuth.js";

const router = express.Router();

router.use(verifyUser);

router.get("/reports/customer-wise", authorize("quotations", "report"), customerWiseQuotationReport);
router.get("/reports/salesman-wise", authorize("quotations", "report"), salesmanWiseQuotationReport);

router
  .route("/")
  .get(authorize("quotations", "view"), getAllQuotations)
  .post(authorize("quotations", "create"), createQuotation);

router.get("/:id", authorize("quotations", "view"), getQuotationById);
router.put("/:id/cancel", authorize("quotations", "modify"), cancelQuotation);

export default router;
