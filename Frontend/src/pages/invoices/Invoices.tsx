// // import React, { useEffect, useState, useCallback } from 'react';
// // import {
// //   Plus,
// //   Trash2,
// //   Download,
// //   Ban,
// //   Eye,
// //   FileCheck,
// //   Calendar,
// // } from 'lucide-react';
// // import { useAuth } from '../../context/AuthContext';
// // import { useToast } from '../../context/ToastContext';
// // import invoiceService from '../../services/invoice.service';
// // import customerService from '../../services/customer.service';
// // import productService from '../../services/product.service';
// // import quotationService from '../../services/quotation.service';
// // import userService from '../../services/user.service';
// // import { Invoice, CreateInvoicePayload } from '../../types/invoice.types';
// // import { Customer } from '../../types/customer.types';
// // import { Product } from '../../types/product.types';
// // import { Quotation } from '../../types/quotation.types';
// // import { User } from '../../types/user.types';
// // import Card from '../../components/common/card/Card';
// // import Button from '../../components/common/button/Button';
// // import Input from '../../components/common/input/Input';
// // import Select from '../../components/common/select/Select';
// // import Table from '../../components/common/table/Table';
// // import Modal from '../../components/common/modal/Modal';
// // import Badge from '../../components/common/badge/Badge';
// // import DataTransferBar from '../../components/common/data-transfer/DataTransferBar';
// // import PdfActionModal from '../../components/common/pdf/PdfActionModal';
// // import './Invoices.css';

// // interface LineItemInput {
// //   product: string;
// //   qty: number;
// //   price: number | '';
// // }

// // export const Invoices: React.FC = () => {
// //   const { user, hasPermission } = useAuth();
// //   const toast = useToast();

// //   const canCreate = hasPermission('sales', 'create');
// //   const canModify = hasPermission('sales', 'modify');
// //   const canReport = hasPermission('sales', 'report');

// //   const [activeTab, setActiveTab] = useState<'list' | 'customerReport' | 'salesmanReport'>('list');
// //   const [invoices, setInvoices] = useState<Invoice[]>([]);
// //   const [customers, setCustomers] = useState<Customer[]>([]);
// //   const [products, setProducts] = useState<Product[]>([]);
// //   const [openQuotations, setOpenQuotations] = useState<Quotation[]>([]);
// //   const [salesUsers, setSalesUsers] = useState<User[]>([]);
// //   const [isLoading, setIsLoading] = useState(false);

// //   // Filters
// //   const [statusFilter, setStatusFilter] = useState('');
// //   const [paymentStatusFilter, setPaymentStatusFilter] = useState('');
// //   const [customerFilter, setCustomerFilter] = useState('');

// //   // New Invoice Modal State
// //   const [isModalOpen, setIsModalOpen] = useState(false);
// //   const [isSaving, setIsSaving] = useState(false);
// //   const [creationMode, setCreationMode] = useState<'direct' | 'fromQuotation'>('direct');
// //   const [selectedQuotationId, setSelectedQuotationId] = useState('');

// //   // Form Fields
// //   const [selectedCustomerId, setSelectedCustomerId] = useState('');
// //   const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
// //   const [discount, setDiscount] = useState<number | ''>('');
// //   const [vatPercent, setVatPercent] = useState<number>(5);
// //   const [items, setItems] = useState<LineItemInput[]>([
// //     { product: '', qty: 1, price: '' },
// //   ]);

// //   // View / Cancel Dialog
// //   const [viewingInvoice, setViewingInvoice] = useState<Invoice | null>(null);
// //   const [invoiceToCancel, setInvoiceToCancel] = useState<Invoice | null>(null);
// //   const [cancelReason, setCancelReason] = useState('');
// //   const [isCancelling, setIsCancelling] = useState(false);
// //   const [invoiceForPdf, setInvoiceForPdf] = useState<Invoice | null>(null);
// //   const [paymentTerms, setPaymentTerms] = useState('');
// //   const [isApproving, setIsApproving] = useState(false);

// //   // Reports State
// //   const [reportCustomerId, setReportCustomerId] = useState('');
// //   const [reportSalesPersonId, setReportSalesPersonId] = useState('');
// //   const [reportFrom, setReportFrom] = useState('');
// //   const [reportTo, setReportTo] = useState('');
// //   const [reportInvoices, setReportInvoices] = useState<Invoice[]>([]);
// //   const [isReportLoading, setIsReportLoading] = useState(false);

// //   const loadData = useCallback(async () => {
// //     setIsLoading(true);
// //     try {
// //       const [invList, cList, pList, qList] = await Promise.all([
// //         invoiceService.getAllInvoices(statusFilter || undefined, customerFilter || undefined),
// //         customerService.getAllCustomers(),
// //         productService.getAllProducts(),
// //         invoiceService.getOpenQuotations(),
// //       ]);
// //       setInvoices(invList);
// //       setCustomers(cList);
// //       setProducts(pList);
// //       setOpenQuotations(qList);

// //       if (user?.isAdmin) {
// //         userService.getAllUsers().then(setSalesUsers).catch(() => []);
// //       }
// //     } catch (err: any) {
// //       toast.error(err.message || 'Failed to load invoices');
// //     } finally {
// //       setIsLoading(false);
// //     }
// //   }, [statusFilter, customerFilter, user?.isAdmin, toast]);

// //   useEffect(() => {
// //     loadData();
// //   }, [loadData]);

// //   const filteredInvoices = paymentStatusFilter
// //     ? invoices.filter((invoice) => invoice.paymentStatus === paymentStatusFilter)
// //     : invoices;

// //   // When quotation is picked in "fromQuotation" mode, auto-populate everything!
// //   const handlePickQuotation = (qId: string) => {
// //     setSelectedQuotationId(qId);
// //     const q = openQuotations.find((item) => item._id === qId);
// //     if (!q) return;

// //     const custId = typeof q.customer === 'object' ? q.customer._id : q.customer;
// //     setSelectedCustomerId(custId);
// //     setDiscount(q.discount > 0 ? q.discount : '');
// //     setVatPercent(q.vatPercent || 5);

// //     const populatedItems: LineItemInput[] = q.items.map((item) => ({
// //       product: typeof item.product === 'object' ? item.product._id : item.product,
// //       qty: item.qty,
// //       price: item.price,
// //     }));
// //     setItems(populatedItems);
// //   };

// //   const addItemRow = () => {
// //     setItems((prev) => [...prev, { product: products[0]?._id || '', qty: 1, price: '' }]);
// //   };

// //   const removeItemRow = (index: number) => {
// //     if (items.length <= 1) return;
// //     setItems((prev) => prev.filter((_, i) => i !== index));
// //   };

// //   const updateItemRow = (index: number, field: keyof LineItemInput, val: any) => {
// //     setItems((prev) => {
// //       const updated = [...prev];
// //       updated[index] = { ...updated[index], [field]: val };
// //       return updated;
// //     });
// //   };

// //   // Calculations
// //   const subTotal = items.reduce((sum, item) => sum + Number(item.qty || 0) * Number(item.price || 0), 0);
// //   const discountedSubtotal = Math.max(0, subTotal - (discount || 0));
// //   const vatAmount = (discountedSubtotal * (vatPercent || 0)) / 100;
// //   const grandTotal = discountedSubtotal + vatAmount;

// //   const handleCreateInvoice = async (e: React.FormEvent) => {
// //     e.preventDefault();
// //     if (!selectedCustomerId) {
// //       toast.error('Please select a customer');
// //       return;
// //     }
// //     if (items.some((i) => !i.product || i.qty <= 0 || i.price === '' || Number(i.price) < 0)) {
// //       toast.error('Please specify valid items with positive quantity and price');
// //       return;
// //     }

// //     setIsSaving(true);
// //     try {
// //       let created: Invoice;
// //       if (creationMode === 'fromQuotation') {
// //         if (!selectedQuotationId) {
// //           toast.warning('Please select a quotation to convert');
// //           setIsSaving(false);
// //           return;
// //         }
// //         created = await invoiceService.createInvoiceFromQuotation(selectedQuotationId, paymentTerms.trim() || undefined);
// //       } else {
// //         const payload: CreateInvoicePayload = {
// //           customer: selectedCustomerId,
// //           invoiceDate,
// //           items: items.map((i) => ({ ...i, price: Number(i.price) })),
// //           paymentTerms: paymentTerms.trim() || undefined,
// //           discount: Number(discount) || 0,
// //           vatPercent: Number(vatPercent) || 0,
// //         };
// //         created = await invoiceService.createInvoice(payload);
// //       }
// //       toast.success(`Invoice ${created.invoiceNo} generated with PDF copy!`);
// //       setIsModalOpen(false);
// //       loadData();
// //     } catch (err: any) {
// //       toast.error(err.message || 'Failed to create invoice');
// //     } finally {
// //       setIsSaving(false);
// //     }
// //   };

// //   const handleCancelInvoice = async () => {
// //     if (!invoiceToCancel) return;
// //     if (!cancelReason.trim()) {
// //       toast.warning('Please enter a cancellation reason');
// //       return;
// //     }
// //     setIsCancelling(true);
// //     try {
// //       await invoiceService.cancelInvoice(invoiceToCancel._id, cancelReason.trim());
// //       toast.success('Invoice cancelled successfully');
// //       setInvoiceToCancel(null);
// //       setCancelReason('');
// //       loadData();
// //     } catch (err: any) {
// //       toast.error(err.message || 'Failed to cancel invoice');
// //     } finally {
// //       setIsCancelling(false);
// //     }
// //   };

// //   const handleFetchReport = async () => {
// //     setIsReportLoading(true);
// //     try {
// //       if (activeTab === 'customerReport') {
// //         if (!reportCustomerId) {
// //           toast.warning('Please select a customer');
// //           return;
// //         }
// //         const data = await invoiceService.getCustomerWiseSalesReport(
// //           reportCustomerId,
// //           reportFrom || undefined,
// //           reportTo || undefined
// //         );
// //         setReportInvoices(data);
// //       } else if (activeTab === 'salesmanReport') {
// //         if (!reportSalesPersonId) {
// //           toast.warning('Please select a salesperson');
// //           return;
// //         }
// //         const data = await invoiceService.getSalesmanWiseSalesReport(
// //           reportSalesPersonId,
// //           reportFrom || undefined,
// //           reportTo || undefined
// //         );
// //         setReportInvoices(data);
// //       }
// //     } catch (err: any) {
// //       toast.error(err.message || 'Failed to fetch sales report');
// //     } finally {
// //       setIsReportLoading(false);
// //     }
// //   };

