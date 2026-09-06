import api from './api';

export interface HealthResponse {
  success: boolean;
  message: string;
}

export const healthService = {
  check: async (): Promise<HealthResponse> => {
    const res = await api.get<HealthResponse>('/health');
    return res.data;
  },
};

export default healthService;
