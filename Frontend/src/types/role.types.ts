export type RoleModule = 'customers' | 'products' | 'purchase' | 'sales' | 'quotations' | 'receipts' | 'users' | 'vat';
export type RoleAction = 'create' | 'view' | 'modify' | 'report';

export interface ModulePermission {
  create?: boolean;
  view?: boolean;
  modify?: boolean;
  report?: boolean;
}

export interface RolePermissions {
  customers?: ModulePermission;
  products?: ModulePermission;
  purchase?: ModulePermission;
  sales?: ModulePermission;
  quotations?: ModulePermission;
  receipts?: ModulePermission;
  users?: ModulePermission;
  vat?: { report?: boolean };
}

export interface Role {
  _id: string;
  name: string;
  description?: string;
  isSystem?: boolean;
  permissions: RolePermissions;
  status: 'Active' | 'Inactive';
  isActive?: boolean;
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateRolePayload {
  name: string;
  description?: string;
  permissions: RolePermissions;
}

export interface UpdateRolePayload {
  name?: string;
  permissions?: RolePermissions;
  status?: 'Active' | 'Inactive';
}

