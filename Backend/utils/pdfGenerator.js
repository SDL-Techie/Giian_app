// import PDFDocument from 'pdfkit';
// import fs from 'fs';
// import path from 'path';

// const UPLOAD_DIR = 'uploads';
// if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });
// const HEADS = { dubai: path.join('assets', 'letterheads', 'giian-dubai.png') };
// const PAGE = { A4: { w: 595.28, h: 841.89 }, A5: { w: 419.53, h: 595.28 } };
// const COMPANY_TRN = process.env.GIIAN_TRN_NO || '100001538600003';
// const fmt = (n) => Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// const fetchImage = async (url) => {
//   if (!url) return null;
//   try {
//     if (/^https?:\/\//i.test(url)) {
//       const r = await fetch(url);
//       if (!r.ok) return null;
//       return Buffer.from(await r.arrayBuffer());
//     }
//     const local = url.startsWith('/') ? url.slice(1) : url;
//     return fs.existsSync(local) ? fs.readFileSync(local) : null;
//   } catch { return null; }
// };

// const SMALL = ['', 'One','Two','Three','Four','Five','Six','Seven','Eight','Nine','Ten','Eleven','Twelve','Thirteen','Fourteen','Fifteen','Sixteen','Seventeen','Eighteen','Nineteen'];
// const TENS = ['', '', 'Twenty','Thirty','Forty','Fifty','Sixty','Seventy','Eighty','Ninety'];
// const underThousand = (n) => {
//   let out = [];
//   if (n >= 100) { out.push(`${SMALL[Math.floor(n / 100)]} Hundred`); n %= 100; }
//   if (n >= 20) { out.push(TENS[Math.floor(n / 10)]); if (n % 10) out.push(SMALL[n % 10]); }
//   else if (n > 0) out.push(SMALL[n]);
//   return out.join(' ');
// };
// const integerToWords = (value) => {
//   let n = Math.floor(Math.abs(Number(value) || 0));
//   if (n === 0) return 'Zero';
//   const groups = [
//     [1_000_000_000, 'Billion'], [1_000_000, 'Million'], [1_000, 'Thousand'], [1, '']
//   ];
//   const parts = [];
//   for (const [div, label] of groups) {
//     const chunk = Math.floor(n / div);
//     if (chunk) {
//       parts.push(`${underThousand(chunk)}${label ? ` ${label}` : ''}`);
//       n %= div;
//     }
//   }
//   return parts.join(' ').trim();
// };
// const amountInWords = (amount, currency = 'AED') => {
//   const n = Math.max(0, Number(amount) || 0);
//   const whole = Math.floor(n);
//   const fils = Math.round((n - whole) * 100);
//   const filsText = fils ? ` and ${integerToWords(fils)} Fils` : '';
//   return `${currency} ${integerToWords(whole)}${filsText} Only.`;
// };
// const safe = (v, fallback = '-') => String(v ?? '').trim() || fallback;

// export const generateBrandedPdf = async ({
//   title,
//   docNumber,
//   fileNamePrefix,
//   region = 'dubai',
//   pageSize = 'A4',
//   date,
//   referenceNo,
//   attn,
//   customer,
//   items = [],
//   discount = 0,
//   vatPercent = 0,
//   subTotal = 0,
//   vatAmount = 0,
//   totalAmount = 0,
//   currency = 'AED',
//   subject,
//   quoteValidity = '15 Days',
//   deliveryTime = '2 - 3 Weeks',
//   paymentTerms = '',
//   warrantyTerms = '',
//   approved = false,
//   approvedBy = '',
//   approvedAt = null,
// }) => {
//   const size = String(pageSize).toUpperCase() === 'A5' ? 'A5' : 'A4';
//   const dim = PAGE[size];
//   const scale = dim.w / PAGE.A4.w;
//   const isQuotation = String(title || '').toUpperCase().includes('QUOTATION');
//   const label = isQuotation ? 'Quotation' : 'Invoice';
//   const fileName = `${fileNamePrefix}-${region}-${size.toLowerCase()}-${docNumber}-${Date.now()}.pdf`;
//   const filePath = path.join(UPLOAD_DIR, fileName);
//   const productImages = await Promise.all(items.map((i) => fetchImage(i.imageUrl)));

//   return new Promise((resolve, reject) => {
//     try {
//       const doc = new PDFDocument({ size, margin: 0, autoFirstPage: true });
//       const out = fs.createWriteStream(filePath);
//       doc.pipe(out);
//       const head = HEADS.dubai;
//       const drawHead = () => { if (fs.existsSync(head)) doc.image(head, 0, 0, { width: dim.w, height: dim.h }); };
//       drawHead();

//       const left = 52 * scale;
//       const right = 545 * scale;
//       const contentW = right - left;
//       const compact = size === 'A5';
//       const fsBody = compact ? 6.2 : 8.2;
//       const fsSmall = compact ? 5.7 : 7.4;
//       const titleY = 178 * scale;

//       doc.fillColor('#111111').font('Helvetica-Bold').fontSize(compact ? 10.5 : 13.5)
//         .text(title, left, titleY, { width: contentW, align: 'center' });

//       const metaY = 214 * scale;
//       const rightMetaX = right - 180 * scale;
//       doc.font('Helvetica').fontSize(fsBody);
//       doc.text(`Customer Name: ${safe(customer?.companyName)}`, left, metaY, { width: 300 * scale });
//       if (customer?.companyAddress) doc.text(`Address: ${safe(customer.companyAddress)}`, left, metaY + 14 * scale, { width: 310 * scale });
//       if (customer?.telephoneNumber) doc.text(`Tel: ${safe(customer.telephoneNumber)}`, left, metaY + 28 * scale, { width: 210 * scale });
//       if (customer?.email) doc.text(`Email: ${safe(customer.email)}`, left, metaY + 42 * scale, { width: 250 * scale });

//       doc.text(`${label} No : ${safe(docNumber)}`, rightMetaX, metaY, { width: 180 * scale, align: 'right' });
//       doc.text(`${label} Date : ${date ? new Date(date).toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' }) : '-'}`, rightMetaX, metaY + 14 * scale, { width: 180 * scale, align: 'right' });
//       if (referenceNo) doc.text(`Reference No : ${referenceNo}`, rightMetaX, metaY + 28 * scale, { width: 180 * scale, align: 'right' });
//       if (attn) doc.text(`Contact Person : ${attn}`, rightMetaX, metaY + 42 * scale, { width: 180 * scale, align: 'right' });

//       const trnY = metaY + 56 * scale;
//       doc.text(`TRN NO: ${COMPANY_TRN}`, left, trnY, { width: 245 * scale });
//       if (subject || isQuotation) {
//         doc.text(`Subject: ${safe(subject, isQuotation ? 'Commercial Quotation' : 'Tax Invoice')}`, left, trnY + 14 * scale, { width: contentW });
//       }

//       let y0 = (isQuotation ? 303 : 292) * scale;
//       const headerH = 22 * scale;
//       const rowH = (compact ? 65 : 82) * scale;
//       const colNo = left;
//       const colItem = left + 42 * scale;
//       const colQty = right - 178 * scale;
//       const colRate = right - 116 * scale;
//       const colAmount = right - 58 * scale;

//       const drawTableHeader = (y) => {
//         doc.font('Helvetica-Bold').fontSize(compact ? 5.8 : 7.5).lineWidth(0.7).rect(left, y, contentW, headerH).stroke('#222222');
//         [colItem, colQty, colRate, colAmount].forEach((x) => doc.moveTo(x, y).lineTo(x, y + headerH).stroke('#222222'));
//         doc.text('SL.No', colNo + 4 * scale, y + 7 * scale, { width: 34 * scale, align: 'center' });
//         doc.text('Item Description', colItem + 4 * scale, y + 7 * scale, { width: colQty-colItem-8*scale, align:'center' });
//         doc.text('Quantity', colQty + 2 * scale, y + 7 * scale, { width: colRate-colQty-4*scale, align:'center' });
//         doc.text('Rate', colRate + 2 * scale, y + 7 * scale, { width: colAmount-colRate-4*scale, align:'center' });
//         doc.text('Amount', colAmount + 2 * scale, y + 7 * scale, { width: right-colAmount-4*scale, align:'center' });
//       };

