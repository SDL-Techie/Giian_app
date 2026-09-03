import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";

const UPLOAD_DIR = "uploads";

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

/**
 * Generates a simple tabular PDF document (Quotation / Invoice / Receipt)
 * and saves it under /uploads. Returns the relative file path to store on the record.
 *
 * @param {Object} opts
 * @param {string} opts.title - e.g. "QUOTATION", "TAX INVOICE", "RECEIPT"
 * @param {string} opts.docNumber
 * @param {string} opts.fileNamePrefix
 * @param {Object[]} opts.metaLines - [{ label, value }] rendered under the title
 * @param {Object} [opts.customer] - { companyName, contactPersonName, companyAddress, mobileNumber }
 * @param {Object[]} [opts.items] - [{ name, qty, price, total }]
 * @param {Object[]} [opts.summaryLines] - [{ label, value }] rendered after the items table (subtotal/discount/vat/total)
 */
export const generateDocumentPdf = async ({
  title,
  docNumber,
  fileNamePrefix,
  metaLines = [],
  customer,
  items,
  summaryLines = [],
}) => {
  return new Promise((resolve, reject) => {
    try {
      const fileName = `${fileNamePrefix}-${docNumber}-${Date.now()}.pdf`;
      const filePath = path.join(UPLOAD_DIR, fileName);
      const doc = new PDFDocument({ margin: 50 });
      const stream = fs.createWriteStream(filePath);
      doc.pipe(stream);

      doc.fontSize(18).text(title, { align: "center" });
      doc.moveDown();
      doc.fontSize(10).text(`Document No: ${docNumber}`, { align: "right" });

      metaLines.forEach((line) => {
        doc.fontSize(10).text(`${line.label}: ${line.value ?? ""}`);
      });

      if (customer) {
        doc.moveDown(0.5);
        doc.fontSize(11).text("Bill To:", { underline: true });
        if (customer.companyName) doc.fontSize(10).text(customer.companyName);
        if (customer.contactPersonName) doc.fontSize(10).text(customer.contactPersonName);
        if (customer.companyAddress) doc.fontSize(10).text(customer.companyAddress);
        if (customer.mobileNumber) doc.fontSize(10).text(customer.mobileNumber);
      }

      if (items && items.length) {
        doc.moveDown();
        const tableTop = doc.y;
        doc.fontSize(10).text("Product", 50, tableTop);
        doc.text("Qty", 260, tableTop);
        doc.text("Price", 330, tableTop);
        doc.text("Total", 420, tableTop);
        doc.moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).stroke();

        let y = tableTop + 22;
        items.forEach((item) => {
          doc.fontSize(10).text(String(item.name || ""), 50, y);
          doc.text(String(item.qty), 260, y);
          doc.text(Number(item.price).toFixed(2), 330, y);
          doc.text(Number(item.total).toFixed(2), 420, y);
          y += 18;
        });
        doc.moveDown(2);
      }

      doc.moveDown();
      summaryLines.forEach((line) => {
        doc.fontSize(11).text(`${line.label}: ${line.value}`, { align: "right" });
      });

      doc.end();

      stream.on("finish", () => resolve(filePath));
      stream.on("error", reject);
    } catch (err) {
      reject(err);
    }
  });
};
