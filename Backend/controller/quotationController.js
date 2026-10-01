// import Quotation from "../model/quotationModel.js";
// import Customer from "../model/customerModel.js";
// import Product from "../model/productModel.js";
// import { getNextSequence } from "../model/counterModel.js";
// import { calculateLineItems, sumItems, computeGrandTotal } from "../utils/calculateTotals.js";
// import { validateLineItems, isValidObjectId, validateCommercialTotalsInput, isValidDateValue } from "../utils/validators.js";
// import { generateBrandedPdf } from "../utils/pdfGenerator.js";
// import { getCompanyTrn } from "../utils/companyTrn.js";
// import { logger } from "../utils/logger.js";

// // @desc   New quotation
// // @route  POST /api/v1/quotations
// export const createQuotation = async (req, res, next) => {
//   try {
//     const { customer: customerId, dateOfQuotation, subject, attn, deliveryTime, warrantyTerms, items, discount, vatPercent, customerTrn, companyTrn } = req.body;

//     if (!customerId || !isValidObjectId(customerId)) {
//       return res.status(400).json({ success: false, message: "A valid customer is required" });
//     }
//     if (!dateOfQuotation || !isValidDateValue(dateOfQuotation)) {
//       return res.status(400).json({ success: false, message: "A valid quotation date is required" });
//     }

//     const customer = await Customer.findById(customerId);
//     if (!customer || customer.status !== "Active") {
//       return res.status(404).json({ success: false, message: "Active customer not found" });
//     }

//     const validationError = validateLineItems(items, "price");
//     if (validationError) {
//       return res.status(400).json({ success: false, message: validationError });
//     }

//     const productIds = items.map((i) => i.product);
//     const products = await Product.find({ _id: { $in: productIds }, status: "Active" });
//     if (products.length !== new Set(productIds).size) {
//       return res.status(400).json({ success: false, message: "One or more products are invalid" });
//     }

//     const lineItems = calculateLineItems(items, "price");
//     const subTotal = sumItems(lineItems, "totalPrice");
//     const totalsValidation = validateCommercialTotalsInput({ subTotal, discount: discount || 0, vatPercent: vatPercent || 0 });
//     if (totalsValidation) return res.status(400).json({ success: false, message: totalsValidation });
//     const totals = computeGrandTotal({ subTotal, discount: discount || 0, vatPercent: vatPercent || 0 });

//     const quotationNo = await getNextSequence("quotation", "QTN-");

//     const quotation = await Quotation.create({
//       quotationNo,
//       customer: customerId,
//       dateOfQuotation,
//       // ATTN defaults to the customer's contact person name unless the user overrides it.
//       attn: attn || customer.contactPersonName,
//       subject: String(subject || "").trim(),
//       deliveryTime: String(deliveryTime || "").trim(),
//       warrantyTerms: String(warrantyTerms || "").trim(),
//       items: lineItems,
//       discount: discount || 0,
//       subTotal: totals.subTotal,
//       vatPercent: vatPercent || 0,
//       vatAmount: totals.vatAmount,
//       totalAmount: totals.totalAmount,
//       customerTrn: String(customerTrn ?? customer.trn ?? '').trim(),
//    companyTrn: await getCompanyTrn(),
//       salesPerson: req.body.salesPerson || req.user._id,
//       createdBy: req.user._id,
//     });

//     // Dubai-only project: generate the GIIAN AED + VAT proposal.
//     const productMap = new Map(products.map((p) => [String(p._id), p]));
//     const pdfItems = lineItems.map((i) => ({ name: productMap.get(String(i.product))?.name || "Product", imageUrl: productMap.get(String(i.product))?.productImageUrl, qty: i.qty, price: i.price, total: i.totalPrice }));
//     let pdfWarning;
//     try {
//       quotation.pdfDubaiUrl = await generateBrandedPdf({ title:"QUOTATION", docNumber:quotation.quotationNo, fileNamePrefix:"quotation", region:"dubai", date:dateOfQuotation, attn:quotation.attn,   subject: quotation.subject, deliveryTime: quotation.deliveryTime, customer, items:pdfItems, discount:discount||0, vatPercent:vatPercent||0, subTotal:totals.subTotal, vatAmount:totals.vatAmount, totalAmount:totals.totalAmount,  customerTrn: quotation.customerTrn, companyTrn: quotation.companyTrn, currency:"AED", warrantyTerms: quotation.warrantyTerms });
//       quotation.pdfUrl = quotation.pdfDubaiUrl;
//       await quotation.save();
//     } catch (pdfError) {
//       pdfWarning = "Quotation was created, but PDF generation failed.";
//       logger.error("Quotation PDF generation failed", { quotationId: String(quotation._id), error: pdfError.message });
//     }

//     res.status(201).json({ success: true, message: "Quotation created successfully", data: quotation, ...(pdfWarning ? { warning: pdfWarning } : {}) });
//   } catch (err) {
//     next(err);
//   }
// };

// // @desc   List quotations (used e.g. when generating an invoice "from quotation")
// // @route  GET /api/v1/quotations?status=Open
// export const getAllQuotations = async (req, res, next) => {
//   try {
//     const { status, customerId } = req.query;
//     const filter = {};
//     if (status) filter.status = status;
//     if (customerId) filter.customer = customerId;

