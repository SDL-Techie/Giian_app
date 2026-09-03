# Sales Management Backend

Backend API for a Sales / Purchase / Quotation / Invoicing / Receipts / VAT
management system, built to the requirements captured in the product
wireframes (Main Menu, User Management, Customers, Products, Purchase,
Quotation, Sales, Receipts, VAT).

## Tech Stack

- Node.js
- Express.js 5
- MongoDB
- Mongoose
- JWT (jsonwebtoken) authentication
- bcryptjs password hashing
- Multer (file uploads: customer documents, product images, purchase invoices)
- PDFKit (generates PDF copies of Quotations, Invoices and Receipts)
- Helmet + express-rate-limit (security headers / brute-force throttling)

## Project Structure

```
Backend/
├── config/          # Database connection
├── controller/       # Route handlers / business logic
├── helper/            # JWT issuing + auth/RBAC middleware
├── middleware/        # Multer upload config, centralized error handler
├── model/              # Mongoose schemas
├── route/               # Express routers
├── utils/                # Totals calculator, validators, PDF generator
├── uploads/               # Uploaded files & generated PDFs (created at runtime)
├── app.js
├── server.js
├── package.json
└── .env.example
```

## Installation

```bash
npm install
```

## Environment Variables

Copy `.env.example` to `.env` and fill in real values:

| Variable      | Description                                              |
|---------------|------------------------------------------------------------|
| `PORT`        | Port the API listens on (default 4000)                     |
| `NODE_ENV`    | `development` or `production`                              |
| `DB_URL`      | MongoDB connection string                                   |
| `JWT_SECRET`  | Secret used to sign JWTs — **never commit a real value**    |
| `JWT_EXPIRE`  | JWT lifetime, e.g. `7d`                                     |
| `EXPIRE_COOKIE` | Days until the auth cookie expires                        |
| `CLIENT_URL`  | Comma-separated list of allowed CORS origins                |

## Database

Start MongoDB locally (or point `DB_URL` at Atlas / any managed instance):

```bash
mongod --dbpath /path/to/data
```

The app will exit with a clear error message if it cannot reach MongoDB
within 8 seconds of startup, instead of hanging silently.

## Running

```bash
npm start      # node server.js
npm run dev    # nodemon server.js (auto-restart on file changes)
```

On success you'll see:

```
db connected in your <host>
✅ Server is running on http://localhost:4000
```

## Authentication

- The **first** user ever registered (`POST /api/v1/auth/register`)
  automatically becomes the super admin (`isAdmin: true`).
- All subsequent staff accounts should be created by an admin via
  `POST /api/v1/users` and assigned a **Role** (see User Management below).
- Login returns a JWT both as a JSON field (`token`) and as an httpOnly
  cookie. Send it back either as `Authorization: Bearer <token>` or let the
  cookie ride automatically.

## User Management & Roles (Admin only)

Matches the wireframe's "User Management" screen:

- `POST /api/v1/roles` — create a role with a permission matrix, e.g.:

```json
{
  "name": "Sales Executive",
  "permissions": {
    "customers": { "create": true, "view": true, "modify": false },
    "products": { "view": true, "report": true },
    "purchase": { "view": false },
    "sales": { "create": true, "view": true },
    "quotations": { "create": true, "view": true },
    "receipts": { "create": true, "view": true }
  }
}
```

- `POST /api/v1/users` — create a staff user and assign a `roleId`.
- `PUT /api/v1/users/:id/reset-password` — admin resets a user's password.
- `PUT /api/v1/users/:id/status` — activate / deactivate a user.

Every business-data route checks the caller's role permissions (or admin
status) via the `authorize(module, action)` middleware — see `API.md` for
the exact permission required per endpoint.

## Data Isolation

All create/update endpoints stamp records with `createdBy` from the
authenticated JWT identity (`req.user.id`) — never from client-supplied
IDs — and every protected read/write requires a valid JWT plus the
relevant module permission.

## API

See [`API.md`](./API.md) for the full endpoint reference (method, auth,
required permission, request body, response shape).

## File Uploads & Generated PDFs

Uploaded documents/images and generated Quotation/Invoice/Receipt PDFs are
written to `/uploads` and served statically at `/uploads/<filename>`. In
production, point this at persistent/object storage instead of local disk.

## Testing

1. **Auth**: register the first user (becomes admin), login, call
   `GET /api/v1/auth/me` with the token, then try it with no token /
   an invalid token to confirm you get `401`.
2. **RBAC**: create a Role with limited permissions, create a user with
   that role, and confirm restricted endpoints return `403`.
3. **Data isolation**: as two different non-admin users, confirm neither
   can read/modify records tied to the other unless their role grants
   `view`/`modify` on that module (all business data is shared within the
   organization by design — access is controlled by **role permission**,
   not per-user ownership, matching the PDF's single-company RBAC model).
4. **Core flows**: create a Customer → Product → Category → Purchase →
   Quotation → convert Quotation to Invoice → create a Collection Receipt
   against that Invoice → confirm the Invoice's `balanceAmount` and
   `paymentStatus` update → pull the VAT Paid / VAT Collected reports.

## Notes

- No fake/mocked integrations are included. Every implemented feature is
  fully functional. If your frontend later needs an external integration
  (email delivery, payment gateway, etc.) not described in the current
  requirements, add the corresponding `.env` variables and service module
  following the same pattern as `utils/pdfGenerator.js`.
