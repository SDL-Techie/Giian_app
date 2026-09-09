// scripts/regenerate-all-receipts.js
//
// Regenerates the PDF for EVERY receipt using the current generator/design,
// regardless of whether a file already exists on disk. Run this once after
// updating the receipt PDF design so old receipts get the new layout + esign.
//
// Usage (from the Backend/ folder):
//   node scripts/regenerate-all-receipts.js

import "dotenv/config";
import mongoose from "mongoose";
import Receipt from "../model/receiptModel.js";
import Customer from "../model/customerModel.js";
import { generateReceiptPdf } from "../utils/pdfGenerator.js";

const run = async () => {
  const uri = process.env.DB_URL;
  if (!uri) throw new Error("DB_URL not set (check your .env)");

  await mongoose.connect(uri);
  console.log("Connected to MongoDB");

  const receipts = await Receipt.find({})
    .populate("allocations.invoice", "invoiceNo balanceAmount totalAmount paidAmount")
    .populate("createdBy", "name esignUrl");

  let fixed = 0;
  let failed = 0;

  for (const receipt of receipts) {
    try {
      const customer = await Customer.findById(receipt.customer);
      if (!customer) {
        console.warn(`Skipped ${receipt.receiptNo}: customer not found`);
        failed += 1;
        continue;
      }

      const pdfPath = await generateReceiptPdf({
        receipt,
        customer,
        allocations: receipt.allocations || [],
        paymentMode: receipt.paymentMode || "",
        receiptType: receipt.type,
        createdBy: receipt.createdBy || null,
      });

      receipt.pdfUrl = `/${pdfPath}`;
      await receipt.save();
      console.log(`Regenerated -> ${receipt.receiptNo}`);
      fixed += 1;
    } catch (err) {
      console.error(`Failed ${receipt.receiptNo}: ${err.message}`);
      failed += 1;
    }
  }

  console.log("\nDone.");
  console.log(`  Regenerated : ${fixed}`);
  console.log(`  Failed      : ${failed}`);

  await mongoose.disconnect();
};

run().catch((err) => {
  console.error("Regeneration script failed:", err);
  process.exit(1);
});