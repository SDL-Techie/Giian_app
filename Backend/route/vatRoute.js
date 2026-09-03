import express from "express";
import { vatPaidReport, vatCollectedReport } from "../controller/vatController.js";
import { verifyUser, authorize } from "../helper/userAuth.js";

const router = express.Router();

router.use(verifyUser);

router.get("/paid", authorize("vat", "report"), vatPaidReport);
router.get("/collected", authorize("vat", "report"), vatCollectedReport);

export default router;
