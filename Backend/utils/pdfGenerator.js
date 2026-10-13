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
  subject,
  customer,
  items = [],
  discount = 0,
  vatPercent = 0,
  subTotal = 0,
  vatAmount = 0,
  totalAmount = 0,
  customerTrn = '',
  companyTrn = '',
  currency = 'AED',
  quoteValidity = '30 Days',
  deliveryTime = '',
  paymentTerms = '',
  warrantyTerms = '',
  notes = '',
  approved = false,
  approvedBy = '',
  approvedAt = null,
  createdBy = null, 
}) => {
  const size = String(pageSize).toUpperCase() === 'A5' ? 'A5' : 'A4';
  const dim = PAGE[size];
  const scale = dim.w / PAGE.A4.w;
  const isQuotation = String(title || '').toUpperCase().includes('QUOTATION');
  const label = isQuotation ? 'Quotation' : 'Invoice';
  const fileName = `${fileNamePrefix}-${region}-${size.toLowerCase()}-${docNumber}-${Date.now()}.pdf`;
  const filePath = path.join(UPLOAD_DIR, fileName);
  const productImages = await Promise.all(items.map((i) => fetchImage(i.imageUrl)));
  // A saved quotation/invoice may carry a creator id rather than a populated user.
  // Resolve that user's own signature; never silently substitute a shared signature.
  let creator = createdBy;
  if (creator && !creator.esignUrl) {
    try {
      const { default: User } = await import('../model/userModel.js');
      creator = await User.findById(creator._id || creator).select('name esignUrl').lean() || creator;
    } catch { /* PDF remains available if the creator no longer exists */ }
  }
  const esignBuffer = await fetchImage(creator?.esignUrl || '');

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
      const colW = rightMetaX - left - 12 * scale;
      const headerBottom = dim.h - 118 * scale;
      const headerContinuationTop = 120 * scale;
      const headerLineGap = 1.5 * scale;
      const startHeaderContinuation = () => {
        doc.addPage({ size, margin: 0 });
        drawHead();
        return headerContinuationTop;
      };
      // Pagination-aware right-side metadata. A long TRN/reference/telephone
      // is split across pages without overflowing the fixed page footer.
      // The left customer block starts below the final metadata block when
      // metadata needed continuation pages.
      doc.font('Helvetica').fontSize(fsBody);
      let ry = metaY;
      let metadataContinued = false;
      const metaWidth = 180 * scale;
      const metaHeight = (value, fontName) => {
        doc.font(fontName).fontSize(fsBody);
        return doc.heightOfString(value, { width: metaWidth, align: 'right', lineGap: headerLineGap });
      };
      const metaPrefix = (value, available, fontName) => {
        let low = 1, high = value.length, best = 0;
        while (low <= high) {
          const mid = (low + high) >> 1;
          if (metaHeight(value.slice(0, mid), fontName) <= available) {
            best = mid; low = mid + 1;
          } else high = mid - 1;
        }
        return best;
      };
      const rightLine = (labelText, value, strong = false) => {
        if (value === undefined || value === null || String(value) === '') return;
        let remaining = `${labelText} : ${String(value).replace(/\r\n?/g, '\n')}`;
        const fontName = strong ? 'Helvetica-Bold' : 'Helvetica';
        while (remaining.length) {
          if (ry + 16 * scale > headerBottom) {
            ry = startHeaderContinuation();
            metadataContinued = true;
          }
          const chunkLength = metaPrefix(remaining, headerBottom - ry - 5 * scale, fontName);
          if (!chunkLength) {
            ry = startHeaderContinuation();
            metadataContinued = true;
            continue;
          }
          const chunk = remaining.slice(0, chunkLength);
          const height = metaHeight(chunk, fontName);
          doc.font(fontName).fontSize(fsBody).text(chunk, rightMetaX, ry, {
            width: metaWidth, align: 'right', lineGap: headerLineGap,
          });
          ry += height + 5 * scale;
          remaining = remaining.slice(chunkLength);
          if (remaining) {
            ry = startHeaderContinuation();
            metadataContinued = true;
          }
        }
      };
      rightLine(`${label} No`, safe(docNumber), true);
      rightLine(`${label} Date`, date ? new Date(date).toLocaleDateString('en-GB', {day:'2-digit',month:'short',year:'numeric'}) : '-');
      rightLine('TRN No', companyTrn);
      rightLine('Reference No', referenceNo);
      rightLine('TEL', customer?.telephoneNumber);

      // Customer metadata can exceed one page. Break long, explicitly multiline
      // fields into fitting chunks, preserving the user's original line breaks
      // and indentation instead of truncating the address or overlapping table.
      let ly = metadataContinued ? ry + 8 * scale : metaY;
      let headerContinued = metadataContinued;
      const headerTextHeight = (text) => {
        doc.font('Helvetica').fontSize(fsBody);
        return doc.heightOfString(text, { width: colW, lineGap: headerLineGap });
      };
      const headerPrefix = (text, space) => {
        let low = 1, high = text.length, best = 0;
        while (low <= high) {
          const mid = Math.floor((low + high) / 2);
          if (headerTextHeight(text.slice(0, mid)) <= space) { best = mid; low = mid + 1; }
          else high = mid - 1;
        }
        return best;
      };
      const leftLine = (fieldLabel, rawValue) => {
        if (rawValue === undefined || rawValue === null || String(rawValue) === '') return;
let remaining = `${fieldLabel ? `${fieldLabel}: ` : ''}${String(rawValue).replace(/\r\n?/g, '\n')}`;
        while (remaining.length) {
          if (ly + 16 * scale > headerBottom) {
            ly = startHeaderContinuation();
            headerContinued = true;
          }
          const available = headerBottom - ly - 5 * scale;
          const amount = headerPrefix(remaining, available);
          if (!amount) {
            ly = startHeaderContinuation();
            headerContinued = true;
            continue;
          }
          const segment = remaining.slice(0, amount);
          doc.font('Helvetica-Bold').fontSize(fsBody);
          const height = headerTextHeight(segment);
          doc.text(segment, left, ly, { width: colW, lineGap: headerLineGap });
          ly += height + 5 * scale;
          remaining = remaining.slice(amount);
          if (remaining.length) {
            ly = startHeaderContinuation();
            headerContinued = true;
          }
        }
      };
leftLine('', customer?.companyName);
leftLine('', customer?.companyAddress);
leftLine('', customer?.telephoneNumber);
leftLine('', customer?.email);
leftLine('TRN No', customerTrn || customer?.trn);
leftLine('ATTN', attn);
leftLine('SUBJECT', subject);

      const firstPageTableY = (isQuotation ? 314 : 292) * scale;
      // If either metadata column required extra pages, table follows the
      // final customer-data page, never the original first-page coordinates.
      let y0 = headerContinued
        ? Math.max(headerContinuationTop, ly + 8 * scale)
        : Math.max(firstPageTableY, ly + 8 * scale, ry + 10 * scale);
      const headerH = 22 * scale;
      const minRowH = (compact ? 65 : 82) * scale;
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

      // All content uses the same safe page limit, including continuation rows.
      // PDFKit will otherwise silently add pages when text flows past the bottom.
      const pageBottom = dim.h - 118 * scale;
      const continuationTop = 120 * scale;
      const startPage = (withTable = false) => {
        doc.addPage({ size, margin: 0 });
        drawHead();
        y = continuationTop;
        if (withTable) { drawTableHeader(y); y += headerH; }
      };
      let y = y0;
      if (y + headerH + 25 * scale > pageBottom) startPage(false);
      drawTableHeader(y);
      y += headerH;
      const ensureSpace = (height, withTable = false) => {
        if (y + height > pageBottom) startPage(withTable);
      };
      const bodyLineGap = 1.5 * scale;
      const textHeight = (str, width, fontSize = fsSmall, gap = bodyLineGap) => {
        doc.font('Helvetica').fontSize(fontSize);
        return doc.heightOfString(String(str), { width, lineGap: gap });
      };
      // Find the largest exact source-text prefix that fits. Preserve spaces,
      // explicit newlines and blank lines rather than flattening textarea input.
      const fittingPrefix = (text, width, maxHeight, fontSize = fsSmall) => {
        if (!text) return '';
        let lo = 1, hi = text.length, best = 0;
        while (lo <= hi) {
          const mid = (lo + hi) >> 1;
          if (textHeight(text.slice(0, mid), width, fontSize) <= maxHeight) {
            best = mid; lo = mid + 1;
          } else hi = mid - 1;
        }
        if (!best) return '';
        if (best < text.length && !/[\s]/.test(text[best - 1])) {
          const tail = text.slice(0, best);
          const boundary = Math.max(tail.lastIndexOf(' '), tail.lastIndexOf('\n'));
          if (boundary >= Math.floor(best * .55)) best = boundary + 1;
        }
        return text.slice(0, best);
      };
      const drawRowFrame = (top, height) => {
        doc.lineWidth(0.7).rect(left, top, contentW, height).stroke('#333333');
        [colItem, colQty, colRate, colAmount].forEach((x) =>
          doc.moveTo(x, top).lineTo(x, top + height).stroke('#333333'));
      };

      for (let idx = 0; idx < items.length; idx++) {
        const it = items[idx];
        const img = productImages[idx];
        const imageW = (compact ? 48 : 64) * scale;
        const imageH = (compact ? 38 : 52) * scale;
        const itemW = colQty - colItem - 12 * scale;
        let description = String(it.description ?? it.name ?? 'Product').replace(/\r\n?/g, '\n');
        let first = true;
        while (first || description.length) {
          const imagePadding = first && img ? imageH + 5 * scale : 0;
          const contentTop = 8 * scale;
          const minimum = Math.max(28 * scale, contentTop + imagePadding + 15 * scale);
          if (y + minimum > pageBottom) startPage(true);
          let room = pageBottom - y - contentTop - imagePadding - 8 * scale;
          let fragment = fittingPrefix(description, itemW, room);
          if (description && !fragment) {
            startPage(true);
            room = pageBottom - y - contentTop - imagePadding - 8 * scale;
            fragment = fittingPrefix(description, itemW, room);
            if (!fragment) throw new Error('Page too small for quotation item description');
          }
          const fragmentH = fragment ? textHeight(fragment, itemW) : 0;
          const rowH = Math.min(pageBottom - y,
            Math.max(first && !description.slice(fragment.length).length ? minRowH : 28 * scale,
              contentTop + imagePadding + fragmentH + 8 * scale));
          drawRowFrame(y, rowH);
          doc.font('Helvetica').fontSize(fsSmall);
          if (first) {
const slNoFontSize = fsSmall;

doc.font('Helvetica')
  .fontSize(slNoFontSize)
  .text(
    String(idx + 1),
    colNo,
    y + (rowH - slNoFontSize) / 2 - 1 * scale,
    {
      width: colItem - colNo,
      align: 'center',
      lineBreak: false,
    }
  );
            doc.text(String(it.qty ?? 0), colQty + 2 * scale, y + 8 * scale,
              { width: colRate - colQty - 5 * scale, align: 'center', lineBreak: false });
            doc.text(fmt(it.price), colRate + 2 * scale, y + 8 * scale,
              { width: colAmount - colRate - 5 * scale, align: 'right', lineBreak: false });
            doc.text(fmt(it.total), colAmount + 2 * scale, y + 8 * scale,
              { width: right - colAmount - 5 * scale, align: 'right', lineBreak: false });
          }
          let descriptionY = y + contentTop;
          if (first && img) {
            try { doc.image(img, colItem + 6 * scale, descriptionY, { fit: [imageW, imageH] }); }
            catch { /* corrupt product photo must not break invoice */ }
            descriptionY += imagePadding;
          }
          if (fragment) doc.font('Helvetica').fontSize(fsSmall).text(fragment,
            colItem + 6 * scale, descriptionY, { width: itemW, lineGap: bodyLineGap });
          description = description.slice(fragment.length);
          y += rowH;
          first = false;
          if (description) startPage(true);
        }
      }

      const totalRowH = 20 * scale;
      ensureSpace(totalRowH);
      doc.rect(left, y, contentW, totalRowH).stroke('#333333');
      doc.font('Helvetica-Bold').fontSize(fsSmall).text(`Gross Amt: ${fmt(subTotal)}`,
        colRate - 18 * scale, y + 6 * scale,
        { width: right - colRate + 18 * scale, align: 'right', lineBreak: false });
      y += totalRowH;
      const totalsX = right - 188 * scale;
      const valueX = right - 86 * scale;
      const totalLineH = 18 * scale;
      const totalLine = (labelText, value, bold = false) => {
        ensureSpace(totalLineH);
        doc.rect(totalsX, y, right - totalsX, totalLineH).stroke('#333333');
        doc.moveTo(valueX, y).lineTo(valueX, y + totalLineH).stroke('#333333');
        doc.font(bold ? 'Helvetica-Bold' : 'Helvetica').fontSize(fsSmall)
          .text(labelText, totalsX + 4 * scale, y + 5 * scale,
            { width: valueX - totalsX - 8 * scale, lineBreak: false })
          .text(fmt(value), valueX + 3 * scale, y + 5 * scale,
            { width: right - valueX - 6 * scale, align: 'right', lineBreak: false });
        y += totalLineH;
      };
      if (Number(discount || 0) > 0) totalLine('Discount', discount);
      totalLine(`Vat ${fmt(vatPercent).replace('.00', '')}%`, vatAmount);
      totalLine('Total Value', totalAmount, true);

      const drawFlowingText = (value, label = '', fontSize = fsSmall) => {
        let remaining = String(value ?? '').replace(/\r\n?/g, '\n');
        if (label) {
          ensureSpace(16 * scale);
          doc.font('Helvetica-Bold').fontSize(fontSize).text(label, left, y, { width: contentW });
          y += 14 * scale;
        }
        while (remaining.length) {
          if (pageBottom - y < 18 * scale) startPage(false);
          const room = pageBottom - y - 5 * scale;
          const fragment = fittingPrefix(remaining, contentW, room, fontSize);
          if (!fragment) { startPage(false); continue; }
          const height = textHeight(fragment, contentW, fontSize);
          doc.font('Helvetica').fontSize(fontSize).text(fragment, left, y,
            { width: contentW, lineGap: bodyLineGap });
          y += height + 4 * scale;
          remaining = remaining.slice(fragment.length);
          if (remaining.length) startPage(false);
        }
        y += 5 * scale;
      };
const amountWordsText = amountInWords(totalAmount, currency)
  .replace(/\s+Only\.$/i, '.ONLY')
  .toUpperCase();

const wordsLabel = 'AMOUNT IN WORDS';
const wordsFontSize = compact ? 6.5 : 9;
const wordsPadding = 7 * scale;
const wordsGap = 8 * scale;
const wordsLineH = 14 * scale;
const wordsBoxX = left;
const wordsBoxW = contentW;

doc.font('Helvetica-Bold').fontSize(wordsFontSize);

const labelWidth = doc.widthOfString(wordsLabel);
const wordsStartX = wordsBoxX + wordsPadding + labelWidth + wordsGap;
const wordsWidth = wordsBoxW - labelWidth - wordsGap - wordsPadding * 2;

const boxTextH = doc.heightOfString(amountWordsText, {
  width: wordsWidth,
  lineGap: 2 * scale,
});

const wordsBoxH = Math.max(
  28 * scale,
  boxTextH + wordsPadding * 2
);

ensureSpace(wordsBoxH + 8 * scale);

doc.save();

doc.lineWidth(0.8)
  .strokeColor('#222222')
  .rect(wordsBoxX, y, wordsBoxW, wordsBoxH)
  .stroke();

doc.fillColor('#111111')
  .font('Helvetica-Bold')
  .fontSize(wordsFontSize);

doc.text(
  wordsLabel,
  wordsBoxX + wordsPadding,
  y + wordsPadding,
  { width: labelWidth + 2 * scale, lineBreak: false }
);

doc.text(
  amountWordsText,
  wordsStartX,
  y + wordsPadding,
  {
    width: wordsWidth,
    lineGap: 2 * scale,
  }
);

doc.restore();

y += wordsBoxH + 12 * scale;
      if (isQuotation) {
        drawFlowingText(`Quote Validity : ${quoteValidity}\nDelivery Time : ${deliveryTime}`);
      }
      if (paymentTerms) drawFlowingText(paymentTerms, 'Payment Terms');
      const notesText = String(notes || warrantyTerms || '');
      if (notesText) drawFlowingText(notesText, 'Notes');

      // Allocate an actual signature block rather than clamping its Y-coordinate
      // onto already-printed notes/totals near the page footer.
      const sigBlockH = 100 * scale;
      ensureSpace(sigBlockH);
      const sigY = y + 4 * scale;
      doc.font('Helvetica-BoldOblique').fontSize(compact ? 6 : 8)
        .text('For GIIAN IMPEX GENERAL TRADING L.L.C', left, sigY,
          { width: contentW, align: 'right' });
      const baseX = right - 185 * scale;
      if (esignBuffer) {
        try { doc.image(esignBuffer, baseX + 72 * scale, sigY + 14 * scale,
          { fit: [90 * scale, 45 * scale] }); } catch {}
      }
      if (approved) {
        const stampPath = process.env.COMPANY_STAMP_PATH || path.join('assets','company','stamp.png');
        const assetsEnabled = String(process.env.COMPANY_APPROVAL_ASSETS_ENABLED || 'false').toLowerCase() === 'true';
        if (assetsEnabled) {
          try { if (fs.existsSync(stampPath)) doc.image(stampPath, baseX, sigY + 10 * scale,
            { fit: [65 * scale, 65 * scale] }); } catch {}
        }
        doc.font('Helvetica').fontSize(compact ? 5.2 : 6.8).text(
          `Approved${approvedBy ? ` by ${approvedBy}` : ''}${approvedAt ? ` · ${new Date(approvedAt).toLocaleDateString('en-GB')}` : ''}`,
          baseX, sigY + 72 * scale, { width: 185 * scale, align: 'right' });
      }

      doc.end();
      out.on('finish', () => resolve(`/${filePath.replace(/\\/g, '/')}`));
      out.on('error', reject);
    } catch (e) { reject(e); }
  });
};



