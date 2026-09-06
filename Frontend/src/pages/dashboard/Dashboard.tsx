import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  FileText,
  TrendingUp,
  Plus,
  ArrowUpRight,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import customerService from '../../services/customer.service';
import invoiceService from '../../services/invoice.service';
import quotationService from '../../services/quotation.service';
import vatService from '../../services/vat.service';
import { Customer } from '../../types/customer.types';
import { Invoice } from '../../types/invoice.types';
import { Quotation } from '../../types/quotation.types';
import Card from '../../components/common/card/Card';
import Button from '../../components/common/button/Button';
import Badge from '../../components/common/badge/Badge';
import Table from '../../components/common/table/Table';
import Spinner from '../../components/common/spinner/Spinner';
import './Dashboard.css';

export const Dashboard: React.FC = () => {
  const { user, hasPermission } = useAuth();
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(true);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [vatPaidTotal, setVatPaidTotal] = useState(0);
  const [vatCollectedTotal, setVatCollectedTotal] = useState(0);

  useEffect(() => {
    const loadDashboardData = async () => {
      setIsLoading(true);
      try {
        const promises: Promise<any>[] = [];

        if (hasPermission('customers', 'view')) {
          promises.push(customerService.getAllCustomers().then(setCustomers).catch(() => []));
        }
        if (hasPermission('sales', 'view')) {
          promises.push(invoiceService.getAllInvoices().then(setInvoices).catch(() => []));
        }
        if (hasPermission('quotations', 'view')) {
          promises.push(quotationService.getAllQuotations().then(setQuotations).catch(() => []));
        }
        if (hasPermission('vat', 'report')) {
          promises.push(vatService.getVatPaidReport().then((r) => setVatPaidTotal(r.totalVatPaid)).catch(() => 0));
          promises.push(vatService.getVatCollectedReport().then((r) => setVatCollectedTotal(r.totalVatCollected)).catch(() => 0));
        }

        await Promise.allSettled(promises);
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboardData();
  }, [hasPermission]);

  const activeInvoices = invoices.filter((i) => i.status === 'Active');
  const totalSalesAmount = activeInvoices.reduce((sum, i) => sum + (i.totalAmount || 0), 0);
  const totalOutstanding = activeInvoices.reduce((sum, i) => sum + (i.balanceAmount || 0), 0);
  const openQuotations = quotations.filter((q) => q.status === 'Open');
  const openQuotationsValue = openQuotations.reduce((sum, q) => sum + (q.totalAmount || 0), 0);

  if (isLoading) {
    return <Spinner size="lg" text="Loading enterprise dashboard..." />;
  }

  return (
    <div className="dashboard-page" id="dashboard-page">
      {/* Dubai business workspace header */}
      <div className="dashboard-hero">
        <div className="dashboard-hero-copy">
          <div className="dashboard-hero-kicker"><span className="hero-live-dot" /> DUBAI BUSINESS WORKSPACE</div>
          <h1 className="dashboard-hero-title">Welcome back, {user?.name}</h1>
          <p className="dashboard-hero-subtitle">
            Customers, quotations, invoices, receipts, purchases and VAT — managed in AED from one workspace.
          </p>
        </div>
        <div className="dashboard-quick-actions">
          {hasPermission('customers', 'create') && (
            <Button
              variant="outline"
              size="sm"
              icon={<Plus size={16} />}
              onClick={() => navigate('/customers')}
            >
              New Customer
            </Button>
          )}
          {hasPermission('quotations', 'create') && (
            <Button
              variant="outline"
              size="sm"
              icon={<Plus size={16} />}
              onClick={() => navigate('/quotations')}
            >
              New Quotation
            </Button>
          )}
          {hasPermission('sales', 'create') && (
            <Button
              variant="primary"
              size="sm"
              icon={<Plus size={16} />}
              onClick={() => navigate('/invoices')}
            >
              New Invoice
            </Button>
          )}
        </div>
      </div>

      {/* Metrics Row */}
      <div className="metrics-grid">
        <div className="metric-card metric-card-blue">
          <div className="metric-icon-box blue">
            <Users size={24} />
          </div>
          <div className="metric-info">
            <div className="metric-label">Total Customers</div>
            <div className="metric-value">{customers.length}</div>
            <div className="metric-sub">{customers.filter((c) => c.status === 'Active').length} active</div>
          </div>
        </div>

        <div className="metric-card metric-card-violet">
          <div className="metric-icon-box teal">
            <FileText size={24} />
          </div>
          <div className="metric-info">
            <div className="metric-label">Open Quotations</div>
            <div className="metric-value">{openQuotations.length}</div>
            <div className="metric-sub">AED {openQuotationsValue.toLocaleString(undefined, { minimumFractionDigits: 2 })} value</div>
          </div>
        </div>

        <div className="metric-card metric-card-green">
          <div className="metric-icon-box green aed-symbol-box">د.إ</div>
          <div className="metric-info">
            <div className="metric-label">Total Sales</div>
            <div className="metric-value">AED {totalSalesAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
            <div className="metric-sub">{activeInvoices.length} active invoices</div>
          </div>
        </div>

        <div className="metric-card metric-card-amber">
          <div className="metric-icon-box amber">
            <TrendingUp size={24} />
          </div>
          <div className="metric-info">
            <div className="metric-label">Pending Receivables</div>
            <div className="metric-value">AED {totalOutstanding.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
            <div className="metric-sub">
              {activeInvoices.filter((i) => i.balanceAmount > 0).length} unpaid / partial
            </div>
          </div>
        </div>
      </div>

      {/* Two Column Grid: Recent Invoices & Recent Quotations */}
      <div className="dashboard-grid-2">
        <Card
          title="Recent Invoices"
          actions={
            <Button variant="ghost" size="sm" onClick={() => navigate('/invoices')}>
              View All
            </Button>
          }
        >
          <Table
            data={invoices.slice(0, 5)}
            keyExtractor={(item) => item._id}
            columns={[
              {
                header: 'Invoice #',
                accessor: (inv) => <strong>{inv.invoiceNo}</strong>,
              },
              {
                header: 'Customer',
                accessor: (inv) => (typeof inv.customer === 'object' ? inv.customer.companyName : inv.customer),
              },
              {
                header: 'Amount',
                accessor: (inv) => `AED ${inv.totalAmount.toFixed(2)}`,
              },
              {
                header: 'Status',
                accessor: (inv) => {
                  if (inv.status === 'Cancelled') return <Badge variant="danger">Cancelled</Badge>;
                  if (inv.paymentStatus === 'Paid') return <Badge variant="success">Paid</Badge>;
                  if (inv.paymentStatus === 'Partially Paid') return <Badge variant="warning">Partial</Badge>;
                  return <Badge variant="neutral">Unpaid</Badge>;
                },
              },
            ]}
            emptyTitle="No invoices created yet"
            emptyDescription="Create invoices from quotations or directly."
          />
        </Card>

        <Card
          title="Recent Quotations"
          actions={
            <Button variant="ghost" size="sm" onClick={() => navigate('/quotations')}>
              View All
            </Button>
          }
        >
          <Table
            data={quotations.slice(0, 5)}
            keyExtractor={(item) => item._id}
            columns={[
              {
                header: 'Quotation #',
                accessor: (q) => <strong>{q.quotationNo}</strong>,
              },
              {
                header: 'Customer',
                accessor: (q) => (typeof q.customer === 'object' ? q.customer.companyName : q.customer),
              },
              {
                header: 'Total',
                accessor: (q) => `AED ${q.totalAmount.toFixed(2)}`,
              },
              {
                header: 'Status',
                accessor: (q) => {
                  if (q.status === 'Converted') return <Badge variant="success">Converted</Badge>;
                  if (q.status === 'Cancelled') return <Badge variant="danger">Cancelled</Badge>;
                  return <Badge variant="info">Open</Badge>;
                },
              },
            ]}
            emptyTitle="No quotations created yet"
            emptyDescription="Issue quotations to prospective customers."
          />
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
