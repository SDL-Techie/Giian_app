// import React, { useEffect, useState, useCallback } from 'react';
// import {
//   Users,
//   Plus,
//   Search,
//   FileText,
//   Edit2,
//   Trash2,
//   Download,
//   Calendar,
// } from 'lucide-react';
// import { useAuth } from '../../context/AuthContext';
// import { useToast } from '../../context/ToastContext';
// import customerService from '../../services/customer.service';
// import { Customer, CreateCustomerPayload } from '../../types/customer.types';
// import { Quotation } from '../../types/quotation.types';
// import { Invoice } from '../../types/invoice.types';
// import Card from '../../components/common/card/Card';
// import Button from '../../components/common/button/Button';
// import Input from '../../components/common/input/Input';
// import Select from '../../components/common/select/Select';
// import Table from '../../components/common/table/Table';
// import Modal from '../../components/common/modal/Modal';
// import Badge from '../../components/common/badge/Badge';
// import ConfirmDialog from '../../components/common/confirm/ConfirmDialog';
// import DataTransferBar from '../../components/common/data-transfer/DataTransferBar';
// import './Customers.css';

// export const Customers: React.FC = () => {
//   const { hasPermission } = useAuth();
//   const toast = useToast();

//   const canCreate = hasPermission('customers', 'create');
//   const canModify = hasPermission('customers', 'modify');

//   const [activeTab, setActiveTab] = useState<'list' | 'quotationReport' | 'salesReport'>('list');
//   const [customers, setCustomers] = useState<Customer[]>([]);
//   const [isLoading, setIsLoading] = useState(false);

//   // Filters
//   const [search, setSearch] = useState('');
//   const [statusFilter, setStatusFilter] = useState('');

//   // Modals state
//   const [isFormOpen, setIsFormOpen] = useState(false);
//   const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
//   const [isSaving, setIsSaving] = useState(false);

//   // Deactivate state
//   const [customerToDeactivate, setCustomerToDeactivate] = useState<Customer | null>(null);
//   const [isDeactivating, setIsDeactivating] = useState(false);

//   // Customer Form fields
//   const [companyName, setCompanyName] = useState('');
//   const [telephoneNumber, setTelephoneNumber] = useState('');
//   const [email, setEmail] = useState('');
//   const [mobileNumber, setMobileNumber] = useState('');
//   const [contactPersonName, setContactPersonName] = useState('');
//   const [companyAddress, setCompanyAddress] = useState('');
//   const [creditLimit, setCreditLimit] = useState<number | ''>('');
//   const [documentFiles, setDocumentFiles] = useState<File[]>([]);
//   const [formErrors, setFormErrors] = useState<Record<string, string>>({});

//   // Reports state
//   const [reportCustomerId, setReportCustomerId] = useState('');
//   const [reportFrom, setReportFrom] = useState('');
//   const [reportTo, setReportTo] = useState('');
//   const [reportQuotations, setReportQuotations] = useState<Quotation[]>([]);
//   const [reportInvoices, setReportInvoices] = useState<Invoice[]>([]);
//   const [isReportLoading, setIsReportLoading] = useState(false);

//   const loadCustomers = useCallback(async () => {
//     setIsLoading(true);
//     try {
//       const data = await customerService.getAllCustomers(search, statusFilter);
//       setCustomers(data);
//     } catch (err: any) {
//       toast.error(err.message || 'Failed to fetch customers');
//     } finally {
//       setIsLoading(false);
//     }
//   }, [search, statusFilter, toast]);

//   useEffect(() => {
//     loadCustomers();
//   }, [loadCustomers]);

//   const openCreateModal = () => {
//     setEditingCustomer(null);
//     setCompanyName('');
//     setTelephoneNumber('');
//     setEmail('');
//     setMobileNumber('');
//     setContactPersonName('');
//     setCompanyAddress('');
//     setCreditLimit('');
//     setDocumentFiles([]);
//     setFormErrors({});
//     setIsFormOpen(true);
//   };

//   const openEditModal = (c: Customer) => {
//     setEditingCustomer(c);
//     setCompanyName(c.companyName);
//     setTelephoneNumber(c.telephoneNumber || '');
//     setEmail(c.email || '');
//     setMobileNumber(c.mobileNumber || '');
//     setContactPersonName(c.contactPersonName || '');
//     setCompanyAddress(c.companyAddress || '');
//     setCreditLimit(c.creditLimit > 0 ? c.creditLimit : '');
//     setDocumentFiles([]);
//     setFormErrors({});
//     setIsFormOpen(true);
//   };

//   const validateForm = () => {
//     const errs: Record<string, string> = {};
//     if (!companyName.trim()) {
//       errs.companyName = 'Company name is required';
//     }
//     if (email && !/^\S+@\S+\.\S+$/.test(email)) {
//       errs.email = 'Please enter a valid email';
//     }
//     if (Number(creditLimit || 0) < 0) {
//       errs.creditLimit = 'Credit limit cannot be negative';
//     }
//     setFormErrors(errs);
//     return Object.keys(errs).length === 0;
//   };

