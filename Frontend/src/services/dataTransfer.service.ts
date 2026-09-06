import api from './api';
export type TransferModule='customers'|'products'|'categories'|'purchases'|'quotations'|'invoices'|'receipts'|'users'|'roles'|'vat';
export const dataTransferService={
  exportExcel:async(module:TransferModule)=>{const r=await api.get(`/data-transfer/${module}/export`,{responseType:'blob'});return r.data as Blob;},
  importExcel:async(module:TransferModule,file:File)=>{const fd=new FormData();fd.append('file',file);const r=await api.post(`/data-transfer/${module}/import`,fd,{headers:{'Content-Type':'multipart/form-data'}});return r.data;}
};
