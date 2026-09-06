import dotenv from "dotenv";
dotenv.config({ path: "./.env" });

import http from "http";
import mongoose from "mongoose";
import { connectDB } from "./config/db.js";
import { ensureBootstrapAdmin } from "./bootstrap/admin.js";
import { logger } from "./utils/logger.js";

const validateEnvironment = () => {
  const required = ["DB_URL", "JWT_SECRET"];
  const missing = required.filter((key) => !process.env[key]);
  if (missing.length) throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
  if (process.env.NODE_ENV === "production" && String(process.env.JWT_SECRET).length < 32) {
    throw new Error("JWT_SECRET must be at least 32 characters in production");
  }
  if (process.env.NODE_ENV === "production" && !process.env.CLIENT_URL) {
    throw new Error("CLIENT_URL must be configured in production");
  }
};

const startServer = async () => {
  validateEnvironment();
  await connectDB();
  await ensureBootstrapAdmin();

  const { default: app } = await import("./app.js");
  const PORT = Number(process.env.PORT || 4000);
  const server = http.createServer(app);

  server.listen(PORT, () => logger.info("Server started", { port: PORT, environment: process.env.NODE_ENV || "development" }));

  const shutdown = async (signal) => {
    logger.info("Graceful shutdown started", { signal });
    server.close(async () => {
      await mongoose.connection.close();
      logger.info("Graceful shutdown complete");
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10000).unref();
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
};

startServer().catch((error) => {
  logger.error("Server startup failed", { error: error.message });
  process.exit(1);
});

process.on("unhandledRejection", (error) => {
  logger.error("Unhandled promise rejection", { error: error?.message || String(error) });
});
process.on("uncaughtException", (error) => {
  logger.error("Uncaught exception", { error: error?.message || String(error) });
  process.exit(1);
});
