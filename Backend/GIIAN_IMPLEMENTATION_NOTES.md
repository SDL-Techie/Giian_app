# NOTICE — SUPERSEDED BY DUBAI FINAL BUILD

This historical implementation note contains earlier Kuwait/Qwait requirements. The current production build is Dubai-only. See `../GIIAN_DUBAI_FINAL_UPDATE_NOTES.md` for the active behavior.

# GIIAN CRM – fixes implemented

## Customer
- Added explicit Active/Inactive status endpoint and frontend buttons so an inactive customer can be reactivated without opening Edit.
- Customer documentation now supports multiple uploads during create/update (`companyDocuments`, maximum 10 files).
- Customer PDFs are optimized with Ghostscript before MongoDB GridFS storage; other supported customer documents use gzip. Files are served through authenticated `/api/v1/files/:id`.

## Product
- Removed subcategory/parent-category handling from backend, web and React Native UI/types/services. Only Category remains.
- Added explicit product Active/Inactive status endpoint and Activate button.
- Product image upload uses Cloudinary from the backend. Cloudinary applies `c_limit,w_1600,h_1600,q_auto:good` before storage.

Required backend environment variables:

```env
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

## Purchase
- Added multiple purchase invoice/document upload (`invoiceFiles`, maximum 10 files).
- PDF files use Multer memory upload -> Ghostscript optimization -> GridFS -> MongoDB; other supported documents use gzip -> GridFS.

## Quotation
- Every new quotation creates two PDFs:
  - Dubai: GIIAN letterhead, AED, VAT included according to quotation VAT.
  - Kuwait: Qwait Metal letterhead, KWD, VAT omitted.
- Added `pdfDubaiUrl` and `pdfKuwaitUrl` while keeping `pdfUrl` for backward compatibility.
- Web/RN quotation PDF action lets the user choose Dubai or Kuwait.
- Quotation detail action fetches the full quotation before displaying.

## Sales / Invoice
- Added `/api/v1/invoices/open-quotations` protected by `sales.create`, fixing invoice-from-quotation fetching for sales users who may not have quotation-view permission.
- Invoice detail API deeply populates the source quotation/customer/products/salesperson.
- Every invoice creates both Dubai/GIIAN and Kuwait/Qwait PDF variants and download UI asks which one to open.
- Dubai invoice uses AED and VAT; Kuwait invoice uses KWD and no VAT.
- Sales report endpoints remain wired and cancelled invoices are excluded where applicable.
- Invoice screens use AED instead of the dollar prefix.

## Upload architecture

```text
React / React Native
        ↓
Select multiple files
        ↓
Node.js + Express
        ↓
Multer (memory)
        ↓
PDF: Ghostscript optimization -> GridFS -> MongoDB
Other docs: gzip -> GridFS -> MongoDB
Images: Cloudinary optimized upload
```

## Verification performed
- `node --check` passed for all modified backend JavaScript files.
- TypeScript parser run found no new TS syntax/parser errors in the web code; dependency/type resolution cannot fully run in this sandbox because `node_modules` was not included in the uploaded projects.
- React Native full typecheck likewise requires the project's Expo dependencies to be installed locally.

## Install / run reminder
Run the normal dependency install in each project before building (`npm install` / existing lockfile workflow), configure MongoDB and the three Cloudinary environment variables, then start the backend, web and mobile projects using their existing scripts.


## Final balance fix – React Native existing purchase multiple upload
- Updated `app/src/screens/purchases/PurchasesListScreen.tsx` to use the multi-select document picker for existing purchases.
- Existing purchase **Upload Invoice** now accepts multiple PDF/image files in one selection.
- Up to 10 files are appended under the `invoiceFiles` multipart field, matching the backend Multer `array(..., 10)` contract.
- Success feedback reports how many files were uploaded.
