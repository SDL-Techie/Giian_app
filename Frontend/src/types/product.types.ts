import { Category } from './category.types';

export interface Product {
  _id: string;
  name: string;
  itemCode: string;
  unitOfMeasure?: string;
  productImageUrl?: string;
  category: Category | { _id: string; name: string } | string;
  status: 'Active' | 'Inactive';
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateProductPayload {
  name: string;
  itemCode: string;
  unitOfMeasure?: string;
  category: string;
  productImage?: File;
}
