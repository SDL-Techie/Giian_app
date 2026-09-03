import mongoose from "mongoose";

// Records how a collection receipt (or an advance adjustment) was applied
// across one or more pending invoices.
const allocationSchema = new mongoose.Schema(
  {
    invoice: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Invoice",
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: [0.01, "Allocation amount must be greater than 0"],
    },
  },
  { _id: false }
);

const receiptSchema = new mongoose.Schema(
  {
    receiptNo: {
      type: String,
      required: true,
      unique: true,
    },
    // "Advance"   - money received with no invoice allocation yet.
    // "Collection"- money received and applied against pending invoice(s).
    // "AdvanceAdjustment" - a previously received Advance later applied to invoice(s).
    type: {
      type: String,
      enum: ["Advance", "Collection", "AdvanceAdjustment"],
      required: true,
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: [true, "Customer is required"],
    },
    amount: {
      type: Number,
      required: [true, "Amount is required"],
      min: [0.01, "Amount must be greater than 0"],
    },
    paymentMode: {
      type: String,
      enum: ["Cash", "Bank"],
      required: function () {
        return this.type !== "AdvanceAdjustment";
      },
    },
    allocations: {
      type: [allocationSchema],
      default: [],
    },
    // For an Advance receipt, tracks how much of it is still unadjusted.
    remainingAdvance: {
      type: Number,
      default: 0,
    },
    // Links an AdvanceAdjustment receipt back to the original Advance receipt it draws from.
    sourceAdvanceReceipt: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Receipt",
      default: null,
    },
    pdfUrl: {
      type: String,
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

const Receipt = mongoose.model("Receipt", receiptSchema);
export default Receipt;
