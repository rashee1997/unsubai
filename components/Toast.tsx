'use client';

import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Info,
  X,
  MailCheck,
  Trash2,
  Sparkles,
  ExternalLink,
} from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface ToastOptions {
  title?: string;
  description?: string;
  duration?: number; // duration in ms, default 4500ms. Set to 0 for persistent.
  action?: ToastAction;
  icon?: React.ReactNode;
}

export interface ToastItem extends ToastOptions {
  id: string;
  type: ToastType;
  message: string;
  createdAt: number;
}

interface ToastContextType {
  toasts: ToastItem[];
  showToast: (type: ToastType, message: string, options?: ToastOptions) => string;
  dismissToast: (id: string) => void;
  toast: {
    success: (message: string, options?: ToastOptions) => string;
    error: (message: string, options?: ToastOptions) => string;
    warning: (message: string, options?: ToastOptions) => string;
    info: (message: string, options?: ToastOptions) => string;
    dismiss: (id: string) => void;
  };
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (type: ToastType, message: string, options?: ToastOptions): string => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const newToast: ToastItem = {
        id,
        type,
        message,
        createdAt: Date.now(),
        duration: options?.duration ?? (type === 'error' ? 6000 : 4500),
        title: options?.title,
        description: options?.description,
        action: options?.action,
        icon: options?.icon,
      };

      setToasts((prev) => {
        // Limit max concurrent toasts to 4 to prevent screen clutter
        const filtered = prev.slice(-3);
        return [...filtered, newToast];
      });

      return id;
    },
    []
  );

  const toastHelpers = {
    success: (message: string, options?: ToastOptions) => showToast('success', message, options),
    error: (message: string, options?: ToastOptions) => showToast('error', message, options),
    warning: (message: string, options?: ToastOptions) => showToast('warning', message, options),
    info: (message: string, options?: ToastOptions) => showToast('info', message, options),
    dismiss: dismissToast,
  };

  return (
    <ToastContext.Provider
      value={{
        toasts,
        showToast,
        dismissToast,
        toast: toastHelpers,
      }}
    >
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

// Toast Container Component that sits fixed in the viewport
const ToastContainer: React.FC<{
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
}> = ({ toasts, onDismiss }) => {
  return (
    <div
      aria-live="polite"
      aria-atomic="true"
      className="fixed bottom-4 right-4 left-4 sm:left-auto sm:right-6 sm:bottom-6 z-50 flex flex-col gap-2.5 max-w-sm sm:max-w-md w-auto pointer-events-none"
    >
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <ToastCard key={toast.id} toast={toast} onDismiss={onDismiss} />
        ))}
      </AnimatePresence>
    </div>
  );
};

