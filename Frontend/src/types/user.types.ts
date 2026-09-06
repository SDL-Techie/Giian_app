import { Role } from './role.types';

export interface User {
  _id: string;
  name: string;
  email: string;
  phoneno?: string;
  isAdmin: boolean;
  role?: Role | string | null;
  roleId?: string;
  status: 'Active' | 'Inactive';
  isActive?: boolean;
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateUserPayload {
  name: string;
  email: string;
  password?: string;
  phoneno?: string;
  roleId?: string;
}

export interface UpdateUserPayload {
  name?: string;
  phoneno?: string;
  email?: string;
  roleId?: string;
}
