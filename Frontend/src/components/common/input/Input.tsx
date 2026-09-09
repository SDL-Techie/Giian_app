import React, { useMemo, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import './Input.css';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  icon?: React.ReactNode;
  isRequired?: boolean;
}

export const Input: React.FC<InputProps> = ({ label, error, helperText, icon, isRequired, className = '', id, type, ...props }) => {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);
  const isPassword = type === 'password';
  const [showPassword, setShowPassword] = useState(false);
  const resolvedType = useMemo(() => (isPassword ? (showPassword ? 'text' : 'password') : type), [isPassword, showPassword, type]);

  return (
    <div className="input-group">
      {label && <label className="input-label" htmlFor={inputId}>{label}{isRequired && <span className="required-star">*</span>}</label>}
      <div className="input-wrapper">
        {icon && <span className="input-icon-left">{icon}</span>}
        <input id={inputId} type={resolvedType} className={`input-field ${icon ? 'has-left-icon' : ''} ${isPassword ? 'has-right-icon' : ''} ${error ? 'input-error' : ''} ${className}`} {...props} />
        {isPassword && (
          <button type="button" className="input-password-toggle" onClick={() => setShowPassword((p) => !p)} aria-label={showPassword ? 'Hide password' : 'Show password'} title={showPassword ? 'Hide password' : 'Show password'}>
            {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
          </button>
        )}
      </div>
      {error && <span className="input-error-msg">{error}</span>}
      {!error && helperText && <span className="input-helper-msg">{helperText}</span>}
    </div>
  );
};
export default Input;