//     const quotations = await Quotation.find(filter)
//       .populate("customer", "companyName contactPersonName")
//       .populate("salesPerson", "name")
//       .sort({ createdAt: -1 });

//     res.status(200).json({ success: true, message: "Quotations fetched", data: quotations });
//   } catch (err) {
//     next(err);
//   }
// };

// // @desc   Get single quotation
// // @route  GET /api/v1/quotations/:id
// // export const getQuotationById = async (req, res, next) => {
// //   try {
// //     if (!isValidObjectId(req.params.id)) {
// //       return res.status(400).json({ success: false, message: "Invalid quotation id" });
// //     }
// //     const quotation = await Quotation.findById(req.params.id)
// //       .populate("customer")
// //       .populate("salesPerson", "name")
// //       .populate("items.product", "name itemCode");
// //     if (!quotation) {
// //       return res.status(404).json({ success: false, message: "Quotation not found" });
// //     }
// //     res.status(200).json({ success: true, message: "Quotation fetched", data: quotation });
// //   } catch (err) {
// //     next(err);
// //   }
// // };

// export const getQuotationById = async (req, res, next) => {
//   try {
//     if (!isValidObjectId(req.params.id)) {
//       return res.status(400).json({ success: false, message: "Invalid quotation id" });
//     }
//     const quotation = await Quotation.findById(req.params.id)
//       .populate("customer")
//       .populate("salesPerson", "name")
//       .populate("approvedBy", "name")
//       .populate("items.product", "name itemCode");
//     if (!quotation) {
//       return res.status(404).json({ success: false, message: "Quotation not found" });
//     }
//     res.status(200).json({ success: true, message: "Quotation fetched", data: quotation });
//   } catch (err) {
//     next(err);
//   }
// };

// // @desc   Cancel a quotation
// // @route  PUT /api/v1/quotations/:id/cancel
// export const cancelQuotation = async (req, res, next) => {
//   try {
//     if (!isValidObjectId(req.params.id)) {
//       return res.status(400).json({ success: false, message: "Invalid quotation id" });
//     }
//     const quotation = await Quotation.findById(req.params.id);
//     if (!quotation) {
//       return res.status(404).json({ success: false, message: "Quotation not found" });
//     }
//     if (quotation.status === "Converted") {
//       return res
//         .status(400)
//         .json({ success: false, message: "Cannot cancel a quotation that has already been converted to an invoice" });
//     }
//     quotation.status = "Cancelled";
//     await quotation.save();
//     res.status(200).json({ success: true, message: "Quotation cancelled successfully", data: quotation });
//   } catch (err) {
//     next(err);
//   }
// };

// // ---------- Reports ----------

// // @desc   Customer wise quotation report
// // @route  GET /api/v1/quotations/reports/customer-wise?customerId=&from=&to=
// export const customerWiseQuotationReport = async (req, res, next) => {
//   try {
//     const { customerId, from, to } = req.query;
//     if (!customerId || !isValidObjectId(customerId)) {
//       return res.status(400).json({ success: false, message: "A valid customerId is required" });
//     }
//     const filter = { customer: customerId };
//     if (from || to) {
//       filter.dateOfQuotation = {};
//       if (from) filter.dateOfQuotation.$gte = new Date(from);
//       if (to) filter.dateOfQuotation.$lte = new Date(to);
//     }
//     const quotations = await Quotation.find(filter)
//       .populate("customer", "companyName")
//       .sort({ dateOfQuotation: -1 });
//     res.status(200).json({ success: true, message: "Report generated", data: quotations });
//   } catch (err) {
//     next(err);
//   }
// };

// // @desc   Salesman wise quotation report
// // @route  GET /api/v1/quotations/reports/salesman-wise?salesPersonId=&from=&to=
// export const salesmanWiseQuotationReport = async (req, res, next) => {
//   try {
//     const { salesPersonId, from, to } = req.query;
//     if (!salesPersonId || !isValidObjectId(salesPersonId)) {
//       return res.status(400).json({ success: false, message: "A valid salesPersonId is required" });
//     }
//     const filter = { salesPerson: salesPersonId };
//     if (from || to) {
//       filter.dateOfQuotation = {};
//       if (from) filter.dateOfQuotation.$gte = new Date(from);
//       if (to) filter.dateOfQuotation.$lte = new Date(to);
//     }
//     const quotations = await Quotation.find(filter)
//       .populate("customer", "companyName")
//       .populate("salesPerson", "name")
//       .sort({ dateOfQuotation: -1 });
//     res.status(200).json({ success: true, message: "Report generated", data: quotations });
//   } catch (err) {
//     next(err);
//   }
// };


// // export const generateQuotationPdf = async (req, res, next) => {
// //   try {
// //     const pageSize = String(req.query.size || "A4").toUpperCase() === "A5" ? "A5" : "A4";
// //     if (!isValidObjectId(req.params.id)) return res.status(400).json({ success:false, message:"Invalid quotation id" });
// //     const quotation = await Quotation.findById(req.params.id).populate("customer").populate("items.product", "name itemCode productImageUrl");
// //     if (!quotation) return res.status(404).json({ success:false, message:"Quotation not found" });
// //     const items = quotation.items.map(i => ({ name:i.product?.name || "Product", imageUrl:i.product?.productImageUrl, qty:i.qty, price:i.price, total:i.totalPrice }));
// //     const url = await generateBrandedPdf({ title:"QUOTATION", docNumber:quotation.quotationNo, fileNamePrefix:"quotation", region:"dubai", pageSize, date:quotation.dateOfQuotation, attn:quotation.attn, customer:quotation.customer, items, discount:quotation.discount||0, vatPercent:quotation.vatPercent||0, subTotal:quotation.subTotal, vatAmount:quotation.vatAmount, totalAmount:quotation.totalAmount, currency:"AED", warrantyTerms:quotation.warrantyTerms || "" });
// //     return res.json({ success:true, message:`${pageSize} quotation generated`, data:{url,pageSize} });
// //   } catch (e) { next(e); }
// // };


