import api, { resolveApiFileUrl } from './api';
import { ApiResponse } from '../types/api.types';
import { Invoice, CreateInvoicePayload } from '../types/invoice.types';

export const invoiceService = {
  getOpenQuotations: async (): Promise<any[]> => {
    const res = await api.get<ApiResponse<any[]>>('/invoices/open-quotations');
    return res.data.data || [];
  },
  getAllInvoices: async (status?: string, customerId?: string): Promise<Invoice[]> => {
    const params: Record<string, string> = {};
    if (status) params.status = status;
    if (customerId) params.customerId = customerId;
    const res = await api.get<ApiResponse<Invoice[]>>('/invoices', { params });
    return (res.data.data || []).map((i:any)=>({...i,pdfUrl:resolveApiFileUrl(i.pdfUrl),pdfDubaiUrl:resolveApiFileUrl(i.pdfDubaiUrl)}));
  },

  getInvoiceById: async (id: string): Promise<Invoice> => {
    const res = await api.get<ApiResponse<Invoice>>(`/invoices/${id}`);
    const i:any=res.data.data!; return {...i,pdfUrl:resolveApiFileUrl(i.pdfUrl),pdfDubaiUrl:resolveApiFileUrl(i.pdfDubaiUrl)};
  },

  createInvoice: async (payload: CreateInvoicePayload): Promise<Invoice> => {
    const res = await api.post<ApiResponse<Invoice>>('/invoices', payload);
    const i:any=res.data.data!; return {...i,pdfUrl:resolveApiFileUrl(i.pdfUrl),pdfDubaiUrl:resolveApiFileUrl(i.pdfDubaiUrl)};
  },

  createInvoiceFromQuotation: async (quotationId: string, paymentTerms?: string): Promise<Invoice> => {
    const res = await api.post<ApiResponse<Invoice>>(`/invoices/from-quotation/${quotationId}`, { paymentTerms: paymentTerms || '' });
    const i:any=res.data.data!; return {...i,pdfUrl:resolveApiFileUrl(i.pdfUrl),pdfDubaiUrl:resolveApiFileUrl(i.pdfDubaiUrl)};
  },

  generateInvoicePdf: async (id: string, size: 'A4' | 'A5'): Promise<string> => {
    const res = await api.get<ApiResponse<{ url: string; pageSize: string }>>(`/invoices/${id}/pdf`, { params: { size } });
    return resolveApiFileUrl(res.data.data?.url || '');
  },

  approveInvoice: async (id: string): Promise<Invoice> => {
    const res = await api.put<ApiResponse<Invoice>>(`/invoices/${id}/approve`);
    return res.data.data!;
  },

  cancelInvoice: async (id: string, reason?: string): Promise<Invoice> => {
    const res = await api.put<ApiResponse<Invoice>>(`/invoices/${id}/cancel`, { reason });
    return res.data.data!;
  },

  getPeriodicSalesReport: async (from?: string, to?: string): Promise<{ invoices: Invoice[]; totalSales: number; count: number }> => {
    const params: Record<string, string> = {};
    if (from) params.from = from;
    if (to) params.to = to;
    const res = await api.get<ApiResponse<{ invoices: Invoice[]; totalSales: number; count: number }>>('/invoices/reports/periodic', { params });
    return res.data.data || { invoices: [], totalSales: 0, count: 0 };
  },

  getCustomerWiseSalesReport: async (customerId: string, from?: string, to?: string): Promise<Invoice[]> => {
    const params: Record<string, string> = { customerId };
    if (from) params.from = from;
    if (to) params.to = to;
    const res = await api.get<ApiResponse<Invoice[]>>('/invoices/reports/customer-wise', { params });
    return res.data.data || [];
  },

  getSalesmanWiseSalesReport: async (salesPersonId: string, from?: string, to?: string): Promise<Invoice[]> => {
    const params: Record<string, string> = { salesPersonId };
    if (from) params.from = from;
    if (to) params.to = to;
    const res = await api.get<ApiResponse<Invoice[]>>('/invoices/reports/salesman-wise', { params });
    return res.data.data || [];
  },

  getProductWiseSalesReport: async (productId: string, from?: string, to?: string): Promise<any[]> => {
    const params: Record<string, string> = { productId };
    if (from) params.from = from;
    if (to) params.to = to;
    const res = await api.get<ApiResponse<any[]>>('/invoices/reports/product-wise', { params });
    return res.data.data || [];
  },
};

export default invoiceService;
