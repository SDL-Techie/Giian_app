// import api, { resolveApiFileUrl } from './api';
// import { ApiResponse } from '../types/api.types';
// import { Customer, CreateCustomerPayload } from '../types/customer.types';
// import { Quotation } from '../types/quotation.types';
// import { Invoice } from '../types/invoice.types';

// export const customerService = {
//   getAllCustomers: async (search?: string, status?: string): Promise<Customer[]> => {
//     const params: Record<string, string> = {};
//     if (search) params.search = search;
//     if (status) params.status = status;
//     const res = await api.get<ApiResponse<Customer[]>>('/customers', { params });
//     return (res.data.data || []).map((c:any)=>({...c,companyDocumentUrl:resolveApiFileUrl(c.companyDocumentUrl),companyDocuments:(c.companyDocuments||[]).map((d:any)=>({...d,url:resolveApiFileUrl(d.url)}))}));
//   },

//   // getCustomerById: async (id: string): Promise<Customer> => {
//   //   const res = await api.get<ApiResponse<Customer>>(`/customers/${id}`);
//   //   return res.data.data!;
//   // },

//   getCustomerById: async (id: string): Promise<Customer> => {
//   const res = await api.get<ApiResponse<Customer>>(`/customers/${id}`);
//   const c: any = res.data.data;
//   return {
//     ...c,
//     companyDocumentUrl: resolveApiFileUrl(c.companyDocumentUrl),
//     companyDocuments: (c.companyDocuments || []).map((d: any) => ({
//       ...d,
//       url: resolveApiFileUrl(d.url),
//     })),
//   };
// },

//   createCustomer: async (payload: CreateCustomerPayload): Promise<Customer> => {
//     const formData = new FormData();
//     formData.append('companyName', payload.companyName);
//     if (payload.telephoneNumber) formData.append('telephoneNumber', payload.telephoneNumber);
//     if (payload.email) formData.append('email', payload.email);
//     if (payload.mobileNumber) formData.append('mobileNumber', payload.mobileNumber);
//     if (payload.contactPersonName) formData.append('contactPersonName', payload.contactPersonName);
//     if (payload.companyAddress) formData.append('companyAddress', payload.companyAddress);
//     if (payload.creditLimit !== undefined) formData.append('creditLimit', String(payload.creditLimit));
//     payload.companyDocuments?.forEach((file) => formData.append('companyDocuments', file));

//     const res = await api.post<ApiResponse<Customer>>('/customers', formData);
//     return res.data.data!;
//   },

//   updateCustomer: async (id: string, payload: Partial<CreateCustomerPayload>): Promise<Customer> => {
//     const formData = new FormData();
//     if (payload.companyName) formData.append('companyName', payload.companyName);
//     if (payload.telephoneNumber !== undefined) formData.append('telephoneNumber', payload.telephoneNumber);
//     if (payload.email !== undefined) formData.append('email', payload.email);
//     if (payload.mobileNumber !== undefined) formData.append('mobileNumber', payload.mobileNumber);
//     if (payload.contactPersonName !== undefined) formData.append('contactPersonName', payload.contactPersonName);
//     if (payload.companyAddress !== undefined) formData.append('companyAddress', payload.companyAddress);
//     if (payload.creditLimit !== undefined) formData.append('creditLimit', String(payload.creditLimit));
//     payload.companyDocuments?.forEach((file) => formData.append('companyDocuments', file));

//     const res = await api.put<ApiResponse<Customer>>(`/customers/${id}`, formData);
//     return res.data.data!;
//   },

//   setCustomerStatus: async (id: string, status: 'Active' | 'Inactive'): Promise<Customer> => {
//     const res = await api.put<ApiResponse<Customer>>(`/customers/${id}/status`, { status });
//     return res.data.data!;
//   },

//   deleteCustomer: async (id: string): Promise<ApiResponse> => {
//     const res = await api.delete<ApiResponse>(`/customers/${id}`);
//     return res.data;
//   },

//   getCustomerWiseQuotationReport: async (customerId: string, from?: string, to?: string): Promise<Quotation[]> => {
//     const params: Record<string, string> = { customerId };
//     if (from) params.from = from;
//     if (to) params.to = to;
//     const res = await api.get<ApiResponse<Quotation[]>>('/customers/reports/quotations', { params });
//     return res.data.data || [];
//   },

//   getCustomerWiseSalesReport: async (customerId: string, from?: string, to?: string): Promise<Invoice[]> => {
//     const params: Record<string, string> = { customerId };
//     if (from) params.from = from;
//     if (to) params.to = to;
//     const res = await api.get<ApiResponse<Invoice[]>>('/customers/reports/sales', { params });
//     return res.data.data || [];
//   },
// };


// export default customerService;


import api, { resolveApiFileUrl } from './api';
import { ApiResponse } from '../types/api.types';
import { Customer, CreateCustomerPayload } from '../types/customer.types';
import { Quotation } from '../types/quotation.types';
import { Invoice } from '../types/invoice.types';