//   const handleSaveCustomer = async (e: React.FormEvent) => {
//     e.preventDefault();
//     if (!validateForm()) return;

//     setIsSaving(true);
//     try {
//       const payload: CreateCustomerPayload = {
//         companyName,
//         telephoneNumber: telephoneNumber || undefined,
//         email: email || undefined,
//         mobileNumber: mobileNumber || undefined,
//         contactPersonName: contactPersonName || undefined,
//         companyAddress: companyAddress || undefined,
//         creditLimit: Number(creditLimit || 0),
//         companyDocuments: documentFiles.length ? documentFiles : undefined,
//       };

//       if (editingCustomer) {
//         await customerService.updateCustomer(editingCustomer._id, payload);
//         toast.success('Customer updated successfully');
//       } else {
//         await customerService.createCustomer(payload);
//         toast.success('Customer created successfully');
//       }
//       setIsFormOpen(false);
//       loadCustomers();
//     } catch (err: any) {
//       toast.error(err.message || 'Failed to save customer');
//     } finally {
//       setIsSaving(false);
//     }
//   };

//   const handleDeactivate = async () => {
//     if (!customerToDeactivate) return;
//     setIsDeactivating(true);
//     try {
//       await customerService.setCustomerStatus(customerToDeactivate._id, 'Inactive');
//       toast.success('Customer deactivated successfully');
//       setCustomerToDeactivate(null);
//       loadCustomers();
//     } catch (err: any) {
//       toast.error(err.message || 'Failed to deactivate customer');
//     } finally {
//       setIsDeactivating(false);
//     }
//   };

//   const handleActivate = async (customer: Customer) => {
//     try { await customerService.setCustomerStatus(customer._id, 'Active'); toast.success('Customer activated successfully'); loadCustomers(); }
//     catch (err:any) { toast.error(err.message || 'Failed to activate customer'); }
//   };

//   const handleFetchReport = async () => {
//     if (!reportCustomerId) {
//       toast.warning('Please select a customer');
//       return;
//     }
//     setIsReportLoading(true);
//     try {
//       if (activeTab === 'quotationReport') {
//         const data = await customerService.getCustomerWiseQuotationReport(
//           reportCustomerId,
//           reportFrom || undefined,
//           reportTo || undefined
//         );
//         setReportQuotations(data);
//       } else if (activeTab === 'salesReport') {
//         const data = await customerService.getCustomerWiseSalesReport(
//           reportCustomerId,
//           reportFrom || undefined,
//           reportTo || undefined
//         );
//         setReportInvoices(data);
//       }
//     } catch (err: any) {
//       toast.error(err.message || 'Failed to generate report');
//     } finally {
//       setIsReportLoading(false);
//     }
//   };

//   return (
//     <div className="customers-page" id="customers-page">
//       <div className="page-header">
//         <div>
//           <h1 className="page-title">Customers</h1>
//           <p className="page-subtitle">Manage customer directory, credit limits, and reports</p>
//         </div>
//         {canCreate && activeTab === 'list' && (
//           <Button
//             variant="primary"
//             icon={<Plus size={16} />}
//             onClick={openCreateModal}
//             id="btn-create-customer"
//           >
//             Create Customer
//           </Button>
//         )}
//       </div>

//       <DataTransferBar module="customers" onImported={() => void loadCustomers()} />

//       <div className="page-tabs">
//         <button
//           className={`page-tab-btn ${activeTab === 'list' ? 'active' : ''}`}
//           onClick={() => setActiveTab('list')}
//         >
//           <Users size={16} />
//           <span>List of Customers</span>
//         </button>
//         <button
//           className={`page-tab-btn ${activeTab === 'quotationReport' ? 'active' : ''}`}
//           onClick={() => {
//             setActiveTab('quotationReport');
//             if (reportCustomerId) handleFetchReport();
//           }}
//         >
//           <FileText size={16} />
//           <span>Customer Quotation Report</span>
//         </button>
//         <button
//           className={`page-tab-btn ${activeTab === 'salesReport' ? 'active' : ''}`}
//           onClick={() => {
//             setActiveTab('salesReport');
//             if (reportCustomerId) handleFetchReport();
//           }}
//         >
//           <span className="aed-symbol" aria-label="AED">د.إ</span>
//           <span>Customer Sales Report</span>
//         </button>
//       </div>

//       {activeTab === 'list' && (
//         <Card>
//           <div className="filter-bar">
//             <div className="filter-search-box">
//               <Input
//                 placeholder="Search by company or contact person..."
//                 value={search}
//                 onChange={(e) => setSearch(e.target.value)}
//                 icon={<Search size={16} />}
//               />
//             </div>
//             <div className="filter-select-box">
//               <Select
//                 value={statusFilter}
//                 onChange={(e) => setStatusFilter(e.target.value)}
//                 options={[
//                   { value: '', label: 'All Statuses' },
//                   { value: 'Active', label: 'Active' },
//                   { value: 'Inactive', label: 'Inactive' },
//                 ]}
//               />
//             </div>
//           </div>