// export const generateQuotationPdf = async (req, res, next) => {
//   try {
//     const pageSize = String(req.query.size || "A4").toUpperCase() === "A5" ? "A5" : "A4";
//     if (!isValidObjectId(req.params.id)) return res.status(400).json({ success:false, message:"Invalid quotation id" });
//     const quotation = await Quotation.findById(req.params.id)
//       .populate("customer")
//       .populate("approvedBy", "name")
//       .populate("createdBy", "name esignUrl")
//       .populate("items.product", "name itemCode productImageUrl");
//     if (!quotation) return res.status(404).json({ success:false, message:"Quotation not found" });
//     const items = quotation.items.map(i => ({ name:i.product?.name || "Product", imageUrl:i.product?.productImageUrl, qty:i.qty, price:i.price, total:i.totalPrice }));
//     const url = await generateBrandedPdf({
//       title:"QUOTATION", docNumber:quotation.quotationNo, fileNamePrefix:"quotation", region:"dubai", pageSize,
//       date:quotation.dateOfQuotation, attn:quotation.attn, subject: quotation.subject,  deliveryTime: quotation.deliveryTime,customer:quotation.customer, items,  customerTrn: quotation.customerTrn,   // add
//   companyTrn: quotation.companyTrn, 
//       discount:quotation.discount||0, vatPercent:quotation.vatPercent||0, subTotal:quotation.subTotal,
//       vatAmount:quotation.vatAmount, totalAmount:quotation.totalAmount, currency:"AED",
//       warrantyTerms:quotation.warrantyTerms || "",
//       approved: quotation.approvalStatus === "Approved",
//       approvedBy: quotation.approvedBy?.name || "",
//       approvedAt: quotation.approvedAt,
//       createdBy: quotation.createdBy,  
//     });
//     return res.json({ success:true, message:`${pageSize} quotation generated`, data:{url,pageSize} });
//   } catch (e) { next(e); }
// };


// export const approveQuotation = async (req, res, next) => {
//   try {
//     if (!isValidObjectId(req.params.id)) return res.status(400).json({ success: false, message: "Invalid quotation id" });
//     const quotation = await Quotation.findById(req.params.id);
//     if (!quotation) return res.status(404).json({ success: false, message: "Quotation not found" });
//     // if (quotation.status !== "Open") return res.status(400).json({ success: false, message: "Only open quotations can be approved" });
//     // if (quotation.approvalStatus === "Approved") return res.status(400).json({ success: false, message: "Quotation is already approved" });

//     quotation.approvalStatus = "Approved";
//     quotation.approvedBy = req.user._id;
//     quotation.approvedAt = new Date();
//     await quotation.save();

//     const populated = await Quotation.findById(quotation._id)
//       .populate("customer")
//       .populate("approvedBy", "name")
//       .populate("createdBy", "name esignUrl")
//       .populate("items.product", "name itemCode productImageUrl");

//     const items = populated.items.map((i) => ({
//       name: i.product?.name || "Product",
//       imageUrl: i.product?.productImageUrl,
//       qty: i.qty,
//       price: i.price,
//       total: i.totalPrice,
//     }));

//     const url = await generateBrandedPdf({
//       title: "QUOTATION",
//       docNumber: populated.quotationNo,
//       fileNamePrefix: "quotation",
//       region: "dubai",
//       pageSize: "A4",
//       date: populated.dateOfQuotation,
//       attn: populated.attn,
//       subject: populated.subject,
//       deliveryTime: populated.deliveryTime,
//       customer: populated.customer,
//       items,
//       discount: populated.discount || 0,
//       vatPercent: populated.vatPercent || 0,
//       subTotal: populated.subTotal,
//       vatAmount: populated.vatAmount,
//       totalAmount: populated.totalAmount,
//       currency: "AED",
//       warrantyTerms: populated.warrantyTerms || "",
//         customerTrn: populated.customerTrn,   // add
//   companyTrn: populated.companyTrn,
//       approved: true,
//       approvedBy: populated.approvedBy?.name || req.user.name,
//       approvedAt: populated.approvedAt,
//       createdBy: populated.createdBy,
//     });

//     populated.pdfDubaiUrl = url;
//     populated.pdfUrl = url;
//     await populated.save();

//     return res.json({ success: true, message: "Quotation approved successfully", data: populated });
//   } catch (e) {
//     next(e);
//   }
// };


// // @desc   Edit a quotation
// // @route  PUT /api/v1/quotations/:id
// export const editQuotation = async (req, res, next) => {
//   try {
//     if (!isValidObjectId(req.params.id)) {
//       return res.status(400).json({ success: false, message: "Invalid quotation id" });
//     }