// //   return (
// //     <div className="invoices-page" id="invoices-page">
// //       <div className="page-header">
// //         <div>
// //           <h1 className="page-title">Sales & Invoices</h1>
// //           <p className="page-subtitle">Commercial billing, quotation conversions, and accounts receivable</p>
// //         </div>
// //         {canCreate && (
// //           <Button
// //             variant="primary"
// //             icon={<Plus size={16} />}
// //             onClick={() => {
// //               if (customers.length === 0) {
// //                 toast.warning('Please create a customer first');
// //                 return;
// //               }
// //               if (products.length === 0) {
// //                 toast.warning('Please create a product first');
// //                 return;
// //               }
// //               setCreationMode('direct');
// //               setSelectedCustomerId(customers[0]._id);
// //               setSelectedQuotationId('');
// //               setItems([{ product: products[0]._id, qty: 1, price: '' }]);
// //               setDiscount('');
// //               setPaymentTerms('');
// //               setIsModalOpen(true);
// //             }}
// //             id="btn-new-invoice"
// //           >
// //             Generate Invoice
// //           </Button>
// //         )}
// //       </div>

// //       <DataTransferBar module="invoices" onImported={() => void loadData()} />

// //       <div className="page-tabs">
// //         <button
// //           className={`page-tab-btn ${activeTab === 'list' ? 'active' : ''}`}
// //           onClick={() => setActiveTab('list')}
// //         >
// //           <span className="aed-symbol" aria-label="AED">د.إ</span>
// //           <span>All Invoices</span>
// //         </button>
// //         {canReport && (
// //           <>
// //             <button
// //               className={`page-tab-btn ${activeTab === 'customerReport' ? 'active' : ''}`}
// //               onClick={() => setActiveTab('customerReport')}
// //             >
// //               <span>Customer-Wise Sales Report</span>
// //             </button>
// //             <button
// //               className={`page-tab-btn ${activeTab === 'salesmanReport' ? 'active' : ''}`}
// //               onClick={() => setActiveTab('salesmanReport')}
// //             >
// //               <span>Salesman-Wise Sales Report</span>
// //             </button>
// //           </>
// //         )}
// //       </div>

// //       {activeTab === 'list' && (
// //         <Card>
// //           <div className="filter-bar">
// //             <div style={{ width: 180 }}>
// //               <Select
// //                 value={paymentStatusFilter}
// //                 onChange={(e) => setPaymentStatusFilter(e.target.value)}
// //                 options={[
// //                   { value: '', label: 'All Payment Statuses' },
// //                   { value: 'Unpaid', label: 'Unpaid' },
// //                   { value: 'Partially Paid', label: 'Partially Paid' },
// //                   { value: 'Paid', label: 'Fully Paid' },
// //                 ]}
// //               />
// //             </div>
// //             <div style={{ width: 160 }}>
// //               <Select
// //                 value={statusFilter}
// //                 onChange={(e) => setStatusFilter(e.target.value)}
// //                 options={[
// //                   { value: '', label: 'All Statuses' },
// //                   { value: 'Active', label: 'Active' },
// //                   { value: 'Cancelled', label: 'Cancelled' },
// //                 ]}
// //               />
// //             </div>
// //             <div style={{ flex: 1, minWidth: 200 }}>
// //               <Select
// //                 value={customerFilter}
// //                 onChange={(e) => setCustomerFilter(e.target.value)}
// //                 options={[
// //                   { value: '', label: 'All Customers' },
// //                   ...customers.map((c) => ({ value: c._id, label: c.companyName })),
// //                 ]}
// //               />
// //             </div>
// //           </div>

// //           <Table
// //             data={filteredInvoices}
// //             isLoading={isLoading}
// //             keyExtractor={(i) => i._id}
// //             columns={[
// //               {
// //                 header: 'Invoice #',
// //                 accessor: (i) => <strong>{i.invoiceNo}</strong>,
// //               },
// //               {
// //                 header: 'Date',
// //                 accessor: (i) => new Date(i.invoiceDate).toLocaleDateString(),
// //               },
// //               {
// //                 header: 'Customer',
// //                 accessor: (i) => (typeof i.customer === 'object' ? i.customer.companyName : i.customer),
// //               },
// //               {
// //                 header: 'Total Amount',
// //                 accessor: (i) => `AED ${i.totalAmount.toFixed(2)}`,
// //               },
// //               {
// //                 header: 'Paid',
// //                 accessor: (i) => `AED ${i.paidAmount.toFixed(2)}`,
// //               },
// //               {
// //                 header: 'Balance Due',
// //                 accessor: (i) => (
// //                   <strong style={{ color: i.balanceAmount > 0 ? 'var(--color-danger)' : 'var(--color-success)' }}>
// //                     AED {i.balanceAmount.toFixed(2)}
// //                   </strong>
// //                 ),
// //               },
// //               {
// //                 header: 'Payment Status',
// //                 accessor: (i) => (
// //                   <Badge
// //                     variant={
// //                       i.paymentStatus === 'Paid'
// //                         ? 'success'
// //                         : i.paymentStatus === 'Partially Paid'
// //                         ? 'warning'
// //                         : 'neutral'
// //                     }
// //                   >
// //                     {i.paymentStatus}
// //                   </Badge>
// //                 ),
// //               },
// //               {
// //                 header: 'Status',
// //                 accessor: (i) => (
// //                   <Badge variant={i.status === 'Active' ? 'info' : 'danger'}>{i.status}</Badge>
// //                 ),
// //               },
// //               {
// //                 header: 'Actions',
// //                 accessor: (i) => (
// //                   <div className="table-actions">
// //                     <button
// //                       className="action-icon-btn btn-view"
// //                       onClick={async () => { try { setViewingInvoice(await invoiceService.getInvoiceById(i._id)); } catch (err:any) { toast.error(err.message || 'Failed to load invoice details'); } }}
// //                       title="View Invoice Details"
// //                     >
// //                       <Eye size={16} />
// //                     </button>
// //                     <button
// //                       className="action-icon-btn btn-view"
// //                       onClick={() => setInvoiceForPdf(i)}
// //                       title="Download Invoice PDF"
// //                     >
// //                       <Download size={16} />
// //                     </button>
// //                     {canModify && i.status === 'Active' && i.paidAmount === 0 && (
// //                       <button
// //                         className="action-icon-btn btn-delete"
// //                         onClick={() => setInvoiceToCancel(i)}
// //                         title="Cancel Invoice"
// //                       >
// //                         <Ban size={16} />
// //                       </button>
// //                     )}
// //                   </div>
// //                 ),
// //               },
// //             ]}
// //             emptyTitle="No invoices found"
// //             emptyDescription="Generate invoices directly or convert open quotations."
// //           />
// //         </Card>
// //       )}

// //       {(activeTab === 'customerReport' || activeTab === 'salesmanReport') && (
// //         <Card title={activeTab === 'customerReport' ? 'Customer-Wise Sales Report' : 'Salesman-Wise Sales Report'}>
// //           <div className="filter-bar">
// //             {activeTab === 'customerReport' ? (
// //               <div style={{ flex: 1, minWidth: 200 }}>
// //                 <Select
// //                   label="Select Customer"
// //                   value={reportCustomerId}
// //                   onChange={(e) => setReportCustomerId(e.target.value)}
// //                   options={[
// //                     { value: '', label: '-- Choose Customer --' },
// //                     ...customers.map((c) => ({ value: c._id, label: c.companyName })),
// //                   ]}
// //                 />
// //               </div>
// //             ) : (
// //               <div style={{ flex: 1, minWidth: 200 }}>
// //                 <Select
// //                   label="Select Salesperson"
// //                   value={reportSalesPersonId}
// //                   onChange={(e) => setReportSalesPersonId(e.target.value)}
// //                   options={[
// //                     { value: '', label: '-- Choose Salesperson --' },
// //                     ...salesUsers.map((u) => ({ value: u._id, label: u.name })),
// //                   ]}
// //                 />
// //               </div>
// //             )}

// //             <div style={{ width: 160 }}>
// //               <Input
// //                 type="date"
// //                 label="From Date"
// //                 value={reportFrom}
// //                 onChange={(e) => setReportFrom(e.target.value)}
// //               />
// //             </div>
// //             <div style={{ width: 160 }}>
// //               <Input
// //                 type="date"
// //                 label="To Date"
// //                 value={reportTo}
// //                 onChange={(e) => setReportTo(e.target.value)}
// //               />
// //             </div>
// //             <div style={{ alignSelf: 'flex-end' }}>
// //               <Button
// //                 variant="primary"
// //                 onClick={handleFetchReport}
// //                 isLoading={isReportLoading}
// //                 loadingText="Generating..."
// //               >
// //                 Generate Report
// //               </Button>
// //             </div>
// //           </div>

// //           <Table
// //             data={reportInvoices}
// //             isLoading={isReportLoading}
// //             keyExtractor={(i) => i._id}
// //             columns={[
// //               { header: 'Invoice #', accessor: (i) => <strong>{i.invoiceNo}</strong> },
// //               { header: 'Date', accessor: (i) => new Date(i.invoiceDate).toLocaleDateString() },
// //               { header: 'Customer', accessor: (i) => (typeof i.customer === 'object' ? i.customer.companyName : i.customer) },
// //               { header: 'Total Amount', accessor: (i) => `AED ${i.totalAmount.toFixed(2)}` },
// //               { header: 'Paid Amount', accessor: (i) => `AED ${i.paidAmount.toFixed(2)}` },
// //               { header: 'Balance Due', accessor: (i) => <strong>AED {i.balanceAmount.toFixed(2)}</strong> },
// //               { header: 'Payment Status', accessor: (i) => <Badge variant={i.paymentStatus === 'Paid' ? 'success' : i.paymentStatus === 'Partially Paid' ? 'warning' : 'neutral'}>{i.paymentStatus}</Badge> },
// //             ]}
// //             emptyTitle="No sales records found"
// //             emptyDescription="Choose parameters and click Generate Report."
// //           />
// //         </Card>
// //       )}

// //       {/* Generate Invoice Modal (matches Wireframe Page 4) */}
// //       <Modal
// //         isOpen={isModalOpen}
// //         onClose={() => setIsModalOpen(false)}
// //         title="Generate Invoice (Auto-Save PDF)"
// //         size="lg"
// //       >
// //         <div className="invoice-mode-picker">
// //           <button
// //             type="button"
// //             className={`invoice-mode-choice ${creationMode === 'direct' ? 'active' : ''}`}
// //             onClick={() => setCreationMode('direct')}
// //           >
// //             Direct Invoice Creation
// //           </button>
// //           <button
// //             type="button"
// //             className={`invoice-mode-choice ${creationMode === 'fromQuotation' ? 'active' : ''}`}
// //             onClick={() => setCreationMode('fromQuotation')}
// //           >
// //             Convert from Quotation (Wireframe Item 1)
// //           </button>
// //         </div>

