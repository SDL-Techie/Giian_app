// scripts/repair-receipt-pdfs.js
//
// One-off maintenance script: finds every Receipt whose pdfUrl points to a
// file that no longer exists in Backend/uploads/ (e.g. left over from an
// older PDF-naming scheme), regenerates the PDF with the current generator,
// and updates the receipt's pdfUrl to the new file.
//
// Usage (run from the Backend/ folder so relative paths & .env resolve):
//   node scripts/repair-receipt-pdfs.js
//
// Safe to re-run — it only touches receipts whose current pdfUrl file is
// missing from disk.

import "dotenv/config";
import path from "path";
import fs from "fs";
import mongoose from "mongoose";
import Receipt from "../model/receiptModel.js";
import Customer from "../model/customerModel.js";
import Invoice from "../model/invoiceModel.js";
import User from "../model/userModel.js";
import { generateReceiptPdf } from "../utils/pdfGenerator.js";

const UPLOAD_DIR = "uploads";

const run = async () => {
  const uri = process.env.DB_URL;
  if (!uri) throw new Error("DB_URL not set (check your .env)");

  await mongoose.connect(uri);
  console.log("Connected to MongoDB");

  const receipts = await Receipt.find({ pdfUrl: { $exists: true, $ne: null } })
    .populate("allocations.invoice", "invoiceNo balanceAmount totalAmount paidAmount")
    .populate("createdBy", "name");

  let fixed = 0;
  let alreadyOk = 0;
  let failed = 0;

  for (const receipt of receipts) {
    const fileName = path.basename(receipt.pdfUrl);
    const onDisk = path.join(UPLOAD_DIR, fileName);

    if (fs.existsSync(onDisk)) {
      alreadyOk += 1;
      continue;
    }

    console.log(`Missing file for ${receipt.receiptNo}: ${fileName} -> regenerating...`);

    try {
      const customer = await Customer.findById(receipt.customer);
      if (!customer) {
        console.warn(`  Skipped ${receipt.receiptNo}: customer not found`);
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
      console.log(`  Fixed -> ${receipt.pdfUrl}`);
      fixed += 1;
    } catch (err) {
      console.error(`  Failed to regenerate ${receipt.receiptNo}: ${err.message}`);
      failed += 1;
    }
  }

  console.log("\nDone.");
  console.log(`  Already OK : ${alreadyOk}`);
  console.log(`  Fixed      : ${fixed}`);
  console.log(`  Failed     : ${failed}`);

  await mongoose.disconnect();
};

run().catch((err) => {
  console.error("Repair script failed:", err);
  process.exit(1);
});