//     const quotation = await Quotation.findById(req.params.id);
//     if (!quotation) {
//       return res.status(404).json({ success: false, message: "Quotation not found" });
//     }
//     if (quotation.status === "Converted") {
//       return res.status(400).json({ success: false, message: "Cannot edit a quotation that has been converted to an invoice" });
//     }
//     if (quotation.status === "Cancelled") {
//       return res.status(400).json({ success: false, message: "Cannot edit a cancelled quotation" });
//     }

// const { customer: customerId, dateOfQuotation, subject, attn, deliveryTime, warrantyTerms, items, discount, vatPercent, salesPerson, customerTrn, companyTrn } = req.body;

//     // ---- Customer ----
//     let customer;
//     const customerChanged = customerId && String(customerId) !== String(quotation.customer);
//     if (customerId) {
//       if (!isValidObjectId(customerId)) {
//         return res.status(400).json({ success: false, message: "A valid customer is required" });
//       }
//       customer = await Customer.findById(customerId);
//       if (!customer || customer.status !== "Active") {
//         return res.status(404).json({ success: false, message: "Active customer not found" });
//       }
//       quotation.customer = customerId;
//     } else {
//       customer = await Customer.findById(quotation.customer);
//     }

//     // ---- Date ----
//     if (dateOfQuotation !== undefined) {
//       if (!dateOfQuotation || !isValidDateValue(dateOfQuotation)) {
//         return res.status(400).json({ success: false, message: "A valid quotation date is required" });
//       }
//       quotation.dateOfQuotation = dateOfQuotation;
//     }

//     // ---- Line items ----
//     let lineItems;
//     if (items !== undefined) {
//       const validationError = validateLineItems(items, "price");
//       if (validationError) {
//         return res.status(400).json({ success: false, message: validationError });
//       }
//       const productIds = items.map((i) => i.product);
//       const activeProducts = await Product.find({ _id: { $in: productIds }, status: "Active" });
//       if (activeProducts.length !== new Set(productIds.map(String)).size) {
//         return res.status(400).json({ success: false, message: "One or more products are invalid" });
//       }
//       lineItems = calculateLineItems(items, "price");
//     } else {
//       // Keep existing items (re-calculated so totals stay consistent with discount/VAT changes)
//       lineItems = calculateLineItems(
//         quotation.items.map((i) => ({ product: i.product, qty: i.qty, price: i.price })),
//         "price"
//       );
//     }

//     // ---- Totals ----
//     const newDiscount = discount !== undefined ? discount : quotation.discount || 0;
//     const newVatPercent = vatPercent !== undefined ? vatPercent : quotation.vatPercent || 0;
//     const subTotal = sumItems(lineItems, "totalPrice");

//     const totalsValidation = validateCommercialTotalsInput({ subTotal, discount: newDiscount, vatPercent: newVatPercent });
//     if (totalsValidation) {
//       return res.status(400).json({ success: false, message: totalsValidation });
//     }
//     const totals = computeGrandTotal({ subTotal, discount: newDiscount, vatPercent: newVatPercent });

//     // ---- Apply changes ----
//     quotation.items = lineItems;
//     quotation.discount = newDiscount;
//     quotation.vatPercent = newVatPercent;
//     quotation.subTotal = totals.subTotal;
//     quotation.vatAmount = totals.vatAmount;
//     quotation.totalAmount = totals.totalAmount;

//     if (attn !== undefined) quotation.attn = String(attn).trim() || customer?.contactPersonName;
//     else if (customerChanged) quotation.attn = customer?.contactPersonName; // re-default to the new customer's contact

//     if (subject !== undefined) quotation.subject = String(subject || "").trim();
//     if (deliveryTime !== undefined) quotation.deliveryTime = String(deliveryTime || "").trim();
//     if (customerTrn !== undefined) quotation.customerTrn = String(customerTrn || "").trim();
// if (companyTrn !== undefined) quotation.companyTrn = String(companyTrn || "").trim();
//     if (warrantyTerms !== undefined) quotation.warrantyTerms = String(warrantyTerms || "").trim();
//     if (salesPerson !== undefined) {
//       if (!isValidObjectId(salesPerson)) {
//         return res.status(400).json({ success: false, message: "Invalid salesPerson id" });
//       }
//       quotation.salesPerson = salesPerson;
//     }

//     // Editing invalidates a previous approval — it must be re-approved.
//     // NOTE: adjust "Pending" to match your approvalStatus enum.
//     const wasApproved = quotation.approvalStatus === "Approved";
//     if (wasApproved) {
//       quotation.approvalStatus = "Pending";
//       quotation.approvedBy = undefined;
//       quotation.approvedAt = undefined;
//     }

//     quotation.updatedBy = req.user._id; // remove if your schema has no updatedBy
//     await quotation.save();

//     // ---- Regenerate PDF ----
//     const productIds = quotation.items.map((i) => i.product);
//     const products = await Product.find({ _id: { $in: productIds } });
//     const productMap = new Map(products.map((p) => [String(p._id), p]));
//     const pdfItems = quotation.items.map((i) => ({
//       name: productMap.get(String(i.product))?.name || "Product",
//       imageUrl: productMap.get(String(i.product))?.productImageUrl,
//       qty: i.qty,
//       price: i.price,
//       total: i.totalPrice,
//     }));