//       drawTableHeader(y0);
//       let y = y0 + headerH;
//       doc.font('Helvetica').fontSize(fsSmall);
//       items.forEach((it, idx) => {
//         const bottomReserve = (isQuotation ? 215 : 170) * scale;
//         if (y + rowH > dim.h - bottomReserve) {
//           doc.addPage({ size, margin: 0 }); drawHead(); y = 120 * scale; drawTableHeader(y); y += headerH;
//         }
//         doc.rect(left, y, contentW, rowH).stroke('#333333');
//         [colItem, colQty, colRate, colAmount].forEach((x) => doc.moveTo(x, y).lineTo(x, y + rowH).stroke('#333333'));
//         doc.text(String(idx + 1), colNo + 4 * scale, y + 8 * scale, { width: 34 * scale, align:'center' });
//         const img = productImages[idx];
//         const imageW = compact ? 48 * scale : 64 * scale;
//         const imageH = compact ? 38 * scale : 52 * scale;
//         let textX = colItem + 5 * scale;
//         if (img) {
//           try {
//             doc.image(img, colItem + 7 * scale, y + 22 * scale, { fit: [imageW, imageH], align:'center', valign:'center' });
//             textX = colItem + imageW + 15 * scale;
//           } catch {}
//         }
//         doc.font('Helvetica').fontSize(fsSmall).text(safe(it.name, 'Product'), textX, y + 8 * scale, { width: Math.max(60, colQty - textX - 6 * scale), height: rowH - 12 * scale });
//         doc.text(String(it.qty ?? 0), colQty + 2 * scale, y + 8 * scale, { width: colRate-colQty-5*scale, align:'center' });
//         doc.text(fmt(it.price), colRate + 2 * scale, y + 8 * scale, { width: colAmount-colRate-5*scale, align:'right' });
//         doc.text(fmt(it.total), colAmount + 2 * scale, y + 8 * scale, { width: right-colAmount-5*scale, align:'right' });
//         y += rowH;
//       });

//       const totalQty = items.reduce((s, i) => s + Number(i.qty || 0), 0);
//       const totalRowH = 20 * scale;
//       doc.rect(left, y, contentW, totalRowH).stroke('#333333');
//       doc.font('Helvetica-Bold').fontSize(fsSmall)
//         .text(`Total Quantity: ${totalQty}`, colItem, y + 6 * scale, { width: colQty-colItem-4*scale, align:'right' })
//         .text(`Gross Amt: ${fmt(subTotal)}`, colRate - 18 * scale, y + 6 * scale, { width: right-colRate+18*scale, align:'right' });
//       y += totalRowH;

//       const totalsX = right - 188 * scale;
//       const valueX = right - 86 * scale;
//       const totalLineH = 18 * scale;
//       const totalLine = (labelText, value, bold = false) => {
//         doc.rect(totalsX, y, right - totalsX, totalLineH).stroke('#333333');
//         doc.moveTo(valueX, y).lineTo(valueX, y + totalLineH).stroke('#333333');
//         doc.font(bold ? 'Helvetica-Bold' : 'Helvetica').fontSize(fsSmall)
//           .text(labelText, totalsX + 4 * scale, y + 5 * scale, { width: valueX - totalsX - 8 * scale })
//           .text(fmt(value), valueX + 3 * scale, y + 5 * scale, { width: right-valueX-6*scale, align:'right' });
//         y += totalLineH;
//       };
//       if (Number(discount || 0) > 0) totalLine('Discount (Figure)', discount);
//       totalLine(`Vat ${fmt(vatPercent).replace('.00','')}%`, vatAmount);
//       totalLine('Total Value', totalAmount, true);

//       y += 4 * scale;
//       const wordsH = compact ? 27 * scale : 34 * scale;
//       doc.rect(left, y, contentW, wordsH).stroke('#333333');
//       doc.font('Helvetica-Bold').fontSize(compact ? 5.5 : 7.2)
//         .text(`Amount In Words  ${amountInWords(totalAmount, currency)}`, left + 3 * scale, y + 5 * scale, { width: contentW - 6 * scale, height: wordsH - 8 * scale });
//       y += wordsH + 10 * scale;

//       if (isQuotation) {
//         doc.font('Helvetica').fontSize(fsSmall)
//           .text(`Quote Validity : ${quoteValidity}`, left, y, { width: contentW })
//           .text(`Delivery Time  : ${deliveryTime}`, left, y + 14 * scale, { width: contentW });
//         y += 34 * scale;
//         if (paymentTerms) { doc.text(`Payment Terms: ${paymentTerms}`, left, y, { width: contentW }); y += 20 * scale; }
//         if (warrantyTerms) {
//           doc.font('Helvetica-Bold').text('Warranty Terms', left, y, { width: contentW });
//           y += 14 * scale;
//           doc.font('Helvetica').text(String(warrantyTerms), left, y, { width: contentW });
//           y += Math.max(22 * scale, doc.heightOfString(String(warrantyTerms), { width: contentW }) + 8 * scale);
//         }
//       } else if (paymentTerms) {
//         doc.font('Helvetica-Bold').fontSize(fsSmall).text('Payment Terms', left, y, { width: contentW });
//         y += 14 * scale;
//         doc.font('Helvetica').text(String(paymentTerms), left, y, { width: contentW });
//         y += Math.max(22 * scale, doc.heightOfString(String(paymentTerms), { width: contentW }) + 8 * scale);
//       }

//       const sigY = Math.min(y + 4 * scale, dim.h - 125 * scale);
//       doc.font('Helvetica-BoldOblique').fontSize(compact ? 6 : 8)
//         .text('For GIIAN IMPEX GENERAL TRADING L.L.C', left, sigY, { width: contentW, align:'right' });
//       // if (!isQuotation && approved) {
//             if (approved) {
//         const signaturePath = process.env.COMPANY_SIGNATURE_PATH || path.join('assets','company','signature.png');
//         const stampPath = process.env.COMPANY_STAMP_PATH || path.join('assets','company','stamp.png');
//         const approvalAssetsEnabled = String(process.env.COMPANY_APPROVAL_ASSETS_ENABLED || 'false').toLowerCase() === 'true';
//         const baseX = right - 185 * scale;
//         if (approvalAssetsEnabled) {
//           try { if (fs.existsSync(signaturePath)) doc.image(signaturePath, baseX + 70*scale, sigY + 12*scale, { fit:[92*scale,42*scale] }); } catch {}
//           try { if (fs.existsSync(stampPath)) doc.image(stampPath, baseX, sigY + 10*scale, { fit:[65*scale,65*scale] }); } catch {}
//         }
//         doc.font('Helvetica').fontSize(compact ? 5.2 : 6.8).text(`Approved${approvedBy ? ` by ${approvedBy}` : ''}${approvedAt ? ` · ${new Date(approvedAt).toLocaleDateString('en-GB')}` : ''}`, baseX, sigY + 72*scale, { width:185*scale, align:'right' });
//       }

//       doc.end();
//       out.on('finish', () => resolve(`/${filePath.replace(/\\/g, '/')}`));
//       out.on('error', reject);
//     } catch (e) { reject(e); }
//   });
// };



// // Dedicated customer-facing landscape receipt. This intentionally uses a
// // separate layout from quotation/invoice booklets and does not expose A4/A5
// // choices in the UI. The PDF is generated once and can be previewed or
// // downloaded directly.
// export const generateReceiptPdf = async ({
//   receipt,
//   customer = {},
//   allocations = [],
//   paymentMode = '',
//   receiptType = '',
//   createdBy = null,
// }) => {
//   const W = 842;
//   const H = 595;
//   const NAVY = '#102033';
//   const GOLD = '#B28A52';
//   const TEXT = '#172033';
//   const MUTED = '#667085';
//   const LINE = '#A9B0BA';
//   const fileName = `receipt-${receipt?.receiptNo || Date.now()}-${Date.now()}.pdf`;
//   const filePath = path.join(UPLOAD_DIR, fileName);

//   const companyName = process.env.COMPANY_NAME || 'GIIAN IMPEX GENERAL TRADING L.L.C';
//   const companyAddress = process.env.COMPANY_ADDRESS || '';
//   const companyEmail = process.env.COMPANY_EMAIL || '';
//   const companyPhone = process.env.COMPANY_PHONE || '';
//   const website = process.env.COMPANY_WEBSITE || '';

//   const dottedLine = (doc, x1, y, x2) => {
//     doc.save().strokeColor(LINE).lineWidth(0.65).dash(2, { space: 2 }).moveTo(x1, y).lineTo(x2, y).stroke().undash().restore();
//   };
//   const check = (doc, x, y, checked) => {
//     doc.save().rect(x, y, 11, 11).lineWidth(0.8).strokeColor(TEXT).stroke();
//     if (checked) doc.strokeColor(GOLD).lineWidth(1.5).moveTo(x+2,y+6).lineTo(x+5,y+9).lineTo(x+10,y+2).stroke();
//     doc.restore();
//   };

//   const settlementText = allocations.map((a) => {
//     const inv = a.invoice || {};
//     const full = Number(inv.balanceAmount || 0) <= 0.001;
//     const number = inv.invoiceNo || a.invoiceNo || '';
//     return number ? `${full ? 'Full Settlement of Invoice' : 'Partial Settlement of Invoice'} ${number}` : '';
//   }).filter(Boolean).join(' / ');

//   return new Promise((resolve, reject) => {
//     try {
//       const doc = new PDFDocument({ size: [W, H], margin: 0 });
//       const out = fs.createWriteStream(filePath);
//       doc.pipe(out);
//       doc.rect(0,0,W,H).fill('#FFFFFF');

