import mongoose from "mongoose";

const categorySchema = new mongoose.Schema({
  name: { type: String, required: [true, "Category name is required"], trim: true, unique: true },
  status: { type: String, enum: ["Active", "Inactive"], default: "Active" },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
}, { timestamps: true });
categorySchema.index({ status: 1, createdAt: -1 });
export default mongoose.model("Category", categorySchema);