// Dedicated customer-facing landscape receipt. This intentionally uses a
// separate layout from quotation/invoice booklets and does not expose A4/A5
// choices in the UI. The PDF is generated once and can be previewed or
// downloaded directly.
//
// The "Received By" signature line dynamically renders the e-signature of
// whichever staff/user created the receipt. The e-sign image is fetched
// (async, via the shared fetchImage() helper) BEFORE the PDF is drawn, since
// PDFKit's drawing calls are synchronous.
export const generateReceiptPdf = async ({
  receipt,
  customer = {},
  allocations = [],
  paymentMode = '',
  receiptType = '',
  createdBy = null,
}) => {
  const W = 842;
  const H = 595;
  const NAVY = '#102033';
  const GOLD = '#B28A52';
  const TEXT = '#172033';
  const MUTED = '#667085';
  const LINE = '#A9B0BA';
  const fileName = `receipt-${receipt?.receiptNo || Date.now()}-${Date.now()}.pdf`;
  const filePath = path.join(UPLOAD_DIR, fileName);

  const companyName = process.env.COMPANY_NAME || 'GIIAN IMPEX GENERAL TRADING L.L.C';
  const companyAddress = process.env.COMPANY_ADDRESS || '';
  const companyEmail = process.env.COMPANY_EMAIL || '';
  const companyPhone = process.env.COMPANY_PHONE || '';
  const website = process.env.COMPANY_WEBSITE || '';

  // Only the receipt creator's own signature may be printed.
  // Never use the role/shared signature as a fallback.
  // receiptController populates createdBy.esignUrl from the user document.
  const esignUrl = createdBy?.esignUrl || '';
  const esignBuffer = await fetchImage(esignUrl);

  const dottedLine = (doc, x1, y, x2) => {
    doc.save().strokeColor(LINE).lineWidth(0.65).dash(2, { space: 2 }).moveTo(x1, y).lineTo(x2, y).stroke().undash().restore();
  };
  const check = (doc, x, y, checked) => {
    doc.save().rect(x, y, 11, 11).lineWidth(0.8).strokeColor(TEXT).stroke();
    if (checked) doc.strokeColor(GOLD).lineWidth(1.5).moveTo(x+2,y+6).lineTo(x+5,y+9).lineTo(x+10,y+2).stroke();
    doc.restore();
  };

  const settlementText = allocations.map((a) => {
    const inv = a.invoice || {};
    const full = Number(inv.balanceAmount || 0) <= 0.001;
    const number = inv.invoiceNo || a.invoiceNo || '';
    return number ? `${full ? 'Full Settlement of Invoice' : 'Partial Settlement of Invoice'} ${number}` : '';
  }).filter(Boolean).join(' / ');

  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: [W, H], margin: 0 });
      const out = fs.createWriteStream(filePath);
      doc.pipe(out);
      doc.rect(0,0,W,H).fill('#FFFFFF');

      // top-left brand panel
      // doc.save().fillColor(NAVY).moveTo(0,0).lineTo(238,0).lineTo(190,92).lineTo(0,92).closePath().fill().restore();
      // doc.save().fillColor(GOLD).moveTo(184,0).lineTo(322,0).lineTo(294,34).lineTo(168,34).closePath().fill().restore();
      // doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(18).text('GIIAN', 34, 27);
      // doc.font('Helvetica').fontSize(8).text('BUSINESS SUITE', 34, 51, { characterSpacing: 1.1 });

      // top-left brand panel
