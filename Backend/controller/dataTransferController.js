import XLSX from 'xlsx';
import mongoose from 'mongoose';
import Customer from '../model/customerModel.js';
import Product from '../model/productModel.js';
import Category from '../model/categoryModel.js';
import Purchase from '../model/purchaseModel.js';
import Quotation from '../model/quotationModel.js';
import Invoice from '../model/invoiceModel.js';
import Receipt from '../model/receiptModel.js';
import User from '../model/userModel.js';
import Role from '../model/roleModel.js';
import { isStrongPassword } from '../utils/passwordPolicy.js';
import { withMongoTransaction } from '../utils/transaction.js';

const models={customers:Customer,products:Product,categories:Category,purchases:Purchase,quotations:Quotation,invoices:Invoice,receipts:Receipt,users:User,roles:Role};
const permissionModule={customers:'customers',products:'products',categories:'products',purchases:'purchase',quotations:'quotations',invoices:'sales',receipts:'receipts',users:'users',roles:'users',vat:'vat'};
const allowed=(req,action)=>{ if(['users','roles'].includes(req.params.module)) return !!req.user?.isAdmin; return req.user?.isAdmin || !!req.user?.role?.permissions?.[permissionModule[req.params.module]]?.[action]; };
const jsonFields=new Set(['items','invoiceFiles','companyDocuments','permissions','allocations']);
const parseCell=(key,value)=>{if(typeof value!=='string')return value;const v=value.trim();if(!v)return undefined;if(jsonFields.has(key)||v.startsWith('{')||v.startsWith('[')){try{return JSON.parse(v)}catch{}}if(v==='true')return true;if(v==='false')return false;return value};
const clean=(obj)=>{const o={...obj};for(const k of ['_id','__v','createdAt','updatedAt','createdBy','Customer Name','Category Name','Sales Person','Role Name','Quotation No'])delete o[k];for(const k of Object.keys(o)){const v=parseCell(k,o[k]);if(v===undefined)delete o[k];else o[k]=v;}return o};

const lookupByName = async (Model, field, value, session) => {
  if (!value) return null;
  if (mongoose.isValidObjectId(value)) return value;
  let q=Model.findOne({[field]:String(value).trim()}); if(session) q=q.session(session); const doc=await q.select('_id').lean(); return doc?._id || null;
};
const lookupProduct = async (value, session) => {
  if (!value) return null; if(mongoose.isValidObjectId(value)) return value;
  let q=Product.findOne({$or:[{itemCode:String(value).trim()},{name:String(value).trim()}]}); if(session) q=q.session(session); const d=await q.select('_id').lean(); return d?._id||null;
};
const resolveItemRefs=async(items,session)=>{if(!Array.isArray(items))return items;const out=[];for(const it of items){const ref=it.product??it.itemCode??it.productName??it.name;const id=await lookupProduct(ref,session);if(!id)throw new Error(`Product not found: ${ref}`);out.push({...it,product:id});}return out};

const exportItems=(items=[],module='')=>items.map(i=>module==='purchases'?({productName:i.product?.name||'',itemCode:i.product?.itemCode||'',qty:i.qty,cost:i.cost,totalCost:i.totalCost}):({productName:i.product?.name||'',itemCode:i.product?.itemCode||'',qty:i.qty,price:i.price,totalPrice:i.totalPrice}));
const exportAllocations=(allocs=[])=>allocs.map(a=>({invoiceNo:a.invoice?.invoiceNo||'',amount:a.amount}));

const friendlyRow=(module,doc)=>{
  const base={...doc}; delete base._id; delete base.password; delete base.__v; delete base.createdBy; delete base.companyDocuments; delete base.invoiceFiles;
  if(module==='products'){base['Category Name']=doc.category?.name||'';delete base.category;}
  if(['quotations','invoices'].includes(module)){base['Customer Name']=doc.customer?.companyName||'';base['Sales Person']=doc.salesPerson?.name||'';if(module==='invoices')base['Quotation No']=doc.quotation?.quotationNo||'';base.items=JSON.stringify(exportItems(doc.items,module));delete base.customer;delete base.salesPerson;delete base.quotation;if(doc.approvedBy){base['Approved By']=doc.approvedBy?.name||'';delete base.approvedBy;}}
  if(module==='purchases'){base.items=JSON.stringify(exportItems(doc.items,module));}
  if(module==='receipts'){base['Customer Name']=doc.customer?.companyName||'';base.allocations=JSON.stringify(exportAllocations(doc.allocations));delete base.customer;delete base.sourceAdvanceReceipt;}
  if(module==='users'){base['Role Name']=doc.role?.name||'';delete base.role;}
  for(const k of Object.keys(base)){if(base[k] instanceof Date)base[k]=base[k].toISOString();else if(typeof base[k]==='object'&&base[k]!==null&&!Array.isArray(base[k]))base[k]=JSON.stringify(base[k]);else if(Array.isArray(base[k])&&k!=='items'&&k!=='allocations')base[k]=JSON.stringify(base[k]);}
  return base;
};