// //         <form onSubmit={handleCreateInvoice} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
// //           {creationMode === 'fromQuotation' && (
// //             <Select
// //               label="Choose Quotation to Convert"
// //               value={selectedQuotationId}
// //               onChange={(e) => handlePickQuotation(e.target.value)}
// //               options={[
// //                 { value: '', label: '-- Select Open Quotation --' },
// //                 ...openQuotations.map((q) => ({
// //                   value: q._id,
// //                   label: `${q.quotationNo} - ${typeof q.customer === 'object' ? q.customer.companyName : 'Customer'} (AED ${q.totalAmount.toFixed(2)})`,
// //                 })),
// //               ]}
// //               isRequired
// //             />
// //           )}

// //           <div className="form-grid-2">
// //             <Select
// //               label="Customer"
// //               value={selectedCustomerId}
// //               onChange={(e) => setSelectedCustomerId(e.target.value)}
// //               options={customers.map((c) => ({ value: c._id, label: c.companyName }))}
// //               isRequired
// //             />
// //             <Input
// //               type="date"
// //               label="Invoice Date"
// //               value={invoiceDate}
// //               onChange={(e) => setInvoiceDate(e.target.value)}
// //               isRequired
// //             />
// //           </div>

// //           <div>
// //             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
// //               <label className="input-label" style={{ fontWeight: 600 }}>Invoice Products</label>
// //               <Button type="button" variant="outline" size="sm" icon={<Plus size={14} />} onClick={addItemRow}>
// //                 Add Product
// //               </Button>
// //             </div>

// //             <div className="items-builder-table">
// //               <div className="items-builder-header">
// //                 <div>Product</div>
// //                 <div>Qty</div>
// //                 <div>Price/Unit</div>
// //                 <div>Total</div>
// //                 <div></div>
// //               </div>

// //               {items.map((item, idx) => (
// //                 <div key={idx} className="items-builder-row">
// //                   <Select
// //                     value={item.product}
// //                     onChange={(e) => updateItemRow(idx, 'product', e.target.value)}
// //                     options={products.map((p) => ({ value: p._id, label: `${p.name} (${p.itemCode})` }))}
// //                   />
// //                   <Input
// //                     type="number"
// //                     min="0.01"
// //                     step="any"
// //                     value={item.qty}
// //                     onChange={(e) => updateItemRow(idx, 'qty', Number(e.target.value))}
// //                   />
// //                   <Input
// //                     type="number"
// //                     min="0"
// //                     step="any"
// //                     value={item.price}
// //                     onChange={(e) => updateItemRow(idx, 'price', e.target.value === '' ? '' : Number(e.target.value))}
// //                   />
// //                   <div style={{ fontWeight: 600, fontSize: 'var(--font-size-sm)' }}>
// //                     AED {(Number(item.qty || 0) * Number(item.price || 0)).toFixed(2)}
// //                   </div>
// //                   <button
// //                     type="button"
// //                     className="action-icon-btn btn-delete"
// //                     onClick={() => removeItemRow(idx)}
// //                     disabled={items.length <= 1}
// //                   >
// //                     <Trash2 size={16} />
// //                   </button>
// //                 </div>
// //               ))}
// //             </div>
// //           </div>

// //           <div className="form-grid-2" style={{ marginTop: '8px' }}>
// //             <Input
// //               type="number"
// //               label="Discount (Figure)"
// //               placeholder="Enter discount amount"
// //               value={discount}
// //               onChange={(e) => setDiscount(e.target.value === '' ? '' : Number(e.target.value))}
// //               min="0"
// //               step="any"
// //             />
// //             <Input
// //               type="number"
// //               label="VAT (%)"
// //               value={vatPercent}
// //               onChange={(e) => setVatPercent(Number(e.target.value))}
// //               min="0"
// //               step="any"
// //             />
// //           </div>

// //           <div className="input-group">
// //             <label className="input-label" htmlFor="invoice-payment-terms">Payment Terms</label>
// //             <textarea id="invoice-payment-terms" className="input-field invoice-terms-textarea" value={paymentTerms} onChange={(e) => setPaymentTerms(e.target.value)} placeholder="Optional. Enter payment terms to display on the invoice PDF." rows={3} />
// //           </div>

// //           <div className="totals-summary-card">
// //             <div className="totals-row">
// //               <span>Subtotal:</span>
// //               <strong>AED {subTotal.toFixed(2)}</strong>
// //             </div>
// //             {Number(discount || 0) > 0 && <div className="totals-row">
// //               <span>Discount (Figure):</span>
// //               <span>-AED {Number(discount || 0).toFixed(2)}</span>
// //             </div>}
// //             <div className="totals-row">
// //               <span>VAT ({vatPercent}%):</span>
// //               <strong>AED {vatAmount.toFixed(2)}</strong>
// //             </div>
// //             <div className="totals-row grand-total">
// //               <span>Invoice Total:</span>
// //               <span>AED {grandTotal.toFixed(2)}</span>
// //             </div>
// //           </div>

// //           <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
// //             <Button variant="secondary" type="button" onClick={() => setIsModalOpen(false)} disabled={isSaving}>
// //               Cancel
// //             </Button>
// //             <Button variant="primary" type="submit" isLoading={isSaving} loadingText="Generating Invoice...">
// //               Generate Invoice (Save in PDF)
// //             </Button>
// //           </div>
// //         </form>
// //       </Modal>

// //       {/* View Invoice Details Modal */}
// //       <Modal
// //         isOpen={!!viewingInvoice}
// //         onClose={() => setViewingInvoice(null)}
// //         title={`Invoice #${viewingInvoice?.invoiceNo}`}
// //         size="lg"
// //       >
// //         {viewingInvoice && (
// //           <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
// //             <div className="form-grid-2">
// //               <div>
// //                 <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>Customer:</span>
// //                 <div><strong>{typeof viewingInvoice.customer === 'object' ? viewingInvoice.customer.companyName : viewingInvoice.customer}</strong></div>
// //               </div>
// //               <div>
// //                 <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>Invoice Date:</span>
// //                 <div>{new Date(viewingInvoice.invoiceDate).toLocaleDateString()}</div>
// //               </div>
// //               <div>
// //                 <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>Payment Status:</span>
// //                 <div>
// //                   <Badge variant={viewingInvoice.paymentStatus === 'Paid' ? 'success' : viewingInvoice.paymentStatus === 'Partially Paid' ? 'warning' : 'neutral'}>
// //                     {viewingInvoice.paymentStatus}
// //                   </Badge>
// //                 </div>
// //               </div>
// //               <div>
// //                 <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>Invoice Status:</span>
// //                 <div>
// //                   <Badge variant={viewingInvoice.status === 'Active' ? 'info' : 'danger'}>
// //                     {viewingInvoice.status}
// //                   </Badge>
// //                 </div>
// //               </div>
// //             </div>

// //             <Table
// //               data={viewingInvoice.items}
// //               keyExtractor={(_, i) => String(i)}
// //               columns={[
// //                 {
// //                   header: 'Product',
// //                   accessor: (item) => (typeof item.product === 'object' ? item.product.name : item.product),
// //                 },
// //                 {
// //                   header: 'Quantity',
// //                   accessor: (item) => item.qty,
// //                 },
// //                 {
// //                   header: 'Unit Price',
// //                   accessor: (item) => `AED ${item.price.toFixed(2)}`,
// //                 },
// //                 {
// //                   header: 'Total Price',
// //                   accessor: (item) => `AED ${item.totalPrice.toFixed(2)}`,
// //                 },
// //               ]}
// //             />

// //             <div className="totals-summary-card">
// //               <div className="totals-row">
// //                 <span>Subtotal:</span>
// //                 <strong>AED {viewingInvoice.subTotal.toFixed(2)}</strong>
// //               </div>
// //               {viewingInvoice.discount > 0 && <div className="totals-row">
// //                 <span>Discount (Figure):</span>
// //                 <span>-AED {viewingInvoice.discount.toFixed(2)}</span>
// //               </div>}
// //               <div className="totals-row">
// //                 <span>VAT ({viewingInvoice.vatPercent}%):</span>
// //                 <strong>AED {viewingInvoice.vatAmount.toFixed(2)}</strong>
// //               </div>
// //               <div className="totals-row">
// //                 <span>Total Amount:</span>
// //                 <strong>AED {viewingInvoice.totalAmount.toFixed(2)}</strong>
// //               </div>
// //               <div className="totals-row">
// //                 <span>Paid So Far:</span>
// //                 <span style={{ color: 'var(--color-success)' }}>AED {viewingInvoice.paidAmount.toFixed(2)}</span>
// //               </div>
// //               <div className="totals-row grand-total">
// //                 <span>Remaining Balance:</span>
// //                 <span style={{ color: viewingInvoice.balanceAmount > 0 ? 'var(--color-danger)' : 'var(--color-success)' }}>
// //                   AED {viewingInvoice.balanceAmount.toFixed(2)}
// //                 </span>
// //               </div>
// //             </div>

// //             {viewingInvoice.paymentTerms && <div className="document-terms-card"><strong>Payment Terms</strong><p>{viewingInvoice.paymentTerms}</p></div>}
// //             <div style={{ display:'flex', justifyContent:'flex-end', flexWrap:'wrap', gap:'10px', marginTop:'8px' }}>
// //               {user?.isAdmin && viewingInvoice.approvalStatus !== 'Approved' && viewingInvoice.status === 'Active' && <button className="btn btn-secondary btn-md" disabled={isApproving} onClick={async () => { try { setIsApproving(true); const approved = await invoiceService.approveInvoice(viewingInvoice._id); setViewingInvoice(approved); toast.success('Invoice approved successfully'); await loadData(); } catch(e:any){ toast.error(e.message || 'Failed to approve invoice'); } finally { setIsApproving(false); } }}><FileCheck size={16}/><span>{isApproving ? 'Approving...' : 'Approve Invoice'}</span></button>}
// //               {viewingInvoice.approvalStatus === 'Approved' && <Badge variant="success">Admin Approved</Badge>}
// //               <button className="btn btn-primary btn-md" onClick={() => { setViewingInvoice(null); setInvoiceForPdf(viewingInvoice); }}><Download size={16}/><span>Invoice PDF</span></button>
// //             </div>
// //           </div>
// //         )}
// //       </Modal>

