import api, { resolveApiFileUrl } from './api';
import { ApiResponse } from '../types/api.types';
import { Purchase, CreatePurchasePayload } from '../types/purchase.types';

export const purchaseService = {
  getAllPurchases: async (from?: string, to?: string, vendorName?: string): Promise<Purchase[]> => {
    const params: Record<string, string> = {};
    if (from) params.from = from;
    if (to) params.to = to;
    if (vendorName) params.vendorName = vendorName;
    const res = await api.get<ApiResponse<Purchase[]>>('/purchases', { params });
    return (res.data.data || []).map((p:any)=>({...p,invoiceFileUrl:resolveApiFileUrl(p.invoiceFileUrl),invoiceFiles:(p.invoiceFiles||[]).map((d:any)=>({...d,url:resolveApiFileUrl(d.url)}))}));
  },

  getPurchaseById: async (id: string): Promise<Purchase> => {
    const res = await api.get<ApiResponse<Purchase>>(`/purchases/${id}`);
    return res.data.data!;
  },

  createPurchase: async (payload: CreatePurchasePayload): Promise<Purchase> => {
    const formData = new FormData();
    formData.append('dateOfPurchase', payload.dateOfPurchase);
    formData.append('vendorName', payload.vendorName);
    formData.append('invoiceNumber', payload.invoiceNumber);
    formData.append('items', JSON.stringify(payload.items));
    if (payload.vatPercent !== undefined) {
      formData.append('vatPercent', String(payload.vatPercent));
    }
    payload.invoiceFiles?.forEach((file) => formData.append('invoiceFiles', file));

    const res = await api.post<ApiResponse<Purchase>>('/purchases', formData);
    return res.data.data!;
  },

  uploadPurchaseInvoice: async (id: string, files: File[]): Promise<Purchase> => {
    const formData = new FormData();
    files.forEach((file) => formData.append('invoiceFiles', file));
    const res = await api.put<ApiResponse<Purchase>>(`/purchases/${id}/upload-invoice`, formData);
    return res.data.data!;
  },
};

export default purchaseService;
