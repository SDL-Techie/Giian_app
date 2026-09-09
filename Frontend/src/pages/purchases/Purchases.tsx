import React, { useEffect, useState, useCallback } from 'react';
import {
  ShoppingCart,
  Plus,
  Trash2,
  Download,
  Upload,
  Eye,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import purchaseService from '../../services/purchase.service';
import productService from '../../services/product.service';
import { Purchase, CreatePurchasePayload } from '../../types/purchase.types';
import { Product } from '../../types/product.types';
import Card from '../../components/common/card/Card';
import Button from '../../components/common/button/Button';
import Input from '../../components/common/input/Input';
import Select from '../../components/common/select/Select';
import Table from '../../components/common/table/Table';
import Modal from '../../components/common/modal/Modal';
import Badge from '../../components/common/badge/Badge';
import DataTransferBar from '../../components/common/data-transfer/DataTransferBar';
import './Purchases.css';

interface LineItemInput {
  product: string;
  qty: number;
  cost: number | '';
}

export const Purchases: React.FC = () => {
  const { hasPermission } = useAuth();
  const toast = useToast();

  const canCreate = hasPermission('purchase', 'create');
  const canModify = hasPermission('purchase', 'modify');

  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Period / Vendor Filter
  const [filterFrom, setFilterFrom] = useState('');
  const [filterTo, setFilterTo] = useState('');
  const [filterVendor, setFilterVendor] = useState('');

  // Modal State
  const [isNewPurchaseOpen, setIsNewPurchaseOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedPurchase, setSelectedPurchase] = useState<Purchase | null>(null);

  // Upload modal
  const [uploadPurchaseId, setUploadPurchaseId] = useState<string | null>(null);
  const [uploadInvoiceFiles, setUploadInvoiceFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  // Form Fields
  const [dateOfPurchase, setDateOfPurchase] = useState(new Date().toISOString().split('T')[0]);
  const [vendorName, setVendorName] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [vatPercent, setVatPercent] = useState<number>(5);
  const [invoiceFiles, setInvoiceFiles] = useState<File[]>([]);
  const [items, setItems] = useState<LineItemInput[]>([
    { product: '', qty: 1, cost: '' },
  ]);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [purchList, prodList] = await Promise.all([
        purchaseService.getAllPurchases(filterFrom, filterTo, filterVendor),
        productService.getAllProducts(),
      ]);
      setPurchases(purchList);
      setProducts(prodList);
    } catch (err: any) {
      toast.error(err.message || 'Failed to fetch purchases');
    } finally {
      setIsLoading(false);
    }
  }, [filterFrom, filterTo, filterVendor, toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const addItemRow = () => {
    setItems((prev) => [...prev, { product: products[0]?._id || '', qty: 1, cost: '' }]);
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
  const subTotalCost = items.reduce((sum, item) => sum + Number(item.qty || 0) * Number(item.cost || 0), 0);
  const vatAmount = (subTotalCost * (vatPercent || 0)) / 100;
  const totalCost = subTotalCost + vatAmount;

  const handleCreatePurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vendorName.trim()) {
      toast.error('Vendor name is required');
      return;
    }
    if (!invoiceNumber.trim()) {
      toast.error('Invoice number is required');
      return;
    }
    if (items.some((i) => !i.product || i.qty <= 0 || i.cost === '' || Number(i.cost) < 0)) {
      toast.error('Please select valid products with positive quantity and non-negative cost');
      return;
    }

    setIsSaving(true);
    try {
      const payload: CreatePurchasePayload = {
        dateOfPurchase,
        vendorName,
        invoiceNumber,
        items: items.map((i) => ({ ...i, cost: Number(i.cost) })),
        vatPercent: Number(vatPercent),
        invoiceFiles: invoiceFiles.length ? invoiceFiles : undefined,
      };

      await purchaseService.createPurchase(payload);
      toast.success('Purchase recorded successfully');
      setIsNewPurchaseOpen(false);
      // Reset form
      setVendorName('');
      setInvoiceNumber('');
      setItems([{ product: products[0]?._id || '', qty: 1, cost: '' }]);
      setInvoiceFiles([]);
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to record purchase');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUploadInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadPurchaseId || !uploadInvoiceFiles.length) {
      toast.error('Please select an invoice file');
      return;
    }
    setIsUploading(true);
    try {
      await purchaseService.uploadPurchaseInvoice(uploadPurchaseId, uploadInvoiceFiles);
      toast.success('Invoice file attached successfully');
      setUploadPurchaseId(null);
      setUploadInvoiceFiles([]);
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to upload invoice file');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="purchases-page" id="purchases-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Purchases</h1>
          <p className="page-subtitle">Track vendor invoices, procurement orders and inventory additions</p>
        </div>
        {canCreate && (
          <Button
            variant="primary"
            icon={<Plus size={16} />}
            onClick={() => {
              if (products.length === 0) {
                toast.warning('Please create at least one product before recording purchases.');
              }
              setItems([{ product: products[0]?._id || '', qty: 1, cost: '' }]);
              setIsNewPurchaseOpen(true);
            }}
            id="btn-new-purchase"
          >
            New Purchase
          </Button>
        )}
      </div>

      <DataTransferBar module="purchases" onImported={() => void loadData()} />

      <Card title="Purchase Invoices / Period Report">
        <div className="filter-bar">
          <div style={{ flex: 1, minWidth: 200 }}>
            <Input
              placeholder="Filter by vendor name..."
              value={filterVendor}
              onChange={(e) => setFilterVendor(e.target.value)}
            />
          </div>
          <div style={{ width: 160 }}>
            <Input
              type="date"
              label="From Date"
              value={filterFrom}
              onChange={(e) => setFilterFrom(e.target.value)}
            />
          </div>
          <div style={{ width: 160 }}>
            <Input
              type="date"
              label="To Date"
              value={filterTo}
              onChange={(e) => setFilterTo(e.target.value)}
            />
          </div>
          <div style={{ alignSelf: 'flex-end' }}>
            <Button variant="secondary" onClick={loadData}>
              Apply Filter
            </Button>
          </div>
        </div>

        <Table
          data={purchases}
          isLoading={isLoading}
          keyExtractor={(p) => p._id}
          columns={[
            {
              header: 'Purchase #',
              accessor: (p) => <strong>{p.purchaseNo}</strong>,
            },
            {
              header: 'Date',
              accessor: (p) => new Date(p.dateOfPurchase).toLocaleDateString(),
            },
            {
              header: 'Vendor Name',
              accessor: (p) => p.vendorName,
            },
            {
              header: 'Invoice #',
              accessor: (p) => p.invoiceNumber,
            },
            {
              header: 'Subtotal',
              accessor: (p) => `AED ${p.subTotalCost.toFixed(2)}`,
            },
            {
              header: 'VAT',
              accessor: (p) => `AED ${p.vatAmount.toFixed(2)} (${p.vatPercent}%)`,
            },
            {
              header: 'Total Cost',
              accessor: (p) => <strong>AED {p.totalCost.toFixed(2)}</strong>,
            },
            {
              header: 'Invoice File',
              accessor: (p) => (
                <div className="table-actions">
                  {p.invoiceFileUrl ? (
                    <a
                      href={p.invoiceFileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="action-icon-btn btn-view"
                      title="Download Uploaded Invoice Document"
                    >
                      <Download size={16} />
                    </a>
                  ) : (
                    <span style={{ color: 'var(--text-muted)' }}>None</span>
                  )}
                  {canModify && (
                    <button
                      className="action-icon-btn btn-edit"
                      onClick={() => { setUploadPurchaseId(p._id); setUploadInvoiceFiles([]); }}
                      title={p.invoiceFileUrl ? 'Upload Additional Invoice Documents' : 'Upload Invoice Documents'}
                    >
                      <Upload size={16} />
                    </button>
                  )}
                </div>
              ),
            },
            {
              header: 'Details',
              accessor: (p) => (
                <button
                  className="action-icon-btn btn-view"
                  onClick={() => setSelectedPurchase(p)}
                  title="View Purchase Details"
                >
                  <Eye size={16} />
                </button>
              ),
            },
          ]}
          emptyTitle="No purchases found"
          emptyDescription="Record vendor purchases to manage cost and inventory."
        />
      </Card>

      {/* New Purchase Modal */}
      <Modal
        isOpen={isNewPurchaseOpen}
        onClose={() => setIsNewPurchaseOpen(false)}
        title="New Purchase"
        size="lg"
      >
        <form onSubmit={handleCreatePurchase} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="form-grid-2">
            <Input
              type="date"
              label="Date of Purchase"
              value={dateOfPurchase}
              onChange={(e) => setDateOfPurchase(e.target.value)}
              isRequired
            />
            <Input
              label="Vendor Name"
              placeholder="e.g. Apex Industrial Supplies"
              value={vendorName}
              onChange={(e) => setVendorName(e.target.value)}
              isRequired
            />
          </div>

          <div className="form-grid-2">
            <Input
              label="Invoice Number"
              placeholder="e.g. VEND-INV-8910"
              value={invoiceNumber}
              onChange={(e) => setInvoiceNumber(e.target.value)}
              isRequired
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

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <label className="input-label" style={{ fontWeight: 600 }}>Purchase Items</label>
              <Button type="button" variant="outline" size="sm" icon={<Plus size={14} />} onClick={addItemRow}>
                Add Item
              </Button>
            </div>

            <div className="items-builder-table">
              <div className="items-builder-header">
                <div>Product</div>
                <div>Qty</div>
                <div>Cost/Unit</div>
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
                    value={item.cost}
                    onChange={(e) => updateItemRow(idx, 'cost', e.target.value === '' ? '' : Number(e.target.value))}
                  />
                  <div style={{ fontWeight: 600, fontSize: 'var(--font-size-sm)' }}>
                    AED {(Number(item.qty || 0) * Number(item.cost || 0)).toFixed(2)}
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

          <div className="totals-summary-card">
            <div className="totals-row">
              <span>Subtotal:</span>
              <strong>AED {subTotalCost.toFixed(2)}</strong>
            </div>
            <div className="totals-row">
              <span>VAT ({vatPercent}%):</span>
              <strong>AED {vatAmount.toFixed(2)}</strong>
            </div>
            <div className="totals-row grand-total">
              <span>Total Cost:</span>
              <span>AED {totalCost.toFixed(2)}</span>
            </div>
          </div>

          {/* <div className="input-group">
            <label className="input-label">Upload Invoice Documents (multiple, optional)</label>
            <input
              type="file"
              className="input-field"
              multiple accept=".pdf,.doc,.docx,image/*" onChange={(e) => setInvoiceFiles(Array.from(e.target.files || []))}
            />
          </div> */}


          <div className="input-group">
  <label className="input-label">
    Upload Purchase Documents (multiple, optional)
  </label>

  <div className="document-upload-list">
    {invoiceFiles.map((file, index) => (
      <div key={index} className="document-upload-row">

        <input
          type="file"
          className="input-field"
          accept=".pdf,.doc,.docx,.xls,.xlsx,image/*"
          onChange={(e) => {
            const selectedFile = e.target.files?.[0];

            if (!selectedFile) return;

            setInvoiceFiles((prev) => {
              const updated = [...prev];
              updated[index] = selectedFile;
              return updated;
            });
          }}
        />

        {index === invoiceFiles.length - 1 && (
          <button
            type="button"
            className="add-document-btn"
            onClick={() =>
              setInvoiceFiles((prev) => [...prev, null as any])
            }
            title="Add another document"
          >
            +
          </button>
        )}

        {invoiceFiles.length > 1 && (
          <button
            type="button"
            className="remove-document-btn"
            onClick={() =>
              setInvoiceFiles((prev) =>
                prev.filter((_, i) => i !== index)
              )
            }
            title="Remove document"
          >
            ×
          </button>
        )}

      </div>
    ))}

    {invoiceFiles.length === 0 && (
      <div className="document-upload-row">
        <input
          type="file"
          className="input-field"
          accept=".pdf,.doc,.docx,.xls,.xlsx,image/*"
          onChange={(e) => {
            const selectedFile = e.target.files?.[0];

            if (!selectedFile) return;

            setInvoiceFiles([selectedFile]);
          }}
        />

        <button
          type="button"
          className="add-document-btn"
          onClick={() =>
            setInvoiceFiles([null as any])
          }
          title="Add another document"
        >
          +
        </button>
      </div>
    )}
  </div>
</div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
            <Button variant="secondary" type="button" onClick={() => setIsNewPurchaseOpen(false)} disabled={isSaving}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" isLoading={isSaving} loadingText="Saving Purchase...">
              Record Purchase
            </Button>
          </div>
        </form>
      </Modal>

      {/* Upload Invoice Documents Modal */}
      <Modal
        isOpen={!!uploadPurchaseId}
        onClose={() => setUploadPurchaseId(null)}
        title="Upload Invoice Documents"
        size="md"
      >
        <form onSubmit={handleUploadInvoice} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="input-group">
            <label className="input-label">Select Invoice Documents (multiple)</label>
            <input
              type="file"
              className="input-field"
              multiple accept=".pdf,.doc,.docx,image/*" onChange={(e) => setUploadInvoiceFiles(Array.from(e.target.files || []))}
              required
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <Button variant="secondary" type="button" onClick={() => setUploadPurchaseId(null)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" isLoading={isUploading} loadingText="Uploading...">
              Upload Invoice
            </Button>
          </div>
        </form>
      </Modal>

      {/* View Purchase Details Modal */}
      {/* <Modal
        isOpen={!!selectedPurchase}
        onClose={() => setSelectedPurchase(null)}
        title={`Purchase #${selectedPurchase?.purchaseNo}`}
        size="lg"
      >
        {selectedPurchase && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="form-grid-2">
              <div>
                <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>Vendor Name:</span>
                <div><strong>{selectedPurchase.vendorName}</strong></div>
              </div>
              <div>
                <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>Vendor Invoice #:</span>
                <div><strong>{selectedPurchase.invoiceNumber}</strong></div>
              </div>
              <div>
                <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>Date:</span>
                <div>{new Date(selectedPurchase.dateOfPurchase).toLocaleDateString()}</div>
              </div>
              <div>
                <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>Status:</span>
                <div><Badge variant={selectedPurchase.status === 'Active' ? 'success' : 'danger'}>{selectedPurchase.status}</Badge></div>
              </div>
            </div>

            <Table
              data={selectedPurchase.items}
              keyExtractor={(_, i) => String(i)}
              columns={[
                {
                  header: 'Product',
                  accessor: (item) => (typeof item.product === 'object' ? `${item.product.name} (${item.product.itemCode})` : item.product),
                },
                {
                  header: 'Quantity',
                  accessor: (item) => item.qty,
                },
                {
                  header: 'Cost per Unit',
                  accessor: (item) => `AED ${item.cost.toFixed(2)}`,
                },
                {
                  header: 'Total Cost',
                  accessor: (item) => `AED ${item.totalCost.toFixed(2)}`,
                },
              ]}
            />

            
            
         

            <div className="totals-summary-card">
              <div className="totals-row">
                <span>Subtotal:</span>
                <strong>AED {selectedPurchase.subTotalCost.toFixed(2)}</strong>
              </div>
              <div className="totals-row">
                <span>VAT ({selectedPurchase.vatPercent}%):</span>
                <strong>AED {selectedPurchase.vatAmount.toFixed(2)}</strong>
              </div>
              <div className="totals-row grand-total">
                <span>Total Cost:</span>
                <span>AED {selectedPurchase.totalCost.toFixed(2)}</span>
              </div>
            </div>
          </div>
        )}
      </Modal> */}


      {/* View Purchase Details Modal */}
<Modal
  isOpen={!!selectedPurchase}
  onClose={() => setSelectedPurchase(null)}
  title={`Purchase #${selectedPurchase?.purchaseNo}`}
  size="lg"
>
  {selectedPurchase && (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
      }}
    >
      {/* Purchase Information */}
      <div className="form-grid-2">
        <div>
          <span
            style={{
              fontSize: 'var(--font-size-xs)',
              color: 'var(--text-muted)',
            }}
          >
            Vendor Name:
          </span>
          <div>
            <strong>{selectedPurchase.vendorName}</strong>
          </div>
        </div>

        <div>
          <span
            style={{
              fontSize: 'var(--font-size-xs)',
              color: 'var(--text-muted)',
            }}
          >
            Vendor Invoice #:
          </span>
          <div>
            <strong>{selectedPurchase.invoiceNumber}</strong>
          </div>
        </div>

        <div>
          <span
            style={{
              fontSize: 'var(--font-size-xs)',
              color: 'var(--text-muted)',
            }}
          >
            Date:
          </span>
          <div>
            {new Date(
              selectedPurchase.dateOfPurchase
            ).toLocaleDateString()}
          </div>
        </div>

        <div>
          <span
            style={{
              fontSize: 'var(--font-size-xs)',
              color: 'var(--text-muted)',
            }}
          >
            Status:
          </span>

          <div>
            <Badge
              variant={
                selectedPurchase.status === 'Active'
                  ? 'success'
                  : 'danger'
              }
            >
              {selectedPurchase.status}
            </Badge>
          </div>
        </div>
      </div>

      {/* Purchase Items */}
      <div>
        <h3
          style={{
            marginBottom: '10px',
            fontSize: 'var(--font-size-md)',
          }}
        >
          Purchase Items
        </h3>

        <Table
          data={selectedPurchase.items}
          keyExtractor={(_, i) => String(i)}
          columns={[
            {
              header: 'Product',
              accessor: (item) =>
                typeof item.product === 'object'
                  ? `${item.product.name} (${item.product.itemCode})`
                  : item.product,
            },
            {
              header: 'Quantity',
              accessor: (item) => item.qty,
            },
            {
              header: 'Cost per Unit',
              accessor: (item) =>
                `AED ${item.cost.toFixed(2)}`,
            },
            {
              header: 'Total Cost',
              accessor: (item) =>
                `AED ${item.totalCost.toFixed(2)}`,
            },
          ]}
        />
      </div>

      {/* Purchase Documents */}
      <div className="purchase-documents-section">
        <div className="purchase-documents-header">
          <h3>Purchase Documents</h3>

          <Badge variant="success">
            {selectedPurchase.invoiceFiles?.length || 0}{' '}
            {selectedPurchase.invoiceFiles?.length === 1
              ? 'Document'
              : 'Documents'}
          </Badge>
        </div>

        {selectedPurchase.invoiceFiles &&
        selectedPurchase.invoiceFiles.length > 0 ? (
          <div className="purchase-documents-list">
            {selectedPurchase.invoiceFiles.map(
              (doc, index) => (
                <div
                  key={doc.id || index}
                  className="purchase-document-item"
                >
                  <div className="purchase-document-info">
                    <span className="purchase-document-icon">
                      📄
                    </span>

                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        minWidth: 0,
                      }}
                    >
                      <span
                        className="purchase-document-name"
                        title={doc.filename}
                      >
                        {doc.filename ||
                          `Document ${index + 1}`}
                      </span>

                      {doc.size && (
                        <span
                          style={{
                            fontSize:
                              'var(--font-size-xs)',
                            color:
                              'var(--text-muted)',
                          }}
                        >
                          {(doc.size / 1024).toFixed(1)} KB
                        </span>
                      )}
                    </div>
                  </div>

                  <a
                    href={doc.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    download
                    className="action-icon-btn btn-view"
                    title="Download Document"
                  >
                    <Download size={16} />
                  </a>
                </div>
              )
            )}
          </div>
        ) : (
          <div className="purchase-no-documents">
            No documents uploaded
          </div>
        )}
      </div>

      {/* Totals */}
      <div className="totals-summary-card">
        <div className="totals-row">
          <span>Subtotal:</span>

          <strong>
            AED {selectedPurchase.subTotalCost.toFixed(2)}
          </strong>
        </div>

        <div className="totals-row">
          <span>
            VAT ({selectedPurchase.vatPercent}%):
          </span>

          <strong>
            AED {selectedPurchase.vatAmount.toFixed(2)}
          </strong>
        </div>

        <div className="totals-row grand-total">
          <span>Total Cost:</span>

          <span>
            AED {selectedPurchase.totalCost.toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  )}
</Modal>

    </div>
  );
};

export default Purchases;
