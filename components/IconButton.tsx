
import React from 'react';

interface IconButtonProps {
  onClick: () => void;
  children: React.ReactNode;
  ariaLabel: string;
  className?: string;
  disabled?: boolean;
  // Fix: Add optional title prop
  title?: string; 
}

const IconButton: React.FC<IconButtonProps> = ({ onClick, children, ariaLabel, className = '', disabled = false, title }) => {
  return (
    <button
      onClick={onClick}
      aria-label={ariaLabel}
      disabled={disabled}
      // Fix: Pass title prop to button element
      title={title}
      className={`p-2 rounded-full hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-opacity-50 transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      {children}
    </button>
  );
};

export default IconButton;
