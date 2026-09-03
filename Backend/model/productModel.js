import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name of the product is required"],
      trim: true,
    },
    itemCode: {
      type: String,
      required: [true, "Item code is required"],
      unique: true,
      trim: true,
    },
    unitOfMeasure: {
      type: String, // optional, e.g. Kg, Pcs, Ltr
      trim: true,
    },
    productImageUrl: {
      type: String, // optional
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: [true, "Category is required"],
    },
    status: {
      type: String,
      enum: ["Active", "Inactive"],
      default: "Active",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

productSchema.index({ name: "text", itemCode: "text" });

const Product = mongoose.model("Product", productSchema);
export default Product;
