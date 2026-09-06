import api from './api';
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
    return res.data.data || [];
  },

  getReceiptById: async (id: string): Promise<Receipt> => {
    const res = await api.get<ApiResponse<Receipt>>(`/receipts/${id}`);
    return res.data.data!;
  },

  getPendingInvoices: async (customerId: string): Promise<Invoice[]> => {
    const res = await api.get<ApiResponse<Invoice[]>>(`/receipts/pending-invoices/${customerId}`);
    return res.data.data || [];
  },

  createAdvanceReceipt: async (payload: CreateAdvanceReceiptPayload): Promise<Receipt> => {
    const res = await api.post<ApiResponse<Receipt>>('/receipts/advance', payload);
    return res.data.data!;
  },

  createCollectionReceipt: async (payload: CreateCollectionReceiptPayload): Promise<Receipt> => {
    const res = await api.post<ApiResponse<Receipt>>('/receipts/collection', payload);
    return res.data.data!;
  },

  getAdvanceBalance: async (customerId: string): Promise<{ advanceReceipts: Receipt[]; totalAdvance: number }> => {
    const res = await api.get<ApiResponse<{ advanceReceipts: Receipt[]; totalAdvance: number }>>(
      `/receipts/advance-balance/${customerId}`
    );
    return res.data.data || { advanceReceipts: [], totalAdvance: 0 };
  },

  createAdvanceAdjustment: async (payload: CreateAdvanceAdjustmentPayload): Promise<Receipt> => {
    const res = await api.post<ApiResponse<Receipt>>('/receipts/advance-adjustment', payload);
    return res.data.data!;
  },


};

export default receiptService;
