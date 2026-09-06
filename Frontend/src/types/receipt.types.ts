import { Customer } from './customer.types';
import { Invoice } from './invoice.types';

export interface ReceiptAllocation {
  invoice: Invoice | { _id: string; invoiceNo: string; totalAmount?: number; balanceAmount?: number } | string;
  amount: number;
}

export interface Receipt {
  _id: string;
  receiptNo: string;
  type: 'Advance' | 'Collection' | 'AdvanceAdjustment';
  customer: Customer | { _id: string; companyName: string; contactPersonName?: string } | string;
  amount: number;
  paymentMode?: 'Cash' | 'Bank';
  allocations?: ReceiptAllocation[];
  remainingAdvance?: number;
  sourceAdvanceReceipt?: string | null;
  pdfUrl?: string;
  status: 'Active' | 'Cancelled';
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateAdvanceReceiptPayload {
  customer: string;
  amount: number;
  paymentMode: 'Cash' | 'Bank';
}

export interface CreateCollectionReceiptPayload {
  customer: string;
  paymentMode: 'Cash' | 'Bank';
  allocations: { invoice: string; amount: number }[];
}

export interface CreateAdvanceAdjustmentPayload {
  customer: string;
  allocations: { invoice: string; amount: number }[];
}
