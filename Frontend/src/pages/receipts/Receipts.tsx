// import React, { useCallback, useEffect, useMemo, useState } from 'react';
// import { ArrowRightLeft, Download, Eye, Plus, Receipt as ReceiptIcon } from 'lucide-react';
// import { useAuth } from '../../context/AuthContext';
// import { useToast } from '../../context/ToastContext';
// import receiptService from '../../services/receipt.service';
// import customerService from '../../services/customer.service';
// import { Customer } from '../../types/customer.types';
// import { Invoice } from '../../types/invoice.types';
// import { Receipt } from '../../types/receipt.types';
// import Card from '../../components/common/card/Card';
// import Button from '../../components/common/button/Button';
// import Input from '../../components/common/input/Input';
// import Select from '../../components/common/select/Select';
// import Table from '../../components/common/table/Table';
// import Modal from '../../components/common/modal/Modal';
// import Badge from '../../components/common/badge/Badge';
// import DataTransferBar from '../../components/common/data-transfer/DataTransferBar';
// import './Receipts.css';
// import { downloadProtectedFile, fetchProtectedFile } from '../../utils/fileDownload';

// type ReceiptMode = 'Advance' | 'Collection' | 'AdvanceAdjustment';

// export const Receipts: React.FC = () => {
//   const { hasPermission } = useAuth();
//   const toast = useToast();
//   const canCreate = hasPermission('receipts', 'create');

//   const [receipts, setReceipts] = useState<Receipt[]>([]);
//   const [customers, setCustomers] = useState<Customer[]>([]);
//   const [isLoading, setIsLoading] = useState(false);
//   const [typeFilter, setTypeFilter] = useState('');
//   const [customerFilter, setCustomerFilter] = useState('');

//   const [isModalOpen, setIsModalOpen] = useState(false);
//   const [receiptType, setReceiptType] = useState<ReceiptMode>('Collection');
//   const [selectedCustomerId, setSelectedCustomerId] = useState('');
//   const [paymentMode, setPaymentMode] = useState<'Cash' | 'Bank'>('Bank');
//   const [pendingInvoices, setPendingInvoices] = useState<Invoice[]>([]);
//   const [advanceBalance, setAdvanceBalance] = useState(0);
//   const [selectedInvoiceId, setSelectedInvoiceId] = useState('');
//   const [amount, setAmount] = useState<number | ''>('');
//   const [isLoadingCustomerData, setIsLoadingCustomerData] = useState(false);
//   const [isSaving, setIsSaving] = useState(false);
//   const [viewingReceipt, setViewingReceipt] = useState<Receipt | null>(null);
//   const [isLoadingDetails, setIsLoadingDetails] = useState(false);
//   const [previewReceipt, setPreviewReceipt] = useState<Receipt | null>(null);
//   const [previewUrl, setPreviewUrl] = useState('');
//   const [isPreviewLoading, setIsPreviewLoading] = useState(false);

//   const loadData = useCallback(async () => {
//     setIsLoading(true);
//     try {
//       const [receiptList, customerList] = await Promise.all([
//         receiptService.getAllReceipts(typeFilter || undefined, customerFilter || undefined),
//         customerService.getAllCustomers(),
//       ]);
//       setReceipts(receiptList);
//       setCustomers(customerList);
//     } catch (err: any) {
//       toast.error(err.message || 'Failed to load receipts');
//     } finally {
//       setIsLoading(false);
//     }
//   }, [typeFilter, customerFilter, toast]);

//   useEffect(() => { loadData(); }, [loadData]);

//   const loadCustomerReceiptData = useCallback(async (customerId: string) => {
//     setSelectedInvoiceId('');
//     setAmount('');
//     setPendingInvoices([]);
//     setAdvanceBalance(0);
//     if (!customerId) return;

//     setIsLoadingCustomerData(true);
//     try {
//       const [pending, advance] = await Promise.all([
//         receiptService.getPendingInvoices(customerId),
//         receiptService.getAdvanceBalance(customerId),
//       ]);
//       setPendingInvoices(pending);
//       setAdvanceBalance(advance.totalAdvance);
//     } catch (err: any) {
//       toast.error(err.message || 'Failed to load customer payment details');
//     } finally {
//       setIsLoadingCustomerData(false);
//     }
//   }, [toast]);