// //       <PdfActionModal
// //         isOpen={!!invoiceForPdf}
// //         onClose={() => setInvoiceForPdf(null)}
// //         documentLabel={`Invoice #${invoiceForPdf?.invoiceNo || ''}`}
// //         fileName={invoiceForPdf?.invoiceNo || 'invoice'}
// //         generate={async (size) => {
// //           if (!invoiceForPdf) throw new Error('Invoice not selected');
// //           try { return await invoiceService.generateInvoicePdf(invoiceForPdf._id, size); }
// //           catch (e: any) { toast.error(e.message || 'Failed to generate invoice PDF'); throw e; }
// //         }}
// //       />

// //       {/* Cancel Invoice with mandatory reason */}
// //       <Modal
// //         isOpen={!!invoiceToCancel}
// //         onClose={() => { if (!isCancelling) { setInvoiceToCancel(null); setCancelReason(''); } }}
// //         title="Cancel Invoice"
// //         size="sm"
// //       >
// //         <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
// //           <p style={{ margin: 0, color: 'var(--text-secondary)' }}>
// //             Cancel Invoice #{invoiceToCancel?.invoiceNo}. This action cannot be reversed.
// //           </p>
// //           <Input
// //             label="Cancellation Reason"
// //             value={cancelReason}
// //             onChange={(e) => setCancelReason(e.target.value)}
// //             placeholder="Enter reason for cancellation"
// //             isRequired
// //           />
// //           <div className="modal-actions">
// //             <Button
// //               type="button"
// //               variant="secondary"
// //               onClick={() => { setInvoiceToCancel(null); setCancelReason(''); }}
// //               disabled={isCancelling}
// //             >
// //               Keep Invoice
// //             </Button>
// //             <Button
// //               type="button"
// //               variant="danger"
// //               onClick={handleCancelInvoice}
// //               isLoading={isCancelling}
// //               loadingText="Cancelling..."
// //               disabled={!cancelReason.trim()}
// //             >
// //               Cancel Invoice
// //             </Button>
// //           </div>
// //         </div>
// //       </Modal>
// //     </div>
// //   );
// // };

// // export default Invoices;


// import React, { useEffect, useState, useCallback } from 'react';
// import {
//   Plus,
//   Trash2,
//   Download,
//   Ban,
//   Eye,
//   FileCheck,
//   Calendar,
// } from 'lucide-react';
// import { useAuth } from '../../context/AuthContext';
// import { useToast } from '../../context/ToastContext';
// import invoiceService from '../../services/invoice.service';
// import customerService from '../../services/customer.service';
// import productService from '../../services/product.service';
// import quotationService from '../../services/quotation.service';
// import userService from '../../services/user.service';
// import { Invoice, CreateInvoicePayload } from '../../types/invoice.types';
// import { Customer } from '../../types/customer.types';
// import { Product } from '../../types/product.types';
// import { Quotation } from '../../types/quotation.types';
// import { User } from '../../types/user.types';
// import Card from '../../components/common/card/Card';
// import Button from '../../components/common/button/Button';
// import Input from '../../components/common/input/Input';
// import Select from '../../components/common/select/Select';
// import Table from '../../components/common/table/Table';
// import Modal from '../../components/common/modal/Modal';
// import Badge from '../../components/common/badge/Badge';
// import DataTransferBar from '../../components/common/data-transfer/DataTransferBar';
// import PdfActionModal from '../../components/common/pdf/PdfActionModal';
// import './Invoices.css';

// interface LineItemInput {
//   product: string;
//   qty: number;
//   price: number | '';
// }

// export const Invoices: React.FC = () => {
//   const { user, hasPermission } = useAuth();
//   const toast = useToast();

//   const canCreate = hasPermission('sales', 'create');
//   const canModify = hasPermission('sales', 'modify');
//   const canReport = hasPermission('sales', 'report');

//   const [activeTab, setActiveTab] = useState<'list' | 'customerReport' | 'salesmanReport'>('list');
//   const [invoices, setInvoices] = useState<Invoice[]>([]);
//   const [customers, setCustomers] = useState<Customer[]>([]);
//   const [products, setProducts] = useState<Product[]>([]);
//   const [openQuotations, setOpenQuotations] = useState<Quotation[]>([]);
//   const [salesUsers, setSalesUsers] = useState<User[]>([]);
//   const [isLoading, setIsLoading] = useState(false);

//   // Filters
//   const [statusFilter, setStatusFilter] = useState('');
//   const [paymentStatusFilter, setPaymentStatusFilter] = useState('');
//   const [customerFilter, setCustomerFilter] = useState('');

//   // New Invoice Modal State
//   const [isModalOpen, setIsModalOpen] = useState(false);
//   const [isSaving, setIsSaving] = useState(false);
//   const [creationMode, setCreationMode] = useState<'direct' | 'fromQuotation'>('direct');
//   const [selectedQuotationId, setSelectedQuotationId] = useState('');

//   // Form Fields
//   const [selectedCustomerId, setSelectedCustomerId] = useState('');
//   const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
//   const [discount, setDiscount] = useState<number | ''>('');
//   const [vatPercent, setVatPercent] = useState<number>(5);
//   const [items, setItems] = useState<LineItemInput[]>([
//     { product: '', qty: 1, price: '' },
//   ]);

//   // View / Cancel Dialog
//   const [viewingInvoice, setViewingInvoice] = useState<Invoice | null>(null);
//   const [invoiceToCancel, setInvoiceToCancel] = useState<Invoice | null>(null);
//   const [cancelReason, setCancelReason] = useState('');
//   const [isCancelling, setIsCancelling] = useState(false);
//   const [invoiceForPdf, setInvoiceForPdf] = useState<Invoice | null>(null);
//   const [paymentTerms, setPaymentTerms] = useState('');
//   const [isApproving, setIsApproving] = useState(false);

//   // Reports State
//   const [reportCustomerId, setReportCustomerId] = useState('');
//   const [reportSalesPersonId, setReportSalesPersonId] = useState('');
//   const [reportFrom, setReportFrom] = useState('');
//   const [reportTo, setReportTo] = useState('');
//   const [reportInvoices, setReportInvoices] = useState<Invoice[]>([]);
//   const [isReportLoading, setIsReportLoading] = useState(false);

//   const loadData = useCallback(async () => {
//     setIsLoading(true);
//     try {
//       const [invList, cList, pList, qList] = await Promise.all([
//         invoiceService.getAllInvoices(statusFilter || undefined, customerFilter || undefined),
//         customerService.getAllCustomers(),
//         productService.getAllProducts(),
//         invoiceService.getOpenQuotations(),
//       ]);
//       setInvoices(invList);
//       setCustomers(cList);
//       setProducts(pList);
//       setOpenQuotations(qList);

//       if (user?.isAdmin) {
//         userService.getAllUsers().then(setSalesUsers).catch(() => []);
//       }
//     } catch (err: any) {
//       toast.error(err.message || 'Failed to load invoices');
//     } finally {
//       setIsLoading(false);
//     }
//   }, [statusFilter, customerFilter, user?.isAdmin, toast]);

//   useEffect(() => {
//     loadData();
//   }, [loadData]);

//   const filteredInvoices = paymentStatusFilter
//     ? invoices.filter((invoice) => invoice.paymentStatus === paymentStatusFilter)
//     : invoices;

//   // When quotation is picked in "fromQuotation" mode, auto-populate everything!
//   const handlePickQuotation = (qId: string) => {
//     setSelectedQuotationId(qId);
//     const q = openQuotations.find((item) => item._id === qId);
//     if (!q) return;

//     const custId = typeof q.customer === 'object' ? q.customer._id : q.customer;
//     setSelectedCustomerId(custId);
//     setDiscount(q.discount > 0 ? q.discount : '');
//     setVatPercent(q.vatPercent || 5);

//     const populatedItems: LineItemInput[] = q.items.map((item) => ({
//       product: typeof item.product === 'object' ? item.product._id : item.product,
//       qty: item.qty,
//       price: item.price,
//     }));
//     setItems(populatedItems);
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

//   const handleCreateInvoice = async (e: React.FormEvent) => {
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
//       let created: Invoice;
//       if (creationMode === 'fromQuotation') {
//         if (!selectedQuotationId) {
//           toast.warning('Please select a quotation to convert');
//           setIsSaving(false);
//           return;
//         }
//         created = await invoiceService.createInvoiceFromQuotation(selectedQuotationId, paymentTerms.trim() || undefined);
//       } else {
//         const payload: CreateInvoicePayload = {
//           customer: selectedCustomerId,
//           invoiceDate,
//           items: items.map((i) => ({ ...i, price: Number(i.price) })),
//           paymentTerms: paymentTerms.trim() || undefined,
//           discount: Number(discount) || 0,
//           vatPercent: Number(vatPercent) || 0,
//         };
//         created = await invoiceService.createInvoice(payload);
//       }
//       toast.success(`Invoice ${created.invoiceNo} generated with PDF copy!`);
//       setIsModalOpen(false);
//       loadData();
//     } catch (err: any) {
//       toast.error(err.message || 'Failed to create invoice');
//     } finally {
//       setIsSaving(false);
//     }
//   };

//   const handleCancelInvoice = async () => {
//     if (!invoiceToCancel) return;
//     if (!cancelReason.trim()) {
//       toast.warning('Please enter a cancellation reason');
//       return;
//     }
//     setIsCancelling(true);
//     try {
//       await invoiceService.cancelInvoice(invoiceToCancel._id, cancelReason.trim());
//       toast.success('Invoice cancelled successfully');
//       setInvoiceToCancel(null);
//       setCancelReason('');
//       loadData();
//     } catch (err: any) {
//       toast.error(err.message || 'Failed to cancel invoice');
//     } finally {
//       setIsCancelling(false);
//     }
//   };

//   // Client-side date range filter helper — used when showing "all data"
//   // (no specific customer/salesperson picked) but a From/To date is set.
//   const filterByDateRange = (list: Invoice[], from?: string, to?: string) => {
//     if (!from && !to) return list;
//     const fromTime = from ? new Date(from).setHours(0, 0, 0, 0) : null;
//     const toTime = to ? new Date(to).setHours(23, 59, 59, 999) : null;
//     return list.filter((inv) => {
//       const invTime = new Date(inv.invoiceDate).getTime();
//       if (fromTime !== null && invTime < fromTime) return false;
//       if (toTime !== null && invTime > toTime) return false;
//       return true;
//     });
//   };

