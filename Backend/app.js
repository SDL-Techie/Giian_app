import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";

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

import { notFound, errorHandler } from "./middleware/errorHandler.js";

const app = express();

// ---------- Security & core middleware ----------
app.use(helmet());
app.use(cookieParser());

const allowedOrigins = (process.env.CLIENT_URL || "")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: allowedOrigins.length ? allowedOrigins : true,
    credentials: true,
  })
);

app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true }));

// Serve uploaded documents/images/generated PDFs.
app.use("/uploads", express.static("uploads"));

// Basic rate limiting on all API routes to slow brute force / abuse.
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/api/", apiLimiter);

// Stricter limiter on auth endpoints (login/register) to slow credential stuffing.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many attempts, please try again later." },
});
app.use("/api/v1/auth/login", authLimiter);
app.use("/api/v1/auth/register", authLimiter);

// ---------- Routes ----------
app.get("/api/v1/health", (req, res) => {
  res.status(200).json({ success: true, message: "API is running" });
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

// ---------- Fallback handlers ----------
app.use(notFound);
app.use(errorHandler);

export default app;