const exportVatWorkbook=async()=>{
  const [purchases,invoices]=await Promise.all([Purchase.find({}).lean(),Invoice.find({}).lean()]);
  const rows=[...purchases.map(p=>({Type:'Purchase',RecordId:String(p._id),DocumentNo:p.purchaseNo,Date:p.dateOfPurchase,BaseAmount:p.subTotalCost,VatPercent:p.vatPercent,VatAmount:p.vatAmount,TotalAmount:p.totalCost,Status:p.status})),...invoices.map(i=>({Type:'Invoice',RecordId:String(i._id),DocumentNo:i.invoiceNo,Date:i.invoiceDate,BaseAmount:i.subTotal,VatPercent:i.vatPercent,VatAmount:i.vatAmount,TotalAmount:i.totalAmount,Status:i.status}))];
  const wb=XLSX.utils.book_new();XLSX.utils.book_append_sheet(wb,XLSX.utils.json_to_sheet(rows),'VAT Records');
  const info=XLSX.utils.aoa_to_sheet([['VAT IMPORT'],['To update VAT, keep Type, RecordId and VatPercent. The backend recalculates VAT and totals from the stored base amount.']]);XLSX.utils.book_append_sheet(wb,info,'Import Instructions');return wb;
};
const importVatRows=async(rows,session)=>{let created=0;for(let i=0;i<rows.length;i++){const row=rows[i];const type=String(row.Type||row.type||'').toLowerCase();const id=String(row.RecordId||row.recordId||row._id||'');const rate=Number(row.VatPercent??row.vatPercent);if(!id||!Number.isFinite(rate)||rate<0||rate>100)throw Object.assign(new Error(`Row ${i+2}: Type, RecordId and VatPercent between 0 and 100 are required`),{statusCode:400});if(type==='purchase'){let q=Purchase.findById(id);if(session)q=q.session(session);const p=await q;if(!p)throw new Error(`Row ${i+2}: Purchase not found`);p.vatPercent=rate;p.vatAmount=Number(((p.subTotalCost||0)*rate/100).toFixed(2));p.totalCost=Number(((p.subTotalCost||0)+p.vatAmount).toFixed(2));await p.save(session?{session}:undefined);}else if(type==='invoice'){let q=Invoice.findById(id);if(session)q=q.session(session);const inv=await q;if(!inv)throw new Error(`Row ${i+2}: Invoice not found`);if(inv.status!=='Active')throw new Error(`Row ${i+2}: Cancelled invoice VAT cannot be modified`);if(Number(inv.paidAmount||0)>0)throw new Error(`Row ${i+2}: Invoice VAT cannot be modified after a receipt has been applied`);const taxable=Math.max(0,Number(inv.subTotal||0)-Number(inv.discount||0));inv.vatPercent=rate;inv.vatAmount=Number((taxable*rate/100).toFixed(2));inv.totalAmount=Number((taxable+inv.vatAmount).toFixed(2));inv.balanceAmount=inv.totalAmount;await inv.save(session?{session}:undefined);}else throw new Error(`Row ${i+2}: Type must be Purchase or Invoice`);created++;}return{created,failed:0,errors:[]}};

const exportQuery=async(module)=>{
  const Model=models[module];let q=Model.find({});
  if(module==='products')q=q.populate('category','name');
  if(module==='quotations')q=q.populate('customer','companyName').populate('salesPerson','name').populate('items.product','name itemCode');
  if(module==='invoices')q=q.populate('customer','companyName').populate('salesPerson','name').populate('quotation','quotationNo').populate('approvedBy','name').populate('items.product','name itemCode');
  if(module==='purchases')q=q.populate('items.product','name itemCode');
  if(module==='receipts')q=q.populate('customer','companyName').populate('allocations.invoice','invoiceNo');
  if(module==='users')q=q.populate('role','name');
  return q.lean();
};

