import mongoose from "mongoose";
import { logger } from "./logger.js";

const unsupportedTransaction = (error) => {
  const msg = String(error?.message || "").toLowerCase();
  return (
    msg.includes("transaction numbers are only allowed") ||
    msg.includes("replica set") ||
    msg.includes("mongos")
  );
};

// Production requires MongoDB transactions (Atlas or replica set).
// Local standalone MongoDB can optionally fall back for development only.
export const withMongoTransaction = async (work) => {
  const session = await mongoose.startSession();
  try {
    let result;
    await session.withTransaction(async () => {
      result = await work(session);
    });
    return result;
  } catch (error) {
    const canFallback =
      process.env.NODE_ENV !== "production" &&
      process.env.ALLOW_NON_TRANSACTIONAL_DEV !== "false" &&
      unsupportedTransaction(error);

    if (!canFallback) throw error;

    logger.warn("MongoDB transactions are unavailable; using development-only non-transactional fallback");
    return work(null);
  } finally {
    await session.endSession();
  }
};
