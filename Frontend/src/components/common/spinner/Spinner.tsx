import React from 'react';
import './Spinner.css';

export interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  fullScreen?: boolean;
}

export const Spinner: React.FC<SpinnerProps> = ({ size = 'md', text, fullScreen = false }) => {
  return (
    <div className={`spinner-container ${fullScreen ? 'spinner-fullscreen' : ''}`}>
      <div className={`spinner spinner-${size}`} />
      {text && <span className="spinner-text">{text}</span>}
    </div>
  );
};

export default Spinner;
