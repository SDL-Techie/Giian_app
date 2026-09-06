import api from './api';
import { ApiResponse } from '../types/api.types';
import { VatPaidReportData, VatCollectedReportData } from '../types/vat.types';

export const vatService = {
  getVatPaidReport: async (from?: string, to?: string): Promise<VatPaidReportData> => {
    const params: Record<string, string> = {};
    if (from) params.from = from;
    if (to) params.to = to;
    const res = await api.get<ApiResponse<VatPaidReportData>>('/vat/paid', { params });
    return res.data.data || { purchases: [], totalVatPaid: 0 };
  },

  getVatCollectedReport: async (from?: string, to?: string): Promise<VatCollectedReportData> => {
    const params: Record<string, string> = {};
    if (from) params.from = from;
    if (to) params.to = to;
    const res = await api.get<ApiResponse<VatCollectedReportData>>('/vat/collected', { params });
    return res.data.data || { invoices: [], totalVatCollected: 0 };
  },
};

export default vatService;
