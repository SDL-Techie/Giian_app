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
    if (process.env.NODE_ENV === "production") {
      const hello = await data.connection.db.admin().command({ hello: 1 });
      const transactionCapable = Boolean(hello?.setName) || hello?.msg === "isdbgrid";
      if (!transactionCapable) {
        await data.connection.close();
        throw new Error("Production requires MongoDB Atlas, a replica set, or mongos because financial operations use transactions");
      }
    }
    logger.info("MongoDB connected", { host: data.connection.host, database: data.connection.name });
    return data;
  } catch (err) {
    logger.error("MongoDB connection failed", { error: err.message });
    throw err;
  }
};
