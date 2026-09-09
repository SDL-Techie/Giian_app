import React from 'react';
import './Badge.css';

export interface BadgeProps {
  children: React.ReactNode;
variant?: 'primary' | 'success' | 'danger' | 'warning' | 'info' | 'neutral';
  withDot?: boolean;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  withDot = true,
  className = '',
}) => {
  return (
    <span className={`badge badge-${variant} ${className}`}>
      {withDot && <span className="badge-dot" />}
      {children}
    </span>
  );
};

export default Badge;