//   const handleFetchReport = useCallback(async () => {
//     setIsReportLoading(true);
//     try {
//       if (activeTab === 'customerReport') {
//         if (reportCustomerId) {
//           // Specific customer selected -> use the dedicated report endpoint
//           const data = await invoiceService.getCustomerWiseSalesReport(
//             reportCustomerId,
//             reportFrom || undefined,
//             reportTo || undefined
//           );
//           setReportInvoices(data);
//         } else {
//           // No customer selected -> show ALL invoices, optionally narrowed by date
//           const data = await invoiceService.getAllInvoices();
//           setReportInvoices(filterByDateRange(data, reportFrom, reportTo));
//         }
//       } else if (activeTab === 'salesmanReport') {
//         if (reportSalesPersonId) {
//           const data = await invoiceService.getSalesmanWiseSalesReport(
//             reportSalesPersonId,
//             reportFrom || undefined,
//             reportTo || undefined
//           );
//           setReportInvoices(data);
//         } else {
//           const data = await invoiceService.getAllInvoices();
//           setReportInvoices(filterByDateRange(data, reportFrom, reportTo));
//         }
//       }
//     } catch (err: any) {
//       toast.error(err.message || 'Failed to fetch sales report');
//     } finally {
//       setIsReportLoading(false);
//     }
//   }, [activeTab, reportCustomerId, reportSalesPersonId, reportFrom, reportTo, toast]);

//   // Auto-load report data as soon as the report tab is opened,
//   // and whenever the tab, customer/salesperson, or date filters change.
//   useEffect(() => {
//     if (activeTab === 'customerReport' || activeTab === 'salesmanReport') {
//       handleFetchReport();
//     }
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [activeTab]);

//   return (
//     <div className="invoices-page" id="invoices-page">
//       <div className="page-header">
//         <div>
//           <h1 className="page-title">Sales & Invoices</h1>
//           <p className="page-subtitle">Commercial billing, quotation conversions, and accounts receivable</p>
//         </div>
//         {canCreate && (
//           <Button
//             variant="primary"
//             icon={<Plus size={16} />}
//             onClick={() => {
//               if (customers.length === 0) {
//                 toast.warning('Please create a customer first');
//                 return;
//               }
//               if (products.length === 0) {
//                 toast.warning('Please create a product first');
//                 return;
//               }
//               setCreationMode('direct');
//               setSelectedCustomerId(customers[0]._id);
//               setSelectedQuotationId('');
//               setItems([{ product: products[0]._id, qty: 1, price: '' }]);
//               setDiscount('');
//               setPaymentTerms('');
//               setIsModalOpen(true);
//             }}
//             id="btn-new-invoice"
//           >
//             Generate Invoice
//           </Button>
//         )}
//       </div>

//       <DataTransferBar module="invoices" onImported={() => void loadData()} />

//       <div className="page-tabs">
//         <button
//           className={`page-tab-btn ${activeTab === 'list' ? 'active' : ''}`}
//           onClick={() => setActiveTab('list')}
//         >
//           <span className="aed-symbol" aria-label="AED">د.إ</span>
//           <span>All Invoices</span>
//         </button>
//         {canReport && (
//           <>
//             <button
//               className={`page-tab-btn ${activeTab === 'customerReport' ? 'active' : ''}`}
//               onClick={() => setActiveTab('customerReport')}
//             >
//               <span>Customer-Wise Sales Report</span>
//             </button>
//             <button
//               className={`page-tab-btn ${activeTab === 'salesmanReport' ? 'active' : ''}`}
//               onClick={() => setActiveTab('salesmanReport')}
//             >
//               <span>Salesman-Wise Sales Report</span>
//             </button>
//           </>
//         )}
//       </div>

//       {activeTab === 'list' && (
//         <Card>
//           <div className="filter-bar">
//             <div style={{ width: 180 }}>
//               <Select
//                 value={paymentStatusFilter}
//                 onChange={(e) => setPaymentStatusFilter(e.target.value)}
//                 options={[
//                   { value: '', label: 'All Payment Statuses' },
//                   { value: 'Unpaid', label: 'Unpaid' },
//                   { value: 'Partially Paid', label: 'Partially Paid' },
//                   { value: 'Paid', label: 'Fully Paid' },
//                 ]}
//               />
//             </div>
//             <div style={{ width: 160 }}>
//               <Select
//                 value={statusFilter}
//                 onChange={(e) => setStatusFilter(e.target.value)}
//                 options={[
//                   { value: '', label: 'All Statuses' },
//                   { value: 'Active', label: 'Active' },
//                   { value: 'Cancelled', label: 'Cancelled' },
//                 ]}
//               />
//             </div>
//             <div style={{ flex: 1, minWidth: 200 }}>
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
//             data={filteredInvoices}
//             isLoading={isLoading}
//             keyExtractor={(i) => i._id}
//             columns={[
//               {
//                 header: 'Invoice #',
//                 accessor: (i) => <strong>{i.invoiceNo}</strong>,
//               },
//               {
//                 header: 'Date',
//                 accessor: (i) => new Date(i.invoiceDate).toLocaleDateString(),
//               },
//               {
//                 header: 'Customer',
//                 accessor: (i) => (typeof i.customer === 'object' ? i.customer.companyName : i.customer),
//               },
//               {
//                 header: 'Total Amount',
//                 accessor: (i) => `AED ${i.totalAmount.toFixed(2)}`,
//               },
//               {
//                 header: 'Paid',
//                 accessor: (i) => `AED ${i.paidAmount.toFixed(2)}`,
//               },
//               {
//                 header: 'Balance Due',
//                 accessor: (i) => (
//                   <strong style={{ color: i.balanceAmount > 0 ? 'var(--color-danger)' : 'var(--color-success)' }}>
//                     AED {i.balanceAmount.toFixed(2)}
//                   </strong>
//                 ),
//               },
//               {
//                 header: 'Payment Status',
//                 accessor: (i) => (
//                   <Badge
//                     variant={
//                       i.paymentStatus === 'Paid'
//                         ? 'success'
//                         : i.paymentStatus === 'Partially Paid'
//                         ? 'warning'
//                         : 'neutral'
//                     }
//                   >
//                     {i.paymentStatus}
//                   </Badge>
//                 ),
//               },
//               {
//                 header: 'Status',
//                 accessor: (i) => (
//                   <Badge variant={i.status === 'Active' ? 'info' : 'danger'}>{i.status}</Badge>
//                 ),
//               },
//               {
//                 header: 'Actions',
//                 accessor: (i) => (
//                   <div className="table-actions">
//                     <button
//                       className="action-icon-btn btn-view"
//                       onClick={async () => { try { setViewingInvoice(await invoiceService.getInvoiceById(i._id)); } catch (err:any) { toast.error(err.message || 'Failed to load invoice details'); } }}
//                       title="View Invoice Details"
//                     >
//                       <Eye size={16} />
//                     </button>
//                     <button
//                       className="action-icon-btn btn-view"
//                       onClick={() => setInvoiceForPdf(i)}
//                       title="Download Invoice PDF"
//                     >
//                       <Download size={16} />
//                     </button>
//                     {canModify && i.status === 'Active' && i.paidAmount === 0 && (
//                       <button
//                         className="action-icon-btn btn-delete"
//                         onClick={() => setInvoiceToCancel(i)}
//                         title="Cancel Invoice"
//                       >
//                         <Ban size={16} />
//                       </button>
//                     )}
//                   </div>
//                 ),
//               },
//             ]}
//             emptyTitle="No invoices found"
//             emptyDescription="Generate invoices directly or convert open quotations."
//           />
//         </Card>
//       )}

//       {(activeTab === 'customerReport' || activeTab === 'salesmanReport') && (
//         <Card title={activeTab === 'customerReport' ? 'Customer-Wise Sales Report' : 'Salesman-Wise Sales Report'}>
//           <div className="filter-bar">
//             {activeTab === 'customerReport' ? (
//               <div style={{ flex: 1, minWidth: 200 }}>
//                 <Select
//                   label="Select Customer"
//                   value={reportCustomerId}
//                   onChange={(e) => setReportCustomerId(e.target.value)}
//                   options={[
//                     { value: '', label: 'All Customers' },
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
//                     { value: '', label: 'All Salespersons' },
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
//             data={reportInvoices}
//             isLoading={isReportLoading}
//             keyExtractor={(i) => i._id}
//             columns={[
//               { header: 'Invoice #', accessor: (i) => <strong>{i.invoiceNo}</strong> },
//               { header: 'Date', accessor: (i) => new Date(i.invoiceDate).toLocaleDateString() },
//               { header: 'Customer', accessor: (i) => (typeof i.customer === 'object' ? i.customer.companyName : i.customer) },
//               { header: 'Total Amount', accessor: (i) => `AED ${i.totalAmount.toFixed(2)}` },
//               { header: 'Paid Amount', accessor: (i) => `AED ${i.paidAmount.toFixed(2)}` },
//               { header: 'Balance Due', accessor: (i) => <strong>AED {i.balanceAmount.toFixed(2)}</strong> },
//               { header: 'Payment Status', accessor: (i) => <Badge variant={i.paymentStatus === 'Paid' ? 'success' : i.paymentStatus === 'Partially Paid' ? 'warning' : 'neutral'}>{i.paymentStatus}</Badge> },
//             ]}
//             emptyTitle="No sales records found"
//             emptyDescription="Choose parameters and click Generate Report."
//           />
//         </Card>
//       )}

//       {/* Generate Invoice Modal (matches Wireframe Page 4) */}
//       <Modal
//         isOpen={isModalOpen}
//         onClose={() => setIsModalOpen(false)}
//         title="Generate Invoice (Auto-Save PDF)"
//         size="lg"
//       >
//         <div className="invoice-mode-picker">
//           <button
//             type="button"
//             className={`invoice-mode-choice ${creationMode === 'direct' ? 'active' : ''}`}
//             onClick={() => setCreationMode('direct')}
//           >
//             Direct Invoice Creation
//           </button>
//           <button
//             type="button"
//             className={`invoice-mode-choice ${creationMode === 'fromQuotation' ? 'active' : ''}`}
//             onClick={() => setCreationMode('fromQuotation')}
//           >
//             Convert from Quotation (Wireframe Item 1)
//           </button>
//         </div>

