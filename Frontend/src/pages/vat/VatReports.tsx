import React, { useEffect, useState, useCallback } from 'react';
import { Percent, ArrowDownRight, ArrowUpRight, Calculator } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import vatService from '../../services/vat.service';
import { VatPaidReportResponse, VatCollectedReportResponse } from '../../types/vat.types';
import { Purchase } from '../../types/purchase.types';
import { Invoice } from '../../types/invoice.types';
import Card from '../../components/common/card/Card';
import Button from '../../components/common/button/Button';
import Input from '../../components/common/input/Input';
import Table from '../../components/common/table/Table';
import DataTransferBar from '../../components/common/data-transfer/DataTransferBar';
import './VatReports.css';

export const VatReports: React.FC = () => {
  const toast = useToast();

  const [activeTab, setActiveTab] = useState<'paid' | 'collected'>('paid');

  // Filter dates
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const [vatPaidReport, setVatPaidReport] = useState<VatPaidReportResponse>({
    purchases: [],
    totalVatPaid: 0,
  });

  const [vatCollectedReport, setVatCollectedReport] = useState<VatCollectedReportResponse>({
    invoices: [],
    totalVatCollected: 0,
  });

  const [isLoading, setIsLoading] = useState(false);

  const fetchReports = useCallback(async () => {
    setIsLoading(true);
    try {
      const [paidData, collectedData] = await Promise.all([
        vatService.getVatPaidReport(fromDate || undefined, toDate || undefined),
        vatService.getVatCollectedReport(fromDate || undefined, toDate || undefined),
      ]);
      setVatPaidReport(paidData);
      setVatCollectedReport(collectedData);
    } catch (err: any) {
      toast.error(err.message || 'Failed to fetch VAT reports');
    } finally {
      setIsLoading(false);
    }
  }, [fromDate, toDate, toast]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const netVatPayable = vatCollectedReport.totalVatCollected - vatPaidReport.totalVatPaid;

  return (
    <div className="vat-page" id="vat-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Value Added Tax (VAT) Reports</h1>
          <p className="page-subtitle">Input VAT (Paid on Purchases) vs Output VAT (Collected on Sales)</p>
        </div>
      </div>

      <DataTransferBar module="vat" onImported={() => void fetchReports()} />

      {/* VAT High Level Summary Row */}
      <div className="vat-summary-cards">
        <div className="vat-card">
          <div className="vat-card-label">VAT Paid (Input Tax)</div>
          <div className="vat-card-amount paid">
            AED {vatPaidReport.totalVatPaid.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', marginTop: '4px' }}>
            Paid across {vatPaidReport.purchases.length} vendor purchases
          </div>
        </div>

        <div className="vat-card">
          <div className="vat-card-label">VAT Collected (Output Tax)</div>
          <div className="vat-card-amount collected">
            AED {vatCollectedReport.totalVatCollected.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', marginTop: '4px' }}>
            Collected across {vatCollectedReport.invoices.length} sales invoices
          </div>
        </div>

        <div className="vat-card">
          <div className="vat-card-label">
            {netVatPayable >= 0 ? 'Net VAT Payable to Authority' : 'Net VAT Credit / Refundable'}
          </div>
          <div className="vat-card-amount net">
            AED {Math.abs(netVatPayable).toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', marginTop: '4px' }}>
            VAT Collected minus VAT Paid
          </div>
        </div>
      </div>

      <div className="page-tabs">
        <button
          className={`page-tab-btn ${activeTab === 'paid' ? 'active' : ''}`}
          onClick={() => setActiveTab('paid')}
        >
          <ArrowDownRight size={16} />
          <span>1. VAT Paid Report (Purchases)</span>
        </button>
        <button
          className={`page-tab-btn ${activeTab === 'collected' ? 'active' : ''}`}
          onClick={() => setActiveTab('collected')}
        >
          <ArrowUpRight size={16} />
          <span>2. VAT Collected Report (Sales Invoices)</span>
        </button>
      </div>

      <Card>
        <div className="filter-bar">
          <div style={{ width: 160 }}>
            <Input
              type="date"
              label="From Date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
            />
          </div>
          <div style={{ width: 160 }}>
            <Input
              type="date"
              label="To Date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
            />
          </div>
          <div style={{ alignSelf: 'flex-end' }}>
            <Button
              variant="primary"
              onClick={fetchReports}
              isLoading={isLoading}
              loadingText="Filtering..."
            >
              Filter by Period
            </Button>
          </div>
        </div>

        {activeTab === 'paid' && (
          <div>
            <Table<Purchase>
              data={vatPaidReport.purchases}
              isLoading={isLoading}
              keyExtractor={(p) => p._id}
              columns={[
                {
                  header: 'Date of Purchase',
                  accessor: (p) => new Date(p.dateOfPurchase).toLocaleDateString(),
                },
                {
                  header: 'Vendor Name',
                  accessor: (p) => <strong>{p.vendorName}</strong>,
                },
                {
                  header: 'Vendor Invoice #',
                  accessor: (p) => p.invoiceNumber,
                },
                {
                  header: 'Total Cost',
                  accessor: (p) => `AED ${p.totalCost.toFixed(2)}`,
                },
                {
                  header: 'VAT Paid',
                  accessor: (p) => (
                    <strong style={{ color: 'var(--color-warning)' }}>
                      AED {p.vatAmount.toFixed(2)}
                    </strong>
                  ),
                },
              ]}
              emptyTitle="No VAT paid records"
              emptyDescription="Purchases with VAT will be detailed here."
            />

            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                marginTop: '16px',
                paddingTop: '16px',
                borderTop: '1px solid var(--border-color)',
                fontSize: 'var(--font-size-base)',
              }}
            >
              <div>
                Total VAT Paid:{' '}
                <strong style={{ color: 'var(--color-warning)', fontSize: 'var(--font-size-lg)' }}>
                  AED {vatPaidReport.totalVatPaid.toFixed(2)}
                </strong>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'collected' && (
          <div>
            <Table<Invoice>
              data={vatCollectedReport.invoices}
              isLoading={isLoading}
              keyExtractor={(i) => i._id}
              columns={[
                {
                  header: 'Date of Invoice',
                  accessor: (i) => new Date(i.invoiceDate).toLocaleDateString(),
                },
                {
                  header: 'Customer Name',
                  accessor: (i) => (
                    <strong>
                      {typeof i.customer === 'object' ? i.customer.companyName : i.customer}
                    </strong>
                  ),
                },
                {
                  header: 'Invoice #',
                  accessor: (i) => i.invoiceNo,
                },
                {
                  header: 'Total Invoice Amount',
                  accessor: (i) => `AED ${i.totalAmount.toFixed(2)}`,
                },
                {
                  header: 'VAT Collected',
                  accessor: (i) => (
                    <strong style={{ color: 'var(--color-success)' }}>
                      AED {i.vatAmount.toFixed(2)}
                    </strong>
                  ),
                },
              ]}
              emptyTitle="No VAT collected records"
              emptyDescription="Sales invoices with VAT will be detailed here."
            />

            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                marginTop: '16px',
                paddingTop: '16px',
                borderTop: '1px solid var(--border-color)',
                fontSize: 'var(--font-size-base)',
              }}
            >
              <div>
                Total VAT Collected:{' '}
                <strong style={{ color: 'var(--color-success)', fontSize: 'var(--font-size-lg)' }}>
                  AED {vatCollectedReport.totalVatCollected.toFixed(2)}
                </strong>
              </div>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

export default VatReports;
