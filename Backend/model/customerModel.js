import mongoose from "mongoose";

const customerSchema = new mongoose.Schema(
  {
    companyName: {
      type: String,
      required: [true, "Name of the company is required"],
      trim: true,
    },
    telephoneNumber: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },
    mobileNumber: {
      type: String,
      trim: true,
    },
    contactPersonName: {
      type: String,
      trim: true,
    },
    companyAddress: {
      type: String,
      trim: true,
    },
    creditLimit: {
      type: Number,
      default: 0,
      min: [0, "Credit limit cannot be negative"],
    },
    companyDocumentUrl: {
      type: String, // uploaded company document (registered under this customer)
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

customerSchema.index({ companyName: "text", contactPersonName: "text" });

const Customer = mongoose.model("Customer", customerSchema);
export default Customer;