//   useEffect(() => {
//     if (isModalOpen && selectedCustomerId) loadCustomerReceiptData(selectedCustomerId);
//   }, [isModalOpen, selectedCustomerId, loadCustomerReceiptData]);

//   const selectedInvoice = useMemo(
//     () => pendingInvoices.find((invoice) => invoice._id === selectedInvoiceId),
//     [pendingInvoices, selectedInvoiceId]
//   );

//   const openCreateModal = () => {
//     if (!customers.length) {
//       toast.warning('Please create a customer first');
//       return;
//     }
//     setReceiptType('Collection');
//     setSelectedCustomerId(customers[0]._id);
//     setPaymentMode('Bank');
//     setSelectedInvoiceId('');
//     setAmount('');
//     setIsModalOpen(true);
//   };

//   const handleCreateReceipt = async (e: React.FormEvent) => {
//     e.preventDefault();
//     if (!selectedCustomerId) return toast.warning('Please select a customer');
//     if (Number(amount) <= 0) return toast.warning('Amount must be greater than zero');

//     if (receiptType !== 'Advance' && !selectedInvoiceId) {
//       return toast.warning('Please select a pending invoice');
//     }
//     if (selectedInvoice && Number(amount) > selectedInvoice.balanceAmount) {
//       return toast.warning(`Amount cannot exceed invoice balance of AED ${selectedInvoice.balanceAmount.toFixed(2)}`);
//     }
//     if (receiptType === 'AdvanceAdjustment' && Number(amount) > advanceBalance) {
//       return toast.warning(`Adjustment cannot exceed available advance of AED ${advanceBalance.toFixed(2)}`);
//     }

//     setIsSaving(true);
//     try {
//       let created: Receipt;
//       if (receiptType === 'Advance') {
//         created = await receiptService.createAdvanceReceipt({
//           customer: selectedCustomerId,
//           amount: Number(amount),
//           paymentMode,
//         });
//       } else if (receiptType === 'Collection') {
//         created = await receiptService.createCollectionReceipt({
//           customer: selectedCustomerId,
//           paymentMode,
//           allocations: [{ invoice: selectedInvoiceId, amount: Number(amount) }],
//         });
//       } else {
//         created = await receiptService.createAdvanceAdjustment({
//           customer: selectedCustomerId,
//           allocations: [{ invoice: selectedInvoiceId, amount: Number(amount) }],
//         });
//       }
//       toast.success(`${created.receiptNo} created successfully`);
//       setIsModalOpen(false);
//       await loadData();
//     } catch (err: any) {
//       toast.error(err.message || 'Failed to record receipt');
//     } finally {
//       setIsSaving(false);
//     }
//   };

//   const openReceiptDetails = async (receipt: Receipt) => {
//     setViewingReceipt(receipt);
//     setIsLoadingDetails(true);
//     try {
//       setViewingReceipt(await receiptService.getReceiptById(receipt._id));
//     } catch (err: any) {
//       toast.error(err.message || 'Failed to load receipt details');
//     } finally {
//       setIsLoadingDetails(false);
//     }
//   };

//   const openReceiptPdfPreview = async (receipt: Receipt) => {
//     if (!receipt.pdfUrl) return;
//     setPreviewReceipt(receipt);
//     setIsPreviewLoading(true);
//     try {
//       const blob = await fetchProtectedFile(receipt.pdfUrl);
//       const url = URL.createObjectURL(blob);
//       setPreviewUrl((old) => { if (old) URL.revokeObjectURL(old); return url; });
//     } catch (err: any) {
//       toast.error(err.message || 'Failed to preview receipt');
//       setPreviewReceipt(null);
//     } finally { setIsPreviewLoading(false); }
//   };

//   const closeReceiptPreview = () => {
//     if (previewUrl) URL.revokeObjectURL(previewUrl);
//     setPreviewUrl('');
//     setPreviewReceipt(null);
//   };

