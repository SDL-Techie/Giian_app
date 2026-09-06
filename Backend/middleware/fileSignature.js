import path from "path";

const startsWith = (buffer, bytes) => bytes.every((b, i) => buffer[i] === b);
const ascii = (buffer, start, length) => buffer.subarray(start, start + length).toString("ascii");

const matchesSignature = (file) => {
  const b = file?.buffer;
  if (!Buffer.isBuffer(b) || b.length < 4) return false;
  const ext = path.extname(file.originalname || "").toLowerCase();
  switch (ext) {
    case ".pdf": return ascii(b, 0, 5) === "%PDF-";
    case ".jpg":
    case ".jpeg": return startsWith(b, [0xff, 0xd8, 0xff]);
    case ".png": return startsWith(b, [0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a]);
    case ".webp": return ascii(b, 0, 4) === "RIFF" && ascii(b, 8, 4) === "WEBP";
    case ".doc":
    case ".xls": return startsWith(b, [0xd0,0xcf,0x11,0xe0,0xa1,0xb1,0x1a,0xe1]);
    case ".docx":
    case ".xlsx": return startsWith(b, [0x50,0x4b,0x03,0x04]) || startsWith(b, [0x50,0x4b,0x05,0x06]) || startsWith(b, [0x50,0x4b,0x07,0x08]);
    default: return false;
  }
};

export const validateUploadedFileSignatures = (req, _res, next) => {
  const files = [...(req.files || []), ...(req.file ? [req.file] : [])];
  const bad = files.find((f) => !matchesSignature(f));
  if (bad) {
    const error = new Error(`Uploaded file content does not match its declared type: ${path.basename(bad.originalname || "file")}`);
    error.statusCode = 400;
    return next(error);
  }
  next();
};
