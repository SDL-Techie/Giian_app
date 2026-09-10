// import api, { resolveApiFileUrl } from './api';
// import { ApiResponse } from '../types/api.types';
// import { Purchase, CreatePurchasePayload } from '../types/purchase.types';

// export const purchaseService = {
//   getAllPurchases: async (from?: string, to?: string, vendorName?: string): Promise<Purchase[]> => {
//     const params: Record<string, string> = {};
//     if (from) params.from = from;
//     if (to) params.to = to;
//     if (vendorName) params.vendorName = vendorName;
//     const res = await api.get<ApiResponse<Purchase[]>>('/purchases', { params });
//     return (res.data.data || []).map((p:any)=>({...p,invoiceFileUrl:resolveApiFileUrl(p.invoiceFileUrl),invoiceFiles:(p.invoiceFiles||[]).map((d:any)=>({...d,url:resolveApiFileUrl(d.url)}))}));
//   },

//   getPurchaseById: async (id: string): Promise<Purchase> => {
//     const res = await api.get<ApiResponse<Purchase>>(`/purchases/${id}`);
//     return res.data.data!;
//   },

//   createPurchase: async (payload: CreatePurchasePayload): Promise<Purchase> => {
//     const formData = new FormData();
//     formData.append('dateOfPurchase', payload.dateOfPurchase);
//     formData.append('vendorName', payload.vendorName);
//     formData.append('invoiceNumber', payload.invoiceNumber);
//     formData.append('items', JSON.stringify(payload.items));
//     if (payload.vatPercent !== undefined) {
//       formData.append('vatPercent', String(payload.vatPercent));
//     }
//     payload.invoiceFiles?.forEach((file) => formData.append('invoiceFiles', file));

//     const res = await api.post<ApiResponse<Purchase>>('/purchases', formData);
//     return res.data.data!;
//   },

//   uploadPurchaseInvoice: async (id: string, files: File[]): Promise<Purchase> => {
//     const formData = new FormData();
//     files.forEach((file) => formData.append('invoiceFiles', file));
//     const res = await api.put<ApiResponse<Purchase>>(`/purchases/${id}/upload-invoice`, formData);
//     return res.data.data!;
//   },
// };

// const downloadPurchaseDocument = async (fileUrl: string): Promise<Blob> => {
//   // If `fileUrl` is a relative API path (e.g. "/purchases/507.../invoice/abc.pdf"),
//   // this works as-is because `api` already has the right baseURL + auth headers.
//   const response = await api.get(fileUrl, {
//     responseType: 'blob',
//   });
//   return response.data;
// };


 

// export default purchaseService;



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
    return (res.data.data || []).map((p: any) => ({
      ...p,
      invoiceFileUrl: resolveApiFileUrl(p.invoiceFileUrl),
      invoiceFiles: (p.invoiceFiles || []).map((d: any) => ({ ...d, url: resolveApiFileUrl(d.url) })),
    }));
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

  // ---------------------------------------------------------------------
  // Downloads a purchase document (invoice file) as a Blob using the
  // shared `api` axios instance, so the auth token/interceptor that's
  // already configured on `api` is attached automatically. This avoids
  // the "Access Denied. Login Required" error you get from a plain
  // <a href={url} download> tag, which bypasses that auth header
  // entirely because the browser makes a fresh, unauthenticated request.
  //
  // `fileUrl` here is expected to be the already-resolved absolute URL
  // (i.e. what resolveApiFileUrl produced in getAllPurchases above, e.g.
  // p.invoiceFileUrl or doc.url). axios treats an absolute URL as
  // overriding `api`'s baseURL, but it still runs through the same
  // request interceptors — so the auth header still gets attached.
  // ---------------------------------------------------------------------
  downloadPurchaseDocument: async (fileUrl: string): Promise<Blob> => {
    const res = await api.get(fileUrl, {
      responseType: 'blob',
    });
    return res.data;
  },
};

export default purchaseService;