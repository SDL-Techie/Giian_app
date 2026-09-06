import { Product } from './product.types';

export interface PurchaseItem {
  product: Product | { _id: string; name: string; itemCode: string } | string;
  qty: number;
  cost: number;
  totalCost: number;
}

export interface Purchase {
  _id: string;
  purchaseNo: string;
  dateOfPurchase: string;
  vendorName: string;
  invoiceNumber: string;
  invoiceFileUrl?: string;
  invoiceFiles?: { id:string; filename:string; contentType?:string; size?:number; url:string }[];
  items: PurchaseItem[];
  subTotalCost: number;
  vatPercent: number;
  vatAmount: number;
  totalCost: number;
  status: 'Active' | 'Cancelled';
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreatePurchasePayload {
  dateOfPurchase: string;
  vendorName: string;
  invoiceNumber: string;
  items: { product: string; qty: number; cost: number }[];
  vatPercent?: number;
  invoiceFiles?: File[];
}