//           <Table
//             data={customers}
//             isLoading={isLoading}
//             keyExtractor={(item) => item._id}
//             columns={[
//               {
//                 header: 'Company Name',
//                 accessor: (c) => <strong>{c.companyName}</strong>,
//               },
//               {
//                 header: 'Contact Person',
//                 accessor: (c) => c.contactPersonName || '-',
//               },
//               {
//                 header: 'Phone / Mobile',
//                 accessor: (c) => c.mobileNumber || c.telephoneNumber || '-',
//               },
//               {
//                 header: 'Email',
//                 accessor: (c) => c.email || '-',
//               },
//               {
//                 header: 'Credit Limit',
//                 accessor: (c) => `AED ${Number(c.creditLimit || 0).toLocaleString()}`,
//               },
//               {
//                 header: 'Document',
//                 accessor: (c) =>
//                   c.companyDocumentUrl ? (
//                     <a
//                       href={c.companyDocumentUrl}
//                       target="_blank"
//                       rel="noopener noreferrer"
//                       className="action-icon-btn btn-view"
//                       title="Download Document"
//                     >
//                       <Download size={16} />
//                     </a>
//                   ) : (
//                     <span style={{ color: 'var(--text-muted)' }}>None</span>
//                   ),
//               },
//               {
//                 header: 'Status',
//                 accessor: (c) => (
//                   <Badge variant={c.status === 'Active' ? 'success' : 'danger'}>
//                     {c.status}
//                   </Badge>
//                 ),
//               },
//               {
//                 header: 'Actions',
//                 accessor: (c) =>
//                   canModify ? (
//                     <div className="table-actions">
//                       <button
//                         className="action-icon-btn btn-edit"
//                         onClick={() => openEditModal(c)}
//                         title="Edit Customer"
//                       >
//                         <Edit2 size={16} />
//                       </button>
//                       {c.status === 'Inactive' ? (
//                         <button className="action-icon-btn btn-edit" onClick={() => handleActivate(c)} title="Activate Customer">Activate</button>
//                       ) : (
//                         <button
//                           className="action-icon-btn btn-delete"
//                           onClick={() => setCustomerToDeactivate(c)}
//                           title="Deactivate Customer"
//                         >
//                           <Trash2 size={16} />
//                         </button>
//                       )}
//                     </div>
//                   ) : (
//                     '-'
//                   ),
//               },
//             ]}
//             emptyTitle="No customers found"
//             emptyDescription="Add a new customer to start creating quotations and invoices."
//           />
//         </Card>
//       )}

//       {(activeTab === 'quotationReport' || activeTab === 'salesReport') && (
//         <Card title={activeTab === 'quotationReport' ? 'Customer Wise Quotation Report' : 'Customer Wise Sales Report'}>
//           <div className="filter-bar">
//             <div style={{ flex: 1, minWidth: 200 }}>
//               <Select
//                 label="Choose Customer"
//                 value={reportCustomerId}
//                 onChange={(e) => setReportCustomerId(e.target.value)}
//                 options={[
//                   { value: '', label: '-- Select Customer --' },
//                   ...customers.map((c) => ({ value: c._id, label: c.companyName })),
//                 ]}
//               />
//             </div>
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

//           {activeTab === 'quotationReport' && (
//             <Table
//               data={reportQuotations}
//               isLoading={isReportLoading}
//               keyExtractor={(q) => q._id}
//               columns={[
//                 {
//                   header: 'Quotation #',
//                   accessor: (q) => <strong>{q.quotationNo}</strong>,
//                 },
//                 {
//                   header: 'Date',
//                   accessor: (q) => new Date(q.dateOfQuotation).toLocaleDateString(),
//                 },
//                 {
//                   header: 'Customer',
//                   accessor: (q) => (typeof q.customer === 'object' ? q.customer.companyName : q.customer),
//                 },
//                 {
//                   header: 'Salesperson',
//                   accessor: (q) => (typeof q.salesPerson === 'object' ? q.salesPerson?.name : '-'),
//                 },
//                 {
//                   header: 'Subtotal',
//                   accessor: (q) => `AED ${q.subTotal.toFixed(2)}`,
//                 },
//                 {
//                   header: 'VAT',
//                   accessor: (q) => `AED ${q.vatAmount.toFixed(2)}`,
//                 },
//                 {
//                   header: 'Total Amount',
//                   accessor: (q) => `AED ${q.totalAmount.toFixed(2)}`,
//                 },
//                 {
//                   header: 'Status',
//                   accessor: (q) => (
//                     <Badge variant={q.status === 'Converted' ? 'success' : q.status === 'Cancelled' ? 'danger' : 'info'}>
//                       {q.status}
//                     </Badge>
//                   ),
//                 },
//               ]}
//               emptyTitle="No quotation records"
//               emptyDescription="Select a customer and date range to view quotation reports."
//             />
//           )}

