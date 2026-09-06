import { logger } from "../utils/logger.js";

export const notFound = (req, res) => {
  res.status(404).json({ success: false, message: `Route not found - ${req.originalUrl}`, requestId: req.requestId });
};

export const errorHandler = (err, req, res, _next) => {
  logger.error("Request failed", {
    requestId: req.requestId,
    method: req.method,
    path: req.originalUrl,
    statusCode: err.statusCode || 500,
    error: err.message,
    ...(process.env.NODE_ENV !== "production" && err.stack ? { stack: err.stack } : {}),
  });

  let statusCode = err.statusCode || err.status || 500;
  let message = statusCode >= 500 && process.env.NODE_ENV === "production" ? "Internal Server Error" : (err.message || "Internal Server Error");

  if (err.name === "CastError") { statusCode = 400; message = `Invalid ${err.path}`; }
  if (err.name === "ValidationError") { statusCode = 400; message = Object.values(err.errors).map((v) => v.message).join(", "); }
  if (err.code === 11000) { statusCode = 409; message = `Duplicate value for field: ${Object.keys(err.keyValue || {})[0] || "unique field"}`; }
  if (err.name === "MulterError") { statusCode = 400; message = err.message; }

  res.status(statusCode).json({ success: false, message, requestId: req.requestId });
};