doc.save().fillColor(NAVY)
  .moveTo(0,0)
  .lineTo(238,0)
  .lineTo(190,92)
  .lineTo(0,92)
  .closePath()
  .fill()
  .restore();

doc.save().fillColor(GOLD)
  .moveTo(184,0)
  .lineTo(322,0)
  .lineTo(294,34)
  .lineTo(168,34)
  .closePath()
  .fill()
  .restore();

// GIIAN logo
const logoPath = path.join('assets', 'company', 'giian-logo.png');

if (fs.existsSync(logoPath)) {
  try {
    doc.image(logoPath, 28, 18, {
      fit: [55, 55],
      align: 'center',
      valign: 'center'
    });
  } catch {}
}

// GIIAN text
doc.fillColor('#FFFFFF')
  .font('Helvetica-Bold')
  .fontSize(18)
  .text('GIIAN', 92, 27);

doc.font('Helvetica')
  .fontSize(8)
  .text('BUSINESS SUITE', 92, 51, {
    characterSpacing: 1.1
  });
      doc.fillColor(NAVY).font('Helvetica-Bold').fontSize(29).text('RECEIPT', 320, 31, { width: 200, align: 'center' });

      // const contact = [companyName, companyAddress, companyEmail, website, companyPhone].filter(Boolean);
      // doc.font('Helvetica').fontSize(7.5).fillColor(TEXT);
      // contact.forEach((line, idx) => doc.text(line, 548, 18 + idx*13, { width: 245, align:'right' }));

      // Top-right company details
