import mongoose from "mongoose";

const counterSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  seq: { type: Number, default: 0 },
});

const Counter = mongoose.model("Counter", counterSchema);

export const getNextSequence = async (key, prefix = "", session = null) => {
  const options = { new: true, upsert: true, setDefaultsOnInsert: true };
  if (session) options.session = session;
  const counter = await Counter.findOneAndUpdate({ key }, { $inc: { seq: 1 } }, options);
  return `${prefix}${String(counter.seq).padStart(6, "0")}`;
};

export default Counter;
