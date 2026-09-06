# API Reference

Base URL: `/api/v1`

All responses follow: `{ "success": boolean, "message": string, "data"?: any }`

Auth: send `Authorization: Bearer <token>` (or rely on the `token` cookie
set at login). Endpoints marked **Admin** require `isAdmin: true`.
Endpoints marked **Permission: module.action** require either admin, or a
Role whose `permissions.<module>.<action>` is `true`.

---

## Auth (`/auth`)

| Method | Endpoint | Auth | Body | Notes |
|---|---|---|---|---|
| POST | `/auth/register` | Public | — | Disabled (403). Initial admin is bootstrapped; admins create staff via `/users`. |
| POST | `/auth/login` | Public | `{ email, password }` | Returns JWT + user |
| POST | `/auth/logout` | Token | — | Clears the cookie |
| GET | `/auth/me` | Token | — | Current user's profile |
| PUT | `/auth/me` | Token | `{ name?, phoneno?, email? }` | Update own profile |
| PUT | `/auth/change-password` | Token | `{ currentPassword, newPassword }` | |

## Users (`/users`) — Admin only

| Method | Endpoint | Body |
|---|---|---|
| GET | `/users` | — list all users |
| POST | `/users` | `{ name, email, password, phoneno?, roleId? }` |
| GET | `/users/:id` | — |
| PUT | `/users/:id` | `{ name?, phoneno?, email?, roleId? }` |
| PUT | `/users/:id/reset-password` | `{ newPassword }` |
| PUT | `/users/:id/status` | `{ status: "Active" \| "Inactive" }` |

## Roles (`/roles`) — Admin only

| Method | Endpoint | Body |
|---|---|---|
| GET | `/roles` | — |
| POST | `/roles` | `{ name, permissions: { customers:{create,view,modify}, products:{create,modify,report,view}, purchase:{create,view,modify}, sales:{create,view,modify,report}, quotations:{create,view,modify,report}, receipts:{create,view,modify}, vat:{report} } }` |
| GET | `/roles/:id` | — |
| PUT | `/roles/:id` | `{ name?, permissions?, status? }` |
| DELETE | `/roles/:id` | — |

## Customers (`/customers`) — Permission: `customers.*`

| Method | Endpoint | Permission | Body |
|---|---|---|---|
| GET | `/customers?search=&status=` | view | — |
| POST | `/customers` (multipart, field `companyDocuments`, up to 10 files) | create | `{ companyName, telephoneNumber?, email?, mobileNumber?, contactPersonName?, companyAddress?, creditLimit? }` |
| GET | `/customers/:id` | view | — |
| PUT | `/customers/:id` (multipart) | modify | same fields |
| PUT | `/customers/:id/status` | modify | `{ status: 'Active'|'Inactive' }` |
| DELETE | `/customers/:id` | modify | soft-deactivates |
| GET | `/customers/reports/quotations?customerId=&from=&to=` | view | Customer-wise quotation report |
| GET | `/customers/reports/sales?customerId=&from=&to=` | view | Customer-wise sales report |

## Categories (`/categories`) — Permission: `products.*`

| Method | Endpoint | Permission | Body |
|---|---|---|---|
| GET | `/categories` | view | top-level category list |
| POST | `/categories` | create | `{ name }` |
| PUT | `/categories/:id` | modify | `{ name?, status? }` |
| DELETE | `/categories/:id` | modify | — |

## Products (`/products`) — Permission: `products.*`

| Method | Endpoint | Permission | Body |
|---|---|---|---|
| GET | `/products?search=&category=&status=` | view | — |
| POST | `/products` (multipart, field `productImage`) | create | `{ name, itemCode, unitOfMeasure?, category }` |
| GET | `/products/:id` | view | — |
| PUT | `/products/:id` (multipart) | modify | same fields |
| PUT | `/products/:id/status` | modify | `{ status: 'Active'|'Inactive' }` |
| DELETE | `/products/:id` | modify | soft-deactivates |
| GET | `/products/reports/list` | report | full product list report |

## Purchases (`/purchases`) — Permission: `purchase.*`