//       // top-left brand panel
//       doc.save().fillColor(NAVY).moveTo(0,0).lineTo(238,0).lineTo(190,92).lineTo(0,92).closePath().fill().restore();
//       doc.save().fillColor(GOLD).moveTo(184,0).lineTo(322,0).lineTo(294,34).lineTo(168,34).closePath().fill().restore();
//       doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(18).text('GIIAN', 34, 27);
//       doc.font('Helvetica').fontSize(8).text('BUSINESS SUITE', 34, 51, { characterSpacing: 1.1 });

//       doc.fillColor(NAVY).font('Helvetica-Bold').fontSize(29).text('RECEIPT', 320, 31, { width: 200, align: 'center' });

//       const contact = [companyName, companyAddress, companyEmail, website, companyPhone].filter(Boolean);
//       doc.font('Helvetica').fontSize(7.5).fillColor(TEXT);
//       contact.forEach((line, idx) => doc.text(line, 548, 18 + idx*13, { width: 245, align:'right' }));

//       // vertical receipt band
//       doc.save().fillColor(NAVY).moveTo(790,170).lineTo(842,145).lineTo(842,555).lineTo(790,518).closePath().fill().restore();
//       doc.save().fillColor(GOLD).moveTo(790,170).lineTo(842,145).lineTo(842,161).lineTo(790,186).closePath().fill().restore();
//       doc.save().translate(822,390).rotate(-90).fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(19).text('R E C E I P T', -93, -10, { width:190, align:'center' }).restore();

//       // bottom-left visual block
//       doc.save().fillColor(NAVY).moveTo(0,527).lineTo(245,527).lineTo(310,595).lineTo(0,595).closePath().fill().restore();

//       const receiptNo = safe(receipt?.receiptNo, '');
//       const dateText = receipt?.createdAt ? new Date(receipt.createdAt).toLocaleDateString('en-GB') : new Date().toLocaleDateString('en-GB');
//       const customerName = safe(customer.companyName || customer.name, '');
//       const contactNo = safe(customer.mobileNumber || customer.telephoneNumber || customer.phone, '');
//       const amount = Number(receipt?.amount || 0);
//       const purpose = settlementText || (receiptType === 'Advance' ? 'Advance Payment Received' : receiptType === 'AdvanceAdjustment' ? 'Advance Adjustment' : 'Payment Received');

//       let y=128;
//       doc.fillColor(TEXT).font('Helvetica').fontSize(9).text('No.',28,y).font('Helvetica-Bold').text(receiptNo,63,y); dottedLine(doc,63,y+13,255);
//       doc.font('Helvetica').text('Date',585,y).font('Helvetica-Bold').text(dateText,625,y); dottedLine(doc,625,y+13,760);

//       y+=48; doc.font('Helvetica').text('Received with thanks from',28,y).font('Helvetica-Bold').text(customerName,175,y,{width:570}); dottedLine(doc,175,y+13,760);
//       y+=42; doc.font('Helvetica').text('Amount of (in words)',28,y).font('Helvetica').text(amountInWords(amount),175,y,{width:570}); dottedLine(doc,175,y+13,760);

//       y+=52; doc.font('Helvetica').text('By',28,y);
//       const modes=['Cash','Cheque','Bank Transfer','Other']; let x=72;
//       modes.forEach((m)=>{ const checked = (paymentMode==='Bank' && m==='Bank Transfer') || paymentMode===m; check(doc,x,y-2,checked); doc.text(m,x+16,y,{width:75}); x += m==='Bank Transfer'?112:82; });
//       doc.text('Bank',585,y); dottedLine(doc,625,y+13,760);

//       y+=48; doc.text('For the purpose of',28,y).font('Helvetica-Bold').text(purpose,175,y,{width:570}); dottedLine(doc,175,y+13,760);
//       // y+=44; doc.font('Helvetica').text('Contact No.',28,y).font('Helvetica-Bold').text(contactNo,175,y,{width:570}); dottedLine(doc,175,y+13,760);

//       // amount box
//       doc.fillColor(TEXT).font('Helvetica-Bold').fontSize(12).text('AED',28,457);
//       doc.rect(72,443,190,45).strokeColor('#667085').lineWidth(0.9).stroke();
//       doc.fontSize(17).text(fmt(amount),82,455,{width:170,align:'center'});

//       // signature/received-by lines
//       doc.strokeColor(TEXT).lineWidth(0.8).moveTo(342,500).lineTo(500,500).stroke();
//       doc.font('Helvetica').fontSize(9).text(createdBy?.name || 'Received By',342,508,{width:158,align:'center'});
//       doc.moveTo(570,500).lineTo(750,500).stroke();

//       const approvalAssetsEnabled = String(process.env.COMPANY_APPROVAL_ASSETS_ENABLED || '').toLowerCase() === 'true';
//       const signaturePath = path.join('assets','company','signature.png');
//       const stampPath = path.join('assets','company','stamp.png');
//       if (approvalAssetsEnabled) {
//         if (fs.existsSync(signaturePath)) { try { doc.image(signaturePath,615,446,{fit:[95,42],align:'center'}); } catch {} }
//         if (fs.existsSync(stampPath)) { try { doc.image(stampPath,710,438,{fit:[55,55],align:'center'}); } catch {} }
//       }
//       // doc.font('Helvetica').text('Authorised Signature',570,508,{width:180,align:'center'});
//             doc.font('Helvetica').text('Received By',570,508,{width:180,align:'center'});

//       doc.end();
//       out.on('finish',()=>resolve(filePath.replace(/\\/g, '/')));
//       out.on('error',reject);
//     } catch (e) { reject(e); }
//   });
// };

// // Backward-compatible generic document PDF used by receiptController.
// // Returns a relative uploads path (without a leading slash) because the
// // receipt controller prefixes it when storing pdfUrl.
// export const generateDocumentPdf = async ({
//   title = 'DOCUMENT',
//   docNumber = '',
//   fileNamePrefix = 'document',
//   metaLines = [],
//   customer = {},
//   summaryLines = [],
//   pageSize = 'A4',
// }) => {
//   const size = String(pageSize).toUpperCase() === 'A5' ? 'A5' : 'A4';
//   const dim = PAGE[size];
//   const fileName = `${fileNamePrefix}-${size.toLowerCase()}-${docNumber || Date.now()}-${Date.now()}.pdf`;
//   const filePath = path.join(UPLOAD_DIR, fileName);

//   return new Promise((resolve, reject) => {
//     try {
//       const doc = new PDFDocument({ size, margin: 0, autoFirstPage: true });
//       const out = fs.createWriteStream(filePath);
//       doc.pipe(out);

//       const head = HEADS.dubai;
//       if (fs.existsSync(head)) {
//         doc.image(head, 0, 0, { width: dim.w, height: dim.h });
//       }

//       const scale = dim.w / PAGE.A4.w;
//       const left = 52 * scale;
//       const right = 545 * scale;
//       const contentW = right - left;
//       const compact = size === 'A5';
//       const body = compact ? 7 : 9;
//       let y = 185 * scale;

//       doc.fillColor('#111111')
//         .font('Helvetica-Bold')
//         .fontSize(compact ? 11 : 14)
//         .text(title, left, y, { width: contentW, align: 'center' });

//       y += 38 * scale;
//       const isReceipt = String(title || '').toUpperCase() === 'RECEIPT';
//       doc.font('Helvetica').fontSize(body);

//       if (isReceipt) {
//         const infoH = 30 * scale;
//         doc.roundedRect(left, y, contentW, infoH, 3 * scale).stroke('#333333');
//         doc.font('Helvetica-Bold').text(`Receipt No: ${safe(docNumber)}`, left + 8*scale, y + 10*scale, { width: contentW * .48 });
//         const dateLine = (metaLines || []).find((line) => line?.label === 'Date');
//         doc.font('Helvetica').text(`Date: ${safe(dateLine?.value)}`, left + contentW*.52, y + 10*scale, { width: contentW*.44, align:'right' });
//         y += infoH + 14*scale;

//         if (customer?.companyName) {
//           doc.font('Helvetica-Bold').text('Received From', left, y, { width: 110*scale });
//           doc.font('Helvetica').text(safe(customer.companyName), left + 112*scale, y, { width: contentW - 112*scale });
//           y += 18*scale;
//         }
//         if (customer?.contactPersonName) { doc.text(`Contact Person: ${safe(customer.contactPersonName)}`, left, y, { width: contentW }); y += 16*scale; }
//         if (customer?.companyAddress) { doc.text(`Address: ${safe(customer.companyAddress)}`, left, y, { width: contentW }); y += 16*scale; }

//         const paymentLine = (metaLines || []).find((line) => line?.label === 'Mode of Payment');
//         if (paymentLine?.value) { doc.text(`Mode of Payment: ${safe(paymentLine.value)}`, left, y, { width: contentW }); y += 18*scale; }

