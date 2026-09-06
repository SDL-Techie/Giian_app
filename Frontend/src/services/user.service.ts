import api from './api';
import { ApiResponse } from '../types/api.types';
import { User, CreateUserPayload, UpdateUserPayload } from '../types/user.types';

export const userService = {
  getAllUsers: async (): Promise<User[]> => {
    const res = await api.get<ApiResponse<User[]>>('/users');
    return res.data.data || [];
  },

  getUserById: async (id: string): Promise<User> => {
    const res = await api.get<ApiResponse<User>>(`/users/${id}`);
    return res.data.data!;
  },

  createUser: async (data: CreateUserPayload): Promise<ApiResponse<User>> => {
    const res = await api.post<ApiResponse<User>>('/users', data);
    return res.data;
  },

  updateUserDetails: async (id: string, data: UpdateUserPayload): Promise<User> => {
    const res = await api.put<ApiResponse<User>>(`/users/${id}`, data);
    return res.data.data!;
  },

  updateUser: async (id: string, data: UpdateUserPayload): Promise<User> => {
    const res = await api.put<ApiResponse<User>>(`/users/${id}`, data);
    return res.data.data!;
  },


  resetPassword: async (id: string, newPassword: string): Promise<ApiResponse> => {
    const res = await api.put<ApiResponse>(`/users/${id}/reset-password`, { newPassword });
    return res.data;
  },

  setUserStatus: async (id: string, status: 'Active' | 'Inactive'): Promise<User> => {
    const res = await api.put<ApiResponse<User>>(`/users/${id}/status`, { status });
    return res.data.data!;
  },
};

export default userService;
