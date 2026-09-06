import React, { useState } from 'react';
import { Menu, LogOut, User as UserIcon } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import Button from '../../common/button/Button';
import Badge from '../../common/badge/Badge';
import ConfirmDialog from '../../common/confirm/ConfirmDialog';
import './Header.css';

interface HeaderProps {
  onToggleSidebar: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onToggleSidebar }) => {
  const { user, logout } = useAuth();

  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await logout();
      setShowLogoutConfirm(false);
    } finally {
      setIsLoggingOut(false);
    }
  };

  const displayName = user?.name || 'User';

  return (
    <>
      <header className="app-header" id="app-header">
        <div className="header-left">
          <button
            type="button"
            className="mobile-menu-toggle"
            onClick={onToggleSidebar}
            aria-label="Open navigation menu"
          >
            <Menu size={21} strokeWidth={2} />
          </button>

          <div className="header-user">
            <div className="header-user-icon">
              <UserIcon size={18} strokeWidth={2} />
            </div>

            <div className="header-user-content">
              <div className="header-user-main">
                <span className="header-user-name">
                  {displayName}
                </span>

                <Badge
                  variant={user?.isAdmin ? ('primary' as any) : 'neutral'}
                >
                  {user?.isAdmin ? 'Admin' : 'Staff'}
                </Badge>
              </div>

              <span className="header-user-label">
                Account
              </span>
            </div>
          </div>
        </div>

        <div className="header-right">
          <Button
            variant="outline"
            size="sm"
            icon={<LogOut size={16} strokeWidth={2} />}
            onClick={() => setShowLogoutConfirm(true)}
            id="btn-header-logout"
          >
            <span className="logout-text">Sign Out</span>
          </Button>
        </div>
      </header>

      <ConfirmDialog
        isOpen={showLogoutConfirm}
        onClose={() => {
          if (!isLoggingOut) {
            setShowLogoutConfirm(false);
          }
        }}
        onConfirm={handleLogout}
        title="Confirm Sign Out"
        message="Are you sure you want to sign out? Any unsaved changes will be lost."
        confirmText="Sign Out"
        cancelText="Cancel"
        variant="danger"
        isLoading={isLoggingOut}
      />
    </>
  );
};

export default Header;