//   return (
//     <div className="receipts-page" id="receipts-page">
//       <div className="page-header">
//         <div>
//           <h1 className="page-title">Receipts & Payment Collections</h1>
//           <p className="page-subtitle">Advance receipts, invoice collections and FIFO advance adjustments</p>
//         </div>
//         {canCreate && <Button variant="primary" icon={<Plus size={16} />} onClick={openCreateModal}>Record Receipt</Button>}
//       </div>

//       <DataTransferBar module="receipts" onImported={() => void loadData()} />

//       <Card>
//         <div className="filter-bar">
//           <div style={{ minWidth: 210 }}>
//             <Select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} options={[
//               { value: '', label: 'All Receipt Types' },
//               { value: 'Advance', label: 'Advance' },
//               { value: 'Collection', label: 'Collection' },
//               { value: 'AdvanceAdjustment', label: 'Advance Adjustment' },
//             ]} />
//           </div>
//           <div style={{ minWidth: 240 }}>
//             <Select value={customerFilter} onChange={(e) => setCustomerFilter(e.target.value)} options={[
//               { value: '', label: 'All Customers' },
//               ...customers.map((c) => ({ value: c._id, label: c.companyName })),
//             ]} />
//           </div>
//         </div>

//         <Table
//           data={receipts}
//           isLoading={isLoading}
//           keyExtractor={(r) => r._id}
//           columns={[
//             { header: 'Receipt #', accessor: (r) => <strong>{r.receiptNo}</strong> },
//             { header: 'Customer', accessor: (r) => typeof r.customer === 'object' ? r.customer.companyName : r.customer },
//             { header: 'Type', accessor: (r) => <Badge variant="primary">{r.type}</Badge> },
//             { header: 'Amount', accessor: (r) => `AED ${Number(r.amount || 0).toFixed(2)}` },
//             { header: 'Payment', accessor: (r) => r.paymentMode || 'Internal adjustment' },
//             { header: 'Date', accessor: (r) => r.createdAt ? new Date(r.createdAt).toLocaleDateString() : '-' },
//             { header: 'Actions', accessor: (r) => <div className="table-actions"><button className="action-icon-btn btn-view" onClick={() => openReceiptDetails(r)} title="View receipt details"><ReceiptIcon size={16} /></button>{r.pdfUrl && <><button type="button" className="action-icon-btn btn-view" title="Preview receipt PDF" onClick={() => void openReceiptPdfPreview(r)}><Eye size={16} /></button><button type="button" className="action-icon-btn btn-view" title="Download receipt PDF" onClick={async () => { try { await downloadProtectedFile(r.pdfUrl!, `${r.receiptNo}.pdf`); } catch(err:any) { toast.error(err.message || 'Failed to download receipt'); } }}><Download size={16} /></button></>}</div> },
//           ]}
//           emptyTitle="No receipts found"
//           emptyDescription="Receipts matching the selected filters will appear here."
//         />
//       </Card>

//       <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Record Receipt" size="lg">
//         <div className="receipt-type-picker">
//           {(['Advance', 'Collection', 'AdvanceAdjustment'] as ReceiptMode[]).map((mode) => (
//             <button key={mode} type="button" className={`receipt-type-choice ${receiptType === mode ? 'active' : ''}`} onClick={() => { setReceiptType(mode); setSelectedInvoiceId(''); setAmount(''); }}>
//               {mode === 'AdvanceAdjustment' && <ArrowRightLeft size={16} />} {mode === 'AdvanceAdjustment' ? 'Advance Adjustment' : mode}
//             </button>
//           ))}
//         </div>

//         <form onSubmit={handleCreateReceipt} className="api-form-stack">
//           <Select label="Customer" value={selectedCustomerId} onChange={(e) => setSelectedCustomerId(e.target.value)} options={customers.map((c) => ({ value: c._id, label: c.companyName }))} isRequired />