//         <form onSubmit={handleCreateInvoice} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
//           {creationMode === 'fromQuotation' && (
//             <Select
//               label="Choose Quotation to Convert"
//               value={selectedQuotationId}
//               onChange={(e) => handlePickQuotation(e.target.value)}
//               options={[
//                 { value: '', label: '-- Select Open Quotation --' },
//                 ...openQuotations.map((q) => ({
//                   value: q._id,
//                   label: `${q.quotationNo} - ${typeof q.customer === 'object' ? q.customer.companyName : 'Customer'} (AED ${q.totalAmount.toFixed(2)})`,
//                 })),
//               ]}
//               isRequired
//             />
//           )}

//           <div className="form-grid-2">
//             <Select
//               label="Customer"
//               value={selectedCustomerId}
//               onChange={(e) => setSelectedCustomerId(e.target.value)}
//               options={customers.map((c) => ({ value: c._id, label: c.companyName }))}
//               isRequired
//             />
//             <Input
//               type="date"
//               label="Invoice Date"
//               value={invoiceDate}
//               onChange={(e) => setInvoiceDate(e.target.value)}
//               isRequired
//             />
//           </div>

//           <div>
//             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
//               <label className="input-label" style={{ fontWeight: 600 }}>Invoice Products</label>
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
//             <label className="input-label" htmlFor="invoice-payment-terms">Payment Terms</label>
//             <textarea id="invoice-payment-terms" className="input-field invoice-terms-textarea" value={paymentTerms} onChange={(e) => setPaymentTerms(e.target.value)} placeholder="Optional. Enter payment terms to display on the invoice PDF." rows={3} />
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
//               <span>Invoice Total:</span>
//               <span>AED {grandTotal.toFixed(2)}</span>
//             </div>
//           </div>

//           <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
//             <Button variant="secondary" type="button" onClick={() => setIsModalOpen(false)} disabled={isSaving}>
//               Cancel
//             </Button>
//             <Button variant="primary" type="submit" isLoading={isSaving} loadingText="Generating Invoice...">
//               Generate Invoice (Save in PDF)
//             </Button>
//           </div>
//         </form>
//       </Modal>

//       {/* View Invoice Details Modal */}
//       <Modal
//         isOpen={!!viewingInvoice}
//         onClose={() => setViewingInvoice(null)}
//         title={`Invoice #${viewingInvoice?.invoiceNo}`}
//         size="lg"
//       >
//         {viewingInvoice && (
//           <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
//             <div className="form-grid-2">
//               <div>
//                 <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>Customer:</span>
//                 <div><strong>{typeof viewingInvoice.customer === 'object' ? viewingInvoice.customer.companyName : viewingInvoice.customer}</strong></div>
//               </div>
//               <div>
//                 <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>Invoice Date:</span>
//                 <div>{new Date(viewingInvoice.invoiceDate).toLocaleDateString()}</div>
//               </div>
//               <div>
//                 <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>Payment Status:</span>
//                 <div>
//                   <Badge variant={viewingInvoice.paymentStatus === 'Paid' ? 'success' : viewingInvoice.paymentStatus === 'Partially Paid' ? 'warning' : 'neutral'}>
//                     {viewingInvoice.paymentStatus}
//                   </Badge>
//                 </div>
//               </div>
//               <div>
//                 <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>Invoice Status:</span>
//                 <div>
//                   <Badge variant={viewingInvoice.status === 'Active' ? 'info' : 'danger'}>
//                     {viewingInvoice.status}
//                   </Badge>
//                 </div>
//               </div>
//             </div>

//             <Table
//               data={viewingInvoice.items}
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
//                 <strong>AED {viewingInvoice.subTotal.toFixed(2)}</strong>
//               </div>
//               {viewingInvoice.discount > 0 && <div className="totals-row">
//                 <span>Discount (Figure):</span>
//                 <span>-AED {viewingInvoice.discount.toFixed(2)}</span>
//               </div>}
//               <div className="totals-row">
//                 <span>VAT ({viewingInvoice.vatPercent}%):</span>
//                 <strong>AED {viewingInvoice.vatAmount.toFixed(2)}</strong>
//               </div>
//               <div className="totals-row">
//                 <span>Total Amount:</span>
//                 <strong>AED {viewingInvoice.totalAmount.toFixed(2)}</strong>
//               </div>
//               <div className="totals-row">
//                 <span>Paid So Far:</span>
//                 <span style={{ color: 'var(--color-success)' }}>AED {viewingInvoice.paidAmount.toFixed(2)}</span>
//               </div>
//               <div className="totals-row grand-total">
//                 <span>Remaining Balance:</span>
//                 <span style={{ color: viewingInvoice.balanceAmount > 0 ? 'var(--color-danger)' : 'var(--color-success)' }}>
//                   AED {viewingInvoice.balanceAmount.toFixed(2)}
//                 </span>
//               </div>
//             </div>

//             {viewingInvoice.paymentTerms && <div className="document-terms-card"><strong>Payment Terms</strong><p>{viewingInvoice.paymentTerms}</p></div>}
//             <div style={{ display:'flex', justifyContent:'flex-end', flexWrap:'wrap', gap:'10px', marginTop:'8px' }}>
//               {user?.isAdmin && viewingInvoice.approvalStatus !== 'Approved' && viewingInvoice.status === 'Active' && <button className="btn btn-secondary btn-md" disabled={isApproving} onClick={async () => { try { setIsApproving(true); const approved = await invoiceService.approveInvoice(viewingInvoice._id); setViewingInvoice(approved); toast.success('Invoice approved successfully'); await loadData(); } catch(e:any){ toast.error(e.message || 'Failed to approve invoice'); } finally { setIsApproving(false); } }}><FileCheck size={16}/><span>{isApproving ? 'Approving...' : 'Approve Invoice'}</span></button>}
//               {viewingInvoice.approvalStatus === 'Approved' && <Badge variant="success">Admin Approved</Badge>}
//               <button className="btn btn-primary btn-md" onClick={() => { setViewingInvoice(null); setInvoiceForPdf(viewingInvoice); }}><Download size={16}/><span>Invoice PDF</span></button>
//             </div>
//           </div>
//         )}
//       </Modal>

//       <PdfActionModal
//         isOpen={!!invoiceForPdf}
//         onClose={() => setInvoiceForPdf(null)}
//         documentLabel={`Invoice #${invoiceForPdf?.invoiceNo || ''}`}
//         fileName={invoiceForPdf?.invoiceNo || 'invoice'}
//         generate={async (size) => {
//           if (!invoiceForPdf) throw new Error('Invoice not selected');
//           try { return await invoiceService.generateInvoicePdf(invoiceForPdf._id, size); }
//           catch (e: any) { toast.error(e.message || 'Failed to generate invoice PDF'); throw e; }
//         }}
//       />

//       {/* Cancel Invoice with mandatory reason */}
//       <Modal
//         isOpen={!!invoiceToCancel}
//         onClose={() => { if (!isCancelling) { setInvoiceToCancel(null); setCancelReason(''); } }}
//         title="Cancel Invoice"
//         size="sm"
//       >
//         <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
//           <p style={{ margin: 0, color: 'var(--text-secondary)' }}>
//             Cancel Invoice #{invoiceToCancel?.invoiceNo}. This action cannot be reversed.
//           </p>
//           <Input
//             label="Cancellation Reason"
//             value={cancelReason}
//             onChange={(e) => setCancelReason(e.target.value)}
//             placeholder="Enter reason for cancellation"
//             isRequired
//           />
//           <div className="modal-actions">
//             <Button
//               type="button"
//               variant="secondary"
//               onClick={() => { setInvoiceToCancel(null); setCancelReason(''); }}
//               disabled={isCancelling}
//             >
//               Keep Invoice
//             </Button>
//             <Button
//               type="button"
//               variant="danger"
//               onClick={handleCancelInvoice}
//               isLoading={isCancelling}
//               loadingText="Cancelling..."
//               disabled={!cancelReason.trim()}
//             >
//               Cancel Invoice
//             </Button>
//           </div>
//         </div>
//       </Modal>
//     </div>
//   );
// };

// export default Invoices;



