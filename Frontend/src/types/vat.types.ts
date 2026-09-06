import { Purchase } from './purchase.types';
import { Invoice } from './invoice.types';

export interface VatPaidReportData {
  purchases: Purchase[];
  totalVatPaid: number;
}
export type VatPaidReportResponse = VatPaidReportData;

export interface VatCollectedReportData {
  invoices: Invoice[];
  totalVatCollected: number;
}
export type VatCollectedReportResponse = VatCollectedReportData;
