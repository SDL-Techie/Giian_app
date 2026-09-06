import React from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';
import { ToastMessage } from '../../../context/ToastContext';
import './Toast.css';

interface ToastContainerProps {
  toasts: ToastMessage[];
  onClose: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onClose }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="toast-container" id="toast-container">
      {toasts.map((toast) => {
        const getIcon = () => {
          switch (toast.type) {
            case 'success':
              return <CheckCircle2 className="toast-icon success" size={20} />;
            case 'error':
              return <AlertCircle className="toast-icon error" size={20} />;
            case 'warning':
              return <AlertTriangle className="toast-icon warning" size={20} />;
            default:
              return <Info className="toast-icon info" size={20} />;
          }
        };

        return (
          <div key={toast.id} className={`toast-item toast-${toast.type}`} id={`toast-${toast.id}`}>
            {getIcon()}
            <div className="toast-content">
              {toast.title && <div className="toast-title">{toast.title}</div>}
              <div className="toast-message">{toast.message}</div>
            </div>
            <button
              className="toast-close-btn"
              onClick={() => onClose(toast.id)}
              aria-label="Close notification"
            >
              <X size={16} />
            </button>
          </div>
        );
      })}
    </div>
  );
};