doc.font('Helvetica')
  .fontSize(7.5)
  .fillColor(TEXT);

// Company name
doc.text(
  companyName,
  548,
  18,
  {
    width: 245,
    align: 'right'
  }
);

// Company address - below company name
doc.font('Helvetica')
  .fontSize(7.2)
  .text(
    `Nooraniva Building
Plot number:152-0
Hor Al Anz
DUbai,UAE`,
    548,
    32,
    {
      width: 245,
      align: 'right',
      lineGap: 2
    }
  );
      // vertical receipt band
      doc.save().fillColor(NAVY).moveTo(790,170).lineTo(842,145).lineTo(842,555).lineTo(790,518).closePath().fill().restore();
      doc.save().fillColor(GOLD).moveTo(790,170).lineTo(842,145).lineTo(842,161).lineTo(790,186).closePath().fill().restore();
      doc.save().translate(822,390).rotate(-90).fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(19).text('R E C E I P T', -93, -10, { width:190, align:'center' }).restore();

      // bottom-left visual block
      doc.save().fillColor(NAVY).moveTo(0,527).lineTo(245,527).lineTo(310,595).lineTo(0,595).closePath().fill().restore();

      const receiptNo = safe(receipt?.receiptNo, '');
      const dateText = receipt?.createdAt ? new Date(receipt.createdAt).toLocaleDateString('en-GB') : new Date().toLocaleDateString('en-GB');
      const customerName = safe(customer.companyName || customer.name, '');
      const contactNo = safe(customer.mobileNumber || customer.telephoneNumber || customer.phone, '');
      const amount = Number(receipt?.amount || 0);
      const purpose = settlementText || (receiptType === 'Advance' ? 'Advance Payment Received' : receiptType === 'AdvanceAdjustment' ? 'Advance Adjustment' : 'Payment Received');

      let y=128;
      // doc.fillColor(TEXT).font('Helvetica').fontSize(9).text('No.',28,y).font('Helvetica-Bold').text(receiptNo,63,y); dottedLine(doc,63,y+13,255);
      doc.fillColor(TEXT)
  .font('Helvetica')
  .fontSize(9)
  .text('No.', 28, y);