//         const settlementLines = (metaLines || []).filter((line) => /Settlement of Invoice/i.test(String(line?.label || '')));
//         for (const line of settlementLines) {
//           doc.roundedRect(left, y, contentW, 28*scale, 3*scale).fillAndStroke('#F8F6F1','#CFC7BB');
//           doc.fillColor('#111111').font('Helvetica-Bold').text(safe(line.label), left + 8*scale, y + 9*scale, { width: contentW*.66 });
//           doc.font('Helvetica').text(safe(line.value), left + contentW*.68, y + 9*scale, { width: contentW*.28, align:'right' });
//           y += 36*scale;
//         }
//       } else {
//         doc.text(`Document No : ${safe(docNumber)}`, left, y, { width: contentW });
//         y += 18 * scale;
//         for (const line of metaLines || []) {
//           if (!line) continue;
//           doc.text(`${safe(line.label, '')}${line.label ? ' : ' : ''}${safe(line.value)}`, left, y, { width: contentW });
//           y += 16 * scale;
//         }
//         y += 8 * scale;
//         if (customer?.companyName) { doc.font('Helvetica-Bold').text(`Customer : ${safe(customer.companyName)}`, left, y, { width: contentW }); y += 17 * scale; }
//         if (customer?.contactPersonName) { doc.font('Helvetica').text(`Contact Person : ${safe(customer.contactPersonName)}`, left, y, { width: contentW }); y += 17 * scale; }
//         if (customer?.companyAddress) { doc.text(`Address : ${safe(customer.companyAddress)}`, left, y, { width: contentW }); y += 17 * scale; }
//         if (customer?.telephoneNumber) { doc.text(`Tel : ${safe(customer.telephoneNumber)}`, left, y, { width: contentW }); y += 17 * scale; }
//       }

//       y += 14 * scale;
//       for (const line of summaryLines || []) {
//         if (!line) continue;
//         doc.roundedRect(left, y, contentW, 28 * scale, 3 * scale).stroke('#333333');
//         doc.font('Helvetica-Bold').fontSize(body)
//           .text(safe(line.label, 'Total'), left + 8 * scale, y + 9 * scale, { width: contentW * 0.62 })
//           .text(safe(line.value), left + contentW * 0.62, y + 9 * scale, { width: contentW * 0.34, align: 'right' });
//         y += 36 * scale;
//       }

//       const sigY = Math.min(y + 20 * scale, dim.h - 125 * scale);
//       doc.font('Helvetica-BoldOblique')
//         .fontSize(compact ? 6 : 8)
//         .text('For GIIAN IMPEX GENERAL TRADING L.L.C', left, sigY, { width: contentW, align: 'right' });

//       doc.end();
//       out.on('finish', () => resolve(filePath.replace(/\\/g, '/')));
//       out.on('error', reject);
//     } catch (error) {
//       reject(error);
//     }
//   });
// };




// // import PDFDocument from 'pdfkit';
// // import fs from 'fs';
// // import path from 'path';

// // const UPLOAD_DIR = 'uploads';
// // if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });
// // const HEADS = { dubai: path.join('assets', 'letterheads', 'giian-dubai.png') };
// // const PAGE = { A4: { w: 595.28, h: 841.89 }, A5: { w: 419.53, h: 595.28 } };
// // const COMPANY_TRN = process.env.GIIAN_TRN_NO || '100001538600003';
// // const fmt = (n) => Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
// // const safe = (v, fallback = '-') => String(v ?? '').trim() || fallback;

// // const fetchImage = async (url) => {
// //   if (!url) return null;
// //   try {
// //     if (/^https?:\/\//i.test(url)) {
// //       const r = await fetch(url);
// //       if (!r.ok) return null;
// //       return Buffer.from(await r.arrayBuffer());
// //     }
// //     const local = url.startsWith('/') ? url.slice(1) : url;
// //     return fs.existsSync(local) ? fs.readFileSync(local) : null;
// //   } catch { return null; }
// // };

// // const SMALL = ['', 'One','Two','Three','Four','Five','Six','Seven','Eight','Nine','Ten','Eleven','Twelve','Thirteen','Fourteen','Fifteen','Sixteen','Seventeen','Eighteen','Nineteen'];
// // const TENS = ['', '', 'Twenty','Thirty','Forty','Fifty','Sixty','Seventy','Eighty','Ninety'];
// // const underThousand = (n) => {
// //   let out = [];
// //   if (n >= 100) { out.push(`${SMALL[Math.floor(n / 100)]} Hundred`); n %= 100; }
// //   if (n >= 20) { out.push(TENS[Math.floor(n / 10)]); if (n % 10) out.push(SMALL[n % 10]); }
// //   else if (n > 0) out.push(SMALL[n]);
// //   return out.join(' ');
// // };
// // const integerToWords = (value) => {
// //   let n = Math.floor(Math.abs(Number(value) || 0));
// //   if (n === 0) return 'Zero';
// //   const groups = [
// //     [1_000_000_000, 'Billion'], [1_000_000, 'Million'], [1_000, 'Thousand'], [1, '']
// //   ];
// //   const parts = [];
// //   for (const [div, label] of groups) {
// //     const chunk = Math.floor(n / div);
// //     if (chunk) {
// //       parts.push(`${underThousand(chunk)}${label ? ` ${label}` : ''}`);
// //       n %= div;
// //     }
// //   }
// //   return parts.join(' ').trim();
// // };
// // const amountInWords = (amount, currency = 'AED') => {
// //   const n = Math.max(0, Number(amount) || 0);
// //   const whole = Math.floor(n);
// //   const fils = Math.round((n - whole) * 100);
// //   const filsText = fils ? ` and ${integerToWords(fils)} Fils` : '';
// //   return `${currency} ${integerToWords(whole)}${filsText} Only.`;
// // };

// // export const generateBrandedPdf = async ({
// //   title,
// //   docNumber,
// //   fileNamePrefix,
// //   region = 'dubai',
// //   pageSize = 'A4',
// //   date,
// //   referenceNo,
// //   attn,
// //   customer,
// //   items = [],
// //   discount = 0,
// //   vatPercent = 0,
// //   subTotal = 0,
// //   vatAmount = 0,
// //   totalAmount = 0,
// //   currency = 'AED',
// //   subject,
// //   quoteValidity = '15 Days',
// //   deliveryTime = '2 - 3 Weeks',
// //   paymentTerms = '',
// //   warrantyTerms = '',
// //   approved = false,
// //   approvedBy = '',
// //   approvedAt = null,
// // }) => {
// //   const size = String(pageSize).toUpperCase() === 'A5' ? 'A5' : 'A4';
// //   const dim = PAGE[size];
// //   const scale = dim.w / PAGE.A4.w;
// //   const isQuotation = String(title || '').toUpperCase().includes('QUOTATION');
// //   const label = isQuotation ? 'Quotation' : 'Invoice';
// //   const fileName = `${fileNamePrefix}-${region}-${size.toLowerCase()}-${docNumber}-${Date.now()}.pdf`;
// //   const filePath = path.join(UPLOAD_DIR, fileName);
// //   const productImages = await Promise.all(items.map((i) => fetchImage(i.imageUrl)));

// //   return new Promise((resolve, reject) => {
// //     try {
// //       const doc = new PDFDocument({ size, margin: 0, autoFirstPage: true });
// //       const out = fs.createWriteStream(filePath);
// //       doc.pipe(out);
// //       const head = HEADS.dubai;
// //       const drawHead = () => { if (fs.existsSync(head)) doc.image(head, 0, 0, { width: dim.w, height: dim.h }); };
// //       drawHead();

// //       const left = 52 * scale;
// //       const right = 545 * scale;
// //       const contentW = right - left;
// //       const compact = size === 'A5';
// //       const fsBody = compact ? 6.2 : 8.2;
// //       const fsSmall = compact ? 5.7 : 7.4;
// //       const titleY = 178 * scale;

// //       doc.fillColor('#111111').font('Helvetica-Bold').fontSize(compact ? 10.5 : 13.5)
// //         .text(title, left, titleY, { width: contentW, align: 'center' });

// //       const metaY = 214 * scale;
// //       const rightMetaX = right - 180 * scale;
// //       doc.font('Helvetica').fontSize(fsBody);
// //       doc.text(`Customer Name: ${safe(customer?.companyName)}`, left, metaY, { width: 300 * scale });
// //       if (customer?.companyAddress) doc.text(`Address: ${safe(customer.companyAddress)}`, left, metaY + 14 * scale, { width: 310 * scale });
// //       if (customer?.telephoneNumber) doc.text(`Tel: ${safe(customer.telephoneNumber)}`, left, metaY + 28 * scale, { width: 210 * scale });
// //       if (customer?.email) doc.text(`Email: ${safe(customer.email)}`, left, metaY + 42 * scale, { width: 250 * scale });