export const customerService = {
  getAllCustomers: async (search?: string, status?: string): Promise<Customer[]> => {
    const params: Record<string, string> = {};
    if (search) params.search = search;
    if (status) params.status = status;
    const res = await api.get<ApiResponse<Customer[]>>('/customers', { params });
    return (res.data.data || []).map((c: any) => ({
      ...c,
      companyDocumentUrl: resolveApiFileUrl(c.companyDocumentUrl),
      companyDocuments: (c.companyDocuments || []).map((d: any) => ({ ...d, url: resolveApiFileUrl(d.url) })),
    }));
  },

  getCustomerById: async (id: string): Promise<Customer> => {
    const res = await api.get<ApiResponse<Customer>>(`/customers/${id}`);
    const c: any = res.data.data;
    return {
      ...c,
      companyDocumentUrl: resolveApiFileUrl(c.companyDocumentUrl),
      companyDocuments: (c.companyDocuments || []).map((d: any) => ({
        ...d,
        url: resolveApiFileUrl(d.url),
      })),
    };
  },

  createCustomer: async (payload: CreateCustomerPayload): Promise<Customer> => {
    const formData = new FormData();
    formData.append('companyName', payload.companyName);
    if (payload.telephoneNumber) formData.append('telephoneNumber', payload.telephoneNumber);
    if (payload.email) formData.append('email', payload.email);
    if (payload.mobileNumber) formData.append('mobileNumber', payload.mobileNumber);
    if (payload.contactPersonName) formData.append('contactPersonName', payload.contactPersonName);
    if (payload.companyAddress) formData.append('companyAddress', payload.companyAddress);
    if (payload.creditLimit !== undefined) formData.append('creditLimit', String(payload.creditLimit));
    payload.companyDocuments?.forEach((file) => formData.append('companyDocuments', file));

    const res = await api.post<ApiResponse<Customer>>('/customers', formData);
    return res.data.data!;
  },

  updateCustomer: async (id: string, payload: Partial<CreateCustomerPayload>): Promise<Customer> => {
    const formData = new FormData();
    if (payload.companyName) formData.append('companyName', payload.companyName);
    if (payload.telephoneNumber !== undefined) formData.append('telephoneNumber', payload.telephoneNumber);
    if (payload.email !== undefined) formData.append('email', payload.email);
    if (payload.mobileNumber !== undefined) formData.append('mobileNumber', payload.mobileNumber);
    if (payload.contactPersonName !== undefined) formData.append('contactPersonName', payload.contactPersonName);
    if (payload.companyAddress !== undefined) formData.append('companyAddress', payload.companyAddress);
    if (payload.creditLimit !== undefined) formData.append('creditLimit', String(payload.creditLimit));
    payload.companyDocuments?.forEach((file) => formData.append('companyDocuments', file));

    const res = await api.put<ApiResponse<Customer>>(`/customers/${id}`, formData);
    return res.data.data!;
  },

  setCustomerStatus: async (id: string, status: 'Active' | 'Inactive'): Promise<Customer> => {
    const res = await api.put<ApiResponse<Customer>>(`/customers/${id}/status`, { status });
    return res.data.data!;
  },

  deleteCustomer: async (id: string): Promise<ApiResponse> => {
    const res = await api.delete<ApiResponse>(`/customers/${id}`);
    return res.data;
  },

  getCustomerWiseQuotationReport: async (customerId: string, from?: string, to?: string): Promise<Quotation[]> => {
    const params: Record<string, string> = { customerId };
    if (from) params.from = from;
    if (to) params.to = to;
    const res = await api.get<ApiResponse<Quotation[]>>('/customers/reports/quotations', { params });
    return res.data.data || [];
  },

  getCustomerWiseSalesReport: async (customerId: string, from?: string, to?: string): Promise<Invoice[]> => {
    const params: Record<string, string> = { customerId };
    if (from) params.from = from;
    if (to) params.to = to;
    const res = await api.get<ApiResponse<Invoice[]>>('/customers/reports/sales', { params });
    return res.data.data || [];
  },

  // ---------------------------------------------------------------------
  // Fetches a customer document as a Blob through the shared `api` axios
  // instance, so its auth interceptor attaches the token/cookie the same
  // way it does for every other call on this service. A plain
  // <a href={doc.url}> tag skips that entirely, which is why you were
  // getting "Access Denied. Login Required" on view/download.
  //
  // `fileUrl` is the already-resolved absolute URL produced by
  // resolveApiFileUrl above (companyDocumentUrl / companyDocuments[].url).
  // ---------------------------------------------------------------------
  getCustomerDocumentBlob: async (fileUrl: string): Promise<Blob> => {
    const res = await api.get(fileUrl, {
      responseType: 'blob',
    });
    return res.data;
  },
};

export default customerService;