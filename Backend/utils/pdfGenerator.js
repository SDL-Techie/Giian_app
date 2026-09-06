import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

const UPLOAD_DIR = 'uploads';
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });
const HEADS = { dubai: path.join('assets', 'letterheads', 'giian-dubai.png') };
const PAGE = { A4: { w: 595.28, h: 841.89 }, A5: { w: 419.53, h: 595.28 } };
const COMPANY_TRN = process.env.GIIAN_TRN_NO || '100001538600003';
const fmt = (n) => Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const fetchImage = async (url) => {
  if (!url) return null;
  try {
    if (/^https?:\/\//i.test(url)) {
      const r = await fetch(url);
      if (!r.ok) return null;
      return Buffer.from(await r.arrayBuffer());
    }
    const local = url.startsWith('/') ? url.slice(1) : url;
    return fs.existsSync(local) ? fs.readFileSync(local) : null;
  } catch { return null; }
};

const SMALL = ['', 'One','Two','Three','Four','Five','Six','Seven','Eight','Nine','Ten','Eleven','Twelve','Thirteen','Fourteen','Fifteen','Sixteen','Seventeen','Eighteen','Nineteen'];
const TENS = ['', '', 'Twenty','Thirty','Forty','Fifty','Sixty','Seventy','Eighty','Ninety'];
const underThousand = (n) => {
  let out = [];
  if (n >= 100) { out.push(`${SMALL[Math.floor(n / 100)]} Hundred`); n %= 100; }
  if (n >= 20) { out.push(TENS[Math.floor(n / 10)]); if (n % 10) out.push(SMALL[n % 10]); }
  else if (n > 0) out.push(SMALL[n]);
  return out.join(' ');
};
const integerToWords = (value) => {
  let n = Math.floor(Math.abs(Number(value) || 0));
  if (n === 0) return 'Zero';
  const groups = [
    [1_000_000_000, 'Billion'], [1_000_000, 'Million'], [1_000, 'Thousand'], [1, '']
  ];
  const parts = [];
  for (const [div, label] of groups) {
    const chunk = Math.floor(n / div);
    if (chunk) {
      parts.push(`${underThousand(chunk)}${label ? ` ${label}` : ''}`);
      n %= div;
    }
  }
  return parts.join(' ').trim();
};
const amountInWords = (amount, currency = 'AED') => {
  const n = Math.max(0, Number(amount) || 0);
  const whole = Math.floor(n);
  const fils = Math.round((n - whole) * 100);
  const filsText = fils ? ` and ${integerToWords(fils)} Fils` : '';
  return `${currency} ${integerToWords(whole)}${filsText} Only.`;
};
const safe = (v, fallback = '-') => String(v ?? '').trim() || fallback;

