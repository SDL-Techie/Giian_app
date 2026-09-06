import React from 'react';
import './Select.css';

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options?: SelectOption[];
  isRequired?: boolean;
}

export const Select: React.FC<SelectProps> = ({
  label,
  error,
  options = [],
  children,
  isRequired,
  className = '',
  id,
  ...props
}) => {
  const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="select-group">
      {label && (
        <label className="select-label" htmlFor={selectId}>
          {label}
          {isRequired && <span className="required-star">*</span>}
        </label>
      )}
      <select
        id={selectId}
        className={`select-field ${error ? 'select-error' : ''} ${className}`}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
        {children}
      </select>
      {error && <span className="select-error-msg">{error}</span>}
    </div>
  );
};

export default Select;