//           {activeTab === 'salesReport' && (
//             <Table
//               data={reportInvoices}
//               isLoading={isReportLoading}
//               keyExtractor={(i) => i._id}
//               columns={[
//                 {
//                   header: 'Invoice #',
//                   accessor: (i) => <strong>{i.invoiceNo}</strong>,
//                 },
//                 {
//                   header: 'Date',
//                   accessor: (i) => new Date(i.invoiceDate).toLocaleDateString(),
//                 },
//                 {
//                   header: 'Customer',
//                   accessor: (i) => (typeof i.customer === 'object' ? i.customer.companyName : i.customer),
//                 },
//                 {
//                   header: 'Total Amount',
//                   accessor: (i) => `AED ${i.totalAmount.toFixed(2)}`,
//                 },
//                 {
//                   header: 'Paid Amount',
//                   accessor: (i) => `AED ${i.paidAmount.toFixed(2)}`,
//                 },
//                 {
//                   header: 'Balance',
//                   accessor: (i) => `AED ${i.balanceAmount.toFixed(2)}`,
//                 },
//                 {
//                   header: 'Payment Status',
//                   accessor: (i) => (
//                     <Badge variant={i.paymentStatus === 'Paid' ? 'success' : i.paymentStatus === 'Partially Paid' ? 'warning' : 'danger'}>
//                       {i.paymentStatus}
//                     </Badge>
//                   ),
//                 },
//               ]}
//               emptyTitle="No sales records"
//               emptyDescription="Select a customer and date range to view sales reports."
//             />
//           )}
//         </Card>
//       )}

//       {/* Create / Edit Customer Modal */}
//       <Modal
//         isOpen={isFormOpen}
//         onClose={() => setIsFormOpen(false)}
//         title={editingCustomer ? 'Modify Customer' : 'Create Customer'}
//         size="lg"
//       >
//         <form onSubmit={handleSaveCustomer} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
//           <Input
//             label="Name of the Company"
//             placeholder="e.g. Acme Corporation"
//             value={companyName}
//             onChange={(e) => setCompanyName(e.target.value)}
//             error={formErrors.companyName}
//             isRequired
//           />

//           <div className="form-grid-2">
//             <Input
//               label="Contact Person Name"
//               placeholder="e.g. Jane Smith"
//               value={contactPersonName}
//               onChange={(e) => setContactPersonName(e.target.value)}
//             />
//             <Input
//               type="email"
//               label="Email ID"
//               placeholder="billing@company.com"
//               value={email}
//               onChange={(e) => setEmail(e.target.value)}
//               error={formErrors.email}
//             />
//           </div>

//           <div className="form-grid-2">
//             <Input
//               label="Telephone Number"
//               placeholder="e.g. +1 555-1234"
//               value={telephoneNumber}
//               onChange={(e) => setTelephoneNumber(e.target.value)}
//             />
//             <Input
//               label="Mobile Number"
//               placeholder="e.g. +1 555-5678"
//               value={mobileNumber}
//               onChange={(e) => setMobileNumber(e.target.value)}
//             />
//           </div>

//           <Input
//             label="Address of the Company"
//             placeholder="e.g. 100 Main Street, Suite 200, Metropolis"
//             value={companyAddress}
//             onChange={(e) => setCompanyAddress(e.target.value)}
//           />

//           <div className="form-grid-2">
//             <Input
//               type="number"
//               label="Credit Limit (AED)"
//               placeholder="0"
//               value={creditLimit}
//               onChange={(e) => setCreditLimit(e.target.value === '' ? '' : Number(e.target.value))}
//               error={formErrors.creditLimit}
//               min="0"
//               step="any"
//             />
//             <div className="input-group">
//               <label className="input-label">Upload Company Documents (multiple)</label>
//               <input
//                 type="file"
//                 className="input-field"
//                 multiple accept=".pdf,.doc,.docx,.xls,.xlsx,image/*" onChange={(e) => setDocumentFiles(Array.from(e.target.files || []))}
//               />
//             </div>
//           </div>

//           <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
//             <Button variant="secondary" type="button" onClick={() => setIsFormOpen(false)} disabled={isSaving}>
//               Cancel
//             </Button>
//             <Button
//               variant="primary"
//               type="submit"
//               isLoading={isSaving}
//               loadingText={editingCustomer ? 'Saving Changes...' : 'Creating Customer...'}
//             >
//               {editingCustomer ? 'Save Changes' : 'Create Customer'}
//             </Button>
//           </div>
//         </form>
//       </Modal>

//       {/* Deactivate Confirm Dialog */}
//       <ConfirmDialog
//         isOpen={!!customerToDeactivate}
//         onClose={() => setCustomerToDeactivate(null)}
//         onConfirm={handleDeactivate}
//         title="Deactivate Customer"
//         message={`Are you sure you want to deactivate "${customerToDeactivate?.companyName}"? They will no longer appear in active selections.`}
//         confirmText="Deactivate"
//         isLoading={isDeactivating}
//       />
//     </div>
//   );
// };

// export default Customers;




