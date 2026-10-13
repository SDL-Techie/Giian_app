import api from './api';
import { ApiResponse } from '../types/api.types';
export interface Measurement { _id:string; name:string; abbreviation:string; status:'Active'|'Inactive' }
export const measurementService = {
 getAll: async ():Promise<Measurement[]> => (await api.get<ApiResponse<Measurement[]>>('/measurements')).data.data || [],
 create: async (payload:{name:string;abbreviation:string;status?:'Active'|'Inactive'}) => (await api.post<ApiResponse<Measurement>>('/measurements',payload)).data.data!,
 update: async (id:string,payload:Partial<Measurement>) => (await api.put<ApiResponse<Measurement>>(`/measurements/${id}`,payload)).data.data!,
 remove: async (id:string) => api.delete(`/measurements/${id}`),
};