//           {receiptType !== 'Advance' && (
//             <Select
//               label={isLoadingCustomerData ? 'Loading pending invoices...' : 'Pending Invoice'}
//               value={selectedInvoiceId}
//               onChange={(e) => { setSelectedInvoiceId(e.target.value); const invoice = pendingInvoices.find((i) => i._id === e.target.value); setAmount(invoice?.balanceAmount ?? ''); }}
//               disabled={isLoadingCustomerData}
//               options={[{ value: '', label: '-- Select pending invoice --' }, ...pendingInvoices.map((i) => ({ value: i._id, label: `${i.invoiceNo} · Balance AED ${i.balanceAmount.toFixed(2)}` }))]}
//               isRequired
//             />
//           )}

//           {receiptType === 'AdvanceAdjustment' && (
//             <div className="receipt-balance-card"><ReceiptIcon size={18} /><span>Available advance balance</span><strong>AED {advanceBalance.toFixed(2)}</strong></div>
//           )}

//           <div className="form-grid-2">
//             <Input type="number" min="0.01" step="0.01" label="Amount" value={amount} onChange={(e) => setAmount(e.target.value === '' ? '' : Number(e.target.value))} placeholder="Enter amount" isRequired />
//             {receiptType !== 'AdvanceAdjustment' ? (
//               <Select label="Payment Mode" value={paymentMode} onChange={(e) => setPaymentMode(e.target.value as 'Cash' | 'Bank')} options={[{ value: 'Cash', label: 'Cash' }, { value: 'Bank', label: 'Bank' }]} isRequired />
//             ) : <Input label="Adjustment Method" value="FIFO from available advance receipts" disabled />}
//           </div>

//           <div className="modal-actions"><Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)} disabled={isSaving}>Cancel</Button><Button type="submit" variant="primary" isLoading={isSaving} loadingText="Recording...">Record Receipt</Button></div>
//         </form>
//       </Modal>

//       <Modal isOpen={!!previewReceipt} onClose={closeReceiptPreview} title={`Receipt Preview · ${previewReceipt?.receiptNo || ''}`} size="xl">
//         <div className="receipt-pdf-preview">
//           {isPreviewLoading && <div className="inline-loading">Loading receipt preview…</div>}
//           {!isPreviewLoading && previewUrl && <iframe src={previewUrl} title={`Receipt ${previewReceipt?.receiptNo || ''}`} />}
//           <div className="modal-actions">
//             <Button type="button" variant="secondary" onClick={closeReceiptPreview}>Close</Button>
//             {previewReceipt?.pdfUrl && <Button type="button" variant="primary" icon={<Download size={16} />} onClick={() => void downloadProtectedFile(previewReceipt.pdfUrl!, `${previewReceipt.receiptNo}.pdf`)}>Download</Button>}
//           </div>
//         </div>
//       </Modal>

//       <Modal isOpen={!!viewingReceipt} onClose={() => setViewingReceipt(null)} title={`Receipt ${viewingReceipt?.receiptNo || ''}`} size="md">
//         {viewingReceipt && <div className="receipt-details-grid">
//           {isLoadingDetails && <div className="inline-loading">Refreshing receipt details…</div>}
//           <div><span>Type</span><strong>{viewingReceipt.type}</strong></div>
//           <div><span>Amount</span><strong>AED {Number(viewingReceipt.amount || 0).toFixed(2)}</strong></div>
//           <div><span>Payment Mode</span><strong>{viewingReceipt.paymentMode || 'Internal adjustment'}</strong></div>
//           <div><span>Status</span><strong>{viewingReceipt.status}</strong></div>
//           {!!viewingReceipt.remainingAdvance && <div><span>Remaining Advance</span><strong>AED {viewingReceipt.remainingAdvance.toFixed(2)}</strong></div>}
//           {viewingReceipt.allocations?.map((a, idx) => <div key={idx}><span>Allocation {idx + 1}</span><strong>{typeof a.invoice === 'object' ? a.invoice.invoiceNo : a.invoice} · AED ${a.amount.toFixed(2)}</strong></div>)}
//         </div>}
//       </Modal>
//     </div>
//   );
// };

// export default Receipts;



import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  ArrowRightLeft,
  Banknote,
  Download,
  Eye,
  FileText,
  Inbox,
  Plus,
  Receipt as ReceiptIcon,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import receiptService from '../../services/receipt.service';