doc.font('Helvetica-Bold')
  .fontSize(14)
  .text(receiptNo, 63, y);

dottedLine(doc, 63, y + 16, 255);
      doc.font('Helvetica').text('Date',585,y).font('Helvetica-Bold').text(dateText,625,y); dottedLine(doc,625,y+13,760);

      // y+=48; doc.font('Helvetica').text('Received with thanks from',28,y).font('Helvetica-Bold').text(`M/S ${customerName}`,175,y,{width:570}); dottedLine(doc,175,y+13,760);
      y += 48;

doc.font('Helvetica')
  .text('Received with thanks from ', 28, y, {
    continued: true
  });

doc.font('Helvetica-Bold')
  .text(`M/S ${customerName}`);

dottedLine(doc, 175, y + 13, 760);
      y+=42; doc.font('Helvetica').text('Amount of (in words)',28,y).font('Helvetica').text(amountInWords(amount),175,y,{width:570}); dottedLine(doc,175,y+13,760);

      y+=52; doc.font('Helvetica').text('By',28,y);
      const modes=['Cash','Cheque','Bank Transfer','Other']; let x=72;
      modes.forEach((m)=>{ const checked = (paymentMode==='Bank' && m==='Bank Transfer') || paymentMode===m; check(doc,x,y-2,checked); doc.text(m,x+16,y,{width:75}); x += m==='Bank Transfer'?112:82; });
      // doc.text('Bank',585,y); dottedLine(doc,625,y+13,760);

      y+=48; doc.text('For the purpose of',28,y).font('Helvetica-Bold').text(purpose,175,y,{width:570}); dottedLine(doc,175,y+13,760);
      // y+=44; doc.font('Helvetica').text('Contact No.',28,y).font('Helvetica-Bold').text(contactNo,175,y,{width:570}); dottedLine(doc,175,y+13,760);

      // amount box
      doc.fillColor(TEXT).font('Helvetica-Bold').fontSize(12).text('AED',28,457);
      doc.rect(72,443,190,45).strokeColor('#667085').lineWidth(0.9).stroke();
      doc.fontSize(17).text(fmt(amount),82,455,{width:170,align:'center'});

      // signature/received-by lines
      // doc.strokeColor(TEXT).lineWidth(0.8).moveTo(342,500).lineTo(500,500).stroke();
      // if (esignBuffer) {
      //   try { doc.image(esignBuffer, 374, 446, { fit: [95, 42], align: 'center' }); } catch {}
      // }
      // doc.font('Helvetica').fontSize(9).text(createdBy?.name || 'Received By',342,508,{width:158,align:'center'});
      // doc.moveTo(570,500).lineTo(750,500).stroke();

      // const approvalAssetsEnabled = String(process.env.COMPANY_APPROVAL_ASSETS_ENABLED || '').toLowerCase() === 'true';
      // const signaturePath = path.join('assets','company','signature1.png');
      // const stampPath = path.join('assets','company','stamp1.png');
      // if (approvalAssetsEnabled) {
      //   if (fs.existsSync(signaturePath)) { try { doc.image(signaturePath,615,446,{fit:[95,42],align:'center'}); } catch {} }
      //   if (fs.existsSync(stampPath)) { try { doc.image(stampPath,710,438,{fit:[55,55],align:'center'}); } catch {} }
      // }
      // // doc.font('Helvetica').text('Authorised Signature',570,508,{width:180,align:'center'});
      //       doc.font('Helvetica').text('Received By',570,508,{width:180,align:'center'});


      // =====================================================