//     let pdfWarning;
//     try {
//       const url = await generateBrandedPdf({
//         title: "QUOTATION",
//         docNumber: quotation.quotationNo,
//         fileNamePrefix: "quotation",
//         region: "dubai",
//         date: quotation.dateOfQuotation,
//         attn: quotation.attn,
//         subject: quotation.subject,
//         deliveryTime: quotation.deliveryTime,
//         customer,
//         items: pdfItems,
//         discount: quotation.discount || 0,
//         vatPercent: quotation.vatPercent || 0,
//         subTotal: quotation.subTotal,
//         vatAmount: quotation.vatAmount,
//         customerTrn: quotation.customerTrn,
// companyTrn: quotation.companyTrn,
//         totalAmount: quotation.totalAmount,
//         currency: "AED",
//         warrantyTerms: quotation.warrantyTerms || "",
//       });
//       quotation.pdfDubaiUrl = url;
//       quotation.pdfUrl = url;
//       await quotation.save();
//     } catch (pdfError) {
//       pdfWarning = "Quotation was updated, but PDF generation failed.";
//       logger.error("Quotation PDF regeneration failed", { quotationId: String(quotation._id), error: pdfError.message });
//     }

//     const updated = await Quotation.findById(quotation._id)
//       .populate("customer")
//       .populate("salesPerson", "name")
//       .populate("approvedBy", "name")
//       .populate("createdBy", "name esignUrl")  
//       .populate("items.product", "name itemCode");

//     res.status(200).json({
//       success: true,
//       message: wasApproved
//         ? "Quotation updated successfully. It needs to be approved again."
//         : "Quotation updated successfully",
//       data: updated,
//       ...(pdfWarning ? { warning: pdfWarning } : {}),
//     });
//   } catch (err) {
//     next(err);
//   }
// };


import Quotation from "../model/quotationModel.js";
import Customer from "../model/customerModel.js";
import Product from "../model/productModel.js";
import { getNextSequence } from "../model/counterModel.js";
import { calculateLineItems, sumItems, computeGrandTotal } from "../utils/calculateTotals.js";
import { validateLineItems, isValidObjectId, validateCommercialTotalsInput, isValidDateValue } from "../utils/validators.js";
import { generateBrandedPdf } from "../utils/pdfGenerator.js";
import { getCompanyTrn } from "../utils/companyTrn.js";
import { logger } from "../utils/logger.js";

// @desc   New quotation
// @route  POST /api/v1/quotations
export const createQuotation = async (req, res, next) => {
  try {
    // NOTE: companyTrn is NOT read from the request any more - it always comes from the admin user.
    const { customer: customerId, dateOfQuotation, subject, attn, deliveryTime, warrantyTerms, items, discount, vatPercent, customerTrn } = req.body;

    if (!customerId || !isValidObjectId(customerId)) {
      return res.status(400).json({ success: false, message: "A valid customer is required" });
    }
    if (!dateOfQuotation || !isValidDateValue(dateOfQuotation)) {
      return res.status(400).json({ success: false, message: "A valid quotation date is required" });
    }

    const customer = await Customer.findById(customerId);
    if (!customer || customer.status !== "Active") {
      return res.status(404).json({ success: false, message: "Active customer not found" });
    }

    const validationError = validateLineItems(items, "price");
    if (validationError) {
      return res.status(400).json({ success: false, message: validationError });
    }

    const productIds = items.map((i) => i.product);
    const products = await Product.find({ _id: { $in: productIds }, status: "Active" });
    if (products.length !== new Set(productIds).size) {
      return res.status(400).json({ success: false, message: "One or more products are invalid" });
    }

    const lineItems = calculateLineItems(items, "price");
    const subTotal = sumItems(lineItems, "totalPrice");
    const totalsValidation = validateCommercialTotalsInput({ subTotal, discount: discount || 0, vatPercent: vatPercent || 0 });
    if (totalsValidation) return res.status(400).json({ success: false, message: totalsValidation });
    const totals = computeGrandTotal({ subTotal, discount: discount || 0, vatPercent: vatPercent || 0 });

    const quotationNo = await getNextSequence("quotation", "QTN-");

    const quotation = await Quotation.create({
      quotationNo,
      customer: customerId,
      dateOfQuotation,
      // ATTN defaults to the customer's contact person name unless the user overrides it.
      attn: attn || customer.contactPersonName,
      subject: String(subject || "").trim(),
      deliveryTime: String(deliveryTime || "").trim(),
      warrantyTerms: String(warrantyTerms || "").trim(),
      items: lineItems,
      discount: discount || 0,
      subTotal: totals.subTotal,
      vatPercent: vatPercent || 0,
      vatAmount: totals.vatAmount,
      totalAmount: totals.totalAmount,
      // Customer TRN: what the user typed, otherwise the customer's saved TRN.
      customerTrn: String(customerTrn ?? customer.trn ?? "").trim(),
      // Company TRN: always the admin's TRN (same for every quotation).
      companyTrn: await getCompanyTrn(),
      salesPerson: req.body.salesPerson || req.user._id,
      createdBy: req.user._id,
    });

    // Dubai-only project: generate the GIIAN AED + VAT proposal.
    const productMap = new Map(products.map((p) => [String(p._id), p]));
    const pdfItems = lineItems.map((i) => ({ name: productMap.get(String(i.product))?.name || "Product", imageUrl: productMap.get(String(i.product))?.productImageUrl, qty: i.qty, price: i.price, total: i.totalPrice }));
    let pdfWarning;
    try {
      quotation.pdfDubaiUrl = await generateBrandedPdf({
        title: "QUOTATION", docNumber: quotation.quotationNo, fileNamePrefix: "quotation", region: "dubai",
        date: dateOfQuotation, attn: quotation.attn, subject: quotation.subject, deliveryTime: quotation.deliveryTime,
        customer, items: pdfItems, discount: discount || 0, vatPercent: vatPercent || 0,
        subTotal: totals.subTotal, vatAmount: totals.vatAmount, totalAmount: totals.totalAmount,
        customerTrn: quotation.customerTrn,
        companyTrn: quotation.companyTrn || (await getCompanyTrn()),
        currency: "AED", warrantyTerms: quotation.warrantyTerms,
      });
      quotation.pdfUrl = quotation.pdfDubaiUrl;
      await quotation.save();
    } catch (pdfError) {
      pdfWarning = "Quotation was created, but PDF generation failed.";
      logger.error("Quotation PDF generation failed", { quotationId: String(quotation._id), error: pdfError.message });
    }

    res.status(201).json({ success: true, message: "Quotation created successfully", data: quotation, ...(pdfWarning ? { warning: pdfWarning } : {}) });
  } catch (err) {
    next(err);
  }
};

