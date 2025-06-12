import React, { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Toast Context for global toast management
const ToastContext = createContext();

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

// Toast types and their configurations
const TOAST_TYPES = {
  success: {
    icon: '✓',
    bgColor: 'bg-emerald-500',
    borderColor: 'border-emerald-600',
    textColor: 'text-white'
  },
  error: {
    icon: '✕',
    bgColor: 'bg-red-500',
    borderColor: 'border-red-600',
    textColor: 'text-white'
  },
  warning: {
    icon: '⚠',
    bgColor: 'bg-amber-500',
    borderColor: 'border-amber-600',
    textColor: 'text-white'
  },
  info: {
    icon: 'ℹ',
    bgColor: 'bg-blue-500',
    borderColor: 'border-blue-600',
    textColor: 'text-white'
  }
};

// Individual Toast Component
const Toast = ({ toast, onRemove }) => {
  const config = TOAST_TYPES[toast.type] || TOAST_TYPES.info;

  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.3 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.5 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={`
        ${config.bgColor} ${config.borderColor} ${config.textColor}
        border-l-4 rounded-lg shadow-lg p-4 mb-3 min-w-96 max-w-md
        flex items-start gap-3 cursor-pointer hover:shadow-xl
        transition-shadow duration-200
      `}
      onClick={() => onRemove(toast.id)}
      role="alert"
      aria-live="assertive"
    >
      {/* Icon */}
      <div className="text-xl font-bold mt-0.5 flex-shrink-0">
        {config.icon}
      </div>
      
      {/* Content */}
      <div className="flex-1 min-w-0">
        {toast.title && (
          <h4 className="font-bold text-sm mb-1 leading-tight">
            {toast.title}
          </h4>
        )}
        <p className="text-sm leading-relaxed opacity-95">
          {toast.message}
        </p>
        {toast.action && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              toast.action.onClick();
              onRemove(toast.id);
            }}
            className="mt-2 text-xs font-bold underline hover:no-underline transition-all"
          >
            {toast.action.label}
          </button>
        )}
      </div>
      
      {/* Close button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onRemove(toast.id);
        }}
        className="text-lg font-bold opacity-70 hover:opacity-100 transition-opacity flex-shrink-0"
        aria-label="Close notification"
      >
        ×
      </button>
    </motion.div>
  );
};

// Toast Container Component
const ToastContainer = ({ toasts, removeToast }) => {
  return (
    <div 
      className="fixed top-4 right-4 z-50 max-h-screen overflow-hidden"
      role="region"
      aria-label="Notifications"
    >
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            toast={toast}
            onRemove={removeToast}
          />
        ))}
      </AnimatePresence>
    </div>
  );
};

// Toast Provider Component
export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  // Add a new toast
  const addToast = useCallback((message, options = {}) => {
    const id = Date.now() + Math.random();
    const toast = {
      id,
      message,
      type: options.type || 'info',
      title: options.title,
      duration: options.duration || 5000,
      action: options.action
    };

    setToasts(prev => [toast, ...prev].slice(0, 5)); // Limit to 5 toasts

    // Auto-remove after duration
    if (toast.duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, toast.duration);
    }

    return id;
  }, []);

  // Remove a toast
  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  // Clear all toasts
  const clearToasts = useCallback(() => {
    setToasts([]);
  }, []);

  // Convenience methods
  const showSuccess = useCallback((message, options) => 
    addToast(message, { ...options, type: 'success' }), [addToast]);
  
  const showError = useCallback((message, options) => 
    addToast(message, { ...options, type: 'error' }), [addToast]);
  
  const showWarning = useCallback((message, options) => 
    addToast(message, { ...options, type: 'warning' }), [addToast]);
  
  const showInfo = useCallback((message, options) => 
    addToast(message, { ...options, type: 'info' }), [addToast]);

  const value = {
    addToast,
    removeToast,
    clearToasts,
    showSuccess,
    showError,
    showWarning,
    showInfo
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  );
};

export default ToastProvider; 