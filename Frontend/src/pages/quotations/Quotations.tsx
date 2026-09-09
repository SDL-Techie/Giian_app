// import React, { useEffect, useState, useCallback } from 'react';
// import {
//   FileText,
//   Plus,
//   Trash2,
//   Download,
//   Ban,
//   Eye,
//   UserCheck,
// } from 'lucide-react';
// import { useAuth } from '../../context/AuthContext';
// import { useToast } from '../../context/ToastContext';
// import quotationService from '../../services/quotation.service';
// import customerService from '../../services/customer.service';
// import productService from '../../services/product.service';
// import userService from '../../services/user.service';
// import { Quotation, CreateQuotationPayload } from '../../types/quotation.types';
// import { Customer } from '../../types/customer.types';
// import { Product } from '../../types/product.types';
// import { User } from '../../types/user.types';
// import Card from '../../components/common/card/Card';
// import Button from '../../components/common/button/Button';
// import Input from '../../components/common/input/Input';
// import Select from '../../components/common/select/Select';
// import Table from '../../components/common/table/Table';
// import Modal from '../../components/common/modal/Modal';
// import Badge from '../../components/common/badge/Badge';
// import ConfirmDialog from '../../components/common/confirm/ConfirmDialog';
// import DataTransferBar from '../../components/common/data-transfer/DataTransferBar';
// import PdfActionModal from '../../components/common/pdf/PdfActionModal';
// import './Quotations.css';

// interface LineItemInput {
//   product: string;
//   qty: number;
//   price: number | '';
// }

// export const Quotations: React.FC = () => {
//   const { user, hasPermission } = useAuth();
//   const toast = useToast();

//   const canCreate = hasPermission('quotations', 'create');
//   const canModify = hasPermission('quotations', 'modify');
//   const canReport = hasPermission('quotations', 'report');

//   const [activeTab, setActiveTab] = useState<'list' | 'customerReport' | 'salesmanReport'>('list');
//   const [quotations, setQuotations] = useState<Quotation[]>([]);
//   const [customers, setCustomers] = useState<Customer[]>([]);
//   const [products, setProducts] = useState<Product[]>([]);
//   const [salesUsers, setSalesUsers] = useState<User[]>([]);
//   const [isLoading, setIsLoading] = useState(false);

//   // Filters
//   const [statusFilter, setStatusFilter] = useState('');
//   const [customerFilter, setCustomerFilter] = useState('');

//   // New Quotation Modal State
//   const [isModalOpen, setIsModalOpen] = useState(false);
//   const [isSaving, setIsSaving] = useState(false);
//   const [selectedCustomerId, setSelectedCustomerId] = useState('');
//   const [dateOfQuotation, setDateOfQuotation] = useState(new Date().toISOString().split('T')[0]);
//   const [attn, setAttn] = useState('');
//   const [discount, setDiscount] = useState<number | ''>('');
//   const [vatPercent, setVatPercent] = useState<number>(5);
//   const [items, setItems] = useState<LineItemInput[]>([
//     { product: '', qty: 1, price: '' },
//   ]);

//   // Cancel Quotation Dialog
//   const [quotationToCancel, setQuotationToCancel] = useState<Quotation | null>(null);
//   const [isCancelling, setIsCancelling] = useState(false);
//   const [viewingQuotation, setViewingQuotation] = useState<Quotation | null>(null);
//   const [quotationForPdf, setQuotationForPdf] = useState<Quotation | null>(null);
//   const [warrantyTerms, setWarrantyTerms] = useState('');

//   // Reports State
//   const [reportCustomerId, setReportCustomerId] = useState('');
//   const [reportSalesPersonId, setReportSalesPersonId] = useState('');
//   const [reportFrom, setReportFrom] = useState('');
//   const [reportTo, setReportTo] = useState('');
//   const [reportQuotations, setReportQuotations] = useState<Quotation[]>([]);
//   const [isReportLoading, setIsReportLoading] = useState(false);

//   const loadData = useCallback(async () => {
//     setIsLoading(true);
//     try {
//       const [qList, cList, pList] = await Promise.all([
//         quotationService.getAllQuotations(statusFilter, customerFilter),
//         customerService.getAllCustomers(),
//         productService.getAllProducts(),
//       ]);
//       setQuotations(qList);
//       setCustomers(cList);
//       setProducts(pList);

//       if (user?.isAdmin) {
//         userService.getAllUsers().then(setSalesUsers).catch(() => []);
//       }
//     } catch (err: any) {
//       toast.error(err.message || 'Failed to fetch quotations');
//     } finally {
//       setIsLoading(false);
//     }
//   }, [statusFilter, customerFilter, user?.isAdmin, toast]);

//   useEffect(() => {
//     loadData();
//   }, [loadData]);

//   // Handle auto-populating ATTN from selected customer
//   const handleCustomerChange = (cId: string) => {
//     setSelectedCustomerId(cId);
//     const chosen = customers.find((c) => c._id === cId);
//     if (chosen?.contactPersonName) {
//       setAttn(chosen.contactPersonName);
//     }
//   };

//   const addItemRow = () => {
//     setItems((prev) => [...prev, { product: products[0]?._id || '', qty: 1, price: '' }]);
//   };

//   const removeItemRow = (index: number) => {
//     if (items.length <= 1) return;
//     setItems((prev) => prev.filter((_, i) => i !== index));
//   };

//   const updateItemRow = (index: number, field: keyof LineItemInput, val: any) => {
//     setItems((prev) => {
//       const updated = [...prev];
//       updated[index] = { ...updated[index], [field]: val };
//       return updated;
//     });
//   };

//   // Calculations
//   const subTotal = items.reduce((sum, item) => sum + Number(item.qty || 0) * Number(item.price || 0), 0);
//   const discountedSubtotal = Math.max(0, subTotal - (discount || 0));
//   const vatAmount = (discountedSubtotal * (vatPercent || 0)) / 100;
//   const grandTotal = discountedSubtotal + vatAmount;

//   const handleCreateQuotation = async (e: React.FormEvent) => {
//     e.preventDefault();
//     if (!selectedCustomerId) {
//       toast.error('Please select a customer');
//       return;
//     }
//     if (items.some((i) => !i.product || i.qty <= 0 || i.price === '' || Number(i.price) < 0)) {
//       toast.error('Please specify valid items with positive quantity and price');
//       return;
//     }

//     setIsSaving(true);
//     try {
//       const payload: CreateQuotationPayload = {
//         customer: selectedCustomerId,
//         dateOfQuotation,
//         attn: attn || undefined,
//         items: items.map((i) => ({ ...i, price: Number(i.price) })),
//         warrantyTerms: warrantyTerms.trim() || undefined,
//         discount: Number(discount) || 0,
//         vatPercent: Number(vatPercent) || 0,
//       };

//       const created = await quotationService.createQuotation(payload);
//       toast.success(`Quotation ${created.quotationNo} generated with PDF copy!`);
//       setIsModalOpen(false);
//       loadData();
//     } catch (err: any) {
//       toast.error(err.message || 'Failed to create quotation');
//     } finally {
//       setIsSaving(false);
//     }
//   };