// //       doc.text(`${label} No : ${safe(docNumber)}`, rightMetaX, metaY, { width: 180 * scale, align: 'right' });
// //       doc.text(`${label} Date : ${date ? new Date(date).toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' }) : '-'}`, rightMetaX, metaY + 14 * scale, { width: 180 * scale, align: 'right' });
// //       if (referenceNo) doc.text(`Reference No : ${referenceNo}`, rightMetaX, metaY + 28 * scale, { width: 180 * scale, align: 'right' });
// //       if (attn) doc.text(`Contact Person : ${attn}`, rightMetaX, metaY + 42 * scale, { width: 180 * scale, align: 'right' });

// //       const trnY = metaY + 56 * scale;
// //       doc.text(`TRN NO: ${COMPANY_TRN}`, left, trnY, { width: 245 * scale });
// //       if (subject || isQuotation) {
// //         doc.text(`Subject: ${safe(subject, isQuotation ? 'Commercial Quotation' : 'Tax Invoice')}`, left, trnY + 14 * scale, { width: contentW });
// //       }

// //       let y0 = (isQuotation ? 303 : 292) * scale;
// //       const headerH = 22 * scale;
// //       const rowH = (compact ? 65 : 82) * scale;
// //       const colNo = left;
// //       const colItem = left + 42 * scale;
// //       const colQty = right - 178 * scale;
// //       const colRate = right - 116 * scale;
// //       const colAmount = right - 58 * scale;

// //       const drawTableHeader = (y) => {
// //         doc.font('Helvetica-Bold').fontSize(compact ? 5.8 : 7.5).lineWidth(0.7).rect(left, y, contentW, headerH).stroke('#222222');
// //         [colItem, colQty, colRate, colAmount].forEach((x) => doc.moveTo(x, y).lineTo(x, y + headerH).stroke('#222222'));
// //         doc.text('SL.No', colNo + 4 * scale, y + 7 * scale, { width: 34 * scale, align: 'center' });
// //         doc.text('Item Description', colItem + 4 * scale, y + 7 * scale, { width: colQty-colItem-8*scale, align:'center' });
// //         doc.text('Quantity', colQty + 2 * scale, y + 7 * scale, { width: colRate-colQty-4*scale, align:'center' });
// //         doc.text('Rate', colRate + 2 * scale, y + 7 * scale, { width: colAmount-colRate-4*scale, align:'center' });
// //         doc.text('Amount', colAmount + 2 * scale, y + 7 * scale, { width: right-colAmount-4*scale, align:'center' });
// //       };

// //       drawTableHeader(y0);
// //       let y = y0 + headerH;
// //       doc.font('Helvetica').fontSize(fsSmall);
// //       items.forEach((it, idx) => {
// //         const bottomReserve = (isQuotation ? 215 : 170) * scale;
// //         if (y + rowH > dim.h - bottomReserve) {
// //           doc.addPage({ size, margin: 0 }); drawHead(); y = 120 * scale; drawTableHeader(y); y += headerH;
// //         }
// //         doc.rect(left, y, contentW, rowH).stroke('#333333');
// //         [colItem, colQty, colRate, colAmount].forEach((x) => doc.moveTo(x, y).lineTo(x, y + rowH).stroke('#333333'));
// //         doc.text(String(idx + 1), colNo + 4 * scale, y + 8 * scale, { width: 34 * scale, align:'center' });
// //         const img = productImages[idx];
// //         const imageW = compact ? 48 * scale : 64 * scale;
// //         const imageH = compact ? 38 * scale : 52 * scale;
// //         let textX = colItem + 5 * scale;
// //         if (img) {
// //           try {
// //             doc.image(img, colItem + 7 * scale, y + 22 * scale, { fit: [imageW, imageH], align:'center', valign:'center' });
// //             textX = colItem + imageW + 15 * scale;
// //           } catch {}
// //         }
// //         doc.font('Helvetica').fontSize(fsSmall).text(safe(it.name, 'Product'), textX, y + 8 * scale, { width: Math.max(60, colQty - textX - 6 * scale), height: rowH - 12 * scale });
// //         doc.text(String(it.qty ?? 0), colQty + 2 * scale, y + 8 * scale, { width: colRate-colQty-5*scale, align:'center' });
// //         doc.text(fmt(it.price), colRate + 2 * scale, y + 8 * scale, { width: colAmount-colRate-5*scale, align:'right' });
// //         doc.text(fmt(it.total), colAmount + 2 * scale, y + 8 * scale, { width: right-colAmount-5*scale, align:'right' });
// //         y += rowH;
// //       });

// //       const totalQty = items.reduce((s, i) => s + Number(i.qty || 0), 0);
// //       const totalRowH = 20 * scale;
// //       doc.rect(left, y, contentW, totalRowH).stroke('#333333');
// //       doc.font('Helvetica-Bold').fontSize(fsSmall)
// //         .text(`Total Quantity: ${totalQty}`, colItem, y + 6 * scale, { width: colQty-colItem-4*scale, align:'right' })
// //         .text(`Gross Amt: ${fmt(subTotal)}`, colRate - 18 * scale, y + 6 * scale, { width: right-colRate+18*scale, align:'right' });
// //       y += totalRowH;

// //       const totalsX = right - 188 * scale;
// //       const valueX = right - 86 * scale;
// //       const totalLineH = 18 * scale;
// //       const totalLine = (labelText, value, bold = false) => {
// //         doc.rect(totalsX, y, right - totalsX, totalLineH).stroke('#333333');
// //         doc.moveTo(valueX, y).lineTo(valueX, y + totalLineH).stroke('#333333');
// //         doc.font(bold ? 'Helvetica-Bold' : 'Helvetica').fontSize(fsSmall)
// //           .text(labelText, totalsX + 4 * scale, y + 5 * scale, { width: valueX - totalsX - 8 * scale })
// //           .text(fmt(value), valueX + 3 * scale, y + 5 * scale, { width: right-valueX-6*scale, align:'right' });
// //         y += totalLineH;
// //       };
// //       if (Number(discount || 0) > 0) totalLine('Discount (Figure)', discount);
// //       totalLine(`Vat ${fmt(vatPercent).replace('.00','')}%`, vatAmount);
// //       totalLine('Total Value', totalAmount, true);

// //       y += 4 * scale;
// //       const wordsH = compact ? 27 * scale : 34 * scale;
// //       doc.rect(left, y, contentW, wordsH).stroke('#333333');
// //       doc.font('Helvetica-Bold').fontSize(compact ? 5.5 : 7.2)
// //         .text(`Amount In Words  ${amountInWords(totalAmount, currency)}`, left + 3 * scale, y + 5 * scale, { width: contentW - 6 * scale, height: wordsH - 8 * scale });
// //       y += wordsH + 10 * scale;

// //       if (isQuotation) {
// //         doc.font('Helvetica').fontSize(fsSmall)
// //           .text(`Quote Validity : ${quoteValidity}`, left, y, { width: contentW })
// //           .text(`Delivery Time  : ${deliveryTime}`, left, y + 14 * scale, { width: contentW });
// //         y += 34 * scale;
// //         if (paymentTerms) { doc.text(`Payment Terms: ${paymentTerms}`, left, y, { width: contentW }); y += 20 * scale; }
// //         if (warrantyTerms) {
// //           doc.font('Helvetica-Bold').text('Warranty Terms', left, y, { width: contentW });
// //           y += 14 * scale;
// //           doc.font('Helvetica').text(String(warrantyTerms), left, y, { width: contentW });
// //           y += Math.max(22 * scale, doc.heightOfString(String(warrantyTerms), { width: contentW }) + 8 * scale);
// //         }
// //       } else if (paymentTerms) {
// //         doc.font('Helvetica-Bold').fontSize(fsSmall).text('Payment Terms', left, y, { width: contentW });
// //         y += 14 * scale;
// //         doc.font('Helvetica').text(String(paymentTerms), left, y, { width: contentW });
// //         y += Math.max(22 * scale, doc.heightOfString(String(paymentTerms), { width: contentW }) + 8 * scale);
// //       }

// //       const sigY = Math.min(y + 4 * scale, dim.h - 125 * scale);
// //       doc.font('Helvetica-BoldOblique').fontSize(compact ? 6 : 8)
// //         .text('For GIIAN IMPEX GENERAL TRADING L.L.C', left, sigY, { width: contentW, align:'right' });
// //       if (approved) {
// //         const signaturePath = process.env.COMPANY_SIGNATURE_PATH || path.join('assets','company','signature.png');
// //         const stampPath = process.env.COMPANY_STAMP_PATH || path.join('assets','company','stamp.png');
// //         const approvalAssetsEnabled = String(process.env.COMPANY_APPROVAL_ASSETS_ENABLED || 'false').toLowerCase() === 'true';
// //         const baseX = right - 185 * scale;
// //         if (approvalAssetsEnabled) {
// //           try { if (fs.existsSync(signaturePath)) doc.image(signaturePath, baseX + 70*scale, sigY + 12*scale, { fit:[92*scale,42*scale] }); } catch {}
// //           try { if (fs.existsSync(stampPath)) doc.image(stampPath, baseX, sigY + 10*scale, { fit:[65*scale,65*scale] }); } catch {}
// //         }
// //         doc.font('Helvetica').fontSize(compact ? 5.2 : 6.8).text(`Approved${approvedBy ? ` by ${approvedBy}` : ''}${approvedAt ? ` · ${new Date(approvedAt).toLocaleDateString('en-GB')}` : ''}`, baseX, sigY + 72*scale, { width:185*scale, align:'right' });
// //       }