// RECEIVED BY - DYNAMIC STAFF E-SIGNATURE
// =====================================================

// Right-side Received By line
doc
  .strokeColor(TEXT)
  .lineWidth(0.8)
  .moveTo(570, 500)
  .lineTo(750, 500)
  .stroke();

// Draw the e-signature of the staff who created the receipt
if (esignBuffer) {
  try {
    doc.image(esignBuffer, 615, 446, {
      fit: [95, 42],
      align: 'center',
      valign: 'center'
    });
  } catch (error) {
    // Ignore invalid e-signature image
  }
}

  // Company stamp stays static
        if (approvalAssetsEnabled) {
          try { if (fs.existsSync(stampPath)) doc.image(stampPath, baseX, sigY + 10*scale, { fit:[65*scale,65*scale] }); } catch {}
        }

// Company stamp
// const approvalAssetsEnabled =
//   String(
//     process.env.COMPANY_APPROVAL_ASSETS_ENABLED || ''
//   ).toLowerCase() === 'true';

// const stampPath = path.join(
//   'assets',
//   'company',
//   'stamp1.png'
// );

// if (
//   approvalAssetsEnabled &&
//   fs.existsSync(stampPath)
// ) {
//   try {
//     doc.image(stampPath, 710, 438, {
//       fit: [55, 55],
//       align: 'center'
//     });
//   } catch (error) {
//     // Ignore invalid stamp image
//   }
// }