export const exportModule=async(req,res,next)=>{try{if(!allowed(req,'view')&&!allowed(req,'report'))return res.status(403).json({success:false,message:'You do not have permission to export this module'});let wb;if(req.params.module==='vat'){wb=await exportVatWorkbook();}else{if(!models[req.params.module])return res.status(400).json({success:false,message:'Unsupported module'});const docs=await exportQuery(req.params.module);const rows=docs.map(d=>friendlyRow(req.params.module,d));const ws=XLSX.utils.json_to_sheet(rows);wb=XLSX.utils.book_new();XLSX.utils.book_append_sheet(wb,ws,req.params.module.slice(0,31));const notes=[['IMPORT / EXPORT NOTE'],['Reference columns use readable business text (customer/company name, category name, role name, invoice number and product item code/name) instead of raw MongoDB ObjectIds wherever possible. Imports accept these readable values.']];if(req.params.module==='users')notes.push(['For new user imports, include a strong password column (10+ chars with uppercase, lowercase, number and special character). Existing passwords are never exported.']);XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet(notes),'Import Instructions');}const buf=XLSX.write(wb,{type:'buffer',bookType:'xlsx'});res.setHeader('Content-Type','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');res.setHeader('Content-Disposition',`attachment; filename="${req.params.module}-${new Date().toISOString().slice(0,10)}.xlsx"`);res.send(buf);}catch(e){next(e)}};

const prepareImportRow=async(module,row,session)=>{const data=clean(row);if(module==='products'){const ref=row['Category Name']??data.category;const id=await lookupByName(Category,'name',ref,session);if(!id)throw new Error(`Category not found: ${ref}`);data.category=id;delete data['Category Name'];}
  if(['quotations','invoices'].includes(module)){const customerRef=row['Customer Name']??data.customer;const cid=await lookupByName(Customer,'companyName',customerRef,session);if(!cid)throw new Error(`Customer not found: ${customerRef}`);data.customer=cid;const salesRef=row['Sales Person']??data.salesPerson;if(salesRef){const sid=await lookupByName(User,'name',salesRef,session);if(!sid)throw new Error(`Sales person not found: ${salesRef}`);data.salesPerson=sid;}data.items=await resolveItemRefs(parseCell('items',row.items??data.items),session);if(module==='invoices'&&(row['Quotation No']||data.quotation)){const qref=row['Quotation No']??data.quotation;let q=mongoose.isValidObjectId(qref)?Quotation.findById(qref):Quotation.findOne({quotationNo:String(qref).trim()});if(session)q=q.session(session);const qd=await q.select('_id');data.quotation=qd?._id||null;}delete data['Customer Name'];delete data['Sales Person'];delete data['Quotation No'];delete data['Approved By'];}
  if(module==='purchases')data.items=await resolveItemRefs(parseCell('items',row.items??data.items),session);
  if(module==='receipts'){const ref=row['Customer Name']??data.customer;const cid=await lookupByName(Customer,'companyName',ref,session);if(!cid)throw new Error(`Customer not found: ${ref}`);data.customer=cid;const allocs=parseCell('allocations',row.allocations??data.allocations)||[];data.allocations=[];for(const a of allocs){const invRef=a.invoiceNo??a.invoice;let q=mongoose.isValidObjectId(invRef)?Invoice.findById(invRef):Invoice.findOne({invoiceNo:String(invRef).trim()});if(session)q=q.session(session);const inv=await q.select('_id');if(!inv)throw new Error(`Invoice not found: ${invRef}`);data.allocations.push({invoice:inv._id,amount:a.amount});}delete data['Customer Name'];}
  if(module==='users'){const ref=row['Role Name']??data.role;if(ref){const rid=await lookupByName(Role,'name',ref,session);if(!rid)throw new Error(`Role not found: ${ref}`);data.role=rid;}delete data['Role Name'];}
  return data;};

export const importModule=async(req,res,next)=>{try{if(!allowed(req,'create')&&!allowed(req,'modify'))return res.status(403).json({success:false,message:'You do not have permission to import this module'});if(!req.file)return res.status(400).json({success:false,message:'Excel file is required'});const wb=XLSX.read(req.file.buffer,{type:'buffer'});const rows=XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]],{defval:''});if(!rows.length)return res.status(400).json({success:false,message:'Excel sheet is empty'});if(rows.length>1000)return res.status(400).json({success:false,message:'Maximum 1000 rows per import'});const result=await withMongoTransaction(async(session)=>{if(req.params.module==='vat')return importVatRows(rows,session);const Model=models[req.params.module];if(!Model)throw Object.assign(new Error('Unsupported module'),{statusCode:400});let created=0;for(let i=0;i<rows.length;i++){try{const data=await prepareImportRow(req.params.module,rows[i],session);data.createdBy=req.user._id;if(req.params.module==='users'){if(!isStrongPassword(data.password))throw new Error('strong password is required for user import');data.isAdmin=false;data.mustChangePassword=true;}if(req.params.module==='roles')data.isSystem=false;if(session)await Model.create([data],{session});else await Model.create(data);created++;}catch(e){throw Object.assign(new Error(`Row ${i+2}: ${e.message}`),{statusCode:400});}}return{created,failed:0,errors:[]};});res.json({success:true,message:`Imported ${result.created} rows atomically${process.env.NODE_ENV==='production'?'':'/safely for the configured environment'}`,data:result});}catch(e){next(e)}};
