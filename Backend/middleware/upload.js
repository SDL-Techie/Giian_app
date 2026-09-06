import multer from "multer";
import path from "path";

const storage = multer.memoryStorage();
const MAX_FILE_SIZE = Number(process.env.MAX_UPLOAD_MB || 10) * 1024 * 1024;

const docTypes = new Map([
  [".jpg", ["image/jpeg"]],
  [".jpeg", ["image/jpeg"]],
  [".png", ["image/png"]],
  [".webp", ["image/webp"]],
  [".pdf", ["application/pdf"]],
  [".doc", ["application/msword"]],
  [".docx", ["application/vnd.openxmlformats-officedocument.wordprocessingml.document"]],
  [".xls", ["application/vnd.ms-excel"]],
  [".xlsx", ["application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"]],
]);

const imageTypes = new Map([
  [".jpg", ["image/jpeg"]],
  [".jpeg", ["image/jpeg"]],
  [".png", ["image/png"]],
  [".webp", ["image/webp"]],
]);

const filterFor = (allowed) => (_req, file, cb) => {
  const ext = path.extname(file.originalname || "").toLowerCase();
  const mime = String(file.mimetype || "").toLowerCase();
  const valid = allowed.has(ext) && allowed.get(ext).includes(mime);
  if (valid) return cb(null, true);
  const error = new Error("Unsupported file type or MIME type mismatch");
  error.statusCode = 400;
  cb(error, false);
};

export const documentUpload = multer({ storage, fileFilter: filterFor(docTypes), limits: { fileSize: MAX_FILE_SIZE, files: 10 } });
export const imageUpload = multer({ storage, fileFilter: filterFor(imageTypes), limits: { fileSize: MAX_FILE_SIZE, files: 1 } });
export const excelUpload = multer({
  storage,
  fileFilter: filterFor(new Map([
    [".xls", ["application/vnd.ms-excel"]],
    [".xlsx", ["application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"]],
  ])),
  limits: { fileSize: MAX_FILE_SIZE, files: 1 },
});

export default documentUpload;