// //       doc.end();
// //       out.on('finish', () => resolve(`/${filePath.replace(/\\/g, '/')}`));
// //       out.on('error', reject);
// //     } catch (e) { reject(e); }
// //   });
// // };

// // // Backward-compatible generic document PDF used elsewhere in the app.
// // export const generateDocumentPdf = async ({
// //   title = 'DOCUMENT',
// //   docNumber = '',
// //   fileNamePrefix = 'document',
// //   metaLines = [],
// //   customer = {},
// //   summaryLines = [],
// //   pageSize = 'A4',
// // }) => {
// //   const size = String(pageSize).toUpperCase() === 'A5' ? 'A5' : 'A4';
// //   const dim = PAGE[size];
// //   const fileName = `${fileNamePrefix}-${size.toLowerCase()}-${docNumber || Date.now()}-${Date.now()}.pdf`;
// //   const filePath = path.join(UPLOAD_DIR, fileName);

// //   return new Promise((resolve, reject) => {
// //     try {
// //       const doc = new PDFDocument({ size, margin: 0, autoFirstPage: true });
// //       const out = fs.createWriteStream(filePath);
// //       doc.pipe(out);

// //       const head = HEADS.dubai;
// //       if (fs.existsSync(head)) {
// //         doc.image(head, 0, 0, { width: dim.w, height: dim.h });
// //       }

// //       const scale = dim.w / PAGE.A4.w;
// //       const left = 52 * scale;
// //       const right = 545 * scale;
// //       const contentW = right - left;
// //       const compact = size === 'A5';
// //       const body = compact ? 7 : 9;
// //       let y = 185 * scale;

// //       doc.fillColor('#111111')
// //         .font('Helvetica-Bold')
// //         .fontSize(compact ? 11 : 14)
// //         .text(title, left, y, { width: contentW, align: 'center' });

// //       y += 38 * scale;
// //       const isReceipt = String(title || '').toUpperCase() === 'RECEIPT';
// //       doc.font('Helvetica').fontSize(body);

// //       if (isReceipt) {
// //         const infoH = 30 * scale;
// //         doc.roundedRect(left, y, contentW, infoH, 3 * scale).stroke('#333333');
// //         doc.font('Helvetica-Bold').text(`Receipt No: ${safe(docNumber)}`, left + 8*scale, y + 10*scale, { width: contentW * .48 });
// //         const dateLine = (metaLines || []).find((line) => line?.label === 'Date');
// //         doc.font('Helvetica').text(`Date: ${safe(dateLine?.value)}`, left + contentW*.52, y + 10*scale, { width: contentW*.44, align:'right' });
// //         y += infoH + 14*scale;

// //         if (customer?.companyName) {
// //           doc.font('Helvetica-Bold').text('Received From', left, y, { width: 110*scale });
// //           doc.font('Helvetica').text(safe(customer.companyName), left + 112*scale, y, { width: contentW - 112*scale });
// //           y += 18*scale;
// //         }
// //         if (customer?.contactPersonName) { doc.text(`Contact Person: ${safe(customer.contactPersonName)}`, left, y, { width: contentW }); y += 16*scale; }
// //         if (customer?.companyAddress) { doc.text(`Address: ${safe(customer.companyAddress)}`, left, y, { width: contentW }); y += 16*scale; }

// //         const paymentLine = (metaLines || []).find((line) => line?.label === 'Mode of Payment');
// //         if (paymentLine?.value) { doc.text(`Mode of Payment: ${safe(paymentLine.value)}`, left, y, { width: contentW }); y += 18*scale; }

// //         const settlementLines = (metaLines || []).filter((line) => /Settlement of Invoice/i.test(String(line?.label || '')));
// //         for (const line of settlementLines) {
// //           doc.roundedRect(left, y, contentW, 28*scale, 3*scale).fillAndStroke('#F8F6F1','#CFC7BB');
// //           doc.fillColor('#111111').font('Helvetica-Bold').text(safe(line.label), left + 8*scale, y + 9*scale, { width: contentW*.66 });
// //           doc.font('Helvetica').text(safe(line.value), left + contentW*.68, y + 9*scale, { width: contentW*.28, align:'right' });
// //           y += 36*scale;
// //         }
// //       } else {
// //         doc.text(`Document No : ${safe(docNumber)}`, left, y, { width: contentW });
// //         y += 18 * scale;
// //         for (const line of metaLines || []) {
// //           if (!line) continue;
// //           doc.text(`${safe(line.label, '')}${line.label ? ' : ' : ''}${safe(line.value)}`, left, y, { width: contentW });
// //           y += 16 * scale;
// //         }
// //         y += 8 * scale;
// //         if (customer?.companyName) { doc.font('Helvetica-Bold').text(`Customer : ${safe(customer.companyName)}`, left, y, { width: contentW }); y += 17 * scale; }
// //         if (customer?.contactPersonName) { doc.font('Helvetica').text(`Contact Person : ${safe(customer.contactPersonName)}`, left, y, { width: contentW }); y += 17 * scale; }
// //         if (customer?.companyAddress) { doc.text(`Address : ${safe(customer.companyAddress)}`, left, y, { width: contentW }); y += 17 * scale; }
// //         if (customer?.telephoneNumber) { doc.text(`Tel : ${safe(customer.telephoneNumber)}`, left, y, { width: contentW }); y += 17 * scale; }
// //       }

// //       y += 14 * scale;
// //       for (const line of summaryLines || []) {
// //         if (!line) continue;
// //         doc.roundedRect(left, y, contentW, 28 * scale, 3 * scale).stroke('#333333');
// //         doc.font('Helvetica-Bold').fontSize(body)
// //           .text(safe(line.label, 'Total'), left + 8 * scale, y + 9 * scale, { width: contentW * 0.62 })
// //           .text(safe(line.value), left + contentW * 0.62, y + 9 * scale, { width: contentW * 0.34, align: 'right' });
// //         y += 36 * scale;
// //       }

// //       const sigY = Math.min(y + 20 * scale, dim.h - 125 * scale);
// //       doc.font('Helvetica-BoldOblique')
// //         .fontSize(compact ? 6 : 8)
// //         .text('For GIIAN IMPEX GENERAL TRADING L.L.C', left, sigY, { width: contentW, align: 'right' });

// //       doc.end();
// //       out.on('finish', () => resolve(filePath.replace(/\\/g, '/')));
// //       out.on('error', reject);
// //     } catch (error) {
// //       reject(error);
// //     }
// //   });
// // };

// // // ---------------------------------------------------------------------------
// // // Receipt PDF — matches the GIIAN receipt design, with a single "Received By"
// // // signature block that dynamically pulls the role's e-sign (Cloudinary URL)
// // // for whoever created the receipt.
// // // ---------------------------------------------------------------------------

// // const RCPT_NAVY = "#152238";
// // const RCPT_GOLD = "#c99a4a";
// // const RCPT_GRAY = "#7a8699";
// // const RCPT_LINE = "#cfd6e0";

// // const RCPT_ONES = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten",
// //   "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
// // const RCPT_TENS = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

// // const receiptNumToWords = (n) => {
// //   if (n === 0) return "Zero";
// //   if (n < 20) return RCPT_ONES[n];
// //   if (n < 100) return RCPT_TENS[Math.floor(n / 10)] + (n % 10 ? " " + RCPT_ONES[n % 10] : "");
// //   if (n < 1000) return RCPT_ONES[Math.floor(n / 100)] + " Hundred" + (n % 100 ? " " + receiptNumToWords(n % 100) : "");
// //   if (n < 100000) return receiptNumToWords(Math.floor(n / 1000)) + " Thousand" + (n % 1000 ? " " + receiptNumToWords(n % 1000) : "");
// //   if (n < 10000000) return receiptNumToWords(Math.floor(n / 100000)) + " Lakh" + (n % 100000 ? " " + receiptNumToWords(n % 100000) : "");
// //   return String(n);
// // };

// // const receiptAmountInWords = (amount) => {
// //   const value = Number(amount) || 0;
// //   const rupees = Math.floor(value);
// //   const fils = Math.round((value - rupees) * 100);
// //   let words = `AED ${receiptNumToWords(rupees)}`;
// //   if (fils > 0) words += ` and ${receiptNumToWords(fils)} Fils`;
// //   return `${words} Only.`;
// // };

// // // const drawReceiptHeader = (doc, companyName = "GIIAN IMPEX GENERAL TRADING L.L.C") => {
// // //   const pageWidth = doc.page.width;

