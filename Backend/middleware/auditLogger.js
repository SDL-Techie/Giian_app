import crypto from "crypto";
import AuditLog from "../model/auditLogModel.js";
import { logger } from "../utils/logger.js";

const MUTATING = new Set(["POST", "PUT", "PATCH", "DELETE"]);
const SENSITIVE = new Set(["password", "currentPassword", "newPassword", "token"]);

const sanitize = (value, depth = 0) => {
  if (depth > 3) return "[truncated]";
  if (Array.isArray(value)) return value.slice(0, 20).map((v) => sanitize(v, depth + 1));
  if (!value || typeof value !== "object") return value;
  const out = {};
  for (const [key, val] of Object.entries(value)) {
    out[key] = SENSITIVE.has(key) ? "[redacted]" : sanitize(val, depth + 1);
  }
  return out;
};

export const requestContext = (req, res, next) => {
  req.requestId = req.headers["x-request-id"] || crypto.randomUUID();
  res.setHeader("X-Request-Id", req.requestId);
  next();
};

export const auditMutations = (req, res, next) => {
  if (!MUTATING.has(req.method)) return next();

  res.on("finish", async () => {
    if (res.statusCode >= 400) return;
    try {
      await AuditLog.create({
        actor: req.user?._id || null,
        method: req.method,
        path: req.originalUrl,
        statusCode: res.statusCode,
        ip: req.ip,
        userAgent: req.get("user-agent") || "",
        requestId: req.requestId,
        metadata: sanitize(req.body || {}),
      });
    } catch (error) {
      logger.error("Failed to write audit log", { requestId: req.requestId, error: error.message });
    }
  });

  next();
};