// @desc   List quotations (used e.g. when generating an invoice "from quotation")
// @route  GET /api/v1/quotations?status=Open
export const getAllQuotations = async (req, res, next) => {
  try {
    const { status, customerId } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (customerId) filter.customer = customerId;

    const quotations = await Quotation.find(filter)
      .populate("customer", "companyName contactPersonName")
      .populate("salesPerson", "name")
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, message: "Quotations fetched", data: quotations });
  } catch (err) {
    next(err);
  }
};

// @desc   Get single quotation
// @route  GET /api/v1/quotations/:id
export const getQuotationById = async (req, res, next) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid quotation id" });
    }
    const quotation = await Quotation.findById(req.params.id)
      .populate("customer")
      .populate("salesPerson", "name")
      .populate("approvedBy", "name")
      .populate("items.product", "name itemCode");
    if (!quotation) {
      return res.status(404).json({ success: false, message: "Quotation not found" });
    }
    res.status(200).json({ success: true, message: "Quotation fetched", data: quotation });
  } catch (err) {
    next(err);
  }
};

// @desc   Cancel a quotation
// @route  PUT /api/v1/quotations/:id/cancel
export const cancelQuotation = async (req, res, next) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid quotation id" });
    }
    const quotation = await Quotation.findById(req.params.id);
    if (!quotation) {
      return res.status(404).json({ success: false, message: "Quotation not found" });
    }
    if (quotation.status === "Converted") {
      return res
        .status(400)
        .json({ success: false, message: "Cannot cancel a quotation that has already been converted to an invoice" });
    }
    quotation.status = "Cancelled";
    await quotation.save();
    res.status(200).json({ success: true, message: "Quotation cancelled successfully", data: quotation });
  } catch (err) {
    next(err);
  }
};

// ---------- Reports ----------

// @desc   Customer wise quotation report
// @route  GET /api/v1/quotations/reports/customer-wise?customerId=&from=&to=
export const customerWiseQuotationReport = async (req, res, next) => {
  try {
    const { customerId, from, to } = req.query;
    if (!customerId || !isValidObjectId(customerId)) {
      return res.status(400).json({ success: false, message: "A valid customerId is required" });
    }
    const filter = { customer: customerId };
    if (from || to) {
      filter.dateOfQuotation = {};
      if (from) filter.dateOfQuotation.$gte = new Date(from);
      if (to) filter.dateOfQuotation.$lte = new Date(to);
    }
    const quotations = await Quotation.find(filter)
      .populate("customer", "companyName")
      .sort({ dateOfQuotation: -1 });
    res.status(200).json({ success: true, message: "Report generated", data: quotations });
  } catch (err) {
    next(err);
  }
};

// @desc   Salesman wise quotation report
// @route  GET /api/v1/quotations/reports/salesman-wise?salesPersonId=&from=&to=
export const salesmanWiseQuotationReport = async (req, res, next) => {
  try {
    const { salesPersonId, from, to } = req.query;
    if (!salesPersonId || !isValidObjectId(salesPersonId)) {
      return res.status(400).json({ success: false, message: "A valid salesPersonId is required" });
    }
    const filter = { salesPerson: salesPersonId };
    if (from || to) {
      filter.dateOfQuotation = {};
      if (from) filter.dateOfQuotation.$gte = new Date(from);
      if (to) filter.dateOfQuotation.$lte = new Date(to);
    }
    const quotations = await Quotation.find(filter)
      .populate("customer", "companyName")
      .populate("salesPerson", "name")
      .sort({ dateOfQuotation: -1 });
    res.status(200).json({ success: true, message: "Report generated", data: quotations });
  } catch (err) {
    next(err);
  }
};