// // //   doc.save();
// // //   doc.rect(0, 0, pageWidth, 95).fill(RCPT_NAVY);
// // //   doc.polygon([200, 0], [300, 0], [230, 95], [130, 95]).fill(RCPT_GOLD);
// // //   doc.restore();

// // //   doc.fillColor("#ffffff").font("Helvetica-Bold").fontSize(20).text("GIIAN", 40, 30);
// // //   doc.fontSize(8).font("Helvetica").fillColor("#d8dee8")
// // //     .text("BUSINESS SUITE", 40, 55, { characterSpacing: 1 });

// // //   doc.fillColor(RCPT_NAVY).font("Helvetica-Bold").fontSize(28).text("RECEIPT", 0, 38, { align: "center" });

// // //   doc.font("Helvetica").fontSize(8).fillColor(RCPT_GRAY)
// // //     .text(companyName, pageWidth - 280, 30, { width: 240, align: "right" });
// // // };

// // const drawReceiptHeader = (doc, companyName = "GIIAN IMPEX GENERAL TRADING L.L.C") => {
// //   const pageWidth = doc.page.width;
// //   const bandHeight = 95;

// //   doc.save();
// //   doc.polygon([0, 0], [150, 0], [90, bandHeight], [0, bandHeight]).fill(RCPT_NAVY);
// //   doc.polygon([115, 0], [165, 0], [105, bandHeight], [55, bandHeight]).fill(RCPT_GOLD);
// //   doc.restore();

// //   doc.fillColor("#ffffff").font("Helvetica-Bold").fontSize(20).text("GIIAN", 24, 26);
// //   doc.fontSize(8).font("Helvetica").fillColor("#d8dee8")
// //     .text("BUSINESS SUITE", 24, 52, { characterSpacing: 1 });

// //   doc.fillColor(RCPT_NAVY).font("Helvetica-Bold").fontSize(28)
// //     .text("RECEIPT", 0, 34, { width: pageWidth, align: "center" });

// //   doc.font("Helvetica").fontSize(8).fillColor(RCPT_GRAY)
// //     .text(companyName, pageWidth - 280, 24, { width: 240, align: "right" });
// // };

// // const drawReceiptSideRibbon = (doc) => {
// //   const pageWidth = doc.page.width;
// //   const pageHeight = doc.page.height;
// //   const ribbonWidth = 40;
// //   const ribbonTop = 100;
// //   const ribbonHeight = pageHeight - 200;

// //   doc.save();
// //   doc.rect(pageWidth - ribbonWidth, ribbonTop, ribbonWidth, ribbonHeight).fill(RCPT_NAVY);
// //   doc.polygon(
// //     [pageWidth - ribbonWidth, ribbonTop + ribbonHeight],
// //     [pageWidth, ribbonTop + ribbonHeight],
// //     [pageWidth, ribbonTop + ribbonHeight + 55],
// //     [pageWidth - ribbonWidth - 40, ribbonTop + ribbonHeight + 55]
// //   ).fill(RCPT_GOLD);
// //   doc.restore();

// //   doc.save();
// //   doc.rotate(90, { origin: [pageWidth - ribbonWidth / 2, ribbonTop + ribbonHeight / 2] });
// //   doc.fillColor("#ffffff").font("Helvetica-Bold").fontSize(13)
// //     .text("RECEIPT", pageWidth - ribbonWidth / 2 - 70, ribbonTop + ribbonHeight / 2 - 7, {
// //       width: 140,
// //       align: "center",
// //       characterSpacing: 3,
// //     });
// //   doc.restore();
// // };

// // const drawReceiptFooterCorner = (doc) => {
// //   const pageWidth = doc.page.width;
// //   const pageHeight = doc.page.height;

// //   doc.save();
// //   doc.polygon(
// //     [0, pageHeight - 90],
// //     [190, pageHeight],
// //     [0, pageHeight]
// //   ).fill(RCPT_NAVY);
// //   doc.restore();
// // };

// // const receiptDottedLine = (doc, x1, y, x2) => {
// //   doc.moveTo(x1, y).lineTo(x2, y).dash(1, { space: 2 }).strokeColor(RCPT_LINE).lineWidth(1).stroke().undash();
// // };

// // const receiptLabelValueRow = (doc, x, y, label, value, labelWidth = 190, lineWidth = 300) => {
// //   doc.font("Helvetica").fontSize(9).fillColor(RCPT_GRAY).text(label, x, y);
// //   doc.font("Helvetica-Bold").fontSize(10.5).fillColor(RCPT_NAVY)
// //     .text(value || "-", x + labelWidth, y - 2, { width: lineWidth });
// //   receiptDottedLine(doc, x + labelWidth, y + 15, x + labelWidth + lineWidth);
// // };

// // const drawReceiptCheckbox = (doc, x, y, label, checked) => {
// //   doc.rect(x, y, 10, 10).lineWidth(1).strokeColor("#8a93a6").stroke();
// //   if (checked) {
// //     doc.moveTo(x + 1.5, y + 5).lineTo(x + 4, y + 8.5).lineTo(x + 8.5, y + 1.5)
// //       .strokeColor(RCPT_NAVY).lineWidth(1.4).stroke();
// //   }
// //   doc.font("Helvetica").fontSize(9).fillColor(RCPT_NAVY).text(label, x + 15, y - 1);
// //   return doc.widthOfString(label) + 15;
// // };

// // const resolveReceiptPurpose = (receiptType, allocations) => {
// //   if (receiptType === "Advance") return "Advance Receipt";
// //   if (receiptType === "AdvanceAdjustment") {
// //     const invoiceNos = (allocations || [])
// //       .map((a) => (typeof a.invoice === "object" ? a.invoice?.invoiceNo : null))
// //       .filter(Boolean)
// //       .join(", ");
// //     return `Advance Adjustment${invoiceNos ? ` against ${invoiceNos}` : ""}`;
// //   }
// //   if (allocations?.length === 1) {
// //     const inv = allocations[0].invoice;
// //     const invoiceNo = typeof inv === "object" ? inv?.invoiceNo : "";
// //     const isFull = typeof inv === "object" && inv?.balanceAmount !== undefined
// //       ? Number(inv.balanceAmount) <= 0.001
// //       : false;
// //     return `${isFull ? "Full" : "Partial"} Settlement of Invoice ${invoiceNo}`;
// //   }
// //   const invoiceNos = (allocations || [])
// //     .map((a) => (typeof a.invoice === "object" ? a.invoice?.invoiceNo : null))
// //     .filter(Boolean)
// //     .join(", ");
// //   return `Settlement of Invoices ${invoiceNos}`;
// // };

// // /**
// //  * Generates a receipt PDF matching the GIIAN receipt design.
// //  * Only ONE signature block is rendered — "Received By" — with the e-sign
// //  * dynamically fetched from the receipt creator's assigned Role
// //  * (createdBy.role.esignUrl), stored on Cloudinary.
// //  *
// //  * @param {Object} params
// //  * @param {Object} params.receipt - Receipt document (receiptNo, amount, createdAt, etc.)
// //  * @param {Object} params.customer - Customer document (companyName, etc.)
// //  * @param {Array}  params.allocations - Populated allocations (invoice docs)
// //  * @param {String} params.paymentMode - "Cash" | "Bank" | null (null for AdvanceAdjustment)
// //  * @param {String} params.receiptType - "Advance" | "Collection" | "AdvanceAdjustment"
// //  * @param {Object} params.createdBy - Populated user { name, role: { name, esignUrl } }
// //  * @returns {Promise<string>} relative path e.g. "uploads/receipts/RCT-000003.pdf"
// //  */
// // export const generateReceiptPdf = async ({ receipt, customer, allocations = [], paymentMode, receiptType, createdBy }) => {
// //   const outputDir = path.join("uploads", "receipts");
// //   if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

// //   const fileName = `${receipt.receiptNo}.pdf`;
// //   const relativePath = path.join("uploads", "receipts", fileName).replace(/\\/g, "/");
// //   const filePath = path.join(outputDir, fileName);

// //   const doc = new PDFDocument({ size: "A4", margin: 0 });
// //   const stream = fs.createWriteStream(filePath);
// //   doc.pipe(stream);

// //   // Fetch the e-sign image bytes up front (async), before starting sync draw calls.
// //   // Reuses the same fetchImage() used by generateBrandedPdf — supports both
// //   // remote (Cloudinary) URLs and local paths.
// // const esignUrl = createdBy?.esignUrl;
// //   const esignBuffer = await fetchImage(esignUrl);

// //   drawReceiptHeader(doc);

// //   const left = 50;
// //   const pageWidth = doc.page.width;
// //   let y = 130;

// //   // No. / Date row
// //   doc.font("Helvetica").fontSize(9).fillColor(RCPT_GRAY).text("No.", left, y);
// //   doc.font("Helvetica-Bold").fontSize(10.5).fillColor(RCPT_NAVY).text(receipt.receiptNo, left + 30, y - 1);
// //   receiptDottedLine(doc, left + 30, y + 15, left + 220);

