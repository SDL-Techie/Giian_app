import express from "express";
import { getAuditLogs } from "../controller/auditLogController.js";
import { verifyUser, isAdmin } from "../helper/userAuth.js";

const router = express.Router();
router.use(verifyUser, isAdmin);
router.get("/", getAuditLogs);
export default router;