// Individual Toast Card with timer, icons, and animations
const ToastCard: React.FC<{
  toast: ToastItem;
  onDismiss: (id: string) => void;
}> = ({ toast, onDismiss }) => {
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(100);
  const duration = toast.duration || 4500;
  const remainingTimeRef = useRef<number>(duration);

  useEffect(() => {
    remainingTimeRef.current = duration;
  }, [duration]);

  useEffect(() => {
    if (duration <= 0) return; // Persistent toast

    const updateInterval = 50;
    const interval = setInterval(() => {
      if (!isPaused) {
        remainingTimeRef.current -= updateInterval;
        const pct = Math.max(0, (remainingTimeRef.current / duration) * 100);
        setProgress(pct);

        if (remainingTimeRef.current <= 0) {
          clearInterval(interval);
          onDismiss(toast.id);
        }
      }
    }, updateInterval);

    return () => clearInterval(interval);
  }, [duration, isPaused, onDismiss, toast.id]);

  const handleMouseEnter = () => {
    setIsPaused(true);
  };

  const handleMouseLeave = () => {
    setIsPaused(false);
  };

  // Color mapping based on toast type
  const typeConfig = {
    success: {
      bg: 'bg-white/95 dark:bg-[#12141a]/95',
      border: 'border-emerald-500/30 dark:border-emerald-500/40',
      glow: 'shadow-emerald-500/10 dark:shadow-emerald-950/40',
      iconBg: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/80 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60',
      progressBar: 'bg-emerald-500 dark:bg-emerald-400',
      defaultTitle: 'Success',
      defaultIcon: <CheckCircle2 className="w-4 h-4" />,
    },
    error: {
      bg: 'bg-white/95 dark:bg-[#161214]/95',
      border: 'border-rose-500/30 dark:border-rose-500/40',
      glow: 'shadow-rose-500/10 dark:shadow-rose-950/40',
      iconBg: 'bg-rose-50 text-rose-600 dark:bg-rose-950/80 dark:text-rose-400 border border-rose-200 dark:border-rose-800/60',
      progressBar: 'bg-rose-500 dark:bg-rose-400',
      defaultTitle: 'Error',
      defaultIcon: <AlertCircle className="w-4 h-4" />,
    },
    warning: {
      bg: 'bg-white/95 dark:bg-[#161411]/95',
      border: 'border-amber-500/30 dark:border-amber-500/40',
      glow: 'shadow-amber-500/10 dark:shadow-amber-950/40',
      iconBg: 'bg-amber-50 text-amber-600 dark:bg-amber-950/80 dark:text-amber-400 border border-amber-200 dark:border-amber-800/60',
      progressBar: 'bg-amber-500 dark:bg-amber-400',
      defaultTitle: 'Warning',
      defaultIcon: <AlertTriangle className="w-4 h-4" />,
    },
    info: {
      bg: 'bg-white/95 dark:bg-[#12131a]/95',
      border: 'border-indigo-500/30 dark:border-indigo-500/40',
      glow: 'shadow-indigo-500/10 dark:shadow-indigo-950/40',
      iconBg: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/80 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/60',
      progressBar: 'bg-indigo-500 dark:bg-indigo-400',
      defaultTitle: 'Notice',
      defaultIcon: <Info className="w-4 h-4" />,
    },
  }[toast.type];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.92, y: 8, transition: { duration: 0.15 } }}
      transition={{ type: 'spring', stiffness: 450, damping: 30 }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`pointer-events-auto relative overflow-hidden rounded-2xl border ${typeConfig.border} ${typeConfig.bg} shadow-xl ${typeConfig.glow} backdrop-blur-xl transition-all select-none`}
    >
      <div className="p-3.5 sm:p-4 flex items-start gap-3">
        {/* Icon */}
        <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${typeConfig.iconBg}`}>
          {toast.icon || typeConfig.defaultIcon}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 pr-1">
          <div className="flex items-center justify-between gap-2">
            <h4 className="text-xs font-bold text-slate-900 dark:text-white tracking-tight">
              {toast.title || typeConfig.defaultTitle}
            </h4>
          </div>

          <p className="text-xs font-medium text-slate-700 dark:text-zinc-200 mt-0.5 break-words leading-relaxed">
            {toast.message}
          </p>

          {toast.description && (
            <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-1 leading-normal">
              {toast.description}
            </p>
          )}

          {/* Action button if provided */}
          {toast.action && (
            <div className="mt-2.5 flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  toast.action?.onClick();
                  onDismiss(toast.id);
                }}
                className="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-zinc-200 transition-colors cursor-pointer shadow-xs active:scale-95"
              >
                {toast.action.label}
              </button>
            </div>
          )}
        </div>

        {/* Dismiss Close Button */}
        <button
          type="button"
          onClick={() => onDismiss(toast.id)}
          className="text-slate-400 hover:text-slate-700 dark:text-zinc-400 dark:hover:text-white transition-colors p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 shrink-0 cursor-pointer"
          aria-label="Dismiss notification"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Auto-dismiss progress bar */}
      {duration > 0 && (
        <div className="h-0.5 w-full bg-slate-100 dark:bg-white/5 overflow-hidden">
          <div
            className={`h-full ${typeConfig.progressBar} transition-all duration-75`}
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </motion.div>
  );
};