export const generateBrandedPdf = async ({
  title,
  docNumber,
  fileNamePrefix,
  region = 'dubai',
  pageSize = 'A4',
  date,
  referenceNo,
  attn,
  customer,
  items = [],
  discount = 0,
  vatPercent = 0,
  subTotal = 0,
  vatAmount = 0,
  totalAmount = 0,
  currency = 'AED',
  subject,
  quoteValidity = '15 Days',
  deliveryTime = '2 - 3 Weeks',
  paymentTerms = '50% Advance & Balance 50% upon Delivery.',
}) => {
  const size = String(pageSize).toUpperCase() === 'A5' ? 'A5' : 'A4';
  const dim = PAGE[size];
  const scale = dim.w / PAGE.A4.w;
  const isQuotation = String(title || '').toUpperCase().includes('QUOTATION');
  const label = isQuotation ? 'Quotation' : 'Invoice';
  const fileName = `${fileNamePrefix}-${region}-${size.toLowerCase()}-${docNumber}-${Date.now()}.pdf`;
  const filePath = path.join(UPLOAD_DIR, fileName);
  const productImages = await Promise.all(items.map((i) => fetchImage(i.imageUrl)));

  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size, margin: 0, autoFirstPage: true });
      const out = fs.createWriteStream(filePath);
      doc.pipe(out);
      const head = HEADS.dubai;
      const drawHead = () => { if (fs.existsSync(head)) doc.image(head, 0, 0, { width: dim.w, height: dim.h }); };
      drawHead();

      const left = 52 * scale;
      const right = 545 * scale;
      const contentW = right - left;
      const compact = size === 'A5';
      const fsBody = compact ? 6.2 : 8.2;
      const fsSmall = compact ? 5.7 : 7.4;
      const titleY = 178 * scale;

      doc.fillColor('#111111').font('Helvetica-Bold').fontSize(compact ? 10.5 : 13.5)
        .text(title, left, titleY, { width: contentW, align: 'center' });

      const metaY = 214 * scale;
      const rightMetaX = right - 180 * scale;
      doc.font('Helvetica').fontSize(fsBody);
      doc.text(`Customer Name: ${safe(customer?.companyName)}`, left, metaY, { width: 300 * scale });
      if (customer?.companyAddress) doc.text(`Address: ${safe(customer.companyAddress)}`, left, metaY + 14 * scale, { width: 310 * scale });
      if (customer?.telephoneNumber) doc.text(`Tel: ${safe(customer.telephoneNumber)}`, left, metaY + 28 * scale, { width: 210 * scale });
      if (customer?.email) doc.text(`Email: ${safe(customer.email)}`, left, metaY + 42 * scale, { width: 250 * scale });

      doc.text(`${label} No : ${safe(docNumber)}`, rightMetaX, metaY, { width: 180 * scale, align: 'right' });
      doc.text(`${label} Date : ${date ? new Date(date).toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' }) : '-'}`, rightMetaX, metaY + 14 * scale, { width: 180 * scale, align: 'right' });
      if (referenceNo) doc.text(`Reference No : ${referenceNo}`, rightMetaX, metaY + 28 * scale, { width: 180 * scale, align: 'right' });
      if (attn) doc.text(`Contact Person : ${attn}`, rightMetaX, metaY + 42 * scale, { width: 180 * scale, align: 'right' });

      const trnY = metaY + 56 * scale;
      doc.text(`TRN NO: ${COMPANY_TRN}`, left, trnY, { width: 245 * scale });
      if (subject || isQuotation) {
        doc.text(`Subject: ${safe(subject, isQuotation ? 'Commercial Quotation' : 'Tax Invoice')}`, left, trnY + 14 * scale, { width: contentW });
      }

      let y0 = (isQuotation ? 303 : 292) * scale;
      const headerH = 22 * scale;
      const rowH = (compact ? 65 : 82) * scale;
      const colNo = left;
      const colItem = left + 42 * scale;
      const colQty = right - 178 * scale;
      const colRate = right - 116 * scale;
      const colAmount = right - 58 * scale;

      const drawTableHeader = (y) => {
        doc.font('Helvetica-Bold').fontSize(compact ? 5.8 : 7.5).lineWidth(0.7).rect(left, y, contentW, headerH).stroke('#222222');
        [colItem, colQty, colRate, colAmount].forEach((x) => doc.moveTo(x, y).lineTo(x, y + headerH).stroke('#222222'));
        doc.text('SL.No', colNo + 4 * scale, y + 7 * scale, { width: 34 * scale, align: 'center' });
        doc.text('Item Description', colItem + 4 * scale, y + 7 * scale, { width: colQty-colItem-8*scale, align:'center' });
        doc.text('Quantity', colQty + 2 * scale, y + 7 * scale, { width: colRate-colQty-4*scale, align:'center' });
        doc.text('Rate', colRate + 2 * scale, y + 7 * scale, { width: colAmount-colRate-4*scale, align:'center' });
        doc.text('Amount', colAmount + 2 * scale, y + 7 * scale, { width: right-colAmount-4*scale, align:'center' });
      };

      drawTableHeader(y0);
      let y = y0 + headerH;
      doc.font('Helvetica').fontSize(fsSmall);
      items.forEach((it, idx) => {
        const bottomReserve = (isQuotation ? 215 : 170) * scale;
        if (y + rowH > dim.h - bottomReserve) {
          doc.addPage({ size, margin: 0 }); drawHead(); y = 120 * scale; drawTableHeader(y); y += headerH;
        }
        doc.rect(left, y, contentW, rowH).stroke('#333333');
        [colItem, colQty, colRate, colAmount].forEach((x) => doc.moveTo(x, y).lineTo(x, y + rowH).stroke('#333333'));
        doc.text(String(idx + 1), colNo + 4 * scale, y + 8 * scale, { width: 34 * scale, align:'center' });
        const img = productImages[idx];
        const imageW = compact ? 48 * scale : 64 * scale;
        const imageH = compact ? 38 * scale : 52 * scale;
        let textX = colItem + 5 * scale;
        if (img) {
          try {
            doc.image(img, colItem + 7 * scale, y + 22 * scale, { fit: [imageW, imageH], align:'center', valign:'center' });
            textX = colItem + imageW + 15 * scale;
          } catch {}
        }
        doc.font('Helvetica').fontSize(fsSmall).text(safe(it.name, 'Product'), textX, y + 8 * scale, { width: Math.max(60, colQty - textX - 6 * scale), height: rowH - 12 * scale });
        doc.text(String(it.qty ?? 0), colQty + 2 * scale, y + 8 * scale, { width: colRate-colQty-5*scale, align:'center' });
        doc.text(fmt(it.price), colRate + 2 * scale, y + 8 * scale, { width: colAmount-colRate-5*scale, align:'right' });
        doc.text(fmt(it.total), colAmount + 2 * scale, y + 8 * scale, { width: right-colAmount-5*scale, align:'right' });
        y += rowH;
      });

      const totalQty = items.reduce((s, i) => s + Number(i.qty || 0), 0);
      const totalRowH = 20 * scale;
      doc.rect(left, y, contentW, totalRowH).stroke('#333333');
      doc.font('Helvetica-Bold').fontSize(fsSmall)
        .text(`Total Quantity: ${totalQty}`, colItem, y + 6 * scale, { width: colQty-colItem-4*scale, align:'right' })
        .text(`Gross Amt: ${fmt(subTotal)}`, colRate - 18 * scale, y + 6 * scale, { width: right-colRate+18*scale, align:'right' });
      y += totalRowH;

      const totalsX = right - 188 * scale;
      const valueX = right - 86 * scale;
      const totalLineH = 18 * scale;
      const totalLine = (labelText, value, bold = false) => {
        doc.rect(totalsX, y, right - totalsX, totalLineH).stroke('#333333');
        doc.moveTo(valueX, y).lineTo(valueX, y + totalLineH).stroke('#333333');
        doc.font(bold ? 'Helvetica-Bold' : 'Helvetica').fontSize(fsSmall)
          .text(labelText, totalsX + 4 * scale, y + 5 * scale, { width: valueX - totalsX - 8 * scale })
          .text(fmt(value), valueX + 3 * scale, y + 5 * scale, { width: right-valueX-6*scale, align:'right' });
        y += totalLineH;
      };
      totalLine('Discount', discount);
      totalLine(`Vat ${fmt(vatPercent).replace('.00','')}%`, vatAmount);
      totalLine('Total Value', totalAmount, true);

      y += 4 * scale;
      const wordsH = compact ? 27 * scale : 34 * scale;
      doc.rect(left, y, contentW, wordsH).stroke('#333333');
      doc.font('Helvetica-Bold').fontSize(compact ? 5.5 : 7.2)
        .text(`Amount In Words  ${amountInWords(totalAmount, currency)}`, left + 3 * scale, y + 5 * scale, { width: contentW - 6 * scale, height: wordsH - 8 * scale });
      y += wordsH + 10 * scale;

      if (isQuotation) {
        doc.font('Helvetica').fontSize(fsSmall)
          .text(`Quote Validity : ${quoteValidity}`, left, y, { width: contentW })
          .text(`Delivery Time  : ${deliveryTime}`, left, y + 14 * scale, { width: contentW })
          .text(`Payment Terms: ${paymentTerms}`, left, y + 28 * scale, { width: contentW });
        y += 48 * scale;
      } else if (paymentTerms) {
        doc.font('Helvetica').fontSize(fsSmall).text(`Payment Terms: ${paymentTerms}`, left, y, { width: contentW });
        y += 20 * scale;
      }

      const sigY = Math.min(y + 4 * scale, dim.h - 125 * scale);
      doc.font('Helvetica-BoldOblique').fontSize(compact ? 6 : 8)
        .text('For GIIAN IMPEX GENERAL TRADING L.L.C', left, sigY, { width: contentW, align:'right' });

      doc.end();
      out.on('finish', () => resolve(`/${filePath.replace(/\\/g, '/')}`));
      out.on('error', reject);
    } catch (e) { reject(e); }
  });
};


