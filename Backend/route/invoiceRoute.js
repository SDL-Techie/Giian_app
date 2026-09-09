import express from "express";
import {
  createInvoiceFromQuotation,
  createInvoiceWithoutQuotation,
  cancelInvoice,
  getAllInvoices,
  getInvoiceById,
  periodicSalesReport,
  customerWiseSalesReport,
  salesmanWiseSalesReport,
  productWiseSalesReport,
  getOpenQuotationsForInvoice,
  generateInvoicePdf,
  approveInvoice,
} from "../controller/invoiceController.js";
import { verifyUser, authorize, isAdmin } from "../helper/userAuth.js";

const router = express.Router();

router.use(verifyUser);

router.get("/open-quotations", authorize("sales", "create"), getOpenQuotationsForInvoice);

router.get("/reports/periodic", authorize("sales", "report"), periodicSalesReport);
router.get("/reports/customer-wise", authorize("sales", "report"), customerWiseSalesReport);
router.get("/reports/salesman-wise", authorize("sales", "report"), salesmanWiseSalesReport);
router.get("/reports/product-wise", authorize("sales", "report"), productWiseSalesReport);

router
  .route("/")
  .get(authorize("sales", "view"), getAllInvoices)
  .post(authorize("sales", "create"), createInvoiceWithoutQuotation);

router.post(
  "/from-quotation/:quotationId",
  authorize("sales", "create"),
  createInvoiceFromQuotation
);
router.get("/:id/pdf", authorize("sales", "view"), generateInvoicePdf);
router.put("/:id/approve", isAdmin, approveInvoice);
router.get("/:id", authorize("sales", "view"), getInvoiceById);
router.put("/:id/cancel", authorize("sales", "modify"), cancelInvoice);

export default router;
