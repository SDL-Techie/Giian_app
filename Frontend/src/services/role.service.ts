import api from './api';
import { ApiResponse } from '../types/api.types';
import { Role, CreateRolePayload, UpdateRolePayload } from '../types/role.types';

export const roleService = {
  getAllRoles: async (): Promise<Role[]> => {
    const res = await api.get<ApiResponse<Role[]>>('/roles');
    return res.data.data || [];
  },

  getRoleById: async (id: string): Promise<Role> => {
    const res = await api.get<ApiResponse<Role>>(`/roles/${id}`);
    return res.data.data!;
  },

  createRole: async (data: CreateRolePayload): Promise<Role> => {
    const res = await api.post<ApiResponse<Role>>('/roles', data);
    return res.data.data!;
  },

  updateRole: async (id: string, data: UpdateRolePayload): Promise<Role> => {
    const res = await api.put<ApiResponse<Role>>(`/roles/${id}`, data);
    return res.data.data!;
  },

  deleteRole: async (id: string): Promise<ApiResponse> => {
    const res = await api.delete<ApiResponse>(`/roles/${id}`);
    return res.data;
  },
};

export default roleService;