//   const handleCancelQuotation = async () => {
//     if (!quotationToCancel) return;
//     setIsCancelling(true);
//     try {
//       await quotationService.cancelQuotation(quotationToCancel._id);
//       toast.success('Quotation cancelled successfully');
//       setQuotationToCancel(null);
//       loadData();
//     } catch (err: any) {
//       toast.error(err.message || 'Failed to cancel quotation');
//     } finally {
//       setIsCancelling(false);
//     }
//   };

//   const handleFetchReport = async () => {
//     setIsReportLoading(true);
//     try {
//       if (activeTab === 'customerReport') {
//         if (!reportCustomerId) {
//           toast.warning('Please select a customer');
//           return;
//         }
//         const data = await quotationService.getCustomerWiseQuotationReport(
//           reportCustomerId,
//           reportFrom || undefined,
//           reportTo || undefined
//         );
//         setReportQuotations(data);
//       } else if (activeTab === 'salesmanReport') {
//         if (!reportSalesPersonId) {
//           toast.warning('Please select a salesperson');
//           return;
//         }
//         const data = await quotationService.getSalesmanWiseQuotationReport(
//           reportSalesPersonId,
//           reportFrom || undefined,
//           reportTo || undefined
//         );
//         setReportQuotations(data);
//       }
//     } catch (err: any) {
//       toast.error(err.message || 'Failed to fetch quotation report');
//     } finally {
//       setIsReportLoading(false);
//     }
//   };

//   return (
//     <div className="quotations-page" id="quotations-page">
//       <div className="page-header">
//         <div>
//           <h1 className="page-title">Quotations</h1>
//           <p className="page-subtitle">Formal price estimates, customer proposals and auto-generated PDFs</p>
//         </div>
//         {canCreate && (
//           <Button
//             variant="primary"
//             icon={<Plus size={16} />}
//             onClick={() => {
//               if (customers.length === 0) {
//                 toast.warning('Please create at least one customer first');
//                 return;
//               }
//               if (products.length === 0) {
//                 toast.warning('Please create at least one product first');
//                 return;
//               }
//               handleCustomerChange(customers[0]._id);
//               setItems([{ product: products[0]._id, qty: 1, price: '' }]);
//               setDiscount('');
//               setWarrantyTerms('');
//               setIsModalOpen(true);
//             }}
//             id="btn-new-quotation"
//           >
//             New Quotation
//           </Button>
//         )}
//       </div>

//       <DataTransferBar module="quotations" onImported={() => void loadData()} />

//       <div className="page-tabs">
//         <button
//           className={`page-tab-btn ${activeTab === 'list' ? 'active' : ''}`}
//           onClick={() => setActiveTab('list')}
//         >
//           <FileText size={16} />
//           <span>All Quotations</span>
//         </button>
//         {canReport && (
//           <>
//             <button
//               className={`page-tab-btn ${activeTab === 'customerReport' ? 'active' : ''}`}
//               onClick={() => setActiveTab('customerReport')}
//             >
//               <span>Customer-Wise Report</span>
//             </button>
//             <button
//               className={`page-tab-btn ${activeTab === 'salesmanReport' ? 'active' : ''}`}
//               onClick={() => setActiveTab('salesmanReport')}
//             >
//               <span>Salesman-Wise Report</span>
//             </button>
//           </>
//         )}
//       </div>

//       {activeTab === 'list' && (
//         <Card>
//           <div className="filter-bar">
//             <div style={{ width: 220 }}>
//               <Select
//                 value={statusFilter}
//                 onChange={(e) => setStatusFilter(e.target.value)}
//                 options={[
//                   { value: '', label: 'All Statuses' },
//                   { value: 'Open', label: 'Open' },
//                   { value: 'Converted', label: 'Converted to Invoice' },
//                   { value: 'Cancelled', label: 'Cancelled' },
//                 ]}
//               />
//             </div>
//             <div style={{ flex: 1, minWidth: 220 }}>
//               <Select
//                 value={customerFilter}
//                 onChange={(e) => setCustomerFilter(e.target.value)}
//                 options={[
//                   { value: '', label: 'All Customers' },
//                   ...customers.map((c) => ({ value: c._id, label: c.companyName })),
//                 ]}
//               />
//             </div>
//           </div>

//           <Table
//             data={quotations}
//             isLoading={isLoading}
//             keyExtractor={(q) => q._id}
//             columns={[
//               {
//                 header: 'Quotation #',
//                 accessor: (q) => <strong>{q.quotationNo}</strong>,
//               },
//               {
//                 header: 'Date',
//                 accessor: (q) => new Date(q.dateOfQuotation).toLocaleDateString(),
//               },
//               {
//                 header: 'Customer',
//                 accessor: (q) => (typeof q.customer === 'object' ? q.customer.companyName : q.customer),
//               },
//               {
//                 header: 'ATTN',
//                 accessor: (q) => q.attn || '-',
//               },
//               {
//                 header: 'Subtotal',
//                 accessor: (q) => `AED ${q.subTotal.toFixed(2)}`,
//               },
//               {
//                 header: 'VAT',
//                 accessor: (q) => `AED ${q.vatAmount.toFixed(2)} (${q.vatPercent}%)`,
//               },
//               {
//                 header: 'Grand Total',
//                 accessor: (q) => <strong>AED {q.totalAmount.toFixed(2)}</strong>,
//               },
//               {
//                 header: 'Status',
//                 accessor: (q) => (
//                   <Badge
//                     variant={
//                       q.status === 'Converted' ? 'success' : q.status === 'Cancelled' ? 'danger' : 'info'
//                     }
//                   >
//                     {q.status}
//                   </Badge>
//                 ),
//               },
//               {
//                 header: 'Actions',
//                 accessor: (q) => (
//                   <div className="table-actions">
//                     <button
//                       className="action-icon-btn btn-view"
//                       onClick={async () => { try { setViewingQuotation(await quotationService.getQuotationById(q._id)); } catch (err:any) { toast.error(err.message || 'Failed to load quotation details'); } }}
//                       title="View Quotation Details"
//                     >
//                       <Eye size={16} />
//                     </button>
//                     <button className="action-icon-btn btn-view" onClick={() => setQuotationForPdf(q)} title="Quotation PDF options"><Download size={16} /></button>
//                     {canModify && q.status === 'Open' && (
//                       <button
//                         className="action-icon-btn btn-delete"
//                         onClick={() => setQuotationToCancel(q)}
//                         title="Cancel Quotation"
//                       >
//                         <Ban size={16} />
//                       </button>
//                     )}
//                   </div>
//                 ),
//               },
//             ]}
//             emptyTitle="No quotations found"
//             emptyDescription="Generate quotations to propose items and pricing to customers."
//           />
//         </Card>
//       )}

