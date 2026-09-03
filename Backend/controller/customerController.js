import Customer from "../model/customerModel.js";
import Quotation from "../model/quotationModel.js";
import Invoice from "../model/invoiceModel.js";
import { isValidObjectId } from "../utils/validators.js";

// @desc   Create customer
// @route  POST /api/v1/customers
export const createCustomer = async (req, res, next) => {
  try {
    const {
      companyName,
      telephoneNumber,
      email,
      mobileNumber,
      contactPersonName,
      companyAddress,
      creditLimit,
    } = req.body;

    if (!companyName) {
      return res
        .status(400)
        .json({ success: false, message: "Name of the company is required" });
    }

    const customer = await Customer.create({
      companyName,
      telephoneNumber,
      email,
      mobileNumber,
      contactPersonName,
      companyAddress,
      creditLimit,
      companyDocumentUrl: req.file ? `/uploads/${req.file.filename}` : undefined,
      createdBy: req.user._id,
    });

    res.status(201).json({ success: true, message: "Customer created successfully", data: customer });
  } catch (err) {
    next(err);
  }
};

// @desc   List of customers (with optional search)
// @route  GET /api/v1/customers
export const getAllCustomers = async (req, res, next) => {
  try {
    const { search, status } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (search) filter.$text = { $search: search };

    const customers = await Customer.find(filter).sort({ createdAt: -1 });
    res.status(200).json({ success: true, message: "Customers fetched", data: customers });
  } catch (err) {
    next(err);
  }
};

// @desc   Get single customer
// @route  GET /api/v1/customers/:id
export const getCustomerById = async (req, res, next) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid customer id" });
    }
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({ success: false, message: "Customer not found" });
    }
    res.status(200).json({ success: true, message: "Customer fetched", data: customer });
  } catch (err) {
    next(err);
  }
};

// @desc   Update customer
// @route  PUT /api/v1/customers/:id
export const updateCustomer = async (req, res, next) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid customer id" });
    }

    const updates = { ...req.body };
    if (req.file) {
      updates.companyDocumentUrl = `/uploads/${req.file.filename}`;
    }

    const customer = await Customer.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    });

    if (!customer) {
      return res.status(404).json({ success: false, message: "Customer not found" });
    }

    res.status(200).json({ success: true, message: "Customer updated successfully", data: customer });
  } catch (err) {
    next(err);
  }
};

// @desc   Deactivate / delete customer
// @route  DELETE /api/v1/customers/:id
export const deleteCustomer = async (req, res, next) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid customer id" });
    }
    const customer = await Customer.findByIdAndUpdate(
      req.params.id,
      { status: "Inactive" },
      { new: true }
    );
    if (!customer) {
      return res.status(404).json({ success: false, message: "Customer not found" });
    }
    res.status(200).json({ success: true, message: "Customer deactivated successfully" });
  } catch (err) {
    next(err);
  }
};

// ---------- Reports ----------

// @desc   Customer wise quotation report
// @route  GET /api/v1/customers/reports/quotations?customerId=&from=&to=
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
      .populate("salesPerson", "name")
      .sort({ dateOfQuotation: -1 });

    res.status(200).json({ success: true, message: "Report generated", data: quotations });
  } catch (err) {
    next(err);
  }
};

// @desc   Customer wise sales report
// @route  GET /api/v1/customers/reports/sales?customerId=&from=&to=
export const customerWiseSalesReport = async (req, res, next) => {
  try {
    const { customerId, from, to } = req.query;
    if (!customerId || !isValidObjectId(customerId)) {
      return res.status(400).json({ success: false, message: "A valid customerId is required" });
    }

    const filter = { customer: customerId };
    if (from || to) {
      filter.invoiceDate = {};
      if (from) filter.invoiceDate.$gte = new Date(from);
      if (to) filter.invoiceDate.$lte = new Date(to);
    }

    const invoices = await Invoice.find(filter)
      .populate("customer", "companyName")
      .populate("salesPerson", "name")
      .sort({ invoiceDate: -1 });

    res.status(200).json({ success: true, message: "Report generated", data: invoices });
  } catch (err) {
    next(err);
  }
};
