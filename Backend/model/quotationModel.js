import mongoose from "mongoose";

const quotationItemSchema = new mongoose.Schema(
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
    price: {
      type: Number,
      required: true,
      min: [0, "Price cannot be negative"],
    },
    totalPrice: {
      type: Number,
      required: true,
    },
  },
  { _id: false }
);

const quotationSchema = new mongoose.Schema(
  {
    quotationNo: {
      type: String,
      required: true,
      unique: true,
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: [true, "Customer is required"],
    },
    dateOfQuotation: {
      type: Date,
      required: [true, "Date of quotation is required"],
    },
    // ATTN - defaults to the customer's contact person name unless overridden.
    attn: {
      type: String,
      trim: true,
    },
    warrantyTerms: {
      type: String,
      trim: true,
      default: "",
      maxlength: [2000, "Warranty terms are too long"],
    },
    items: {
      type: [quotationItemSchema],
      validate: [(arr) => arr.length > 0, "At least one product is required"],
    },
    discount: {
      type: Number,
      default: 0,
      min: [0, "Discount cannot be negative"],
    },
    subTotal: {
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
    totalAmount: {
      type: Number,
      required: true,
    },
    salesPerson: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // Once an invoice is generated from this quotation it is marked "Converted"
    // so it can no longer be converted again.
    status: {
      type: String,
      enum: ["Open", "Converted", "Cancelled"],
      default: "Open",
    },
     approvalStatus: {
      type: String,
      enum: ["Pending", "Approved"],
      default: "Pending",
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    approvedAt: {
      type: Date,
    },
    pdfUrl: { type: String },
    pdfDubaiUrl: { type: String },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);


quotationSchema.index({customer:1,dateOfQuotation:-1});
quotationSchema.index({salesPerson:1,dateOfQuotation:-1});
quotationSchema.index({status:1,createdAt:-1});
const Quotation = mongoose.model("Quotation", quotationSchema);
export default Quotation;
