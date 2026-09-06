import api from './api';
import { ApiResponse } from '../types/api.types';
import { Product, CreateProductPayload } from '../types/product.types';

export const productService = {
  getAllProducts: async (search?: string, category?: string, status?: string): Promise<Product[]> => {
    const params: Record<string, string> = {};
    if (search) params.search = search;
    if (category) params.category = category;
    if (status) params.status = status;
    const res = await api.get<ApiResponse<Product[]>>('/products', { params });
    return res.data.data || [];
  },

  getProductById: async (id: string): Promise<Product> => {
    const res = await api.get<ApiResponse<Product>>(`/products/${id}`);
    return res.data.data!;
  },

  createProduct: async (payload: CreateProductPayload): Promise<Product> => {
    const formData = new FormData();
    formData.append('name', payload.name);
    formData.append('itemCode', payload.itemCode);
    if (payload.unitOfMeasure) formData.append('unitOfMeasure', payload.unitOfMeasure);
    formData.append('category', payload.category);
    if (payload.productImage) formData.append('productImage', payload.productImage);

    const res = await api.post<ApiResponse<Product>>('/products', formData);
    return res.data.data!;
  },

  updateProduct: async (id: string, payload: Partial<CreateProductPayload>): Promise<Product> => {
    const formData = new FormData();
    if (payload.name) formData.append('name', payload.name);
    if (payload.itemCode) formData.append('itemCode', payload.itemCode);
    if (payload.unitOfMeasure !== undefined) formData.append('unitOfMeasure', payload.unitOfMeasure);
    if (payload.category) formData.append('category', payload.category);
    if (payload.productImage) formData.append('productImage', payload.productImage);

    const res = await api.put<ApiResponse<Product>>(`/products/${id}`, formData);
    return res.data.data!;
  },

  setProductStatus: async (id: string, status: 'Active' | 'Inactive'): Promise<Product> => {
    const res = await api.put<ApiResponse<Product>>(`/products/${id}/status`, { status });
    return res.data.data!;
  },

  deleteProduct: async (id: string): Promise<ApiResponse> => {
    const res = await api.delete<ApiResponse>(`/products/${id}`);
    return res.data;
  },

  getProductListReport: async (): Promise<Product[]> => {
    const res = await api.get<ApiResponse<Product[]>>('/products/reports/list');
    return res.data.data || [];
  },
};

export default productService;
