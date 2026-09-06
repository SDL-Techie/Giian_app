import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Package,
  ShoppingCart,
  FileText,
  Receipt as ReceiptIcon,
  Percent,
  ShieldCheck,
  UserCheck,
  ScrollText,
  Shield,
  UserRoundX,
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import './Sidebar.css';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { user, hasPermission } = useAuth();

  const canViewCustomers = hasPermission('customers', 'view');
  const canViewProducts = hasPermission('products', 'view');
  const canViewPurchases = hasPermission('purchase', 'view');
  const canViewSales = hasPermission('sales', 'view');
  const canViewQuotations = hasPermission('quotations', 'view');
  const canViewReceipts = hasPermission('receipts', 'view');
  const canViewVat = hasPermission('vat', 'report');
  const isAdmin = !!user?.isAdmin;

  return (
    <>
      <div
        className={`sidebar-mobile-backdrop ${isOpen ? 'mobile-open' : ''}`}
        onClick={onClose}
      />
      <aside className={`sidebar ${isOpen ? 'mobile-open' : ''}`} id="main-sidebar">
        <div className="sidebar-header">
          <div className="sidebar-logo-icon">
            <img src="/assets/giian-logo.png" alt="giian logo" className="sidebar-logo-image" />
          </div>
          <div>
            <div className="sidebar-brand-title">giian</div>
            <div className="sidebar-brand-sub">Business Suite</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          <NavLink
            to="/dashboard"
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            onClick={onClose}
            id="nav-dashboard"
          >
            <LayoutDashboard size={18} className="nav-link-icon" />
            <span>Dashboard</span>
          </NavLink>

          <div className="nav-section-title">Sales & Orders</div>

          {canViewCustomers && (
            <NavLink
              to="/customers"
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              onClick={onClose}
              id="nav-customers"
            >
              <Users size={18} className="nav-link-icon" />
              <span>Customers</span>
            </NavLink>
          )}

          {canViewQuotations && (
            <NavLink
              to="/quotations"
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              onClick={onClose}
              id="nav-quotations"
            >
              <FileText size={18} className="nav-link-icon" />
              <span>Quotations</span>
            </NavLink>
          )}

          {canViewSales && (
            <NavLink
              to="/invoices"
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              onClick={onClose}
              id="nav-invoices"
            >
              <span className="nav-link-icon aed-nav-symbol">د.إ</span>
              <span>Sales & Invoices</span>
            </NavLink>
          )}

          {canViewReceipts && (
            <NavLink
              to="/receipts"
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              onClick={onClose}
              id="nav-receipts"
            >
              <ReceiptIcon size={18} className="nav-link-icon" />
              <span>Receipts</span>
            </NavLink>
          )}

          <div className="nav-section-title">Inventory & Buying</div>

          {canViewProducts && (
            <NavLink
              to="/products"
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              onClick={onClose}
              id="nav-products"
            >
              <Package size={18} className="nav-link-icon" />
              <span>Products & Categories</span>
            </NavLink>
          )}

          {canViewPurchases && (
            <NavLink
              to="/purchases"
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              onClick={onClose}
              id="nav-purchases"
            >
              <ShoppingCart size={18} className="nav-link-icon" />
              <span>Purchases</span>
            </NavLink>
          )}

          <div className="nav-section-title">Accounting & Tax</div>

          {canViewVat && (
            <NavLink
              to="/vat"
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              onClick={onClose}
              id="nav-vat"
            >
              <Percent size={18} className="nav-link-icon" />
              <span>VAT Reports</span>
            </NavLink>
          )}

          <div className="nav-section-title">Administration</div>

          {isAdmin && (
            <NavLink
              to="/users"
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              onClick={onClose}
              id="nav-users"
            >
              <ShieldCheck size={18} className="nav-link-icon" />
              <span>User Management</span>
            </NavLink>
          )}

          <div className="nav-section-title">Legal & Support</div>
          <NavLink to="/terms" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={onClose}><ScrollText size={18} className="nav-link-icon"/><span>Terms & Conditions</span></NavLink>
          <NavLink to="/privacy" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={onClose}><Shield size={18} className="nav-link-icon"/><span>Privacy Policy</span></NavLink>
          {!isAdmin && <NavLink to="/delete-account" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={onClose}><UserRoundX size={18} className="nav-link-icon"/><span>Delete Account</span></NavLink>}

          <NavLink
            to="/profile"
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            onClick={onClose}
            id="nav-profile"
          >
            <UserCheck size={18} className="nav-link-icon" />
            <span>My Profile</span>
          </NavLink>
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user-card">
            <div className="sidebar-user-avatar">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="sidebar-user-info">
              <div className="sidebar-user-name">{user?.name || 'User'}</div>
              <div className="sidebar-user-role">
                {user?.isAdmin ? 'Administrator' : (typeof user?.role === 'object' ? user.role?.name : 'Staff')}
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
