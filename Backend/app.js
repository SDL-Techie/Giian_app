import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import mongoose from "mongoose";

import authRoute from "./route/authRoute.js";
import userRoute from "./route/userRoute.js";
import roleRoute from "./route/roleRoute.js";
import customerRoute from "./route/customerRoute.js";
import categoryRoute from "./route/categoryRoute.js";
import productRoute from "./route/productRoute.js";
import purchaseRoute from "./route/purchaseRoute.js";
import quotationRoute from "./route/quotationRoute.js";
import invoiceRoute from "./route/invoiceRoute.js";
import receiptRoute from "./route/receiptRoute.js";
import vatRoute from "./route/vatRoute.js";
import fileRoute from "./route/fileRoute.js";
import dataTransferRoute from "./route/dataTransferRoute.js";
import auditLogRoute from "./route/auditLogRoute.js";

import { notFound, errorHandler } from "./middleware/errorHandler.js";
import { verifyUser } from "./helper/userAuth.js";
import { requestContext, auditMutations } from "./middleware/auditLogger.js";

const app = express();
app.disable("x-powered-by");
if (process.env.TRUST_PROXY) app.set("trust proxy", Number(process.env.TRUST_PROXY) || 1);

app.use(requestContext);
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(cookieParser());

const allowedOrigins = (process.env.CLIENT_URL || "").split(",").map((o) => o.trim()).filter(Boolean);
app.use(cors({
  origin(origin, callback) {
    if (!origin) return callback(null, true); // React Native/Postman/server-to-server
    if (process.env.NODE_ENV !== "production" && allowedOrigins.length === 0) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    const error = new Error("Origin not allowed by CORS");
    error.statusCode = 403;
    callback(error);
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Request-Id"],
}));

app.use(express.json({ limit: process.env.JSON_BODY_LIMIT || "2mb" }));
app.use(express.urlencoded({ extended: true, limit: process.env.JSON_BODY_LIMIT || "2mb" }));
app.use("/uploads", verifyUser, express.static("uploads", { dotfiles: "deny", maxAge: process.env.NODE_ENV === "production" ? "1h" : 0 }));
app.use(auditMutations);

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: Number(process.env.API_RATE_LIMIT || 300),
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { success: false, message: "Too many requests, please try again later." },
});
app.use("/api/", apiLimiter);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: Number(process.env.AUTH_RATE_LIMIT || 10),
  standardHeaders: "draft-7",
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: { success: false, message: "Too many login attempts, please try again later." },
});
app.use("/api/v1/auth/login", authLimiter);

app.get("/api/v1/health", (_req, res) => res.status(200).json({ success: true, status: "alive" }));
app.get("/api/v1/ready", (_req, res) => {
  const dbReady = mongoose.connection.readyState === 1;
  return res.status(dbReady ? 200 : 503).json({ success: dbReady, status: dbReady ? "ready" : "not-ready", database: dbReady ? "connected" : "disconnected" });
});
app.use("/api/v1/auth", authRoute);
app.use("/api/v1/users", userRoute);
app.use("/api/v1/roles", roleRoute);
app.use("/api/v1/customers", customerRoute);
app.use("/api/v1/categories", categoryRoute);
app.use("/api/v1/products", productRoute);
app.use("/api/v1/purchases", purchaseRoute);
app.use("/api/v1/quotations", quotationRoute);
app.use("/api/v1/invoices", invoiceRoute);
app.use("/api/v1/receipts", receiptRoute);
app.use("/api/v1/vat", vatRoute);
app.use("/api/v1/files", fileRoute);
app.use("/api/v1/data-transfer", dataTransferRoute);
app.use("/api/v1/audit-logs", auditLogRoute);

app.use(notFound);
app.use(errorHandler);
export default app;