// Received By label
doc
  .font('Helvetica')
  .fontSize(9)
  .fillColor(TEXT)
  .text('Received By', 570, 508, {
    width: 180,
    align: 'center'
  });


      doc.end();
      out.on('finish',()=>resolve(filePath.replace(/\\/g, '/')));
      out.on('error',reject);
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
      const isReceipt = String(title || '').toUpperCase() === 'RECEIPT';
      doc.font('Helvetica').fontSize(body);

      if (isReceipt) {
        const infoH = 30 * scale;
        doc.roundedRect(left, y, contentW, infoH, 3 * scale).stroke('#333333');
        doc.font('Helvetica-Bold').text(`Receipt No: ${safe(docNumber)}`, left + 8*scale, y + 10*scale, { width: contentW * .48 });
        const dateLine = (metaLines || []).find((line) => line?.label === 'Date');
        doc.font('Helvetica').text(`Date: ${safe(dateLine?.value)}`, left + contentW*.52, y + 10*scale, { width: contentW*.44, align:'right' });
        y += infoH + 14*scale;

        if (customer?.companyName) {
          doc.font('Helvetica-Bold').text('Received From', left, y, { width: 110*scale });
          doc.font('Helvetica').text(safe(customer.companyName), left + 112*scale, y, { width: contentW - 112*scale });
          y += 18*scale;
        }
        if (customer?.contactPersonName) { doc.text(`Contact Person: ${safe(customer.contactPersonName)}`, left, y, { width: contentW }); y += 16*scale; }
        if (customer?.companyAddress) { doc.text(`Address: ${safe(customer.companyAddress)}`, left, y, { width: contentW }); y += 16*scale; }

        const paymentLine = (metaLines || []).find((line) => line?.label === 'Mode of Payment');
        if (paymentLine?.value) { doc.text(`Mode of Payment: ${safe(paymentLine.value)}`, left, y, { width: contentW }); y += 18*scale; }

        const settlementLines = (metaLines || []).filter((line) => /Settlement of Invoice/i.test(String(line?.label || '')));
        for (const line of settlementLines) {
          doc.roundedRect(left, y, contentW, 28*scale, 3*scale).fillAndStroke('#F8F6F1','#CFC7BB');
          doc.fillColor('#111111').font('Helvetica-Bold').text(safe(line.label), left + 8*scale, y + 9*scale, { width: contentW*.66 });
          doc.font('Helvetica').text(safe(line.value), left + contentW*.68, y + 9*scale, { width: contentW*.28, align:'right' });
          y += 36*scale;
        }
      } else {
        doc.text(`Document No : ${safe(docNumber)}`, left, y, { width: contentW });
        y += 18 * scale;
        for (const line of metaLines || []) {
          if (!line) continue;
          doc.text(`${safe(line.label, '')}${line.label ? ' : ' : ''}${safe(line.value)}`, left, y, { width: contentW });
          y += 16 * scale;
        }
        y += 8 * scale;
        if (customer?.companyName) { doc.font('Helvetica-Bold').text(`Customer : ${safe(customer.companyName)}`, left, y, { width: contentW }); y += 17 * scale; }
        if (customer?.contactPersonName) { doc.font('Helvetica').text(`Contact Person : ${safe(customer.contactPersonName)}`, left, y, { width: contentW }); y += 17 * scale; }
        if (customer?.companyAddress) { doc.text(`Address : ${safe(customer.companyAddress)}`, left, y, { width: contentW }); y += 17 * scale; }
        if (customer?.telephoneNumber) { doc.text(`Tel : ${safe(customer.telephoneNumber)}`, left, y, { width: contentW }); y += 17 * scale; }
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