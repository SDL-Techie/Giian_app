import api from './api';
import { ApiResponse } from '../types/api.types';
import {
  LoginRequest,
  LoginResponse,
  ChangePasswordRequest,
  UpdateProfileRequest,
} from '../types/auth.types';
import { User } from '../types/user.types';

export const authService = {
  login: async (data: LoginRequest): Promise<LoginResponse> => {
    const res = await api.post<LoginResponse>('/auth/login', data);
    return res.data;
  },


  logout: async (): Promise<ApiResponse> => {
    const res = await api.post<ApiResponse>('/auth/logout');
    return res.data;
  },

  getMe: async (): Promise<User> => {
    const res = await api.get<ApiResponse<User>>('/auth/me');
    return res.data.data!;
  },

  updateProfile: async (data: UpdateProfileRequest): Promise<User> => {
    const res = await api.put<ApiResponse<User>>('/auth/me', data);
    return res.data.data!;
  },

  changePassword: async (data: ChangePasswordRequest): Promise<ApiResponse> => {
    const res = await api.put<ApiResponse>('/auth/change-password', data);
    return res.data;
  },
};

export default authService;