import customerService from '../../services/customer.service';
import { Customer } from '../../types/customer.types';
import { Invoice } from '../../types/invoice.types';
import { Receipt } from '../../types/receipt.types';
import Card from '../../components/common/card/Card';
import Button from '../../components/common/button/Button';
import Input from '../../components/common/input/Input';
import Select from '../../components/common/select/Select';
import Table from '../../components/common/table/Table';
import Modal from '../../components/common/modal/Modal';
import Badge from '../../components/common/badge/Badge';
import DataTransferBar from '../../components/common/data-transfer/DataTransferBar';
import './Receipts.css';
import { downloadProtectedFile, fetchProtectedFile } from '../../utils/fileDownload';

type ReceiptMode = 'Advance' | 'Collection' | 'AdvanceAdjustment';

// Config for the type-picker cards — icon, colour variant, title, and
// description shown in the "New Receipt" chooser modal.
const RECEIPT_TYPE_OPTIONS: {
  mode: ReceiptMode;
  icon: React.ReactNode;
  variant: 'advance' | 'collection' | 'adjustment';
  title: string;
  description: string;
}[] = [
  {
    mode: 'Advance',
    icon: <Inbox size={22} />,
    variant: 'advance',
    title: 'Advance Receipt',
    description: 'Receive an advance deposit from a customer.',
  },
  {
    mode: 'Collection',
    icon: <Banknote size={22} />,
    variant: 'collection',
    title: 'Collection Receipt',
    description: 'Collect payment against pending invoices.',
  },
  {
    mode: 'AdvanceAdjustment',
    icon: <FileText size={22} />,
    variant: 'adjustment',
    title: 'Advance Adjustment',
    description: 'Apply customer advance against outstanding invoices.',
  },
];

const RECEIPT_TYPE_LABEL: Record<ReceiptMode, string> = {
  Advance: 'Advance Receipt',
  Collection: 'Collection Receipt',
  AdvanceAdjustment: 'Advance Adjustment',
};