export const generateQuotationPdf = async (req, res, next) => {
  try {
    const pageSize = String(req.query.size || "A4").toUpperCase() === "A5" ? "A5" : "A4";
    if (!isValidObjectId(req.params.id)) return res.status(400).json({ success:false, message:"Invalid quotation id" });
    const quotation = await Quotation.findById(req.params.id)
      .populate("customer")
      .populate("approvedBy", "name")
      .populate("createdBy", "name esignUrl")
      .populate("items.product", "name itemCode productImageUrl");
    if (!quotation) return res.status(404).json({ success:false, message:"Quotation not found" });
    const items = quotation.items.map(i => ({ name:i.product?.name || "Product", imageUrl:i.product?.productImageUrl, qty:i.qty, price:i.price, total:i.totalPrice }));
    const url = await generateBrandedPdf({
      title:"QUOTATION", docNumber:quotation.quotationNo, fileNamePrefix:"quotation", region:"dubai", pageSize,
      date:quotation.dateOfQuotation, attn:quotation.attn, subject: quotation.subject, deliveryTime: quotation.deliveryTime,
      customer:quotation.customer, items,
      customerTrn: quotation.customerTrn,
      companyTrn: quotation.companyTrn || (await getCompanyTrn()),
      discount:quotation.discount||0, vatPercent:quotation.vatPercent||0, subTotal:quotation.subTotal,
      vatAmount:quotation.vatAmount, totalAmount:quotation.totalAmount, currency:"AED",
      warrantyTerms:quotation.warrantyTerms || "",
      approved: quotation.approvalStatus === "Approved",
      approvedBy: quotation.approvedBy?.name || "",
      approvedAt: quotation.approvedAt,
      createdBy: quotation.createdBy,
    });
    return res.json({ success:true, message:`${pageSize} quotation generated`, data:{url,pageSize} });
  } catch (e) { next(e); }
};

export const approveQuotation = async (req, res, next) => {
  try {
    if (!isValidObjectId(req.params.id)) return res.status(400).json({ success: false, message: "Invalid quotation id" });
    const quotation = await Quotation.findById(req.params.id);
    if (!quotation) return res.status(404).json({ success: false, message: "Quotation not found" });

    quotation.approvalStatus = "Approved";
    quotation.approvedBy = req.user._id;
    quotation.approvedAt = new Date();
    await quotation.save();

    const populated = await Quotation.findById(quotation._id)
      .populate("customer")
      .populate("approvedBy", "name")
      .populate("createdBy", "name esignUrl")
      .populate("items.product", "name itemCode productImageUrl");

    const items = populated.items.map((i) => ({
      name: i.product?.name || "Product",
      imageUrl: i.product?.productImageUrl,
      qty: i.qty,
      price: i.price,
      total: i.totalPrice,
    }));

    const url = await generateBrandedPdf({
      title: "QUOTATION",
      docNumber: populated.quotationNo,
      fileNamePrefix: "quotation",
      region: "dubai",
      pageSize: "A4",
      date: populated.dateOfQuotation,
      attn: populated.attn,
      subject: populated.subject,
      deliveryTime: populated.deliveryTime,
      customer: populated.customer,
      items,
      discount: populated.discount || 0,
      vatPercent: populated.vatPercent || 0,
      subTotal: populated.subTotal,
      vatAmount: populated.vatAmount,
      totalAmount: populated.totalAmount,
      currency: "AED",
      warrantyTerms: populated.warrantyTerms || "",
      customerTrn: populated.customerTrn,
      companyTrn: populated.companyTrn || (await getCompanyTrn()),
      approved: true,
      approvedBy: populated.approvedBy?.name || req.user.name,
      approvedAt: populated.approvedAt,
      createdBy: populated.createdBy,
    });

    populated.pdfDubaiUrl = url;
    populated.pdfUrl = url;
    await populated.save();

    return res.json({ success: true, message: "Quotation approved successfully", data: populated });
  } catch (e) {
    next(e);
  }
};

