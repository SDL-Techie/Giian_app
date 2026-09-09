import api, { resolveApiFileUrl } from './api';
import { ApiResponse } from '../types/api.types';
import {
  Receipt,
  CreateAdvanceReceiptPayload,
  CreateCollectionReceiptPayload,
  CreateAdvanceAdjustmentPayload,
} from '../types/receipt.types';
import { Invoice } from '../types/invoice.types';

export const receiptService = {
  getAllReceipts: async (type?: string, customerId?: string): Promise<Receipt[]> => {
    const params: Record<string, string> = {};
    if (customerId) params.customerId = customerId;
    if (type) params.type = type;
    const res = await api.get<ApiResponse<Receipt[]>>('/receipts', { params });
    return (res.data.data || []).map((r:any) => ({ ...r, pdfUrl: resolveApiFileUrl(r.pdfUrl) }));
  },

  getReceiptById: async (id: string): Promise<Receipt> => {
    const res = await api.get<ApiResponse<Receipt>>(`/receipts/${id}`);
    const r:any = res.data.data!; return { ...r, pdfUrl: resolveApiFileUrl(r.pdfUrl) };
  },

  getPendingInvoices: async (customerId: string): Promise<Invoice[]> => {
    const res = await api.get<ApiResponse<Invoice[]>>(`/receipts/pending-invoices/${customerId}`);
    return res.data.data || [];
  },

  createAdvanceReceipt: async (payload: CreateAdvanceReceiptPayload): Promise<Receipt> => {
    const res = await api.post<ApiResponse<Receipt>>('/receipts/advance', payload);
    const r:any = res.data.data!; return { ...r, pdfUrl: resolveApiFileUrl(r.pdfUrl) };
  },

  createCollectionReceipt: async (payload: CreateCollectionReceiptPayload): Promise<Receipt> => {
    const res = await api.post<ApiResponse<Receipt>>('/receipts/collection', payload);
    const r:any = res.data.data!; return { ...r, pdfUrl: resolveApiFileUrl(r.pdfUrl) };
  },

  getAdvanceBalance: async (customerId: string): Promise<{ advanceReceipts: Receipt[]; totalAdvance: number }> => {
    const res = await api.get<ApiResponse<{ advanceReceipts: Receipt[]; totalAdvance: number }>>(
      `/receipts/advance-balance/${customerId}`
    );
    return res.data.data || { advanceReceipts: [], totalAdvance: 0 };
  },

  createAdvanceAdjustment: async (payload: CreateAdvanceAdjustmentPayload): Promise<Receipt> => {
    const res = await api.post<ApiResponse<Receipt>>('/receipts/advance-adjustment', payload);
    const r:any = res.data.data!; return { ...r, pdfUrl: resolveApiFileUrl(r.pdfUrl) };
  },


};

export default receiptService;
