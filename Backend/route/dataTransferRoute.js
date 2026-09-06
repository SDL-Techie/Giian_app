import express from "express";
import { exportModule, importModule } from "../controller/dataTransferController.js";
import { verifyUser } from "../helper/userAuth.js";
import { excelUpload } from "../middleware/upload.js";
import { validateUploadedFileSignatures } from "../middleware/fileSignature.js";

const router = express.Router();
router.use(verifyUser);
router.get("/:module/export", exportModule);
router.post("/:module/import", excelUpload.single("file"), validateUploadedFileSignatures, importModule);
export default router;