import React, { useEffect, useState, useCallback } from 'react';
import {
  Plus,
  Trash2,
  Download,
  Ban,
  Eye,
  FileCheck,
  Calendar,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import invoiceService from '../../services/invoice.service';
import customerService from '../../services/customer.service';
import productService from '../../services/product.service';
import quotationService from '../../services/quotation.service';
import userService from '../../services/user.service';
import { Invoice, CreateInvoicePayload } from '../../types/invoice.types';
import { Customer } from '../../types/customer.types';
import { Product } from '../../types/product.types';
import { Quotation } from '../../types/quotation.types';
import { User } from '../../types/user.types';
import Card from '../../components/common/card/Card';
import Button from '../../components/common/button/Button';
import Input from '../../components/common/input/Input';
import Select from '../../components/common/select/Select';
import Table from '../../components/common/table/Table';
import Modal from '../../components/common/modal/Modal';
import Badge from '../../components/common/badge/Badge';
import DataTransferBar from '../../components/common/data-transfer/DataTransferBar';
import PdfActionModal from '../../components/common/pdf/PdfActionModal';
// ADD: e-sign & stamp images — update these paths to wherever you place the files
import esignImage from '../../../public/assets/esign-signature.png';
import stampImage from '../../../public/assets/company-stamp.png';
import './Invoices.css';

interface LineItemInput {
  product: string;
  qty: number;
  price: number | '';
}

export const Invoices: React.FC = () => {
  const { user, hasPermission } = useAuth();
  const toast = useToast();

  const canCreate = hasPermission('sales', 'create');
  const canModify = hasPermission('sales', 'modify');
  const canReport = hasPermission('sales', 'report');

  const [activeTab, setActiveTab] = useState<'list' | 'customerReport' | 'salesmanReport'>('list');
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [openQuotations, setOpenQuotations] = useState<Quotation[]>([]);
  const [salesUsers, setSalesUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Filters
  const [statusFilter, setStatusFilter] = useState('');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('');
  const [customerFilter, setCustomerFilter] = useState('');

  // New Invoice Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [creationMode, setCreationMode] = useState<'direct' | 'fromQuotation'>('direct');
  const [selectedQuotationId, setSelectedQuotationId] = useState('');

  // Form Fields
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [discount, setDiscount] = useState<number | ''>('');
  const [vatPercent, setVatPercent] = useState<number>(5);
  const [items, setItems] = useState<LineItemInput[]>([
    { product: '', qty: 1, price: '' },
  ]);

  // View / Cancel Dialog
  const [viewingInvoice, setViewingInvoice] = useState<Invoice | null>(null);
  const [invoiceToCancel, setInvoiceToCancel] = useState<Invoice | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);
  const [invoiceForPdf, setInvoiceForPdf] = useState<Invoice | null>(null);
  const [paymentTerms, setPaymentTerms] = useState('');
  const [isApproving, setIsApproving] = useState(false);

  // Reports State
  const [reportCustomerId, setReportCustomerId] = useState('');
  const [reportSalesPersonId, setReportSalesPersonId] = useState('');
  const [reportFrom, setReportFrom] = useState('');
  const [reportTo, setReportTo] = useState('');
  const [reportInvoices, setReportInvoices] = useState<Invoice[]>([]);
  const [isReportLoading, setIsReportLoading] = useState(false);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [invList, cList, pList, qList] = await Promise.all([
        invoiceService.getAllInvoices(statusFilter || undefined, customerFilter || undefined),
        customerService.getAllCustomers(),
        productService.getAllProducts(),
        invoiceService.getOpenQuotations(),
      ]);
      setInvoices(invList);
      setCustomers(cList);
      setProducts(pList);
      setOpenQuotations(qList);

      if (user?.isAdmin) {
        userService.getAllUsers().then(setSalesUsers).catch(() => []);
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to load invoices');
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, customerFilter, user?.isAdmin, toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredInvoices = paymentStatusFilter
    ? invoices.filter((invoice) => invoice.paymentStatus === paymentStatusFilter)
    : invoices;

  // When quotation is picked in "fromQuotation" mode, auto-populate everything!
  const handlePickQuotation = (qId: string) => {
    setSelectedQuotationId(qId);
    const q = openQuotations.find((item) => item._id === qId);
    if (!q) return;

    const custId = typeof q.customer === 'object' ? q.customer._id : q.customer;
    setSelectedCustomerId(custId);
    setDiscount(q.discount > 0 ? q.discount : '');
    setVatPercent(q.vatPercent || 5);

    const populatedItems: LineItemInput[] = q.items.map((item) => ({
      product: typeof item.product === 'object' ? item.product._id : item.product,
      qty: item.qty,
      price: item.price,
    }));
    setItems(populatedItems);
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

  const handleCreateInvoice = async (e: React.FormEvent) => {
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
      let created: Invoice;
      if (creationMode === 'fromQuotation') {
        if (!selectedQuotationId) {
          toast.warning('Please select a quotation to convert');
          setIsSaving(false);
          return;
        }
        created = await invoiceService.createInvoiceFromQuotation(selectedQuotationId, paymentTerms.trim() || undefined);
      } else {
        const payload: CreateInvoicePayload = {
          customer: selectedCustomerId,
          invoiceDate,
          items: items.map((i) => ({ ...i, price: Number(i.price) })),
          paymentTerms: paymentTerms.trim() || undefined,
          discount: Number(discount) || 0,
          vatPercent: Number(vatPercent) || 0,
        };
        created = await invoiceService.createInvoice(payload);
      }
      toast.success(`Invoice ${created.invoiceNo} generated with PDF copy!`);
      setIsModalOpen(false);
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to create invoice');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelInvoice = async () => {
    if (!invoiceToCancel) return;
    if (!cancelReason.trim()) {
      toast.warning('Please enter a cancellation reason');
      return;
    }
    setIsCancelling(true);
    try {
      await invoiceService.cancelInvoice(invoiceToCancel._id, cancelReason.trim());
      toast.success('Invoice cancelled successfully');
      setInvoiceToCancel(null);
      setCancelReason('');
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to cancel invoice');
    } finally {
      setIsCancelling(false);
    }
  };

  // Client-side date range filter helper — used when showing "all data"
  // (no specific customer/salesperson picked) but a From/To date is set.
  const filterByDateRange = (list: Invoice[], from?: string, to?: string) => {
    if (!from && !to) return list;
    const fromTime = from ? new Date(from).setHours(0, 0, 0, 0) : null;
    const toTime = to ? new Date(to).setHours(23, 59, 59, 999) : null;
    return list.filter((inv) => {
      const invTime = new Date(inv.invoiceDate).getTime();
      if (fromTime !== null && invTime < fromTime) return false;
      if (toTime !== null && invTime > toTime) return false;
      return true;
    });
  };

  const handleFetchReport = useCallback(async () => {
    setIsReportLoading(true);
    try {
      if (activeTab === 'customerReport') {
        if (reportCustomerId) {
          const data = await invoiceService.getCustomerWiseSalesReport(
            reportCustomerId,
            reportFrom || undefined,
            reportTo || undefined
          );
          setReportInvoices(data);
        } else {
          const data = await invoiceService.getAllInvoices();
          setReportInvoices(filterByDateRange(data, reportFrom, reportTo));
        }
      } else if (activeTab === 'salesmanReport') {
        if (reportSalesPersonId) {
          const data = await invoiceService.getSalesmanWiseSalesReport(
            reportSalesPersonId,
            reportFrom || undefined,
            reportTo || undefined
          );
          setReportInvoices(data);
        } else {
          const data = await invoiceService.getAllInvoices();
          setReportInvoices(filterByDateRange(data, reportFrom, reportTo));
        }
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to fetch sales report');
    } finally {
      setIsReportLoading(false);
    }
  }, [activeTab, reportCustomerId, reportSalesPersonId, reportFrom, reportTo, toast]);

  useEffect(() => {
    if (activeTab === 'customerReport' || activeTab === 'salesmanReport') {
      handleFetchReport();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  // ── E-sign & stamp are shown ONLY once the invoice has been
  // admin-approved — regardless of whether it was created directly or
  // converted from a quotation. `isFromQuotation` / `isDirectInvoice` are
  // still used below to decide who is allowed to click "Approve".
  const isFromQuotation = Boolean((viewingInvoice as any)?.quotation);
  const isDirectInvoice = !!viewingInvoice && !isFromQuotation;

  const showEsignStamp =
    !!viewingInvoice && viewingInvoice.approvalStatus === 'Approved';

  return (
    <div className="invoices-page" id="invoices-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Sales & Invoices</h1>
          <p className="page-subtitle">Commercial billing, quotation conversions, and accounts receivable</p>
        </div>
        {canCreate && (
          <Button
            variant="primary"
            icon={<Plus size={16} />}
            onClick={() => {
              if (customers.length === 0) {
                toast.warning('Please create a customer first');
                return;
              }
              if (products.length === 0) {
                toast.warning('Please create a product first');
                return;
              }
              setCreationMode('direct');
              setSelectedCustomerId(customers[0]._id);
              setSelectedQuotationId('');
              setItems([{ product: products[0]._id, qty: 1, price: '' }]);
              setDiscount('');
              setPaymentTerms('');
              setIsModalOpen(true);
            }}
            id="btn-new-invoice"
          >
            Generate Invoice
          </Button>
        )}
      </div>

      <DataTransferBar module="invoices" onImported={() => void loadData()} />

      <div className="page-tabs">
        <button
          className={`page-tab-btn ${activeTab === 'list' ? 'active' : ''}`}
          onClick={() => setActiveTab('list')}
        >
          <span className="aed-symbol" aria-label="AED">د.إ</span>
          <span>All Invoices</span>
        </button>
        {canReport && (
          <>
            <button
              className={`page-tab-btn ${activeTab === 'customerReport' ? 'active' : ''}`}
              onClick={() => setActiveTab('customerReport')}
            >
              <span>Customer-Wise Sales Report</span>
            </button>
            <button
              className={`page-tab-btn ${activeTab === 'salesmanReport' ? 'active' : ''}`}
              onClick={() => setActiveTab('salesmanReport')}
            >
              <span>Salesman-Wise Sales Report</span>
            </button>
          </>
        )}
      </div>

      {activeTab === 'list' && (
        <Card>
          <div className="filter-bar">
            <div style={{ width: 180 }}>
              <Select
                value={paymentStatusFilter}
                onChange={(e) => setPaymentStatusFilter(e.target.value)}
                options={[
                  { value: '', label: 'All Payment Statuses' },
                  { value: 'Unpaid', label: 'Unpaid' },
                  { value: 'Partially Paid', label: 'Partially Paid' },
                  { value: 'Paid', label: 'Fully Paid' },
                ]}
              />
            </div>
            <div style={{ width: 160 }}>
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                options={[
                  { value: '', label: 'All Statuses' },
                  { value: 'Active', label: 'Active' },
                  { value: 'Cancelled', label: 'Cancelled' },
                ]}
              />
            </div>
            <div style={{ flex: 1, minWidth: 200 }}>
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
            data={filteredInvoices}
            isLoading={isLoading}
            keyExtractor={(i) => i._id}
            columns={[
              {
                header: 'Invoice #',
                accessor: (i) => <strong>{i.invoiceNo}</strong>,
              },
              {
                header: 'Date',
                accessor: (i) => new Date(i.invoiceDate).toLocaleDateString(),
              },
              {
                header: 'Customer',
                accessor: (i) => (typeof i.customer === 'object' ? i.customer.companyName : i.customer),
              },
              {
                header: 'Total Amount',
                accessor: (i) => `AED ${i.totalAmount.toFixed(2)}`,
              },
              {
                header: 'Paid',
                accessor: (i) => `AED ${i.paidAmount.toFixed(2)}`,
              },
              {
                header: 'Balance Due',
                accessor: (i) => (
                  <strong style={{ color: i.balanceAmount > 0 ? 'var(--color-danger)' : 'var(--color-success)' }}>
                    AED {i.balanceAmount.toFixed(2)}
                  </strong>
                ),
              },
              {
                header: 'Payment Status',
                accessor: (i) => (
                  <Badge
                    variant={
                      i.paymentStatus === 'Paid'
                        ? 'success'
                        : i.paymentStatus === 'Partially Paid'
                        ? 'warning'
                        : 'neutral'
                    }
                  >
                    {i.paymentStatus}
                  </Badge>
                ),
              },
              {
                header: 'Status',
                accessor: (i) => (
                  <Badge variant={i.status === 'Active' ? 'info' : 'danger'}>{i.status}</Badge>
                ),
              },
              {
                header: 'Actions',
                accessor: (i) => (
                  <div className="table-actions">
                    <button
                      className="action-icon-btn btn-view"
                      onClick={async () => { try { setViewingInvoice(await invoiceService.getInvoiceById(i._id)); } catch (err:any) { toast.error(err.message || 'Failed to load invoice details'); } }}
                      title="View Invoice Details"
                    >
                      <Eye size={16} />
                    </button>
                    <button
                      className="action-icon-btn btn-view"
                      onClick={() => setInvoiceForPdf(i)}
                      title="Download Invoice PDF"
                    >
                      <Download size={16} />
                    </button>
                    {canModify && i.status === 'Active' && i.paidAmount === 0 && (
                      <button
                        className="action-icon-btn btn-delete"
                        onClick={() => setInvoiceToCancel(i)}
                        title="Cancel Invoice"
                      >
                        <Ban size={16} />
                      </button>
                    )}
                  </div>
                ),
              },
            ]}
            emptyTitle="No invoices found"
            emptyDescription="Generate invoices directly or convert open quotations."
          />
        </Card>
      )}

      {(activeTab === 'customerReport' || activeTab === 'salesmanReport') && (
        <Card title={activeTab === 'customerReport' ? 'Customer-Wise Sales Report' : 'Salesman-Wise Sales Report'}>
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
            data={reportInvoices}
            isLoading={isReportLoading}
            keyExtractor={(i) => i._id}
            columns={[
              { header: 'Invoice #', accessor: (i) => <strong>{i.invoiceNo}</strong> },
              { header: 'Date', accessor: (i) => new Date(i.invoiceDate).toLocaleDateString() },
              { header: 'Customer', accessor: (i) => (typeof i.customer === 'object' ? i.customer.companyName : i.customer) },
              { header: 'Total Amount', accessor: (i) => `AED ${i.totalAmount.toFixed(2)}` },
              { header: 'Paid Amount', accessor: (i) => `AED ${i.paidAmount.toFixed(2)}` },
              { header: 'Balance Due', accessor: (i) => <strong>AED {i.balanceAmount.toFixed(2)}</strong> },
              { header: 'Payment Status', accessor: (i) => <Badge variant={i.paymentStatus === 'Paid' ? 'success' : i.paymentStatus === 'Partially Paid' ? 'warning' : 'neutral'}>{i.paymentStatus}</Badge> },
            ]}
            emptyTitle="No sales records found"
            emptyDescription="Choose parameters and click Generate Report."
          />
        </Card>
      )}

      {/* Generate Invoice Modal (matches Wireframe Page 4) */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Generate Invoice (Auto-Save PDF)"
        size="lg"
      >
        <div className="invoice-mode-picker">
          <button
            type="button"
            className={`invoice-mode-choice ${creationMode === 'direct' ? 'active' : ''}`}
            onClick={() => setCreationMode('direct')}
          >
            Direct Invoice Creation
          </button>
          <button
            type="button"
            className={`invoice-mode-choice ${creationMode === 'fromQuotation' ? 'active' : ''}`}
            onClick={() => setCreationMode('fromQuotation')}
          >
            Convert from Quotation (Wireframe Item 1)
          </button>
        </div>

        <form onSubmit={handleCreateInvoice} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {creationMode === 'fromQuotation' && (
            <Select
              label="Choose Quotation to Convert"
              value={selectedQuotationId}
              onChange={(e) => handlePickQuotation(e.target.value)}
              options={[
                { value: '', label: '-- Select Open Quotation --' },
                ...openQuotations.map((q) => ({
                  value: q._id,
                  label: `${q.quotationNo} - ${typeof q.customer === 'object' ? q.customer.companyName : 'Customer'} (AED ${q.totalAmount.toFixed(2)})`,
                })),
              ]}
              isRequired
            />
          )}

          <div className="form-grid-2">
            <Select
              label="Customer"
              value={selectedCustomerId}
              onChange={(e) => setSelectedCustomerId(e.target.value)}
              options={customers.map((c) => ({ value: c._id, label: c.companyName }))}
              isRequired
            />
            <Input
              type="date"
              label="Invoice Date"
              value={invoiceDate}
              onChange={(e) => setInvoiceDate(e.target.value)}
              isRequired
            />
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <label className="input-label" style={{ fontWeight: 600 }}>Invoice Products</label>
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
            <label className="input-label" htmlFor="invoice-payment-terms">Payment Terms</label>
            <textarea id="invoice-payment-terms" className="input-field invoice-terms-textarea" value={paymentTerms} onChange={(e) => setPaymentTerms(e.target.value)} placeholder="Optional. Enter payment terms to display on the invoice PDF." rows={3} />
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
              <span>Invoice Total:</span>
              <span>AED {grandTotal.toFixed(2)}</span>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
            <Button variant="secondary" type="button" onClick={() => setIsModalOpen(false)} disabled={isSaving}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" isLoading={isSaving} loadingText="Generating Invoice...">
              Generate Invoice (Save in PDF)
            </Button>
          </div>
        </form>
      </Modal>

      {/* View Invoice Details Modal */}
      <Modal
        isOpen={!!viewingInvoice}
        onClose={() => setViewingInvoice(null)}
        title={`Invoice #${viewingInvoice?.invoiceNo}`}
        size="lg"
      >
        {viewingInvoice && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="form-grid-2">
              <div>
                <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>Customer:</span>
                <div><strong>{typeof viewingInvoice.customer === 'object' ? viewingInvoice.customer.companyName : viewingInvoice.customer}</strong></div>
              </div>
              <div>
                <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>Invoice Date:</span>
                <div>{new Date(viewingInvoice.invoiceDate).toLocaleDateString()}</div>
              </div>
              <div>
                <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>Payment Status:</span>
                <div>
                  <Badge variant={viewingInvoice.paymentStatus === 'Paid' ? 'success' : viewingInvoice.paymentStatus === 'Partially Paid' ? 'warning' : 'neutral'}>
                    {viewingInvoice.paymentStatus}
                  </Badge>
                </div>
              </div>
              <div>
                <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>Invoice Status:</span>
                <div>
                  <Badge variant={viewingInvoice.status === 'Active' ? 'info' : 'danger'}>
                    {viewingInvoice.status}
                  </Badge>
                </div>
              </div>
            </div>

            <Table
              data={viewingInvoice.items}
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
                <strong>AED {viewingInvoice.subTotal.toFixed(2)}</strong>
              </div>
              {viewingInvoice.discount > 0 && <div className="totals-row">
                <span>Discount (Figure):</span>
                <span>-AED {viewingInvoice.discount.toFixed(2)}</span>
              </div>}
              <div className="totals-row">
                <span>VAT ({viewingInvoice.vatPercent}%):</span>
                <strong>AED {viewingInvoice.vatAmount.toFixed(2)}</strong>
              </div>
              <div className="totals-row">
                <span>Total Amount:</span>
                <strong>AED {viewingInvoice.totalAmount.toFixed(2)}</strong>
              </div>
              <div className="totals-row">
                <span>Paid So Far:</span>
                <span style={{ color: 'var(--color-success)' }}>AED {viewingInvoice.paidAmount.toFixed(2)}</span>
              </div>
              <div className="totals-row grand-total">
                <span>Remaining Balance:</span>
                <span style={{ color: viewingInvoice.balanceAmount > 0 ? 'var(--color-danger)' : 'var(--color-success)' }}>
                  AED {viewingInvoice.balanceAmount.toFixed(2)}
                </span>
              </div>
            </div>

            {viewingInvoice.paymentTerms && <div className="document-terms-card"><strong>Payment Terms</strong><p>{viewingInvoice.paymentTerms}</p></div>}

            {/* ── E-sign & Company Stamp block ──
                Shown ONLY when the invoice's approvalStatus is 'Approved',
                no matter how the invoice was created. */}
            {/* {showEsignStamp && (
              <div className="invoice-esign-stamp-block">
                <div className="invoice-esign-stamp-inner">
                  <img src={esignImage} alt="Authorized Signature" className="invoice-esign-img" />
                  <img src={stampImage} alt="Company Stamp" className="invoice-stamp-img" />
                </div>
              </div>
            )} */}

            <div style={{ display:'flex', justifyContent:'flex-end', flexWrap:'wrap', gap:'10px', marginTop:'8px' }}>
              {/* Approve button: any active, not-yet-approved invoice can be
                  approved by an admin — this is what unlocks the e-sign/stamp,
                  whether the invoice was direct or converted from a quotation. */}
              {user?.isAdmin && viewingInvoice.approvalStatus !== 'Approved' && viewingInvoice.status === 'Active' && (
                <button
                  className="btn btn-secondary btn-md"
                  disabled={isApproving}
                  onClick={async () => {
                    try {
                      setIsApproving(true);
                      const approved = await invoiceService.approveInvoice(viewingInvoice._id);
                      setViewingInvoice(approved);
                      toast.success('Invoice approved successfully');
                      await loadData();
                    } catch (e: any) {
                      toast.error(e.message || 'Failed to approve invoice');
                    } finally {
                      setIsApproving(false);
                    }
                  }}
                >
                  <FileCheck size={16} />
                  <span>{isApproving ? 'Approving...' : 'Approve Invoice'}</span>
                </button>
              )}
              {viewingInvoice.approvalStatus === 'Approved' && <Badge variant="success">Admin Approved</Badge>}
              <button className="btn btn-primary btn-md" onClick={() => { setViewingInvoice(null); setInvoiceForPdf(viewingInvoice); }}><Download size={16}/><span>Invoice PDF</span></button>
            </div>
          </div>
        )}
      </Modal>

      <PdfActionModal
        isOpen={!!invoiceForPdf}
        onClose={() => setInvoiceForPdf(null)}
        documentLabel={`Invoice #${invoiceForPdf?.invoiceNo || ''}`}
        fileName={invoiceForPdf?.invoiceNo || 'invoice'}
        generate={async (size) => {
          if (!invoiceForPdf) throw new Error('Invoice not selected');
          try { return await invoiceService.generateInvoicePdf(invoiceForPdf._id, size); }
          catch (e: any) { toast.error(e.message || 'Failed to generate invoice PDF'); throw e; }
        }}
      />

      {/* Cancel Invoice with mandatory reason */}
      <Modal
        isOpen={!!invoiceToCancel}
        onClose={() => { if (!isCancelling) { setInvoiceToCancel(null); setCancelReason(''); } }}
        title="Cancel Invoice"
        size="sm"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <p style={{ margin: 0, color: 'var(--text-secondary)' }}>
            Cancel Invoice #{invoiceToCancel?.invoiceNo}. This action cannot be reversed.
          </p>
          <Input
            label="Cancellation Reason"
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            placeholder="Enter reason for cancellation"
            isRequired
          />
          <div className="modal-actions">
            <Button
              type="button"
              variant="secondary"
              onClick={() => { setInvoiceToCancel(null); setCancelReason(''); }}
              disabled={isCancelling}
            >
              Keep Invoice
            </Button>
            <Button
              type="button"
              variant="danger"
              onClick={handleCancelInvoice}
              isLoading={isCancelling}
              loadingText="Cancelling..."
              disabled={!cancelReason.trim()}
            >
              Cancel Invoice
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Invoices;