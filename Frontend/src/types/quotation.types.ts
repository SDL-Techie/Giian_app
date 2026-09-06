import { Customer } from './customer.types';
import { Product } from './product.types';
import { User } from './user.types';

export interface QuotationItem {
  product: Product | { _id: string; name: string; itemCode?: string } | string;
  qty: number;
  price: number;
  totalPrice: number;
}

export interface Quotation {
  _id: string;
  quotationNo: string;
  customer: Customer | { _id: string; companyName: string; contactPersonName?: string };
  dateOfQuotation: string;
  attn?: string;
  items: QuotationItem[];
  discount: number;
  subTotal: number;
  vatPercent: number;
  vatAmount: number;
  totalAmount: number;
  salesPerson?: User | { _id: string; name: string };
  status: 'Open' | 'Converted' | 'Cancelled';
  pdfUrl?: string;
  pdfDubaiUrl?: string;
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateQuotationPayload {
  customer: string;
  dateOfQuotation: string;
  attn?: string;
  items: { product: string; qty: number; price: number }[];
  discount?: number;
  vatPercent?: number;
  salesPerson?: string;
}
