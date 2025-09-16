import React, { useEffect } from 'react';

interface ErrorAlertProps {
  message: string | null;
  severity?: 'error' | 'warning' | 'info' | 'success';
  open: boolean;
  onClose: () => void;
  autoHideDuration?: number;
}

const ErrorAlert: React.FC<ErrorAlertProps> = ({
  message,
  severity = 'error',
  open,
  onClose,
  autoHideDuration = 6000,
}) => {
  useEffect(() => {
    if (open && autoHideDuration) {
      const timer = setTimeout(() => {
        onClose();
      }, autoHideDuration);
      return () => clearTimeout(timer);
    }
  }, [open, autoHideDuration, onClose]);

  if (!message || !open) return null;

  const severityColors = {
    error: 'bg-red-100 border-red-500 text-red-700',
    warning: 'bg-yellow-100 border-yellow-500 text-yellow-700',
    info: 'bg-blue-100 border-blue-500 text-blue-700',
    success: 'bg-green-100 border-green-500 text-green-700',
  };

  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 max-w-md w-full px-4">
      <div 
        className={`flex items-center justify-between p-4 border rounded-lg shadow-lg ${severityColors[severity]}`}
        role="alert"
      >
        <span className="flex-1 error-message">{message}</span>
        <button
          onClick={onClose}
          className="ml-4 text-lg font-bold hover:opacity-75 focus:outline-none"
          aria-label="Close"
        >
          ×
        </button>
      </div>
    </div>
  );
};

export default ErrorAlert;