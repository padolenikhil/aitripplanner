
import React from 'react';
import { X } from 'lucide-react';
import IconButton from './IconButton';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, size = 'md' }) => {
  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex justify-center items-center p-4 z-50 transition-opacity duration-300 ease-in-out"
    >
      <div className={`bg-white rounded-lg shadow-xl w-full ${sizeClasses[size]} p-6 relative transform transition-all duration-300 ease-in-out scale-95 opacity-0 animate-modalShow`}>
        <div className="flex justify-between items-center mb-4">
          <h2 id="modal-title" className="text-2xl font-semibold text-slate-800">{title}</h2>
          <IconButton onClick={onClose} ariaLabel="Close modal">
            <X size={24} className="text-slate-600" />
          </IconButton>
        </div>
        <div>{children}</div>
      </div>
      {/* Fix: Removed jsx and global props, using template literal for style content */}
      <style>{`
        @keyframes modalShow {
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        .animate-modalShow {
          animation: modalShow 0.3s forwards;
        }
      `}</style>
    </div>
  );
};

export default Modal;