//       {(activeTab === 'customerReport' || activeTab === 'salesmanReport') && (
//         <Card title={activeTab === 'customerReport' ? 'Customer Wise Quotation Report' : 'Salesman Wise Quotation Report'}>
//           <div className="filter-bar">
//             {activeTab === 'customerReport' ? (
//               <div style={{ flex: 1, minWidth: 200 }}>
//                 <Select
//                   label="Select Customer"
//                   value={reportCustomerId}
//                   onChange={(e) => setReportCustomerId(e.target.value)}
//                   options={[
//                     { value: '', label: '-- Choose Customer --' },
//                     ...customers.map((c) => ({ value: c._id, label: c.companyName })),
//                   ]}
//                 />
//               </div>
//             ) : (
//               <div style={{ flex: 1, minWidth: 200 }}>
//                 <Select
//                   label="Select Salesperson"
//                   value={reportSalesPersonId}
//                   onChange={(e) => setReportSalesPersonId(e.target.value)}
//                   options={[
//                     { value: '', label: '-- Choose Salesperson --' },
//                     ...salesUsers.map((u) => ({ value: u._id, label: u.name })),
//                   ]}
//                 />
//               </div>
//             )}

//             <div style={{ width: 160 }}>
//               <Input
//                 type="date"
//                 label="From Date"
//                 value={reportFrom}
//                 onChange={(e) => setReportFrom(e.target.value)}
//               />
//             </div>
//             <div style={{ width: 160 }}>
//               <Input
//                 type="date"
//                 label="To Date"
//                 value={reportTo}
//                 onChange={(e) => setReportTo(e.target.value)}
//               />
//             </div>
//             <div style={{ alignSelf: 'flex-end' }}>
//               <Button
//                 variant="primary"
//                 onClick={handleFetchReport}
//                 isLoading={isReportLoading}
//                 loadingText="Generating..."
//               >
//                 Generate Report
//               </Button>
//             </div>
//           </div>

//           <Table
//             data={reportQuotations}
//             isLoading={isReportLoading}
//             keyExtractor={(q) => q._id}
//             columns={[
//               { header: 'Quotation #', accessor: (q) => <strong>{q.quotationNo}</strong> },
//               { header: 'Date', accessor: (q) => new Date(q.dateOfQuotation).toLocaleDateString() },
//               { header: 'Customer', accessor: (q) => (typeof q.customer === 'object' ? q.customer.companyName : q.customer) },
//               { header: 'Subtotal', accessor: (q) => `AED ${q.subTotal.toFixed(2)}` },
//               { header: 'Discount', accessor: (q) => `AED ${q.discount.toFixed(2)}` },
//               { header: 'VAT', accessor: (q) => `AED ${q.vatAmount.toFixed(2)}` },
//               { header: 'Total Amount', accessor: (q) => <strong>AED {q.totalAmount.toFixed(2)}</strong> },
//               { header: 'Status', accessor: (q) => <Badge variant={q.status === 'Converted' ? 'success' : q.status === 'Cancelled' ? 'danger' : 'info'}>{q.status}</Badge> },
//             ]}
//             emptyTitle="No quotation records found"
//             emptyDescription="Choose parameters and click Generate Report."
//           />
//         </Card>
//       )}

//       {/* New Quotation Modal (matches Wireframe Page 3) */}
//       <Modal
//         isOpen={isModalOpen}
//         onClose={() => setIsModalOpen(false)}
//         title="New Quotation (Auto-Generate PDF)"
//         size="lg"
//       >
//         <form onSubmit={handleCreateQuotation} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
//           <div className="form-grid-2">
//             <Select
//               label="Choose Customer"
//               value={selectedCustomerId}
//               onChange={(e) => handleCustomerChange(e.target.value)}
//               options={customers.map((c) => ({ value: c._id, label: c.companyName }))}
//               isRequired
//             />
//             <Input
//               type="date"
//               label="Date of Quotation"
//               value={dateOfQuotation}
//               onChange={(e) => setDateOfQuotation(e.target.value)}
//               isRequired
//             />
//           </div>

//           <div className="form-grid-2">
//             <Input
//               label="ATTN (Defaults to Contact Person)"
//               placeholder="e.g. Mr. David Clark"
//               value={attn}
//               onChange={(e) => setAttn(e.target.value)}
//             />
//             <div className="input-group">
//               <label className="input-label">Quotation Number</label>
//               <input
//                 type="text"
//                 className="input-field"
//                 value="(Auto-Generated on Save e.g. QTN-000001)"
//                 disabled
//               />
//             </div>
//           </div>

//           <div>
//             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
//               <label className="input-label" style={{ fontWeight: 600 }}>Products</label>
//               <Button type="button" variant="outline" size="sm" icon={<Plus size={14} />} onClick={addItemRow}>
//                 Add Product
//               </Button>
//             </div>

//             <div className="items-builder-table">
//               <div className="items-builder-header">
//                 <div>Product</div>
//                 <div>Qty</div>
//                 <div>Price/Unit</div>
//                 <div>Total</div>
//                 <div></div>
//               </div>

//               {items.map((item, idx) => (
//                 <div key={idx} className="items-builder-row">
//                   <Select
//                     value={item.product}
//                     onChange={(e) => updateItemRow(idx, 'product', e.target.value)}
//                     options={products.map((p) => ({ value: p._id, label: `${p.name} (${p.itemCode})` }))}
//                   />
//                   <Input
//                     type="number"
//                     min="0.01"
//                     step="any"
//                     value={item.qty}
//                     onChange={(e) => updateItemRow(idx, 'qty', Number(e.target.value))}
//                   />
//                   <Input
//                     type="number"
//                     min="0"
//                     step="any"
//                     value={item.price}
//                     onChange={(e) => updateItemRow(idx, 'price', e.target.value === '' ? '' : Number(e.target.value))}
//                   />
//                   <div style={{ fontWeight: 600, fontSize: 'var(--font-size-sm)' }}>
//                     AED {(Number(item.qty || 0) * Number(item.price || 0)).toFixed(2)}
//                   </div>
//                   <button
//                     type="button"
//                     className="action-icon-btn btn-delete"
//                     onClick={() => removeItemRow(idx)}
//                     disabled={items.length <= 1}
//                   >
//                     <Trash2 size={16} />
//                   </button>
//                 </div>
//               ))}
//             </div>
//           </div>

//           <div className="form-grid-2" style={{ marginTop: '8px' }}>
//             <Input
//               type="number"
//               label="Discount (Figure)"
//               placeholder="Enter discount amount"
//               value={discount}
//               onChange={(e) => setDiscount(e.target.value === '' ? '' : Number(e.target.value))}
//               min="0"
//               step="any"
//             />
//             <Input
//               type="number"
//               label="VAT (%)"
//               value={vatPercent}
//               onChange={(e) => setVatPercent(Number(e.target.value))}
//               min="0"
//               step="any"
//             />
//           </div>

