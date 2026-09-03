import mongoose from "mongoose";

const purchaseItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    qty: {
      type: Number,
      required: true,
      min: [0.01, "Quantity must be greater than 0"],
    },
    cost: {
      type: Number,
      required: true,
      min: [0, "Cost cannot be negative"],
    },
    totalCost: {
      type: Number,
      required: true,
    },
  },
  { _id: false }
);

const purchaseSchema = new mongoose.Schema(
  {
    purchaseNo: {
      type: String,
      required: true,
      unique: true,
    },
    dateOfPurchase: {
      type: Date,
      required: [true, "Date of purchase is required"],
    },
    vendorName: {
      type: String,
      required: [true, "Vendor name is required"],
      trim: true,
    },
    invoiceNumber: {
      type: String,
      required: [true, "Invoice number is required"],
      trim: true,
    },
    invoiceFileUrl: {
      type: String, // uploaded scanned invoice
    },
    items: {
      type: [purchaseItemSchema],
      validate: [(arr) => arr.length > 0, "At least one product is required"],
    },
    subTotalCost: {
      type: Number,
      required: true,
    },
    vatPercent: {
      type: Number,
      default: 0,
    },
    vatAmount: {
      type: Number,
      default: 0,
    },
    totalCost: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ["Active", "Cancelled"],
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

const Purchase = mongoose.model("Purchase", purchaseSchema);
export default Purchase;
