import mongoose from "mongoose";

const invoiceItemSchema = new mongoose.Schema(
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

const invoiceSchema = new mongoose.Schema(
  {
    invoiceNo: {
      type: String,
      required: true,
      unique: true,
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: [true, "Customer is required"],
    },
    invoiceDate: {
      type: Date,
      required: [true, "Invoice date is required"],
    },
    referenceNo: {
      type: String, // optional
      trim: true,
    },
    // Present only when the invoice was generated from an existing quotation.
    quotation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Quotation",
      default: null,
    },
    items: {
      type: [invoiceItemSchema],
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
    // Running total of amounts applied via Receipts (collection/advance adjustment).
    paidAmount: {
      type: Number,
      default: 0,
    },
    balanceAmount: {
      type: Number,
      required: true,
    },
    salesPerson: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: ["Active", "Cancelled"],
      default: "Active",
    },
    paymentStatus: {
      type: String,
      enum: ["Unpaid", "Partially Paid", "Paid"],
      default: "Unpaid",
    },
    cancelledAt: {
      type: Date,
    },
    cancelledReason: {
      type: String,
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


invoiceSchema.index({customer:1,invoiceDate:-1,status:1});
invoiceSchema.index({salesPerson:1,invoiceDate:-1,status:1});
invoiceSchema.index({paymentStatus:1,balanceAmount:1});
invoiceSchema.index({quotation:1},{unique:true,partialFilterExpression:{quotation:{$type:"objectId"}}});
const Invoice = mongoose.model("Invoice", invoiceSchema);
export default Invoice;
