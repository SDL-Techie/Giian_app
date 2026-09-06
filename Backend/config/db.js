import mongoose from "mongoose";
import { logger } from "../utils/logger.js";

export const connectDB = async () => {
  const uri = process.env.DB_URL;
  if (!uri) throw new Error("DB_URL environment variable is required");

  try {
    const data = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: Number(process.env.DB_SERVER_SELECTION_TIMEOUT_MS || 10000),
      maxPoolSize: Number(process.env.DB_MAX_POOL_SIZE || 20),
      minPoolSize: Number(process.env.DB_MIN_POOL_SIZE || 0),
    });
    logger.info("MongoDB connected", { host: data.connection.host, database: data.connection.name });
    return data;
  } catch (err) {
    logger.error("MongoDB connection failed", { error: err.message });
    throw err;
  }
};
