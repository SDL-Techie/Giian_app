import Purchase from "../model/purchaseModel.js";
import Invoice from "../model/invoiceModel.js";

// @desc   VAT Paid report (VAT paid to vendors on Purchases)
// @route  GET /api/v1/vat/paid?from=&to=
export const vatPaidReport = async (req, res, next) => {
  try {
    const { from, to } = req.query;
    const filter = { status: "Active" };
    if (from || to) {
      filter.dateOfPurchase = {};
      if (from) filter.dateOfPurchase.$gte = new Date(from);
      if (to) filter.dateOfPurchase.$lte = new Date(to);
    }

    const purchases = await Purchase.find(filter).sort({ dateOfPurchase: -1 });
    const totalVatPaid = Number(
      purchases.reduce((sum, p) => sum + (p.vatAmount || 0), 0).toFixed(2)
    );

    res.status(200).json({
      success: true,
      message: "VAT paid report generated",
      data: { purchases, totalVatPaid },
    });
  } catch (err) {
    next(err);
  }
};

// @desc   VAT Collected report (VAT collected from customers on Sales)
// @route  GET /api/v1/vat/collected?from=&to=
export const vatCollectedReport = async (req, res, next) => {
  try {
    const { from, to } = req.query;
    const filter = { status: "Active" };
    if (from || to) {
      filter.invoiceDate = {};
      if (from) filter.invoiceDate.$gte = new Date(from);
      if (to) filter.invoiceDate.$lte = new Date(to);
    }

    const invoices = await Invoice.find(filter)
      .populate("customer", "companyName")
      .sort({ invoiceDate: -1 });
    const totalVatCollected = Number(
      invoices.reduce((sum, inv) => sum + (inv.vatAmount || 0), 0).toFixed(2)
    );

    res.status(200).json({
      success: true,
      message: "VAT collected report generated",
      data: { invoices, totalVatCollected },
    });
  } catch (err) {
    next(err);
  }
};