//           <div className="input-group">
//             <label className="input-label" htmlFor="quotation-warranty-terms">Warranty Terms</label>
//             <textarea id="quotation-warranty-terms" className="input-field quotation-terms-textarea" value={warrantyTerms} onChange={(e) => setWarrantyTerms(e.target.value)} placeholder="Optional. Enter warranty terms to display on the quotation PDF." rows={3} />
//           </div>

//           <div className="totals-summary-card">
//             <div className="totals-row">
//               <span>Subtotal:</span>
//               <strong>AED {subTotal.toFixed(2)}</strong>
//             </div>
//             {Number(discount || 0) > 0 && <div className="totals-row">
//               <span>Discount (Figure):</span>
//               <span>-AED {Number(discount || 0).toFixed(2)}</span>
//             </div>}
//             <div className="totals-row">
//               <span>VAT ({vatPercent}%):</span>
//               <strong>AED {vatAmount.toFixed(2)}</strong>
//             </div>
//             <div className="totals-row grand-total">
//               <span>Grand Total:</span>
//               <span>AED {grandTotal.toFixed(2)}</span>
//             </div>
//           </div>

//           <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
//             <Button variant="secondary" type="button" onClick={() => setIsModalOpen(false)} disabled={isSaving}>
//               Cancel
//             </Button>
//             <Button variant="primary" type="submit" isLoading={isSaving} loadingText="Generating Quotation...">
//               Generate Quotation (Save in PDF)
//             </Button>
//           </div>
//         </form>
//       </Modal>

//       {/* View Quotation Details Modal */}
//       <Modal
//         isOpen={!!viewingQuotation}
//         onClose={() => setViewingQuotation(null)}
//         title={`Quotation #${viewingQuotation?.quotationNo}`}
//         size="lg"
//       >
//         {viewingQuotation && (
//           <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
//             <div className="form-grid-2">
//               <div>
//                 <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>Customer:</span>
//                 <div><strong>{typeof viewingQuotation.customer === 'object' ? viewingQuotation.customer.companyName : viewingQuotation.customer}</strong></div>
//               </div>
//               <div>
//                 <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>ATTN:</span>
//                 <div>{viewingQuotation.attn || '-'}</div>
//               </div>
//               <div>
//                 <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>Date:</span>
//                 <div>{new Date(viewingQuotation.dateOfQuotation).toLocaleDateString()}</div>
//               </div>
//               <div>
//                 <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>Status:</span>
//                 <div><Badge variant={viewingQuotation.status === 'Converted' ? 'success' : viewingQuotation.status === 'Cancelled' ? 'danger' : 'info'}>{viewingQuotation.status}</Badge></div>
//               </div>
//             </div>

//             <Table
//               data={viewingQuotation.items}
//               keyExtractor={(_, i) => String(i)}
//               columns={[
//                 {
//                   header: 'Product',
//                   accessor: (item) => (typeof item.product === 'object' ? item.product.name : item.product),
//                 },
//                 {
//                   header: 'Quantity',
//                   accessor: (item) => item.qty,
//                 },
//                 {
//                   header: 'Unit Price',
//                   accessor: (item) => `AED ${item.price.toFixed(2)}`,
//                 },
//                 {
//                   header: 'Total Price',
//                   accessor: (item) => `AED ${item.totalPrice.toFixed(2)}`,
//                 },
//               ]}
//             />

//             <div className="totals-summary-card">
//               <div className="totals-row">
//                 <span>Subtotal:</span>
//                 <strong>AED {viewingQuotation.subTotal.toFixed(2)}</strong>
//               </div>
//               {viewingQuotation.discount > 0 && <div className="totals-row">
//                 <span>Discount (Figure):</span>
//                 <span>-AED {viewingQuotation.discount.toFixed(2)}</span>
//               </div>}
//               <div className="totals-row">
//                 <span>VAT ({viewingQuotation.vatPercent}%):</span>
//                 <strong>AED {viewingQuotation.vatAmount.toFixed(2)}</strong>
//               </div>
//               <div className="totals-row grand-total">
//                 <span>Total:</span>
//                 <span>AED {viewingQuotation.totalAmount.toFixed(2)}</span>
//               </div>
//             </div>

//             {viewingQuotation.warrantyTerms && <div className="document-terms-card"><strong>Warranty Terms</strong><p>{viewingQuotation.warrantyTerms}</p></div>}
//             <div style={{ display:'flex', justifyContent:'flex-end', gap:'10px', marginTop:'8px' }}>
//               <button className="btn btn-primary btn-md" onClick={() => { setViewingQuotation(null); setQuotationForPdf(viewingQuotation); }}><Download size={16}/><span>Quotation PDF</span></button>
//             </div>
//           </div>
//         )}
//       </Modal>

//       <PdfActionModal
//         isOpen={!!quotationForPdf}
//         onClose={() => setQuotationForPdf(null)}
//         documentLabel={`Quotation #${quotationForPdf?.quotationNo || ''}`}
//         fileName={quotationForPdf?.quotationNo || 'quotation'}
//         generate={async (size) => {
//           if (!quotationForPdf) throw new Error('Quotation not selected');
//           try { return await quotationService.generateQuotationPdf(quotationForPdf._id, size); }
//           catch (e: any) { toast.error(e.message || 'Failed to generate quotation PDF'); throw e; }
//         }}
//       />

//       {/* Cancel Quotation Confirm Dialog */}
//       <ConfirmDialog
//         isOpen={!!quotationToCancel}
//         onClose={() => setQuotationToCancel(null)}
//         onConfirm={handleCancelQuotation}
//         title="Cancel Quotation"
//         message={`Are you sure you want to cancel Quotation #${quotationToCancel?.quotationNo}? Once cancelled, it cannot be converted into an invoice.`}
//         confirmText="Cancel Quotation"
//         isLoading={isCancelling}
//       />
//     </div>
//   );
// };

// export default Quotations;



