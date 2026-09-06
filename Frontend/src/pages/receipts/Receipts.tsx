import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowRightLeft, Download, Eye, Plus, Receipt as ReceiptIcon } from 'lucide-react';
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

type ReceiptMode = 'Advance' | 'Collection' | 'AdvanceAdjustment';

export const Receipts: React.FC = () => {
  const { hasPermission } = useAuth();
  const toast = useToast();
  const canCreate = hasPermission('receipts', 'create');

  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [typeFilter, setTypeFilter] = useState('');
  const [customerFilter, setCustomerFilter] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [receiptType, setReceiptType] = useState<ReceiptMode>('Collection');
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [paymentMode, setPaymentMode] = useState<'Cash' | 'Bank'>('Bank');
  const [pendingInvoices, setPendingInvoices] = useState<Invoice[]>([]);
  const [advanceBalance, setAdvanceBalance] = useState(0);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState('');
  const [amount, setAmount] = useState(0);
  const [isLoadingCustomerData, setIsLoadingCustomerData] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [viewingReceipt, setViewingReceipt] = useState<Receipt | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

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
    setAmount(0);
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

  const openCreateModal = () => {
    if (!customers.length) {
      toast.warning('Please create a customer first');
      return;
    }
    setReceiptType('Collection');
    setSelectedCustomerId(customers[0]._id);
    setPaymentMode('Bank');
    setSelectedInvoiceId('');
    setAmount(0);
    setIsModalOpen(true);
  };

  const handleCreateReceipt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerId) return toast.warning('Please select a customer');
    if (amount <= 0) return toast.warning('Amount must be greater than zero');

    if (receiptType !== 'Advance' && !selectedInvoiceId) {
      return toast.warning('Please select a pending invoice');
    }
    if (selectedInvoice && amount > selectedInvoice.balanceAmount) {
      return toast.warning(`Amount cannot exceed invoice balance of AED ${selectedInvoice.balanceAmount.toFixed(2)}`);
    }
    if (receiptType === 'AdvanceAdjustment' && amount > advanceBalance) {
      return toast.warning(`Adjustment cannot exceed available advance of AED ${advanceBalance.toFixed(2)}`);
    }

    setIsSaving(true);
    try {
      let created: Receipt;
      if (receiptType === 'Advance') {
        created = await receiptService.createAdvanceReceipt({
          customer: selectedCustomerId,
          amount,
          paymentMode,
        });
      } else if (receiptType === 'Collection') {
        created = await receiptService.createCollectionReceipt({
          customer: selectedCustomerId,
          paymentMode,
          allocations: [{ invoice: selectedInvoiceId, amount }],
        });
      } else {
        created = await receiptService.createAdvanceAdjustment({
          customer: selectedCustomerId,
          allocations: [{ invoice: selectedInvoiceId, amount }],
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

  return (
    <div className="receipts-page" id="receipts-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Receipts & Payment Collections</h1>
          <p className="page-subtitle">Advance receipts, invoice collections and FIFO advance adjustments</p>
        </div>
        {canCreate && <Button variant="primary" icon={<Plus size={16} />} onClick={openCreateModal}>Record Receipt</Button>}
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
            { header: 'Actions', accessor: (r) => <div className="table-actions"><button className="action-icon-btn btn-view" onClick={() => openReceiptDetails(r)} title="View receipt"><Eye size={16} /></button>{r.pdfUrl && <a href={r.pdfUrl} target="_blank" rel="noreferrer" className="action-icon-btn btn-view" title="Open PDF"><Download size={16} /></a>}</div> },
          ]}
          emptyTitle="No receipts found"
          emptyDescription="Receipts matching the selected filters will appear here."
        />
      </Card>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Record Receipt" size="lg">
        <div className="receipt-type-picker">
          {(['Advance', 'Collection', 'AdvanceAdjustment'] as ReceiptMode[]).map((mode) => (
            <button key={mode} type="button" className={`receipt-type-choice ${receiptType === mode ? 'active' : ''}`} onClick={() => { setReceiptType(mode); setSelectedInvoiceId(''); setAmount(0); }}>
              {mode === 'AdvanceAdjustment' && <ArrowRightLeft size={16} />} {mode === 'AdvanceAdjustment' ? 'Advance Adjustment' : mode}
            </button>
          ))}
        </div>

        <form onSubmit={handleCreateReceipt} className="api-form-stack">
          <Select label="Customer" value={selectedCustomerId} onChange={(e) => setSelectedCustomerId(e.target.value)} options={customers.map((c) => ({ value: c._id, label: c.companyName }))} isRequired />

          {receiptType !== 'Advance' && (
            <Select
              label={isLoadingCustomerData ? 'Loading pending invoices...' : 'Pending Invoice'}
              value={selectedInvoiceId}
              onChange={(e) => { setSelectedInvoiceId(e.target.value); const invoice = pendingInvoices.find((i) => i._id === e.target.value); setAmount(invoice?.balanceAmount || 0); }}
              disabled={isLoadingCustomerData}
              options={[{ value: '', label: '-- Select pending invoice --' }, ...pendingInvoices.map((i) => ({ value: i._id, label: `${i.invoiceNo} · Balance AED ${i.balanceAmount.toFixed(2)}` }))]}
              isRequired
            />
          )}

          {receiptType === 'AdvanceAdjustment' && (
            <div className="receipt-balance-card"><ReceiptIcon size={18} /><span>Available advance balance</span><strong>AED {advanceBalance.toFixed(2)}</strong></div>
          )}

          <div className="form-grid-2">
            <Input type="number" min="0.01" step="0.01" label="Amount" value={amount} onChange={(e) => setAmount(Number(e.target.value))} isRequired />
            {receiptType !== 'AdvanceAdjustment' ? (
              <Select label="Payment Mode" value={paymentMode} onChange={(e) => setPaymentMode(e.target.value as 'Cash' | 'Bank')} options={[{ value: 'Cash', label: 'Cash' }, { value: 'Bank', label: 'Bank' }]} isRequired />
            ) : <Input label="Adjustment Method" value="FIFO from available advance receipts" disabled />}
          </div>

          <div className="modal-actions"><Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)} disabled={isSaving}>Cancel</Button><Button type="submit" variant="primary" isLoading={isSaving} loadingText="Recording...">Record Receipt</Button></div>
        </form>
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
