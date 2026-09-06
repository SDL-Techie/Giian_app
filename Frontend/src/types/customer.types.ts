export interface Customer {
  _id: string;
  companyName: string;
  telephoneNumber?: string;
  email?: string;
  mobileNumber?: string;
  contactPersonName?: string;
  companyAddress?: string;
  creditLimit?: number;
  companyDocumentUrl?: string;
  companyDocuments?: { id:string; filename:string; contentType?:string; size?:number; url:string }[];
  status: 'Active' | 'Inactive';
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateCustomerPayload {
  companyName: string;
  telephoneNumber?: string;
  email?: string;
  mobileNumber?: string;
  contactPersonName?: string;
  companyAddress?: string;
  creditLimit?: number;
  companyDocuments?: File[];
}
