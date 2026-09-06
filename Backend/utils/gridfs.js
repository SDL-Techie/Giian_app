import mongoose from "mongoose";
import { gzip, createGunzip } from "zlib";
import { promisify } from "util";
import path from "path";
import { compressPdfBuffer } from "./fileCompression.js";

const gzipAsync = promisify(gzip);
const bucket = () => new mongoose.mongo.GridFSBucket(mongoose.connection.db, { bucketName: "documents" });
const safeName = (name = "file") => path.basename(String(name)).replace(/[\r\n"<>]/g, "_").slice(0, 180);

export const saveBufferToGridFS = async (file, metadata = {}) => {
  if (!file?.buffer) return null;
  const originalName = safeName(file.originalname);
  const isPdf = String(file.mimetype || "").toLowerCase() === "application/pdf";

  let storedBuffer;
  let contentType;
  let compression;
  let compressed;
  let targetReached;

  if (isPdf) {
    const result = await compressPdfBuffer(file.buffer);
    storedBuffer = result.buffer;
    contentType = "application/pdf";
    compression = result.compression;
    compressed = result.reduced;
    targetReached = result.targetReached;
  } else {
    storedBuffer = await gzipAsync(file.buffer, { level: 9 });
    contentType = "application/gzip";
    compression = "gzip";
    compressed = true;
  }

  return new Promise((resolve, reject) => {
    const stream = bucket().openUploadStream(originalName, {
      contentType,
      metadata: {
        ...metadata,
        originalName,
        originalContentType: file.mimetype,
        originalSize: file.size ?? file.buffer.length,
        storedSize: storedBuffer.length,
        compressed,
        compression,
        ...(isPdf ? { targetKb: Number(process.env.PDF_TARGET_KB || 80), targetReached } : {}),
      },
    });
    stream.on("error", reject);
    stream.on("finish", () => resolve({
      id: String(stream.id),
      filename: originalName,
      contentType: file.mimetype,
      size: file.size ?? file.buffer.length,
      storedSize: storedBuffer.length,
      compressed,
      compression,
      ...(isPdf ? { targetReached } : {}),
      url: `/api/v1/files/${stream.id}`,
    }));
    stream.end(storedBuffer);
  });
};

export const getGridFSFileMetadata = async (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) return null;
  const [file] = await bucket().find({ _id: new mongoose.Types.ObjectId(id) }).limit(1).toArray();
  return file || null;
};

export const streamGridFSFile = async (id, res) => {
  if (!mongoose.Types.ObjectId.isValid(id)) return false;
  const _id = new mongoose.Types.ObjectId(id);
  const files = await bucket().find({ _id }).toArray();
  if (!files.length) return false;
  const file = files[0];
  const meta = file.metadata || {};
  res.setHeader("Content-Type", meta.originalContentType || file.contentType || "application/octet-stream");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Content-Disposition", `inline; filename*=UTF-8''${encodeURIComponent(meta.originalName || file.filename)}`);
  const download = bucket().openDownloadStream(_id);
  // PDFs are stored as valid compressed PDFs and can be streamed directly.
  if (meta.compression === "gzip") download.pipe(createGunzip()).pipe(res);
  else download.pipe(res);
  return true;
};
