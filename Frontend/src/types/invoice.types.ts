import { Customer } from './customer.types';
import { Product } from './product.types';
import { Quotation } from './quotation.types';
import { User } from './user.types';

export interface InvoiceItem {
  product: Product | { _id: string; name: string; itemCode?: string } | string;
  qty: number;
  price: number;
  totalPrice: number;
}

export interface Invoice {
  _id: string;
  invoiceNo: string;
  customer: Customer | { _id: string; companyName: string; contactPersonName?: string; mobileNumber?: string; companyAddress?: string };
  invoiceDate: string;
  referenceNo?: string;
  paymentTerms?: string;
  quotation?: Quotation | string | null;
  items: InvoiceItem[];
  discount: number;
  subTotal: number;
  vatPercent: number;
  vatAmount: number;
  totalAmount: number;
  paidAmount: number;
  balanceAmount: number;
  salesPerson?: User | { _id: string; name: string };
  status: 'Active' | 'Cancelled';
  paymentStatus: 'Unpaid' | 'Partially Paid' | 'Paid';
  approvalStatus?: 'Pending' | 'Approved';
  approvedBy?: User | { _id: string; name: string } | string | null;
  approvedAt?: string;
  cancelledAt?: string;
  cancelledReason?: string;
  pdfUrl?: string;
  pdfDubaiUrl?: string;
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateInvoicePayload {
  customer: string;
  invoiceDate: string;
  referenceNo?: string;
  paymentTerms?: string;
  quotation?: string;
  items: { product: string; qty: number; price: number }[];
  discount?: number;
  vatPercent?: number;
  salesPerson?: string;
}
