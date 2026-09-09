# Production hardening applied

This backend has been hardened for the supplied sales/CRM workflow.

## Authentication and user provisioning
- Public self-registration is disabled. `POST /api/v1/auth/register` returns 403.
- The first administrator is created by the bootstrap process using `BOOTSTRAP_ADMIN_*` environment variables.
- After an administrator exists, startup does not create another one.
- Staff users are created only by an authenticated admin through `POST /api/v1/users`.
- Bootstrap/admin-reset passwords force `mustChangePassword: true`.
- Strong password policy: minimum 10 characters with uppercase, lowercase, number and special character.
- bcrypt cost increased to 12.
- Inactive users and users assigned to inactive roles are blocked.

## Financial consistency
- Collection receipts and advance adjustments validate all invoice allocations before any update.
- Collection and advance-adjustment invoice updates, advance drawdown and receipt creation run in MongoDB transactions.
- Quotation-to-invoice conversion is transaction protected and atomically claims the quotation.
- `Invoice.quotation` has a partial unique index to prevent duplicate conversion at the database layer.
- Document numbers use atomic counters.
- In production, use MongoDB Atlas or a replica set so transactions are supported.

## Validation and data integrity
- VAT is restricted to 0-100%.
- Discounts cannot be negative or exceed subtotal.
- Quantity/price/cost values must be finite and valid.
- Active customers/products are required for new sales documents.
- Customer/product update fields are whitelisted.
- Product hierarchy uses Category only; no subcategory layer is exposed by the backend.
- Category/product/customer/role deletion behavior uses deactivation/soft-delete patterns.

## Security
- Production CORS requires configured `CLIENT_URL` origins.
- Helmet headers, request IDs, API rate limits and stricter login rate limiting are enabled.
- Uploads validate both extension and MIME type and have configurable size limits.
- Product uploads accept images only; data-transfer uploads accept Excel only.
- GridFS filenames are sanitized and invalid IDs are rejected safely.
- Production responses do not expose stack traces/internal 500 error details.
- `.env` is intentionally excluded from this package. Copy `.env.example` to `.env` locally and set real secrets through your deployment platform.

## Audit and operations
- Successful POST/PUT/PATCH/DELETE requests are written to `AuditLog` with sensitive fields redacted.
- Admin-only audit endpoint: `GET /api/v1/audit-logs`.
- Structured JSON application/error logging is included.
- Graceful SIGTERM/SIGINT shutdown is included.
- `npm run backup` wraps `mongodump` for self-managed MongoDB. On Atlas, enable automated backups/snapshots instead.

## Deployment checklist
1. Configure `NODE_ENV=production`, `DB_URL`, a 32+ character `JWT_SECRET`, `CLIENT_URL`, Cloudinary credentials and one-time `BOOTSTRAP_ADMIN_*` values.
2. Use MongoDB Atlas/replica set; do not run production financial operations on standalone MongoDB.
3. Deploy and confirm `/api/v1/health` returns 200.
4. Login with the bootstrap admin and immediately change the password.
5. Remove `BOOTSTRAP_ADMIN_PASSWORD` from deployment secrets after the admin exists and the password has been changed.
6. Create roles and staff users from the admin flow.
7. Enable database backups and production log retention/monitoring.

## PDF document compression
- Customer and purchase PDF uploads are optimized before GridFS storage using Ghostscript `pdfwrite`.
- `PDF_TARGET_KB` is a best-effort target (default `80`). Exact output size cannot be guaranteed because PDF content varies; the backend keeps the smallest valid result rather than corrupting or making the document unreadable.
- Install Ghostscript on the production host/container and set `PDF_COMPRESSOR_PATH` if the binary is not named `gs`.
- `PDF_COMPRESSION_REQUIRED=true` makes PDF uploads fail safely instead of storing an uncompressed PDF when the compressor is unavailable.

## Additional production hardening
- `/api/v1/health` is a liveness endpoint; `/api/v1/ready` returns 200 only when MongoDB is connected.
- Uploads are validated using extension + MIME + binary file signature before processing/storage.
- Ghostscript compression has a configurable hard timeout (`PDF_COMPRESSION_TIMEOUT_MS`, default 45000 ms). Also configure CPU/RAM limits at the Docker/hosting layer because portable Node.js code cannot enforce reliable per-process OS resource quotas.
- Run `npm audit --omit=dev` in CI/CD with network access and review relevant findings before each deployment.
- Excel imports are atomic MongoDB transactions: if any row fails validation/write, the whole import is rolled back. This requires a replica set/Atlas in production, consistent with the financial transaction requirement.


## Receipt PDFs and data transfer
- Receipts use a dedicated landscape customer-facing design and the web UI offers direct Preview / Download only (no A4/A5 selector).
- Configure COMPANY_NAME / COMPANY_ADDRESS / COMPANY_EMAIL / COMPANY_PHONE / COMPANY_WEBSITE for the receipt header.
- Excel exports populate business references with readable text such as customer/company name, category name, sales person, role name, invoice number and product item code/name instead of raw MongoDB ObjectIds where practical. Imports accept those readable reference values.
- Production financial imports and payment operations require MongoDB Atlas or a replica set. Development standalone MongoDB may use the explicitly enabled fallback only outside production.
