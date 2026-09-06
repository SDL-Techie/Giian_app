import api from './api';
import { ApiResponse } from '../types/api.types';
import { Category, CreateCategoryPayload } from '../types/category.types';

export const categoryService = {
  getAllCategories: async (): Promise<Category[]> => {
    const res = await api.get<ApiResponse<Category[]>>('/categories');
    return res.data.data || [];
  },

  createCategory: async (payload: CreateCategoryPayload): Promise<Category> => {
    const res = await api.post<ApiResponse<Category>>('/categories', payload);
    return res.data.data!;
  },

  updateCategory: async (id: string, payload: Partial<Category>): Promise<Category> => {
    const res = await api.put<ApiResponse<Category>>(`/categories/${id}`, payload);
    return res.data.data!;
  },

  deleteCategory: async (id: string): Promise<ApiResponse> => {
    const res = await api.delete<ApiResponse>(`/categories/${id}`);
    return res.data;
  },
};

export default categoryService;