export const Receipts: React.FC = () => {
  const { hasPermission } = useAuth();
  const toast = useToast();
  const canCreate = hasPermission('receipts', 'create');

  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [typeFilter, setTypeFilter] = useState('');
  const [customerFilter, setCustomerFilter] = useState('');

  // STEP 1: "New Receipt" type-picker modal
  const [isTypePickerOpen, setIsTypePickerOpen] = useState(false);

  // STEP 2: the actual create-receipt form modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [receiptType, setReceiptType] = useState<ReceiptMode>('Collection');
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [paymentMode, setPaymentMode] = useState<'Cash' | 'Bank'>('Bank');
  const [pendingInvoices, setPendingInvoices] = useState<Invoice[]>([]);
  const [advanceBalance, setAdvanceBalance] = useState(0);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState('');
  const [amount, setAmount] = useState<number | ''>('');
  const [isLoadingCustomerData, setIsLoadingCustomerData] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [viewingReceipt, setViewingReceipt] = useState<Receipt | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [previewReceipt, setPreviewReceipt] = useState<Receipt | null>(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [receiptList, customerList] = await Promise.all([
        receiptService.getAllReceipts(typeFilter || undefined, customerFilter || undefined),
        customerService.getAllCustomers(),
      ]);
      setReceipts(receiptList);
      setCustomers(customerList);
    } catch (err: any) {
      toast.error(err.message || 'Failed to load receipts');
    } finally {
      setIsLoading(false);
    }
  }, [typeFilter, customerFilter, toast]);

  useEffect(() => { loadData(); }, [loadData]);

  const loadCustomerReceiptData = useCallback(async (customerId: string) => {
    setSelectedInvoiceId('');
    setAmount('');
    setPendingInvoices([]);
    setAdvanceBalance(0);
    if (!customerId) return;

    setIsLoadingCustomerData(true);
    try {
      const [pending, advance] = await Promise.all([
        receiptService.getPendingInvoices(customerId),
        receiptService.getAdvanceBalance(customerId),
      ]);
      setPendingInvoices(pending);
      setAdvanceBalance(advance.totalAdvance);
    } catch (err: any) {
      toast.error(err.message || 'Failed to load customer payment details');
    } finally {
      setIsLoadingCustomerData(false);
    }
  }, [toast]);

  useEffect(() => {
    if (isModalOpen && selectedCustomerId) loadCustomerReceiptData(selectedCustomerId);
  }, [isModalOpen, selectedCustomerId, loadCustomerReceiptData]);

  const selectedInvoice = useMemo(
    () => pendingInvoices.find((invoice) => invoice._id === selectedInvoiceId),
    [pendingInvoices, selectedInvoiceId]
  );

  // "Record Receipt" button now opens the type-picker modal first.
  const openTypePicker = () => {
    if (!customers.length) {
      toast.warning('Please create a customer first');
      return;
    }
    setIsTypePickerOpen(true);
  };

  // Picking a card in the type-picker closes it and opens the actual
  // create-receipt form, pre-set to the chosen type.
  const selectReceiptType = (mode: ReceiptMode) => {
    setReceiptType(mode);
    setSelectedCustomerId(customers[0]._id);
    setPaymentMode('Bank');
    setSelectedInvoiceId('');
    setAmount('');
    setIsTypePickerOpen(false);
    setIsModalOpen(true);
  };

  // Lets the person go back from the form to the type-picker without
  // closing the whole flow.
  const backToTypePicker = () => {
    setIsModalOpen(false);
    setIsTypePickerOpen(true);
  };

  const handleCreateReceipt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerId) return toast.warning('Please select a customer');
    if (Number(amount) <= 0) return toast.warning('Amount must be greater than zero');

    if (receiptType !== 'Advance' && !selectedInvoiceId) {
      return toast.warning('Please select a pending invoice');
    }
    if (selectedInvoice && Number(amount) > selectedInvoice.balanceAmount) {
      return toast.warning(`Amount cannot exceed invoice balance of AED ${selectedInvoice.balanceAmount.toFixed(2)}`);
    }
    if (receiptType === 'AdvanceAdjustment' && Number(amount) > advanceBalance) {
      return toast.warning(`Adjustment cannot exceed available advance of AED ${advanceBalance.toFixed(2)}`);
    }

    setIsSaving(true);
    try {
      let created: Receipt;
      if (receiptType === 'Advance') {
        created = await receiptService.createAdvanceReceipt({
          customer: selectedCustomerId,
          amount: Number(amount),
          paymentMode,
        });
      } else if (receiptType === 'Collection') {
        created = await receiptService.createCollectionReceipt({
          customer: selectedCustomerId,
          paymentMode,
          allocations: [{ invoice: selectedInvoiceId, amount: Number(amount) }],
        });
      } else {
        created = await receiptService.createAdvanceAdjustment({
          customer: selectedCustomerId,
          allocations: [{ invoice: selectedInvoiceId, amount: Number(amount) }],
        });
      }
      toast.success(`${created.receiptNo} created successfully`);
      setIsModalOpen(false);
      await loadData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to record receipt');
    } finally {
      setIsSaving(false);
    }
  };

  const openReceiptDetails = async (receipt: Receipt) => {
    setViewingReceipt(receipt);
    setIsLoadingDetails(true);
    try {
      setViewingReceipt(await receiptService.getReceiptById(receipt._id));
    } catch (err: any) {
      toast.error(err.message || 'Failed to load receipt details');
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const openReceiptPdfPreview = async (receipt: Receipt) => {
    if (!receipt.pdfUrl) return;
    setPreviewReceipt(receipt);
    setIsPreviewLoading(true);
    try {
      const blob = await fetchProtectedFile(receipt.pdfUrl);
      const url = URL.createObjectURL(blob);
      setPreviewUrl((old) => { if (old) URL.revokeObjectURL(old); return url; });
    } catch (err: any) {
      toast.error(err.message || 'Failed to preview receipt');
      setPreviewReceipt(null);
    } finally { setIsPreviewLoading(false); }
  };

  const closeReceiptPreview = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl('');
    setPreviewReceipt(null);
  };

  return (
    <div className="receipts-page" id="receipts-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Receipts & Payment Collections</h1>
          <p className="page-subtitle">Advance receipts, invoice collections and FIFO advance adjustments</p>
        </div>
        {canCreate && <Button variant="primary" icon={<Plus size={16} />} onClick={openTypePicker}>Record Receipt</Button>}
      </div>

      <DataTransferBar module="receipts" onImported={() => void loadData()} />

      <Card>
        <div className="filter-bar">
          <div style={{ minWidth: 210 }}>
            <Select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} options={[
              { value: '', label: 'All Receipt Types' },
              { value: 'Advance', label: 'Advance' },
              { value: 'Collection', label: 'Collection' },
              { value: 'AdvanceAdjustment', label: 'Advance Adjustment' },
            ]} />
          </div>
          <div style={{ minWidth: 240 }}>
            <Select value={customerFilter} onChange={(e) => setCustomerFilter(e.target.value)} options={[
              { value: '', label: 'All Customers' },
              ...customers.map((c) => ({ value: c._id, label: c.companyName })),
            ]} />
          </div>
        </div>

        <Table
          data={receipts}
          isLoading={isLoading}
          keyExtractor={(r) => r._id}
          columns={[
            { header: 'Receipt #', accessor: (r) => <strong>{r.receiptNo}</strong> },
            { header: 'Customer', accessor: (r) => typeof r.customer === 'object' ? r.customer.companyName : r.customer },
            { header: 'Type', accessor: (r) => <Badge variant="primary">{r.type}</Badge> },
            { header: 'Amount', accessor: (r) => `AED ${Number(r.amount || 0).toFixed(2)}` },
            { header: 'Payment', accessor: (r) => r.paymentMode || 'Internal adjustment' },
            { header: 'Date', accessor: (r) => r.createdAt ? new Date(r.createdAt).toLocaleDateString() : '-' },
            { header: 'Actions', accessor: (r) => <div className="table-actions"><button className="action-icon-btn btn-view" onClick={() => openReceiptDetails(r)} title="View receipt details"><ReceiptIcon size={16} /></button>{r.pdfUrl && <><button type="button" className="action-icon-btn btn-view" title="Preview receipt PDF" onClick={() => void openReceiptPdfPreview(r)}><Eye size={16} /></button><button type="button" className="action-icon-btn btn-view" title="Download receipt PDF" onClick={async () => { try { await downloadProtectedFile(r.pdfUrl!, `${r.receiptNo}.pdf`); } catch(err:any) { toast.error(err.message || 'Failed to download receipt'); } }}><Download size={16} /></button></>}</div> },
          ]}
          emptyTitle="No receipts found"
          emptyDescription="Receipts matching the selected filters will appear here."
        />
      </Card>

      {/* STEP 1: New Receipt type-picker modal */}
      <Modal isOpen={isTypePickerOpen} onClose={() => setIsTypePickerOpen(false)} title="New Receipt" size="md">
        <p className="receipt-type-modal-subtitle">Choose the receipt transaction you want to create.</p>

        <div className="receipt-type-list">
          {RECEIPT_TYPE_OPTIONS.map((opt) => (
            <button
              key={opt.mode}
              type="button"
              className="receipt-type-card"
              onClick={() => selectReceiptType(opt.mode)}
            >
              <span className={`receipt-type-card-icon receipt-type-card-icon--${opt.variant}`}>
                {opt.icon}
              </span>
              <span className="receipt-type-card-body">
                <span className="receipt-type-card-title">{opt.title}</span>
                <span className="receipt-type-card-desc">{opt.description}</span>
              </span>
              <ArrowRight size={18} className="receipt-type-card-arrow" />
            </button>
          ))}
        </div>
      </Modal>

      {/* STEP 2: Create-receipt form modal, pre-set to the chosen type */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={RECEIPT_TYPE_LABEL[receiptType]} size="lg">
        <button type="button" className="receipt-back-to-types-btn" onClick={backToTypePicker}>
          ← Change receipt type
        </button>

        <form onSubmit={handleCreateReceipt} className="api-form-stack">
          <Select label="Customer" value={selectedCustomerId} onChange={(e) => setSelectedCustomerId(e.target.value)} options={customers.map((c) => ({ value: c._id, label: c.companyName }))} isRequired />

          {receiptType !== 'Advance' && (
            <Select
              label={isLoadingCustomerData ? 'Loading pending invoices...' : 'Pending Invoice'}
              value={selectedInvoiceId}
              onChange={(e) => { setSelectedInvoiceId(e.target.value); const invoice = pendingInvoices.find((i) => i._id === e.target.value); setAmount(invoice?.balanceAmount ?? ''); }}
              disabled={isLoadingCustomerData}
              options={[{ value: '', label: '-- Select pending invoice --' }, ...pendingInvoices.map((i) => ({ value: i._id, label: `${i.invoiceNo} · Balance AED ${i.balanceAmount.toFixed(2)}` }))]}
              isRequired
            />
          )}

          {receiptType === 'AdvanceAdjustment' && (
            <div className="receipt-balance-card"><ReceiptIcon size={18} /><span>Available advance balance</span><strong>AED {advanceBalance.toFixed(2)}</strong></div>
          )}

          <div className="form-grid-2">
            <Input type="number" min="0.01" step="0.01" label="Amount" value={amount} onChange={(e) => setAmount(e.target.value === '' ? '' : Number(e.target.value))} placeholder="Enter amount" isRequired />
            {receiptType !== 'AdvanceAdjustment' ? (
              <Select label="Payment Mode" value={paymentMode} onChange={(e) => setPaymentMode(e.target.value as 'Cash' | 'Bank')} options={[{ value: 'Cash', label: 'Cash' }, { value: 'Bank', label: 'Bank' }]} isRequired />
            ) : <Input label="Adjustment Method" value="FIFO from available advance receipts" disabled />}
          </div>

          <div className="modal-actions"><Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)} disabled={isSaving}>Cancel</Button><Button type="submit" variant="primary" isLoading={isSaving} loadingText="Recording...">Record Receipt</Button></div>
        </form>
      </Modal>

      <Modal isOpen={!!previewReceipt} onClose={closeReceiptPreview} title={`Receipt Preview · ${previewReceipt?.receiptNo || ''}`} size="xl">
        <div className="receipt-pdf-preview">
          {isPreviewLoading && <div className="inline-loading">Loading receipt preview…</div>}
          {!isPreviewLoading && previewUrl && <iframe src={previewUrl} title={`Receipt ${previewReceipt?.receiptNo || ''}`} />}
          <div className="modal-actions">
            <Button type="button" variant="secondary" onClick={closeReceiptPreview}>Close</Button>
            {previewReceipt?.pdfUrl && <Button type="button" variant="primary" icon={<Download size={16} />} onClick={() => void downloadProtectedFile(previewReceipt.pdfUrl!, `${previewReceipt.receiptNo}.pdf`)}>Download</Button>}
          </div>
        </div>
      </Modal>

      <Modal isOpen={!!viewingReceipt} onClose={() => setViewingReceipt(null)} title={`Receipt ${viewingReceipt?.receiptNo || ''}`} size="md">
        {viewingReceipt && <div className="receipt-details-grid">
          {isLoadingDetails && <div className="inline-loading">Refreshing receipt details…</div>}
          <div><span>Type</span><strong>{viewingReceipt.type}</strong></div>
          <div><span>Amount</span><strong>AED {Number(viewingReceipt.amount || 0).toFixed(2)}</strong></div>
          <div><span>Payment Mode</span><strong>{viewingReceipt.paymentMode || 'Internal adjustment'}</strong></div>
          <div><span>Status</span><strong>{viewingReceipt.status}</strong></div>
          {!!viewingReceipt.remainingAdvance && <div><span>Remaining Advance</span><strong>AED {viewingReceipt.remainingAdvance.toFixed(2)}</strong></div>}
          {viewingReceipt.allocations?.map((a, idx) => <div key={idx}><span>Allocation {idx + 1}</span><strong>{typeof a.invoice === 'object' ? a.invoice.invoiceNo : a.invoice} · AED ${a.amount.toFixed(2)}</strong></div>)}
        </div>}
      </Modal>
    </div>
  );
};

export default Receipts;