// @desc   Edit a quotation
// @route  PUT /api/v1/quotations/:id
export const editQuotation = async (req, res, next) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid quotation id" });
    }

    const quotation = await Quotation.findById(req.params.id);
    if (!quotation) {
      return res.status(404).json({ success: false, message: "Quotation not found" });
    }
    if (quotation.status === "Converted") {
      return res.status(400).json({ success: false, message: "Cannot edit a quotation that has been converted to an invoice" });
    }
    if (quotation.status === "Cancelled") {
      return res.status(400).json({ success: false, message: "Cannot edit a cancelled quotation" });
    }

    // NOTE: companyTrn is NOT read from the request any more.
    const { customer: customerId, dateOfQuotation, subject, attn, deliveryTime, warrantyTerms, items, discount, vatPercent, salesPerson, customerTrn } = req.body;

    // ---- Customer ----
    let customer;
    const customerChanged = customerId && String(customerId) !== String(quotation.customer);
    if (customerId) {
      if (!isValidObjectId(customerId)) {
        return res.status(400).json({ success: false, message: "A valid customer is required" });
      }
      customer = await Customer.findById(customerId);
      if (!customer || customer.status !== "Active") {
        return res.status(404).json({ success: false, message: "Active customer not found" });
      }
      quotation.customer = customerId;
    } else {
      customer = await Customer.findById(quotation.customer);
    }

    // ---- Date ----
    if (dateOfQuotation !== undefined) {
      if (!dateOfQuotation || !isValidDateValue(dateOfQuotation)) {
        return res.status(400).json({ success: false, message: "A valid quotation date is required" });
      }
      quotation.dateOfQuotation = dateOfQuotation;
    }

    // ---- Line items ----
    let lineItems;
    if (items !== undefined) {
      const validationError = validateLineItems(items, "price");
      if (validationError) {
        return res.status(400).json({ success: false, message: validationError });
      }
      const productIds = items.map((i) => i.product);
      const activeProducts = await Product.find({ _id: { $in: productIds }, status: "Active" });
      if (activeProducts.length !== new Set(productIds.map(String)).size) {
        return res.status(400).json({ success: false, message: "One or more products are invalid" });
      }
      lineItems = calculateLineItems(items, "price");
    } else {
      // Keep existing items (re-calculated so totals stay consistent with discount/VAT changes)
      lineItems = calculateLineItems(
        quotation.items.map((i) => ({ product: i.product, qty: i.qty, price: i.price })),
        "price"
      );
    }

    // ---- Totals ----
    const newDiscount = discount !== undefined ? discount : quotation.discount || 0;
    const newVatPercent = vatPercent !== undefined ? vatPercent : quotation.vatPercent || 0;
    const subTotal = sumItems(lineItems, "totalPrice");

    const totalsValidation = validateCommercialTotalsInput({ subTotal, discount: newDiscount, vatPercent: newVatPercent });
    if (totalsValidation) {
      return res.status(400).json({ success: false, message: totalsValidation });
    }
    const totals = computeGrandTotal({ subTotal, discount: newDiscount, vatPercent: newVatPercent });

    // ---- Apply changes ----
    quotation.items = lineItems;
    quotation.discount = newDiscount;
    quotation.vatPercent = newVatPercent;
    quotation.subTotal = totals.subTotal;
    quotation.vatAmount = totals.vatAmount;
    quotation.totalAmount = totals.totalAmount;

    if (attn !== undefined) quotation.attn = String(attn).trim() || customer?.contactPersonName;
    else if (customerChanged) quotation.attn = customer?.contactPersonName; // re-default to the new customer's contact

    if (subject !== undefined) quotation.subject = String(subject || "").trim();
    if (deliveryTime !== undefined) quotation.deliveryTime = String(deliveryTime || "").trim();
    if (customerTrn !== undefined) quotation.customerTrn = String(customerTrn || "").trim();
    // Company TRN always follows the admin's TRN (same for every quotation).
    quotation.companyTrn = await getCompanyTrn();
    if (warrantyTerms !== undefined) quotation.warrantyTerms = String(warrantyTerms || "").trim();
    if (salesPerson !== undefined) {
      if (!isValidObjectId(salesPerson)) {
        return res.status(400).json({ success: false, message: "Invalid salesPerson id" });
      }
      quotation.salesPerson = salesPerson;
    }

    // Editing invalidates a previous approval — it must be re-approved.
    // NOTE: adjust "Pending" to match your approvalStatus enum.
    const wasApproved = quotation.approvalStatus === "Approved";
    if (wasApproved) {
      quotation.approvalStatus = "Pending";
      quotation.approvedBy = undefined;
      quotation.approvedAt = undefined;
    }

    quotation.updatedBy = req.user._id; // remove if your schema has no updatedBy
    await quotation.save();

    // ---- Regenerate PDF ----
    const productIds = quotation.items.map((i) => i.product);
    const products = await Product.find({ _id: { $in: productIds } });
    const productMap = new Map(products.map((p) => [String(p._id), p]));
    const pdfItems = quotation.items.map((i) => ({
      name: productMap.get(String(i.product))?.name || "Product",
      imageUrl: productMap.get(String(i.product))?.productImageUrl,
      qty: i.qty,
      price: i.price,
      total: i.totalPrice,
    }));

    let pdfWarning;
    try {
      const url = await generateBrandedPdf({
        title: "QUOTATION",
        docNumber: quotation.quotationNo,
        fileNamePrefix: "quotation",
        region: "dubai",
        date: quotation.dateOfQuotation,
        attn: quotation.attn,
        subject: quotation.subject,
        deliveryTime: quotation.deliveryTime,
        customer,
        items: pdfItems,
        discount: quotation.discount || 0,
        vatPercent: quotation.vatPercent || 0,
        subTotal: quotation.subTotal,
        vatAmount: quotation.vatAmount,
        customerTrn: quotation.customerTrn,
        companyTrn: quotation.companyTrn,
        totalAmount: quotation.totalAmount,
        currency: "AED",
        warrantyTerms: quotation.warrantyTerms || "",
      });
      quotation.pdfDubaiUrl = url;
      quotation.pdfUrl = url;
      await quotation.save();
    } catch (pdfError) {
      pdfWarning = "Quotation was updated, but PDF generation failed.";
      logger.error("Quotation PDF regeneration failed", { quotationId: String(quotation._id), error: pdfError.message });
    }

    const updated = await Quotation.findById(quotation._id)
      .populate("customer")
      .populate("salesPerson", "name")
      .populate("approvedBy", "name")
      .populate("createdBy", "name esignUrl")
      .populate("items.product", "name itemCode");

    res.status(200).json({
      success: true,
      message: wasApproved
        ? "Quotation updated successfully. It needs to be approved again."
        : "Quotation updated successfully",
      data: updated,
      ...(pdfWarning ? { warning: pdfWarning } : {}),
    });
  } catch (err) {
    next(err);
  }
};