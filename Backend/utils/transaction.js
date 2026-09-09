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
let fallbackNoticeLogged = false;

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

    if (!fallbackNoticeLogged) {
      logger.info("Local standalone MongoDB detected; development transaction fallback is active. Production still requires MongoDB Atlas or a replica set.");
      fallbackNoticeLogged = true;
    }
    return work(null);
  } finally {
    await session.endSession();
  }
};
