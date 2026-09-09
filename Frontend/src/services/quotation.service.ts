// import api, { resolveApiFileUrl } from './api';
// import { ApiResponse } from '../types/api.types';
// import { Quotation, CreateQuotationPayload } from '../types/quotation.types';

// export const quotationService = {
//   getAllQuotations: async (status?: string, customerId?: string): Promise<Quotation[]> => {
//     const params: Record<string, string> = {};
//     if (status) params.status = status;
//     if (customerId) params.customerId = customerId;
//     const res = await api.get<ApiResponse<Quotation[]>>('/quotations', { params });
//     return (res.data.data || []).map((q:any) => ({...q, pdfUrl: resolveApiFileUrl(q.pdfUrl), pdfDubaiUrl: resolveApiFileUrl(q.pdfDubaiUrl)}));
//   },

//   getQuotationById: async (id: string): Promise<Quotation> => {
//     const res = await api.get<ApiResponse<Quotation>>(`/quotations/${id}`);
//     const q:any = res.data.data!; return {...q, pdfUrl: resolveApiFileUrl(q.pdfUrl), pdfDubaiUrl: resolveApiFileUrl(q.pdfDubaiUrl)};
//   },

//   createQuotation: async (payload: CreateQuotationPayload): Promise<Quotation> => {
//     const res = await api.post<ApiResponse<Quotation>>('/quotations', payload);
//     const q:any = res.data.data!; return {...q, pdfUrl: resolveApiFileUrl(q.pdfUrl), pdfDubaiUrl: resolveApiFileUrl(q.pdfDubaiUrl)};
//   },

//   generateQuotationPdf: async (id: string, size: 'A4' | 'A5'): Promise<string> => {
//     const res = await api.get<ApiResponse<{ url: string; pageSize: string }>>(`/quotations/${id}/pdf`, { params: { size } });
//     return resolveApiFileUrl(res.data.data?.url || '') || '';
//   },

//   cancelQuotation: async (id: string): Promise<Quotation> => {
//     const res = await api.put<ApiResponse<Quotation>>(`/quotations/${id}/cancel`);
//     return res.data.data!;
//   },

//   getCustomerWiseQuotationReport: async (customerId: string, from?: string, to?: string): Promise<Quotation[]> => {
//     const params: Record<string, string> = { customerId };
//     if (from) params.from = from;
//     if (to) params.to = to;
//     const res = await api.get<ApiResponse<Quotation[]>>('/quotations/reports/customer-wise', { params });
//     return res.data.data || [];
//   },

//   getSalesmanWiseQuotationReport: async (salesPersonId: string, from?: string, to?: string): Promise<Quotation[]> => {
//     const params: Record<string, string> = { salesPersonId };
//     if (from) params.from = from;
//     if (to) params.to = to;
//     const res = await api.get<ApiResponse<Quotation[]>>('/quotations/reports/salesman-wise', { params });
//     return res.data.data || [];
//   },
// };

// export default quotationService;



import api, { resolveApiFileUrl } from './api';
import { ApiResponse } from '../types/api.types';
import { Quotation, CreateQuotationPayload } from '../types/quotation.types';

export const quotationService = {
  getAllQuotations: async (status?: string, customerId?: string): Promise<Quotation[]> => {
    const params: Record<string, string> = {};
    if (status) params.status = status;
    if (customerId) params.customerId = customerId;
    const res = await api.get<ApiResponse<Quotation[]>>('/quotations', { params });
    return (res.data.data || []).map((q:any) => ({...q, pdfUrl: resolveApiFileUrl(q.pdfUrl), pdfDubaiUrl: resolveApiFileUrl(q.pdfDubaiUrl)}));
  },

  getQuotationById: async (id: string): Promise<Quotation> => {
    const res = await api.get<ApiResponse<Quotation>>(`/quotations/${id}`);
    const q:any = res.data.data!; return {...q, pdfUrl: resolveApiFileUrl(q.pdfUrl), pdfDubaiUrl: resolveApiFileUrl(q.pdfDubaiUrl)};
  },

  createQuotation: async (payload: CreateQuotationPayload): Promise<Quotation> => {
    const res = await api.post<ApiResponse<Quotation>>('/quotations', payload);
    const q:any = res.data.data!; return {...q, pdfUrl: resolveApiFileUrl(q.pdfUrl), pdfDubaiUrl: resolveApiFileUrl(q.pdfDubaiUrl)};
  },

  generateQuotationPdf: async (id: string, size: 'A4' | 'A5'): Promise<string> => {
    const res = await api.get<ApiResponse<{ url: string; pageSize: string }>>(`/quotations/${id}/pdf`, { params: { size } });
    return resolveApiFileUrl(res.data.data?.url || '') || '';
  },

  cancelQuotation: async (id: string): Promise<Quotation> => {
    const res = await api.put<ApiResponse<Quotation>>(`/quotations/${id}/cancel`);
    return res.data.data!;
  },

  approveQuotation: async (id: string): Promise<Quotation> => {
    const res = await api.put<ApiResponse<Quotation>>(`/quotations/${id}/approve`);
    const q:any = res.data.data!; return {...q, pdfUrl: resolveApiFileUrl(q.pdfUrl), pdfDubaiUrl: resolveApiFileUrl(q.pdfDubaiUrl)};
  },

  getCustomerWiseQuotationReport: async (customerId: string, from?: string, to?: string): Promise<Quotation[]> => {
    const params: Record<string, string> = { customerId };
    if (from) params.from = from;
    if (to) params.to = to;
    const res = await api.get<ApiResponse<Quotation[]>>('/quotations/reports/customer-wise', { params });
    return res.data.data || [];
  },

  getSalesmanWiseQuotationReport: async (salesPersonId: string, from?: string, to?: string): Promise<Quotation[]> => {
    const params: Record<string, string> = { salesPersonId };
    if (from) params.from = from;
    if (to) params.to = to;
    const res = await api.get<ApiResponse<Quotation[]>>('/quotations/reports/salesman-wise', { params });
    return res.data.data || [];
  },
};

export default quotationService;