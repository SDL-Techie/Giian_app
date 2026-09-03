import mongoose from "mongoose";

// Generic sequence counter, one document per sequence key (e.g. "quotation", "invoice", "receipt").
const counterSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  seq: { type: Number, default: 0 },
});

const Counter = mongoose.model("Counter", counterSchema);

/**
 * Atomically increments and returns the next number for a given key,
 * formatted with a prefix, e.g. getNextSequence("quotation", "QTN-") => "QTN-000001"
 */
export const getNextSequence = async (key, prefix = "") => {
  const counter = await Counter.findOneAndUpdate(
    { key },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  const padded = String(counter.seq).padStart(6, "0");
  return `${prefix}${padded}`;
};

export default Counter;