// Backward-compatible generic document PDF used by receiptController.
// Returns a relative uploads path (without a leading slash) because the
// receipt controller prefixes it when storing pdfUrl.
export const generateDocumentPdf = async ({
  title = 'DOCUMENT',
  docNumber = '',
  fileNamePrefix = 'document',
  metaLines = [],
  customer = {},
  summaryLines = [],
  pageSize = 'A4',
}) => {
  const size = String(pageSize).toUpperCase() === 'A5' ? 'A5' : 'A4';
  const dim = PAGE[size];
  const fileName = `${fileNamePrefix}-${size.toLowerCase()}-${docNumber || Date.now()}-${Date.now()}.pdf`;
  const filePath = path.join(UPLOAD_DIR, fileName);

  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size, margin: 0, autoFirstPage: true });
      const out = fs.createWriteStream(filePath);
      doc.pipe(out);

      const head = HEADS.dubai;
      if (fs.existsSync(head)) {
        doc.image(head, 0, 0, { width: dim.w, height: dim.h });
      }

      const scale = dim.w / PAGE.A4.w;
      const left = 52 * scale;
      const right = 545 * scale;
      const contentW = right - left;
      const compact = size === 'A5';
      const body = compact ? 7 : 9;
      let y = 185 * scale;

      doc.fillColor('#111111')
        .font('Helvetica-Bold')
        .fontSize(compact ? 11 : 14)
        .text(title, left, y, { width: contentW, align: 'center' });

      y += 38 * scale;
      doc.font('Helvetica').fontSize(body);
      doc.text(`Document No : ${safe(docNumber)}`, left, y, { width: contentW });
      y += 18 * scale;

      for (const line of metaLines || []) {
        if (!line) continue;
        doc.text(`${safe(line.label, '')}${line.label ? ' : ' : ''}${safe(line.value)}`, left, y, { width: contentW });
        y += 16 * scale;
      }

      y += 8 * scale;
      if (customer?.companyName) {
        doc.font('Helvetica-Bold').text(`Customer : ${safe(customer.companyName)}`, left, y, { width: contentW });
        y += 17 * scale;
      }
      if (customer?.contactPersonName) {
        doc.font('Helvetica').text(`Contact Person : ${safe(customer.contactPersonName)}`, left, y, { width: contentW });
        y += 17 * scale;
      }
      if (customer?.companyAddress) {
        doc.text(`Address : ${safe(customer.companyAddress)}`, left, y, { width: contentW });
        y += 17 * scale;
      }
      if (customer?.telephoneNumber) {
        doc.text(`Tel : ${safe(customer.telephoneNumber)}`, left, y, { width: contentW });
        y += 17 * scale;
      }

      y += 14 * scale;
      for (const line of summaryLines || []) {
        if (!line) continue;
        doc.roundedRect(left, y, contentW, 28 * scale, 3 * scale).stroke('#333333');
        doc.font('Helvetica-Bold').fontSize(body)
          .text(safe(line.label, 'Total'), left + 8 * scale, y + 9 * scale, { width: contentW * 0.62 })
          .text(safe(line.value), left + contentW * 0.62, y + 9 * scale, { width: contentW * 0.34, align: 'right' });
        y += 36 * scale;
      }

      const sigY = Math.min(y + 20 * scale, dim.h - 125 * scale);
      doc.font('Helvetica-BoldOblique')
        .fontSize(compact ? 6 : 8)
        .text('For GIIAN IMPEX GENERAL TRADING L.L.C', left, sigY, { width: contentW, align: 'right' });

      doc.end();
      out.on('finish', () => resolve(filePath.replace(/\\/g, '/')));
      out.on('error', reject);
    } catch (error) {
      reject(error);
    }
  });
};
