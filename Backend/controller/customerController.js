import Customer from "../model/customerModel.js";
import Quotation from "../model/quotationModel.js";
import Invoice from "../model/invoiceModel.js";
import { isValidObjectId, isValidEmail, isFiniteNumber } from "../utils/validators.js";
import { saveBufferToGridFS } from "../utils/gridfs.js";

const saveDocs = async (files, userId) => {
  const saved = [];
  // Sequential processing avoids spawning many PDF compression processes at once.
  for (const file of files || []) {
    saved.push(await saveBufferToGridFS(file, { module: "customer", uploadedBy: String(userId) }));
  }
  return saved;
};
const fields = ["companyName", "telephoneNumber", "email", "mobileNumber", "contactPersonName", "companyAddress", "creditLimit"];

const validateCustomerInput = (body, partial = false) => {
  if (!partial && !String(body.companyName || "").trim()) return "Name of the company is required";
  if (body.email && !isValidEmail(body.email)) return "Invalid email format";
  if (body.creditLimit !== undefined && (!isFiniteNumber(body.creditLimit) || Number(body.creditLimit) < 0)) return "Credit limit must be zero or greater";
  return null;
};

export const createCustomer = async (req, res, next) => {
  try {
    const error = validateCustomerInput(req.body);
    if (error) return res.status(400).json({ success: false, message: error });
    const docs = await saveDocs(req.files, req.user._id);
    const data = {};
    for (const key of fields) if (req.body[key] !== undefined) data[key] = req.body[key];
    if (data.companyName) data.companyName = String(data.companyName).trim();
    if (data.email) data.email = String(data.email).toLowerCase().trim();
    const customer = await Customer.create({ ...data, companyDocuments: docs, companyDocumentUrl: docs[0]?.url, createdBy: req.user._id });
    res.status(201).json({ success: true, message: "Customer created successfully", data: customer });
  } catch (e) { next(e); }
};

export const getAllCustomers = async (req, res, next) => {
  try {
    const { search, status } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (search) filter.$text = { $search: search };
    const data = await Customer.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, message: "Customers fetched", data });
  } catch (e) { next(e); }
};

export const getCustomerById = async (req, res, next) => {
  try {
    if (!isValidObjectId(req.params.id)) return res.status(400).json({ success: false, message: "Invalid customer id" });
    const data = await Customer.findById(req.params.id);
    if (!data) return res.status(404).json({ success: false, message: "Customer not found" });
    res.json({ success: true, message: "Customer fetched", data });
  } catch (e) { next(e); }
};

export const updateCustomer = async (req, res, next) => {
  try {
    if (!isValidObjectId(req.params.id)) return res.status(400).json({ success: false, message: "Invalid customer id" });
    const error = validateCustomerInput(req.body, true);
    if (error) return res.status(400).json({ success: false, message: error });
    const customer = await Customer.findById(req.params.id);
    if (!customer) return res.status(404).json({ success: false, message: "Customer not found" });
    for (const key of fields) if (req.body[key] !== undefined) customer[key] = req.body[key];
    if (req.body.companyName !== undefined) customer.companyName = String(req.body.companyName).trim();
    if (req.body.email !== undefined) customer.email = String(req.body.email).toLowerCase().trim();
    if (req.files?.length) {
      const docs = await saveDocs(req.files, req.user._id);
      customer.companyDocuments = [...(customer.companyDocuments || []), ...docs];
      customer.companyDocumentUrl = customer.companyDocuments[0]?.url;
    }
    await customer.save();
    res.json({ success: true, message: "Customer updated successfully", data: customer });
  } catch (e) { next(e); }
};

export const setCustomerStatus = async (req, res, next) => {
  try {
    if (!isValidObjectId(req.params.id)) return res.status(400).json({ success: false, message: "Invalid customer id" });
    if (!["Active", "Inactive"].includes(req.body.status)) return res.status(400).json({ success: false, message: "status must be Active or Inactive" });
    const data = await Customer.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true });
    if (!data) return res.status(404).json({ success: false, message: "Customer not found" });
    res.json({ success: true, message: `Customer ${req.body.status === "Active" ? "activated" : "deactivated"} successfully`, data });
  } catch (e) { next(e); }
};

export const deleteCustomer = async (req, res, next) => { req.body.status = "Inactive"; return setCustomerStatus(req, res, next); };
export const customerWiseQuotationReport = async (req, res, next) => { try { const { customerId, from, to } = req.query; if (!customerId || !isValidObjectId(customerId)) return res.status(400).json({ success: false, message: "A valid customerId is required" }); const filter = { customer: customerId }; if (from || to) { filter.dateOfQuotation = {}; if (from) filter.dateOfQuotation.$gte = new Date(from); if (to) filter.dateOfQuotation.$lte = new Date(to); } const data = await Quotation.find(filter).populate("customer", "companyName").populate("salesPerson", "name").sort({ dateOfQuotation: -1 }); res.json({ success: true, message: "Report generated", data }); } catch (e) { next(e); } };
export const customerWiseSalesReport = async (req, res, next) => { try { const { customerId, from, to } = req.query; if (!customerId || !isValidObjectId(customerId)) return res.status(400).json({ success: false, message: "A valid customerId is required" }); const filter = { customer: customerId }; if (from || to) { filter.invoiceDate = {}; if (from) filter.invoiceDate.$gte = new Date(from); if (to) filter.invoiceDate.$lte = new Date(to); } const data = await Invoice.find(filter).populate("customer", "companyName").populate("salesPerson", "name").sort({ invoiceDate: -1 }); res.json({ success: true, message: "Report generated", data }); } catch (e) { next(e); } };