import React, { useEffect, useState, useCallback } from 'react';
import {
  FileText,
  Plus,
  Trash2,
  Download,
  Ban,
  Eye,
  UserCheck,
  FileCheck
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import quotationService from '../../services/quotation.service';
import customerService from '../../services/customer.service';
import productService from '../../services/product.service';
import userService from '../../services/user.service';
import { Quotation, CreateQuotationPayload } from '../../types/quotation.types';
import { Customer } from '../../types/customer.types';
import { Product } from '../../types/product.types';
import { User } from '../../types/user.types';
import Card from '../../components/common/card/Card';
import Button from '../../components/common/button/Button';
import Input from '../../components/common/input/Input';
import Select from '../../components/common/select/Select';
import Table from '../../components/common/table/Table';
import Modal from '../../components/common/modal/Modal';
import Badge from '../../components/common/badge/Badge';
import ConfirmDialog from '../../components/common/confirm/ConfirmDialog';
import DataTransferBar from '../../components/common/data-transfer/DataTransferBar';
import PdfActionModal from '../../components/common/pdf/PdfActionModal';
import './Quotations.css';

interface LineItemInput {
  product: string;
  qty: number;
  price: number | '';
}

export const Quotations: React.FC = () => {
  const { user, hasPermission } = useAuth();
  const toast = useToast();

  const canCreate = hasPermission('quotations', 'create');
  const canModify = hasPermission('quotations', 'modify');
  const canReport = hasPermission('quotations', 'report');

  const [activeTab, setActiveTab] = useState<'list' | 'customerReport' | 'salesmanReport'>('list');
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [salesUsers, setSalesUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Filters
  const [statusFilter, setStatusFilter] = useState('');
  const [customerFilter, setCustomerFilter] = useState('');

  // New Quotation Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [dateOfQuotation, setDateOfQuotation] = useState(new Date().toISOString().split('T')[0]);
  const [attn, setAttn] = useState('');
  const [discount, setDiscount] = useState<number | ''>('');
  const [vatPercent, setVatPercent] = useState<number>(5);
  const [items, setItems] = useState<LineItemInput[]>([
    { product: '', qty: 1, price: '' },
  ]);

  // Cancel Quotation Dialog
  const [quotationToCancel, setQuotationToCancel] = useState<Quotation | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [viewingQuotation, setViewingQuotation] = useState<Quotation | null>(null);
  const [quotationForPdf, setQuotationForPdf] = useState<Quotation | null>(null);
  const [warrantyTerms, setWarrantyTerms] = useState('');
  const [isApproving, setIsApproving] = useState(false);

  // Reports State
  const [reportCustomerId, setReportCustomerId] = useState('');
  const [reportSalesPersonId, setReportSalesPersonId] = useState('');
  const [reportFrom, setReportFrom] = useState('');
  const [reportTo, setReportTo] = useState('');
  const [reportQuotations, setReportQuotations] = useState<Quotation[]>([]);
  const [isReportLoading, setIsReportLoading] = useState(false);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [qList, cList, pList] = await Promise.all([
        quotationService.getAllQuotations(statusFilter, customerFilter),
        customerService.getAllCustomers(),
        productService.getAllProducts(),
      ]);
      setQuotations(qList);
      setCustomers(cList);
      setProducts(pList);

      if (user?.isAdmin) {
        userService.getAllUsers().then(setSalesUsers).catch(() => []);
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to fetch quotations');
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, customerFilter, user?.isAdmin, toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle auto-populating ATTN from selected customer
  const handleCustomerChange = (cId: string) => {
    setSelectedCustomerId(cId);
    const chosen = customers.find((c) => c._id === cId);
    if (chosen?.contactPersonName) {
      setAttn(chosen.contactPersonName);
    }
  };

  const addItemRow = () => {
    setItems((prev) => [...prev, { product: products[0]?._id || '', qty: 1, price: '' }]);
  };

  const removeItemRow = (index: number) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const updateItemRow = (index: number, field: keyof LineItemInput, val: any) => {
    setItems((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: val };
      return updated;
    });
  };

  // Calculations
  const subTotal = items.reduce((sum, item) => sum + Number(item.qty || 0) * Number(item.price || 0), 0);
  const discountedSubtotal = Math.max(0, subTotal - (discount || 0));
  const vatAmount = (discountedSubtotal * (vatPercent || 0)) / 100;
  const grandTotal = discountedSubtotal + vatAmount;

  const handleCreateQuotation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerId) {
      toast.error('Please select a customer');
      return;
    }
    if (items.some((i) => !i.product || i.qty <= 0 || i.price === '' || Number(i.price) < 0)) {
      toast.error('Please specify valid items with positive quantity and price');
      return;
    }

    setIsSaving(true);
    try {
      const payload: CreateQuotationPayload = {
        customer: selectedCustomerId,
        dateOfQuotation,
        attn: attn || undefined,
        items: items.map((i) => ({ ...i, price: Number(i.price) })),
        warrantyTerms: warrantyTerms.trim() || undefined,
        discount: Number(discount) || 0,
        vatPercent: Number(vatPercent) || 0,
      };

      const created = await quotationService.createQuotation(payload);
      toast.success(`Quotation ${created.quotationNo} generated with PDF copy!`);
      setIsModalOpen(false);
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to create quotation');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelQuotation = async () => {
    if (!quotationToCancel) return;
    setIsCancelling(true);
    try {
      await quotationService.cancelQuotation(quotationToCancel._id);
      toast.success('Quotation cancelled successfully');
      setQuotationToCancel(null);
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to cancel quotation');
    } finally {
      setIsCancelling(false);
    }
  };

  // Client-side date range filter helper — used when showing "all data"
  // (no specific customer/salesperson picked) but a From/To date is set.
  const filterByDateRange = (list: Quotation[], from?: string, to?: string) => {
    if (!from && !to) return list;
    const fromTime = from ? new Date(from).setHours(0, 0, 0, 0) : null;
    const toTime = to ? new Date(to).setHours(23, 59, 59, 999) : null;
    return list.filter((q) => {
      const qTime = new Date(q.dateOfQuotation).getTime();
      if (fromTime !== null && qTime < fromTime) return false;
      if (toTime !== null && qTime > toTime) return false;
      return true;
    });
  };

  const handleFetchReport = useCallback(async () => {
    setIsReportLoading(true);
    try {
      if (activeTab === 'customerReport') {
        if (reportCustomerId) {
          // Specific customer selected -> use the dedicated report endpoint
          const data = await quotationService.getCustomerWiseQuotationReport(
            reportCustomerId,
            reportFrom || undefined,
            reportTo || undefined
          );
          setReportQuotations(data);
        } else {
          // No customer selected -> show ALL quotations, optionally narrowed by date
          const data = await quotationService.getAllQuotations();
          setReportQuotations(filterByDateRange(data, reportFrom, reportTo));
        }
      } else if (activeTab === 'salesmanReport') {
        if (reportSalesPersonId) {
          const data = await quotationService.getSalesmanWiseQuotationReport(
            reportSalesPersonId,
            reportFrom || undefined,
            reportTo || undefined
          );
          setReportQuotations(data);
        } else {
          const data = await quotationService.getAllQuotations();
          setReportQuotations(filterByDateRange(data, reportFrom, reportTo));
        }
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to fetch quotation report');
    } finally {
      setIsReportLoading(false);
    }
  }, [activeTab, reportCustomerId, reportSalesPersonId, reportFrom, reportTo, toast]);

  // Auto-load report data as soon as the report tab is opened,
  // and whenever the tab, customer/salesperson, or date filters change.
  useEffect(() => {
    if (activeTab === 'customerReport' || activeTab === 'salesmanReport') {
      handleFetchReport();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

    // E-sign & stamp are shown ONLY once the quotation has been admin-approved.
  const showEsignStamp =
    !!viewingQuotation && viewingQuotation.approvalStatus === 'Approved';

  return (
    <div className="quotations-page" id="quotations-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Quotations</h1>
          <p className="page-subtitle">Formal price estimates, customer proposals and auto-generated PDFs</p>
        </div>
        {canCreate && (
          <Button
            variant="primary"
            icon={<Plus size={16} />}
            onClick={() => {
              if (customers.length === 0) {
                toast.warning('Please create at least one customer first');
                return;
              }
              if (products.length === 0) {
                toast.warning('Please create at least one product first');
                return;
              }
              handleCustomerChange(customers[0]._id);
              setItems([{ product: products[0]._id, qty: 1, price: '' }]);
              setDiscount('');
              setWarrantyTerms('');
              setIsModalOpen(true);
            }}
            id="btn-new-quotation"
          >
            New Quotation
          </Button>
        )}
      </div>

      <DataTransferBar module="quotations" onImported={() => void loadData()} />

      <div className="page-tabs">
        <button
          className={`page-tab-btn ${activeTab === 'list' ? 'active' : ''}`}
          onClick={() => setActiveTab('list')}
        >
          <FileText size={16} />
          <span>All Quotations</span>
        </button>
        {canReport && (
          <>
            <button
              className={`page-tab-btn ${activeTab === 'customerReport' ? 'active' : ''}`}
              onClick={() => setActiveTab('customerReport')}
            >
              <span>Customer-Wise Report</span>
            </button>
            <button
              className={`page-tab-btn ${activeTab === 'salesmanReport' ? 'active' : ''}`}
              onClick={() => setActiveTab('salesmanReport')}
            >
              <span>Salesman-Wise Report</span>
            </button>
          </>
        )}
      </div>

      {activeTab === 'list' && (
        <Card>
          <div className="filter-bar">
            <div style={{ width: 220 }}>
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                options={[
                  { value: '', label: 'All Statuses' },
                  { value: 'Open', label: 'Open' },
                  { value: 'Converted', label: 'Converted to Invoice' },
                  { value: 'Cancelled', label: 'Cancelled' },
                ]}
              />
            </div>
            <div style={{ flex: 1, minWidth: 220 }}>
              <Select
                value={customerFilter}
                onChange={(e) => setCustomerFilter(e.target.value)}
                options={[
                  { value: '', label: 'All Customers' },
                  ...customers.map((c) => ({ value: c._id, label: c.companyName })),
                ]}
              />
            </div>
          </div>

          <Table
            data={quotations}
            isLoading={isLoading}
            keyExtractor={(q) => q._id}
            columns={[
              {
                header: 'Quotation #',
                accessor: (q) => <strong>{q.quotationNo}</strong>,
              },
              {
                header: 'Date',
                accessor: (q) => new Date(q.dateOfQuotation).toLocaleDateString(),
              },
              {
                header: 'Customer',
                accessor: (q) => (typeof q.customer === 'object' ? q.customer.companyName : q.customer),
              },
              {
                header: 'ATTN',
                accessor: (q) => q.attn || '-',
              },
              {
                header: 'Subtotal',
                accessor: (q) => `AED ${q.subTotal.toFixed(2)}`,
              },
              {
                header: 'VAT',
                accessor: (q) => `AED ${q.vatAmount.toFixed(2)} (${q.vatPercent}%)`,
              },
              {
                header: 'Grand Total',
                accessor: (q) => <strong>AED {q.totalAmount.toFixed(2)}</strong>,
              },
              {
                header: 'Status',
                accessor: (q) => (
                  <Badge
                    variant={
                      q.status === 'Converted' ? 'success' : q.status === 'Cancelled' ? 'danger' : 'info'
                    }
                  >
                    {q.status}
                  </Badge>
                ),
              },
              {
                header: 'Actions',
                accessor: (q) => (
                  <div className="table-actions">
                    <button
                      className="action-icon-btn btn-view"
                      onClick={async () => { try { setViewingQuotation(await quotationService.getQuotationById(q._id)); } catch (err:any) { toast.error(err.message || 'Failed to load quotation details'); } }}
                      title="View Quotation Details"
                    >
                      <Eye size={16} />
                    </button>
                    <button className="action-icon-btn btn-view" onClick={() => setQuotationForPdf(q)} title="Quotation PDF options"><Download size={16} /></button>
                    {canModify && q.status === 'Open' && (
                      <button
                        className="action-icon-btn btn-delete"
                        onClick={() => setQuotationToCancel(q)}
                        title="Cancel Quotation"
                      >
                        <Ban size={16} />
                      </button>
                    )}
                  </div>
                ),
              },
            ]}
            emptyTitle="No quotations found"
            emptyDescription="Generate quotations to propose items and pricing to customers."
          />
        </Card>
      )}

      {(activeTab === 'customerReport' || activeTab === 'salesmanReport') && (
        <Card title={activeTab === 'customerReport' ? 'Customer Wise Quotation Report' : 'Salesman Wise Quotation Report'}>
          <div className="filter-bar">
            {activeTab === 'customerReport' ? (
              <div style={{ flex: 1, minWidth: 200 }}>
                <Select
                  label="Select Customer"
                  value={reportCustomerId}
                  onChange={(e) => setReportCustomerId(e.target.value)}
                  options={[
                    { value: '', label: 'All Customers' },
                    ...customers.map((c) => ({ value: c._id, label: c.companyName })),
                  ]}
                />
              </div>
            ) : (
              <div style={{ flex: 1, minWidth: 200 }}>
                <Select
                  label="Select Salesperson"
                  value={reportSalesPersonId}
                  onChange={(e) => setReportSalesPersonId(e.target.value)}
                  options={[
                    { value: '', label: 'All Salespersons' },
                    ...salesUsers.map((u) => ({ value: u._id, label: u.name })),
                  ]}
                />
              </div>
            )}

            <div style={{ width: 160 }}>
              <Input
                type="date"
                label="From Date"
                value={reportFrom}
                onChange={(e) => setReportFrom(e.target.value)}
              />
            </div>
            <div style={{ width: 160 }}>
              <Input
                type="date"
                label="To Date"
                value={reportTo}
                onChange={(e) => setReportTo(e.target.value)}
              />
            </div>
            <div style={{ alignSelf: 'flex-end' }}>
              <Button
                variant="primary"
                onClick={handleFetchReport}
                isLoading={isReportLoading}
                loadingText="Generating..."
              >
                Generate Report
              </Button>
            </div>
          </div>

          <Table
            data={reportQuotations}
            isLoading={isReportLoading}
            keyExtractor={(q) => q._id}
            columns={[
              { header: 'Quotation #', accessor: (q) => <strong>{q.quotationNo}</strong> },
              { header: 'Date', accessor: (q) => new Date(q.dateOfQuotation).toLocaleDateString() },
              { header: 'Customer', accessor: (q) => (typeof q.customer === 'object' ? q.customer.companyName : q.customer) },
              { header: 'Subtotal', accessor: (q) => `AED ${q.subTotal.toFixed(2)}` },
              { header: 'Discount', accessor: (q) => `AED ${q.discount.toFixed(2)}` },
              { header: 'VAT', accessor: (q) => `AED ${q.vatAmount.toFixed(2)}` },
              { header: 'Total Amount', accessor: (q) => <strong>AED {q.totalAmount.toFixed(2)}</strong> },
              { header: 'Status', accessor: (q) => <Badge variant={q.status === 'Converted' ? 'success' : q.status === 'Cancelled' ? 'danger' : 'info'}>{q.status}</Badge> },
            ]}
            emptyTitle="No quotation records found"
            emptyDescription="Choose parameters and click Generate Report."
          />
        </Card>
      )}

      {/* New Quotation Modal (matches Wireframe Page 3) */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="New Quotation (Auto-Generate PDF)"
        size="lg"
      >
        <form onSubmit={handleCreateQuotation} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="form-grid-2">
            <Select
              label="Choose Customer"
              value={selectedCustomerId}
              onChange={(e) => handleCustomerChange(e.target.value)}
              options={customers.map((c) => ({ value: c._id, label: c.companyName }))}
              isRequired
            />
            <Input
              type="date"
              label="Date of Quotation"
              value={dateOfQuotation}
              onChange={(e) => setDateOfQuotation(e.target.value)}
              isRequired
            />
          </div>

          <div className="form-grid-2">
            <Input
              label="ATTN (Defaults to Contact Person)"
              placeholder="e.g. Mr. David Clark"
              value={attn}
              onChange={(e) => setAttn(e.target.value)}
            />
            <div className="input-group">
              <label className="input-label">Quotation Number</label>
              <input
                type="text"
                className="input-field"
                value="(Auto-Generated on Save e.g. QTN-000001)"
                disabled
              />
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <label className="input-label" style={{ fontWeight: 600 }}>Products</label>
              <Button type="button" variant="outline" size="sm" icon={<Plus size={14} />} onClick={addItemRow}>
                Add Product
              </Button>
            </div>

            <div className="items-builder-table">
              <div className="items-builder-header">
                <div>Product</div>
                <div>Qty</div>
                <div>Price/Unit</div>
                <div>Total</div>
                <div></div>
              </div>

              {items.map((item, idx) => (
                <div key={idx} className="items-builder-row">
                  <Select
                    value={item.product}
                    onChange={(e) => updateItemRow(idx, 'product', e.target.value)}
                    options={products.map((p) => ({ value: p._id, label: `${p.name} (${p.itemCode})` }))}
                  />
                  <Input
                    type="number"
                    min="0.01"
                    step="any"
                    value={item.qty}
                    onChange={(e) => updateItemRow(idx, 'qty', Number(e.target.value))}
                  />
                  <Input
                    type="number"
                    min="0"
                    step="any"
                    value={item.price}
                    onChange={(e) => updateItemRow(idx, 'price', e.target.value === '' ? '' : Number(e.target.value))}
                  />
                  <div style={{ fontWeight: 600, fontSize: 'var(--font-size-sm)' }}>
                    AED {(Number(item.qty || 0) * Number(item.price || 0)).toFixed(2)}
                  </div>
                  <button
                    type="button"
                    className="action-icon-btn btn-delete"
                    onClick={() => removeItemRow(idx)}
                    disabled={items.length <= 1}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="form-grid-2" style={{ marginTop: '8px' }}>
            <Input
              type="number"
              label="Discount (Figure)"
              placeholder="Enter discount amount"
              value={discount}
              onChange={(e) => setDiscount(e.target.value === '' ? '' : Number(e.target.value))}
              min="0"
              step="any"
            />
            <Input
              type="number"
              label="VAT (%)"
              value={vatPercent}
              onChange={(e) => setVatPercent(Number(e.target.value))}
              min="0"
              step="any"
            />
          </div>

          <div className="input-group">
            <label className="input-label" htmlFor="quotation-warranty-terms">Warranty Terms</label>
            <textarea id="quotation-warranty-terms" className="input-field quotation-terms-textarea" value={warrantyTerms} onChange={(e) => setWarrantyTerms(e.target.value)} placeholder="Optional. Enter warranty terms to display on the quotation PDF." rows={3} />
          </div>

          <div className="totals-summary-card">
            <div className="totals-row">
              <span>Subtotal:</span>
              <strong>AED {subTotal.toFixed(2)}</strong>
            </div>
            {Number(discount || 0) > 0 && <div className="totals-row">
              <span>Discount (Figure):</span>
              <span>-AED {Number(discount || 0).toFixed(2)}</span>
            </div>}
            <div className="totals-row">
              <span>VAT ({vatPercent}%):</span>
              <strong>AED {vatAmount.toFixed(2)}</strong>
            </div>
            <div className="totals-row grand-total">
              <span>Grand Total:</span>
              <span>AED {grandTotal.toFixed(2)}</span>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
            <Button variant="secondary" type="button" onClick={() => setIsModalOpen(false)} disabled={isSaving}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" isLoading={isSaving} loadingText="Generating Quotation...">
              Generate Quotation (Save in PDF)
            </Button>
          </div>
        </form>
      </Modal>

      {/* View Quotation Details Modal */}
      {/* <Modal
        isOpen={!!viewingQuotation}
        onClose={() => setViewingQuotation(null)}
        title={`Quotation #${viewingQuotation?.quotationNo}`}
        size="lg"
      >
        {viewingQuotation && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="form-grid-2">
              <div>
                <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>Customer:</span>
                <div><strong>{typeof viewingQuotation.customer === 'object' ? viewingQuotation.customer.companyName : viewingQuotation.customer}</strong></div>
              </div>
              <div>
                <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>ATTN:</span>
                <div>{viewingQuotation.attn || '-'}</div>
              </div>
              <div>
                <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>Date:</span>
                <div>{new Date(viewingQuotation.dateOfQuotation).toLocaleDateString()}</div>
              </div>
              <div>
                <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>Status:</span>
                <div><Badge variant={viewingQuotation.status === 'Converted' ? 'success' : viewingQuotation.status === 'Cancelled' ? 'danger' : 'info'}>{viewingQuotation.status}</Badge></div>
              </div>
            </div>

            <Table
              data={viewingQuotation.items}
              keyExtractor={(_, i) => String(i)}
              columns={[
                {
                  header: 'Product',
                  accessor: (item) => (typeof item.product === 'object' ? item.product.name : item.product),
                },
                {
                  header: 'Quantity',
                  accessor: (item) => item.qty,
                },
                {
                  header: 'Unit Price',
                  accessor: (item) => `AED ${item.price.toFixed(2)}`,
                },
                {
                  header: 'Total Price',
                  accessor: (item) => `AED ${item.totalPrice.toFixed(2)}`,
                },
              ]}
            />

            <div className="totals-summary-card">
              <div className="totals-row">
                <span>Subtotal:</span>
                <strong>AED {viewingQuotation.subTotal.toFixed(2)}</strong>
              </div>
              {viewingQuotation.discount > 0 && <div className="totals-row">
                <span>Discount (Figure):</span>
                <span>-AED {viewingQuotation.discount.toFixed(2)}</span>
              </div>}
              <div className="totals-row">
                <span>VAT ({viewingQuotation.vatPercent}%):</span>
                <strong>AED {viewingQuotation.vatAmount.toFixed(2)}</strong>
              </div>
              <div className="totals-row grand-total">
                <span>Total:</span>
                <span>AED {viewingQuotation.totalAmount.toFixed(2)}</span>
              </div>
            </div>

            {viewingQuotation.warrantyTerms && <div className="document-terms-card"><strong>Warranty Terms</strong><p>{viewingQuotation.warrantyTerms}</p></div>}
            <div style={{ display:'flex', justifyContent:'flex-end', gap:'10px', marginTop:'8px' }}>
              <button className="btn btn-primary btn-md" onClick={() => { setViewingQuotation(null); setQuotationForPdf(viewingQuotation); }}><Download size={16}/><span>Quotation PDF</span></button>
            </div>
          </div>
        )}
      </Modal> */}


<Modal
        isOpen={!!viewingQuotation}
        onClose={() => setViewingQuotation(null)}
        title={`Quotation #${viewingQuotation?.quotationNo}`}
        size="lg"
      >
        {viewingQuotation && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="form-grid-2">
              <div>
                <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>Customer:</span>
                <div><strong>{typeof viewingQuotation.customer === 'object' ? viewingQuotation.customer.companyName : viewingQuotation.customer}</strong></div>
              </div>
              <div>
                <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>ATTN:</span>
                <div>{viewingQuotation.attn || '-'}</div>
              </div>
              <div>
                <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>Date:</span>
                <div>{new Date(viewingQuotation.dateOfQuotation).toLocaleDateString()}</div>
              </div>
              <div>
                <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>Status:</span>
                <div><Badge variant={viewingQuotation.status === 'Converted' ? 'success' : viewingQuotation.status === 'Cancelled' ? 'danger' : 'info'}>{viewingQuotation.status}</Badge></div>
              </div>
            </div>

            <Table
              data={viewingQuotation.items}
              keyExtractor={(_, i) => String(i)}
              columns={[
                {
                  header: 'Product',
                  accessor: (item) => (typeof item.product === 'object' ? item.product.name : item.product),
                },
                {
                  header: 'Quantity',
                  accessor: (item) => item.qty,
                },
                {
                  header: 'Unit Price',
                  accessor: (item) => `AED ${item.price.toFixed(2)}`,
                },
                {
                  header: 'Total Price',
                  accessor: (item) => `AED ${item.totalPrice.toFixed(2)}`,
                },
              ]}
            />

            <div className="totals-summary-card">
              <div className="totals-row">
                <span>Subtotal:</span>
                <strong>AED {viewingQuotation.subTotal.toFixed(2)}</strong>
              </div>
              {viewingQuotation.discount > 0 && <div className="totals-row">
                <span>Discount (Figure):</span>
                <span>-AED {viewingQuotation.discount.toFixed(2)}</span>
              </div>}
              <div className="totals-row">
                <span>VAT ({viewingQuotation.vatPercent}%):</span>
                <strong>AED {viewingQuotation.vatAmount.toFixed(2)}</strong>
              </div>
              <div className="totals-row grand-total">
                <span>Total:</span>
                <span>AED {viewingQuotation.totalAmount.toFixed(2)}</span>
              </div>
            </div>

            {viewingQuotation.warrantyTerms && <div className="document-terms-card"><strong>Warranty Terms</strong><p>{viewingQuotation.warrantyTerms}</p></div>}

            {/* ── E-sign & Company Stamp block ──
                Shown ONLY when the quotation's approvalStatus is 'Approved'. */}
            {/* {showEsignStamp && (
              <div className="quotation-esign-stamp-block">
                <div className="quotation-esign-stamp-inner">
                  <img src={esignImage} alt="Authorized Signature" className="quotation-esign-img" />
                  <img src={stampImage} alt="Company Stamp" className="quotation-stamp-img" />
                </div>
              </div>
            )} */}

            <div style={{ display:'flex', justifyContent:'flex-end', flexWrap:'wrap', gap:'10px', marginTop:'8px' }}>
              {/* Approve button: any open, not-yet-approved quotation can be
                  approved by an admin — this is what unlocks the e-sign/stamp
                  on the quotation PDF. */}
              {/* {user?.isAdmin && viewingQuotation.approvalStatus !== 'Approved' && viewingQuotation.status === 'Open' && (
                <button
                  className="btn btn-secondary btn-md"
                  disabled={isApproving}
                  onClick={async () => {
                    try {
                      setIsApproving(true);
                      const approved = await quotationService.approveQuotation(viewingQuotation._id);
                      setViewingQuotation(approved);
                      toast.success('Quotation approved successfully');
                      await loadData();
                    } catch (e: any) {
                      toast.error(e.message || 'Failed to approve quotation');
                    } finally {
                      setIsApproving(false);
                    }
                  }}
                >
                  <FileCheck size={16} />
                  <span>{isApproving ? 'Approving...' : 'Approve Quotation'}</span>
                </button>
              )} */}

              {user?.isAdmin && viewingQuotation.approvalStatus !== 'Approved' && (
  <button
    className="btn btn-secondary btn-md"
    disabled={isApproving}
    onClick={async () => {
      try {
        setIsApproving(true);
        const approved = await quotationService.approveQuotation(viewingQuotation._id);
        setViewingQuotation(approved);
        toast.success('Quotation approved successfully');
        await loadData();
      } catch (e: any) {
        toast.error(e.message || 'Failed to approve quotation');
      } finally {
        setIsApproving(false);
      }
    }}
  >
    <FileCheck size={16} />
    <span>{isApproving ? 'Approving...' : 'Approve Quotation'}</span>
  </button>
)}
              {viewingQuotation.approvalStatus === 'Approved' && <Badge variant="success">Admin Approved</Badge>}
              <button className="btn btn-primary btn-md" onClick={() => { setViewingQuotation(null); setQuotationForPdf(viewingQuotation); }}><Download size={16}/><span>Quotation PDF</span></button>
            </div>
          </div>
        )}
      </Modal>



      <PdfActionModal
        isOpen={!!quotationForPdf}
        onClose={() => setQuotationForPdf(null)}
        documentLabel={`Quotation #${quotationForPdf?.quotationNo || ''}`}
        fileName={quotationForPdf?.quotationNo || 'quotation'}
        generate={async (size) => {
          if (!quotationForPdf) throw new Error('Quotation not selected');
          try { return await quotationService.generateQuotationPdf(quotationForPdf._id, size); }
          catch (e: any) { toast.error(e.message || 'Failed to generate quotation PDF'); throw e; }
        }}
      />

      {/* Cancel Quotation Confirm Dialog */}
      <ConfirmDialog
        isOpen={!!quotationToCancel}
        onClose={() => setQuotationToCancel(null)}
        onConfirm={handleCancelQuotation}
        title="Cancel Quotation"
        message={`Are you sure you want to cancel Quotation #${quotationToCancel?.quotationNo}? Once cancelled, it cannot be converted into an invoice.`}
        confirmText="Cancel Quotation"
        isLoading={isCancelling}
      />
    </div>
  );
};

export default Quotations;