import React, { useEffect, useState, useCallback } from 'react';
import {
  Users,
  Plus,
  Search,
  FileText,
  Edit2,
  Trash2,
  Download,
  Calendar,
  Eye,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import customerService from '../../services/customer.service';
import { Customer, CreateCustomerPayload } from '../../types/customer.types';
import { Quotation } from '../../types/quotation.types';
import { Invoice } from '../../types/invoice.types';
import Card from '../../components/common/card/Card';
import Button from '../../components/common/button/Button';
import Input from '../../components/common/input/Input';
import Select from '../../components/common/select/Select';
import Table from '../../components/common/table/Table';
import Modal from '../../components/common/modal/Modal';
import Badge from '../../components/common/badge/Badge';
import ConfirmDialog from '../../components/common/confirm/ConfirmDialog';
import DataTransferBar from '../../components/common/data-transfer/DataTransferBar';
import './Customers.css';

export const Customers: React.FC = () => {
  const { hasPermission } = useAuth();
  const toast = useToast();

  const canCreate = hasPermission('customers', 'create');
  const canModify = hasPermission('customers', 'modify');

  const [activeTab, setActiveTab] = useState<'list' | 'quotationReport' | 'salesReport'>('list');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Deactivate state
  const [customerToDeactivate, setCustomerToDeactivate] = useState<Customer | null>(null);
  const [isDeactivating, setIsDeactivating] = useState(false);

  // Customer Form fields
  const [companyName, setCompanyName] = useState('');
  const [telephoneNumber, setTelephoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [contactPersonName, setContactPersonName] = useState('');
  const [companyAddress, setCompanyAddress] = useState('');
  const [creditLimit, setCreditLimit] = useState<number | ''>('');
  // const [documentFiles, setDocumentFiles] = useState<File[]>([]);
  const [documentFiles, setDocumentFiles] = useState<(File | null)[]>([]);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Reports state
  const [reportCustomerId, setReportCustomerId] = useState('');
  const [reportFrom, setReportFrom] = useState('');
  const [reportTo, setReportTo] = useState('');
  const [reportQuotations, setReportQuotations] = useState<Quotation[]>([]);
  const [reportInvoices, setReportInvoices] = useState<Invoice[]>([]);
  const [isReportLoading, setIsReportLoading] = useState(false);

  // NEW: view-documents modal state
  const [viewingDocsCustomer, setViewingDocsCustomer] = useState<Customer | null>(null);

  const loadCustomers = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await customerService.getAllCustomers(search, statusFilter);
      setCustomers(data);
    } catch (err: any) {
      toast.error(err.message || 'Failed to fetch customers');
    } finally {
      setIsLoading(false);
    }
  }, [search, statusFilter, toast]);

  useEffect(() => {
    loadCustomers();
  }, [loadCustomers]);

  const openCreateModal = () => {
    setEditingCustomer(null);
    setCompanyName('');
    setTelephoneNumber('');
    setEmail('');
    setMobileNumber('');
    setContactPersonName('');
    setCompanyAddress('');
    setCreditLimit('');
    setDocumentFiles([]);
    setFormErrors({});
    setIsFormOpen(true);
  };

  const openEditModal = (c: Customer) => {
    setEditingCustomer(c);
    setCompanyName(c.companyName);
    setTelephoneNumber(c.telephoneNumber || '');
    setEmail(c.email || '');
    setMobileNumber(c.mobileNumber || '');
    setContactPersonName(c.contactPersonName || '');
    setCompanyAddress(c.companyAddress || '');
    setCreditLimit(c.creditLimit > 0 ? c.creditLimit : '');
    setDocumentFiles([]);
    setFormErrors({});
    setIsFormOpen(true);
  };

  // NEW: helper to get a normalized document list for any customer,
  // falling back to the legacy single-url field for old records.
  const getCustomerDocuments = (c: Customer) => {
    if (c.companyDocuments && c.companyDocuments.length > 0) {
      return c.companyDocuments;
    }
    if (c.companyDocumentUrl) {
      return [{ id: 'legacy', filename: 'Document', url: c.companyDocumentUrl }];
    }
    return [];
  };

  const validateForm = () => {
    const errs: Record<string, string> = {};
    if (!companyName.trim()) {
      errs.companyName = 'Company name is required';
    }
    if (email && !/^\S+@\S+\.\S+$/.test(email)) {
      errs.email = 'Please enter a valid email';
    }
    if (Number(creditLimit || 0) < 0) {
      errs.creditLimit = 'Credit limit cannot be negative';
    }
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSaveCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSaving(true);
    try {
      const payload: CreateCustomerPayload = {
        companyName,
        telephoneNumber: telephoneNumber || undefined,
        email: email || undefined,
        mobileNumber: mobileNumber || undefined,
        contactPersonName: contactPersonName || undefined,
        companyAddress: companyAddress || undefined,
        creditLimit: Number(creditLimit || 0),
        // companyDocuments: documentFiles.length ? documentFiles : undefined,
        companyDocuments: documentFiles.filter(
  (file): file is File => file !== null
),
      };

      if (editingCustomer) {
        await customerService.updateCustomer(editingCustomer._id, payload);
        toast.success('Customer updated successfully');
      } else {
        await customerService.createCustomer(payload);
        toast.success('Customer created successfully');
      }
      setIsFormOpen(false);
      loadCustomers();
    } catch (err: any) {
      toast.error(err.message || 'Failed to save customer');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeactivate = async () => {
    if (!customerToDeactivate) return;
    setIsDeactivating(true);
    try {
      await customerService.setCustomerStatus(customerToDeactivate._id, 'Inactive');
      toast.success('Customer deactivated successfully');
      setCustomerToDeactivate(null);
      loadCustomers();
    } catch (err: any) {
      toast.error(err.message || 'Failed to deactivate customer');
    } finally {
      setIsDeactivating(false);
    }
  };

  const handleActivate = async (customer: Customer) => {
    try { await customerService.setCustomerStatus(customer._id, 'Active'); toast.success('Customer activated successfully'); loadCustomers(); }
    catch (err:any) { toast.error(err.message || 'Failed to activate customer'); }
  };

  const handleFetchReport = async () => {
    if (!reportCustomerId) {
      toast.warning('Please select a customer');
      return;
    }
    setIsReportLoading(true);
    try {
      if (activeTab === 'quotationReport') {
        const data = await customerService.getCustomerWiseQuotationReport(
          reportCustomerId,
          reportFrom || undefined,
          reportTo || undefined
        );
        setReportQuotations(data);
      } else if (activeTab === 'salesReport') {
        const data = await customerService.getCustomerWiseSalesReport(
          reportCustomerId,
          reportFrom || undefined,
          reportTo || undefined
        );
        setReportInvoices(data);
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to generate report');
    } finally {
      setIsReportLoading(false);
    }
  };

  return (
    <div className="customers-page" id="customers-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Customers</h1>
          <p className="page-subtitle">Manage customer directory, credit limits, and reports</p>
        </div>
        {canCreate && activeTab === 'list' && (
          <Button
            variant="primary"
            icon={<Plus size={16} />}
            onClick={openCreateModal}
            id="btn-create-customer"
          >
            Create Customer
          </Button>
        )}
      </div>

      <DataTransferBar module="customers" onImported={() => void loadCustomers()} />

      <div className="page-tabs">
        <button
          className={`page-tab-btn ${activeTab === 'list' ? 'active' : ''}`}
          onClick={() => setActiveTab('list')}
        >
          <Users size={16} />
          <span>List of Customers</span>
        </button>
        <button
          className={`page-tab-btn ${activeTab === 'quotationReport' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('quotationReport');
            if (reportCustomerId) handleFetchReport();
          }}
        >
          <FileText size={16} />
          <span>Customer Quotation Report</span>
        </button>
        <button
          className={`page-tab-btn ${activeTab === 'salesReport' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('salesReport');
            if (reportCustomerId) handleFetchReport();
          }}
        >
          <span className="aed-symbol" aria-label="AED">د.إ</span>
          <span>Customer Sales Report</span>
        </button>
      </div>

      {activeTab === 'list' && (
        <Card>
          <div className="filter-bar">
            <div className="filter-search-box">
              <Input
                placeholder="Search by company or contact person..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                icon={<Search size={16} />}
              />
            </div>
            <div className="filter-select-box">
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                options={[
                  { value: '', label: 'All Statuses' },
                  { value: 'Active', label: 'Active' },
                  { value: 'Inactive', label: 'Inactive' },
                ]}
              />
            </div>
          </div>

          <Table
            data={customers}
            isLoading={isLoading}
            keyExtractor={(item) => item._id}
            columns={[
              {
                header: 'Company Name',
                accessor: (c) => <strong>{c.companyName}</strong>,
              },
              {
                header: 'Contact Person',
                accessor: (c) => c.contactPersonName || '-',
              },
              {
                header: 'Phone / Mobile',
                accessor: (c) => c.mobileNumber || c.telephoneNumber || '-',
              },
              {
                header: 'Email',
                accessor: (c) => c.email || '-',
              },
              {
                header: 'Credit Limit',
                accessor: (c) => `AED ${Number(c.creditLimit || 0).toLocaleString()}`,
              },
              {
                /* CHANGED: "Document" column -> "Documents" column, shows a View button
                   that opens a modal listing every uploaded file for that customer. */
                header: 'Documents',
                accessor: (c) => {
                  const docs = getCustomerDocuments(c);
                  if (docs.length === 0) {
                    return <span style={{ color: 'var(--text-muted)' }}>None</span>;
                  }
                  return (
                    <button
                      type="button"
                      className="action-icon-btn btn-view"
                      title="View Documents"
                      onClick={() => setViewingDocsCustomer(c)}
                    >
                      <Eye size={16} />
                      <span style={{ marginLeft: 4, fontSize: 12 }}>
                        {docs.length} file{docs.length > 1 ? 's' : ''}
                      </span>
                    </button>
                  );
                },
              },
              {
                header: 'Status',
                accessor: (c) => (
                  <Badge variant={c.status === 'Active' ? 'success' : 'danger'}>
                    {c.status}
                  </Badge>
                ),
              },
              {
                header: 'Actions',
                accessor: (c) =>
                  canModify ? (
                    <div className="table-actions">
                      <button
                        className="action-icon-btn btn-edit"
                        onClick={() => openEditModal(c)}
                        title="Edit Customer"
                      >
                        <Edit2 size={16} />
                      </button>
                      {c.status === 'Inactive' ? (
                        <button className="action-icon-btn btn-edit" onClick={() => handleActivate(c)} title="Activate Customer">Activate</button>
                      ) : (
                        <button
                          className="action-icon-btn btn-delete"
                          onClick={() => setCustomerToDeactivate(c)}
                          title="Deactivate Customer"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  ) : (
                    '-'
                  ),
              },
            ]}
            emptyTitle="No customers found"
            emptyDescription="Add a new customer to start creating quotations and invoices."
          />
        </Card>
      )}

      {(activeTab === 'quotationReport' || activeTab === 'salesReport') && (
        <Card title={activeTab === 'quotationReport' ? 'Customer Wise Quotation Report' : 'Customer Wise Sales Report'}>
          <div className="filter-bar">
            <div style={{ flex: 1, minWidth: 200 }}>
              <Select
                label="Choose Customer"
                value={reportCustomerId}
                onChange={(e) => setReportCustomerId(e.target.value)}
                options={[
                  { value: '', label: '-- Select Customer --' },
                  ...customers.map((c) => ({ value: c._id, label: c.companyName })),
                ]}
              />
            </div>
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

          {activeTab === 'quotationReport' && (
            <Table
              data={reportQuotations}
              isLoading={isReportLoading}
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
                  header: 'Salesperson',
                  accessor: (q) => (typeof q.salesPerson === 'object' ? q.salesPerson?.name : '-'),
                },
                {
                  header: 'Subtotal',
                  accessor: (q) => `AED ${q.subTotal.toFixed(2)}`,
                },
                {
                  header: 'VAT',
                  accessor: (q) => `AED ${q.vatAmount.toFixed(2)}`,
                },
                {
                  header: 'Total Amount',
                  accessor: (q) => `AED ${q.totalAmount.toFixed(2)}`,
                },
                {
                  header: 'Status',
                  accessor: (q) => (
                    <Badge variant={q.status === 'Converted' ? 'success' : q.status === 'Cancelled' ? 'danger' : 'info'}>
                      {q.status}
                    </Badge>
                  ),
                },
              ]}
              emptyTitle="No quotation records"
              emptyDescription="Select a customer and date range to view quotation reports."
            />
          )}

          {activeTab === 'salesReport' && (
            <Table
              data={reportInvoices}
              isLoading={isReportLoading}
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
                  header: 'Paid Amount',
                  accessor: (i) => `AED ${i.paidAmount.toFixed(2)}`,
                },
                {
                  header: 'Balance',
                  accessor: (i) => `AED ${i.balanceAmount.toFixed(2)}`,
                },
                {
                  header: 'Payment Status',
                  accessor: (i) => (
                    <Badge variant={i.paymentStatus === 'Paid' ? 'success' : i.paymentStatus === 'Partially Paid' ? 'warning' : 'danger'}>
                      {i.paymentStatus}
                    </Badge>
                  ),
                },
              ]}
              emptyTitle="No sales records"
              emptyDescription="Select a customer and date range to view sales reports."
            />
          )}
        </Card>
      )}

      {/* Create / Edit Customer Modal */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={editingCustomer ? 'Modify Customer' : 'Create Customer'}
        size="lg"
      >
        <form onSubmit={handleSaveCustomer} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Input
            label="Name of the Company"
            placeholder="e.g. Acme Corporation"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            error={formErrors.companyName}
            isRequired
          />

          <div className="form-grid-2">
            <Input
              label="Contact Person Name"
              placeholder="e.g. Jane Smith"
              value={contactPersonName}
              onChange={(e) => setContactPersonName(e.target.value)}
            />
            <Input
              type="email"
              label="Email ID"
              placeholder="billing@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={formErrors.email}
            />
          </div>

          <div className="form-grid-2">
            <Input
              label="Telephone Number"
              placeholder="e.g. +1 555-1234"
              value={telephoneNumber}
              onChange={(e) => setTelephoneNumber(e.target.value)}
            />
            <Input
              label="Mobile Number"
              placeholder="e.g. +1 555-5678"
              value={mobileNumber}
              onChange={(e) => setMobileNumber(e.target.value)}
            />
          </div>

          <Input
            label="Address of the Company"
            placeholder="e.g. 100 Main Street, Suite 200, Metropolis"
            value={companyAddress}
            onChange={(e) => setCompanyAddress(e.target.value)}
          />

          <div className="form-grid-2">
            <Input
              type="number"
              label="Credit Limit (AED)"
              placeholder="0"
              value={creditLimit}
              onChange={(e) => setCreditLimit(e.target.value === '' ? '' : Number(e.target.value))}
              error={formErrors.creditLimit}
              min="0"
              step="any"
            />
            <div className="input-group">
              <label className="input-label">Upload Company Documents (multiple)</label>
              {/* <input
                type="file"
                className="input-field"
                multiple accept=".pdf,.doc,.docx,.xls,.xlsx,image/*" onChange={(e) => setDocumentFiles(Array.from(e.target.files || []))}
              /> */}
              <div className="document-upload-list">
  {documentFiles.map((file, index) => (
    <div key={index} className="document-upload-row">
      <input
        type="file"
        className="input-field"
        accept=".pdf,.doc,.docx,.xls,.xlsx,image/*"
        onChange={(e) => {
          const selectedFile = e.target.files?.[0];

          if (!selectedFile) return;

          setDocumentFiles((prev) => {
            const updated = [...prev];
            updated[index] = selectedFile;
            return updated;
          });
        }}
      />

      {index === documentFiles.length - 1 && (
        <button
          type="button"
          className="add-document-btn"
          onClick={() => setDocumentFiles((prev) => [...prev, null as any])}
          title="Add another document"
        >
          +
        </button>
      )}

      {documentFiles.length > 1 && (
        <button
          type="button"
          className="remove-document-btn"
          onClick={() => {
            setDocumentFiles((prev) =>
              prev.filter((_, i) => i !== index)
            );
          }}
          title="Remove document"
        >
          ×
        </button>
      )}
    </div>
  ))}

  {documentFiles.length === 0 && (
    <div className="document-upload-row">
      <input
        type="file"
        className="input-field"
        accept=".pdf,.doc,.docx,.xls,.xlsx,image/*"
        onChange={(e) => {
          const selectedFile = e.target.files?.[0];

          if (!selectedFile) return;

          setDocumentFiles([selectedFile]);
        }}
      />

      <button
        type="button"
        className="add-document-btn"
        onClick={() => setDocumentFiles([null as any])}
        title="Add another document"
      >
        +
      </button>
    </div>
  )}
</div>
              {/* NEW: show files already saved on this customer when editing */}
              {editingCustomer && getCustomerDocuments(editingCustomer).length > 0 && (
                <div className="document-list" style={{ marginTop: 8 }}>
                  <label className="input-label" style={{ fontSize: 12 }}>Already uploaded:</label>
            
                 {getCustomerDocuments(editingCustomer).map((doc, idx) => (
  <div key={doc.id || idx} className="document-list-item">
    <span className="document-filename" title={doc.filename}>
      {doc.filename}
    </span>

    <a
      href={doc.url}
      target="_blank"
      rel="noopener noreferrer"
      className="action-icon-btn btn-view"
      title="View"
    >
      <Eye size={14} />
    </a>

    <a
      href={doc.url}
      download
      target="_blank"
      rel="noopener noreferrer"
      className="action-icon-btn btn-view"
      title="Download"
    >
      <Download size={14} />
    </a>
  </div>
))}
                </div>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
            <Button variant="secondary" type="button" onClick={() => setIsFormOpen(false)} disabled={isSaving}>
              Cancel
            </Button>
            <Button
              variant="primary"
              type="submit"
              isLoading={isSaving}
              loadingText={editingCustomer ? 'Saving Changes...' : 'Creating Customer...'}
            >
              {editingCustomer ? 'Save Changes' : 'Create Customer'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* NEW: View Documents Modal */}
      <Modal
        isOpen={!!viewingDocsCustomer}
        onClose={() => setViewingDocsCustomer(null)}
        title={`Documents - ${viewingDocsCustomer?.companyName || ''}`}
        size="md"
      >
        <div className="document-list">
          {viewingDocsCustomer &&
            getCustomerDocuments(viewingDocsCustomer).map((doc, idx) => (
              <div
                key={doc.id || idx}
                className="document-list-item"
                style={{
                  justifyContent: 'space-between',
                  padding: '8px 0',
                  borderBottom: '1px solid var(--border-color, #eee)',
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <FileText size={16} />
                  {doc.filename || `Document ${idx + 1}`}
                </span>
           <span style={{ display: 'flex', gap: 8 }}>
  <a
    href={doc.url}
    target="_blank"
    rel="noopener noreferrer"
    className="action-icon-btn btn-view"
    title="View"
  >
    <Eye size={16} />
  </a>

  <a
    href={doc.url}
    download
    target="_blank"
    rel="noopener noreferrer"
    className="action-icon-btn btn-view"
    title="Download"
  >
    <Download size={16} />
  </a>
</span>
              </div>
            ))}
          {viewingDocsCustomer && getCustomerDocuments(viewingDocsCustomer).length === 0 && (
            <p style={{ color: 'var(--text-muted)' }}>No documents uploaded.</p>
          )}
        </div>
      </Modal>

      {/* Deactivate Confirm Dialog */}
      <ConfirmDialog
        isOpen={!!customerToDeactivate}
        onClose={() => setCustomerToDeactivate(null)}
        onConfirm={handleDeactivate}
        title="Deactivate Customer"
        message={`Are you sure you want to deactivate "${customerToDeactivate?.companyName}"? They will no longer appear in active selections.`}
        confirmText="Deactivate"
        isLoading={isDeactivating}
      />
    </div>
  );
};

export default Customers;