import mongoose from "mongoose";
const schema = new mongoose.Schema({ name: { type: String, required: true, trim: true, unique: true, maxlength: 100 }, abbreviation: { type: String, trim: true, default: "", maxlength: 20 }, status: { type: String, enum: ["Active", "Inactive"], default: "Active" }, createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true } }, { timestamps: true });
export default mongoose.model("Measurement", schema);