| Method | Endpoint | Permission | Body |
|---|---|---|---|
| GET | `/purchases?from=&to=&vendorName=` | view | period report / listing |
| POST | `/purchases` (multipart, field `invoiceFile`) | create | `{ dateOfPurchase, vendorName, invoiceNumber, items:[{product,qty,cost}], vatPercent? }` |
| GET | `/purchases/:id` | view | — |
| PUT | `/purchases/:id/upload-invoice` (multipart, field `invoiceFile`) | modify | attach/replace scanned invoice |

## Quotations (`/quotations`) — Permission: `quotations.*`

| Method | Endpoint | Permission | Body |
|---|---|---|---|
| GET | `/quotations?status=&customerId=` | view | — |
| POST | `/quotations` | create | `{ customer, dateOfQuotation, attn?, items:[{product,qty,price}], discount?, vatPercent?, salesPerson? }` — `quotationNo` auto-generated, PDF auto-generated |
| GET | `/quotations/:id` | view | — |
| PUT | `/quotations/:id/cancel` | modify | — |
| GET | `/quotations/reports/customer-wise?customerId=&from=&to=` | report | — |
| GET | `/quotations/reports/salesman-wise?salesPersonId=&from=&to=` | report | — |

## Sales / Invoices (`/invoices`) — Permission: `sales.*`

| Method | Endpoint | Permission | Body |
|---|---|---|---|
| GET | `/invoices?status=&customerId=` | view | — |
| POST | `/invoices` | create | `{ customer, invoiceDate, referenceNo?, items:[{product,qty,price}], discount?, vatPercent?, salesPerson? }` — "without quotation" flow |
| POST | `/invoices/from-quotation/:quotationId` | create | — "from quotation" flow, auto-generates the invoice |
| GET | `/invoices/:id` | view | — |
| PUT | `/invoices/:id/cancel` | modify | `{ reason? }` — blocked once any receipt has been applied |
| GET | `/invoices/reports/periodic?from=&to=` | report | totals + list |
| GET | `/invoices/reports/customer-wise?customerId=&from=&to=` | report | — |
| GET | `/invoices/reports/salesman-wise?salesPersonId=&from=&to=` | report | — |
| GET | `/invoices/reports/product-wise?productId=&from=&to=` | report | — |

## Receipts (`/receipts`) — Permission: `receipts.*`

| Method | Endpoint | Permission | Body |
|---|---|---|---|
| POST | `/receipts/advance` | create | `{ customer, amount, paymentMode: "Cash"\|"Bank" }` |
| GET | `/receipts/pending-invoices/:customerId` | view | pending invoices to collect against |
| POST | `/receipts/collection` | create | `{ customer, paymentMode, allocations:[{invoice, amount}] }` (partial or full) |
| GET | `/receipts/advance-balance/:customerId` | view | available advance to adjust |
| POST | `/receipts/advance-adjustment` | create | `{ customer, allocations:[{invoice, amount}] }` — draws down existing Advance receipts (FIFO) and applies to invoices |
| GET | `/receipts?customerId=&type=` | view | — |
| GET | `/receipts/:id` | view | — |

## VAT (`/vat`) — Permission: `vat.report`

| Method | Endpoint | Notes |
|---|---|---|
| GET | `/vat/paid?from=&to=` | VAT paid on Purchases |
| GET | `/vat/collected?from=&to=` | VAT collected on Sales |

---

## Error Responses

```json
{ "success": false, "message": "Human readable message" }
```

| Status | Meaning |
|---|---|
| 400 | Validation error / malformed request |
| 401 | Missing/invalid/expired token |
| 403 | Authenticated but lacking permission |
| 404 | Resource not found |
| 409 | Conflict (duplicate email / role name / item code) |
| 500 | Unexpected server error (logged server-side, never leaks a stack trace) |

## Production additions

### Audit logs (`/audit-logs`) — Admin only

| Method | Endpoint | Notes |
|---|---|---|
| GET | `/audit-logs?page=1&limit=50&method=&actor=&from=&to=` | Successful mutation audit history |
