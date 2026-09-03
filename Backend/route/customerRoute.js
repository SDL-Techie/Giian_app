import express from "express";
import {
  createCustomer,
  getAllCustomers,
  getCustomerById,
  updateCustomer,
  deleteCustomer,
  customerWiseQuotationReport,
  customerWiseSalesReport,
} from "../controller/customerController.js";
import { verifyUser, authorize } from "../helper/userAuth.js";
import upload from "../middleware/upload.js";

const router = express.Router();

router.use(verifyUser);

// Reports (list report is available to anyone who can view customers)
router.get("/reports/quotations", authorize("customers", "view"), customerWiseQuotationReport);
router.get("/reports/sales", authorize("customers", "view"), customerWiseSalesReport);

router
  .route("/")
  .get(authorize("customers", "view"), getAllCustomers)
  .post(authorize("customers", "create"), upload.single("companyDocument"), createCustomer);

router
  .route("/:id")
  .get(authorize("customers", "view"), getCustomerById)
  .put(authorize("customers", "modify"), upload.single("companyDocument"), updateCustomer)
  .delete(authorize("customers", "modify"), deleteCustomer);

export default router;
