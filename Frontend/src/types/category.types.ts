export interface Category { _id:string; name:string; status:'Active'|'Inactive'; createdBy?:string; createdAt?:string; updatedAt?:string; }
export interface CreateCategoryPayload { name:string; }