// //   const dateLabelX = pageWidth - 220;
// //   doc.font("Helvetica").fontSize(9).fillColor(RCPT_GRAY).text("Date", dateLabelX, y);
// //   const dateStr = new Date(receipt.createdAt || Date.now()).toLocaleDateString("en-GB");
// //   doc.font("Helvetica-Bold").fontSize(10.5).fillColor(RCPT_NAVY).text(dateStr, dateLabelX + 40, y - 1);
// //   receiptDottedLine(doc, dateLabelX + 40, y + 15, pageWidth - 50);

// //   // Received with thanks from
// //   y += 45;
// //   receiptLabelValueRow(doc, left, y, "Received with thanks from", customer?.companyName || customer?.contactPerson || "-");

// //   // Amount of (in words)
// //   y += 45;
// //   receiptLabelValueRow(doc, left, y, "Amount of (in words)", receiptAmountInWords(receipt.amount || 0));

// //   // By: payment mode checkboxes
// //   y += 50;
// //   doc.font("Helvetica").fontSize(9).fillColor(RCPT_GRAY).text("By", left, y);
// //   const modes = ["Cash", "Cheque", "Credit Card", "Bank Transfer", "Other"];
// //   const activeLabel = receiptType === "AdvanceAdjustment" ? null : (paymentMode === "Bank" ? "Bank Transfer" : paymentMode);
// //   let cx = left + 30;
// //   modes.forEach((m) => {
// //     const w = drawReceiptCheckbox(doc, cx, y - 1, m, m === activeLabel);
// //     cx += w + 22;
// //   });

// //   doc.font("Helvetica").fontSize(9).fillColor(RCPT_GRAY).text("Bank", pageWidth - 140, y);
// //   receiptDottedLine(doc, pageWidth - 105, y + 13, pageWidth - 50);

// //   // For the purpose of
// //   y += 45;
// //   receiptLabelValueRow(doc, left, y, "For the purpose of", resolveReceiptPurpose(receiptType, allocations));

// //   // Amount box
// //   y += 65;
// //   doc.font("Helvetica-Bold").fontSize(11).fillColor(RCPT_NAVY).text("AED", left, y + 17);
// //   doc.rect(left + 45, y, 220, 46).lineWidth(1).strokeColor(RCPT_LINE).stroke();
// //   doc.font("Helvetica-Bold").fontSize(20).fillColor(RCPT_NAVY)
// //     .text(Number(receipt.amount || 0).toFixed(2), left + 55, y + 12);

// //   if (receiptType === "Advance" && receipt.remainingAdvance !== undefined) {
// //     doc.font("Helvetica").fontSize(8).fillColor(RCPT_GRAY)
// //       .text(`Remaining unadjusted advance: AED ${Number(receipt.remainingAdvance).toFixed(2)}`, left + 45, y + 55);
// //   }

// //   // Signature row — SINGLE block only: "Received By" with dynamic role e-sign
// //   const sigY = y + 130;
// //   const sigWidth = 200;
// //   const sigX = pageWidth - 260;

// //   if (esignBuffer) {
// //     try {
// //       doc.image(esignBuffer, sigX + 25, sigY - 50, { fit: [150, 44], align: "center" });
// //     } catch {
// //       // unreadable/corrupt image buffer — silently skip, signature line still renders
// //     }
// //   }
// //   doc.moveTo(sigX, sigY).lineTo(sigX + sigWidth, sigY).strokeColor("#8a93a6").lineWidth(1).stroke();
// //   doc.font("Helvetica").fontSize(9).fillColor(RCPT_GRAY)
// //     .text("Received By", sigX, sigY + 8, { width: sigWidth, align: "center" });
// //   if (createdBy?.name) {
// //     doc.font("Helvetica").fontSize(8).fillColor(RCPT_NAVY)
// //       .text(createdBy.name, sigX, sigY + 21, { width: sigWidth, align: "center" });
// //   }

// //   drawReceiptSideRibbon(doc);
// //   drawReceiptFooterCorner(doc);

// //   doc.end();

// //   await new Promise((resolve, reject) => {
// //     stream.on("finish", resolve);
// //     stream.on("error", reject);
// //   });

// //   return relativePath;
// // };

// // export default generateReceiptPdf;





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
  paymentTerms = '',
  warrantyTerms = '',
  approved = false,
  approvedBy = '',
  approvedAt = null,
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
      if (Number(discount || 0) > 0) totalLine('Discount (Figure)', discount);
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
          .text(`Delivery Time  : ${deliveryTime}`, left, y + 14 * scale, { width: contentW });
        y += 34 * scale;
        if (paymentTerms) { doc.text(`Payment Terms: ${paymentTerms}`, left, y, { width: contentW }); y += 20 * scale; }
        if (warrantyTerms) {
          doc.font('Helvetica-Bold').text('Warranty Terms', left, y, { width: contentW });
          y += 14 * scale;
          doc.font('Helvetica').text(String(warrantyTerms), left, y, { width: contentW });
          y += Math.max(22 * scale, doc.heightOfString(String(warrantyTerms), { width: contentW }) + 8 * scale);
        }
      } else if (paymentTerms) {
        doc.font('Helvetica-Bold').fontSize(fsSmall).text('Payment Terms', left, y, { width: contentW });
        y += 14 * scale;
        doc.font('Helvetica').text(String(paymentTerms), left, y, { width: contentW });
        y += Math.max(22 * scale, doc.heightOfString(String(paymentTerms), { width: contentW }) + 8 * scale);
      }

      const sigY = Math.min(y + 4 * scale, dim.h - 125 * scale);
      doc.font('Helvetica-BoldOblique').fontSize(compact ? 6 : 8)
        .text('For GIIAN IMPEX GENERAL TRADING L.L.C', left, sigY, { width: contentW, align:'right' });
      if (approved) {
        const signaturePath = process.env.COMPANY_SIGNATURE_PATH || path.join('assets','company','signature.png');
        const stampPath = process.env.COMPANY_STAMP_PATH || path.join('assets','company','stamp.png');
        const approvalAssetsEnabled = String(process.env.COMPANY_APPROVAL_ASSETS_ENABLED || 'false').toLowerCase() === 'true';
        const baseX = right - 185 * scale;
        if (approvalAssetsEnabled) {
          try { if (fs.existsSync(signaturePath)) doc.image(signaturePath, baseX + 70*scale, sigY + 12*scale, { fit:[92*scale,42*scale] }); } catch {}
          try { if (fs.existsSync(stampPath)) doc.image(stampPath, baseX, sigY + 10*scale, { fit:[65*scale,65*scale] }); } catch {}
        }
        doc.font('Helvetica').fontSize(compact ? 5.2 : 6.8).text(`Approved${approvedBy ? ` by ${approvedBy}` : ''}${approvedAt ? ` · ${new Date(approvedAt).toLocaleDateString('en-GB')}` : ''}`, baseX, sigY + 72*scale, { width:185*scale, align:'right' });
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

  // Dynamic staff e-signature: prefer the role's esignUrl, fall back to a
  // top-level esignUrl on the user document if the backend populates it
  // that way instead. fetchImage() already swallows network/file errors
  // and resolves to null, so a missing or broken image never throws here.
  const esignUrl = createdBy?.role?.esignUrl || createdBy?.esignUrl || '';
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
      doc.save().fillColor(NAVY).moveTo(0,0).lineTo(238,0).lineTo(190,92).lineTo(0,92).closePath().fill().restore();
      doc.save().fillColor(GOLD).moveTo(184,0).lineTo(322,0).lineTo(294,34).lineTo(168,34).closePath().fill().restore();
      doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(18).text('GIIAN', 34, 27);
      doc.font('Helvetica').fontSize(8).text('BUSINESS SUITE', 34, 51, { characterSpacing: 1.1 });

      doc.fillColor(NAVY).font('Helvetica-Bold').fontSize(29).text('RECEIPT', 320, 31, { width: 200, align: 'center' });

      const contact = [companyName, companyAddress, companyEmail, website, companyPhone].filter(Boolean);
      doc.font('Helvetica').fontSize(7.5).fillColor(TEXT);
      contact.forEach((line, idx) => doc.text(line, 548, 18 + idx*13, { width: 245, align:'right' }));

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
      doc.fillColor(TEXT).font('Helvetica').fontSize(9).text('No.',28,y).font('Helvetica-Bold').text(receiptNo,63,y); dottedLine(doc,63,y+13,255);
      doc.font('Helvetica').text('Date',585,y).font('Helvetica-Bold').text(dateText,625,y); dottedLine(doc,625,y+13,760);

      y+=48; doc.font('Helvetica').text('Received with thanks from',28,y).font('Helvetica-Bold').text(customerName,175,y,{width:570}); dottedLine(doc,175,y+13,760);
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