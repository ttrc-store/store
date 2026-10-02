'use client';

import * as React from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────────

export type ToastVariant = 'default' | 'success' | 'error' | 'warning' | 'info';

export interface ToastData {
  id: string;
  title: string;
  description?: string;
  variant?: ToastVariant;
  duration?: number; // ms; 0 = persistent
}

// ─── Toast Context ────────────────────────────────────────────────────────────

interface ToastContextValue {
  toasts: ToastData[];
  toast: (data: Omit<ToastData, 'id'>) => string;
  dismiss: (id: string) => void;
}

const ToastContext = React.createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = React.useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within <ToastProvider>');
  return ctx;
}

// ─── Toast Provider ───────────────────────────────────────────────────────────

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastData[]>([]);

  const toast = React.useCallback((data: Omit<ToastData, 'id'>) => {
    const id = Math.random().toString(36).slice(2);
    const newToast: ToastData = { id, duration: 4000, variant: 'default', ...data };
    setToasts((prev) => [newToast, ...prev].slice(0, 5)); // max 5 toasts
    return id;
  }, []);

  const dismiss = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, toast, dismiss }}>
      {children}
      <Toaster />
    </ToastContext.Provider>
  );
}

// ─── Individual Toast ─────────────────────────────────────────────────────────

const VARIANT_STYLES: Record<ToastVariant, { icon: React.ReactNode; border: string; bg: string }> = {
  default: {
    icon: <Info size={16} className="text-purple-700 shrink-0 mt-0.5" />,
    border: 'border-border',
    bg: 'bg-popover',
  },
  success: {
    icon: <CheckCircle size={16} className="text-green-500 shrink-0 mt-0.5" />,
    border: 'border-green-500/30',
    bg: 'bg-green-950/30',
  },
  error: {
    icon: <AlertCircle size={16} className="text-red-500 shrink-0 mt-0.5" />,
    border: 'border-red-500/30',
    bg: 'bg-red-950/30',
  },
  warning: {
    icon: <AlertTriangle size={16} className="text-yellow-500 shrink-0 mt-0.5" />,
    border: 'border-yellow-500/30',
    bg: 'bg-yellow-950/30',
  },
  info: {
    icon: <Info size={16} className="text-blue-400 shrink-0 mt-0.5" />,
    border: 'border-blue-400/30',
    bg: 'bg-blue-950/20',
  },
};

function Toast({ data, onDismiss }: { data: ToastData; onDismiss: () => void }) {
  const styles = VARIANT_STYLES[data.variant ?? 'default'];

  // Auto-dismiss
  React.useEffect(() => {
    if (!data.duration) return;
    const timer = setTimeout(onDismiss, data.duration);
    return () => clearTimeout(timer);
  }, [data.duration, onDismiss]);

  return (
    <div
      role="alert"
      aria-live="polite"
      className={cn(
        'relative flex gap-3 w-full max-w-sm p-4 rounded-xl border shadow-xl',
        'animate-fade-in-up',
        styles.bg,
        styles.border,
      )}
    >
      {styles.icon}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground">{data.title}</p>
        {data.description && (
          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{data.description}</p>
        )}
      </div>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss notification"
        className="shrink-0 p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
      >
        <X size={14} />
      </button>
    </div>
  );
}

// ─── Toaster (portal-like fixed container) ────────────────────────────────────

export function Toaster() {
  const { toasts, dismiss } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div
      aria-label="Notifications"
      className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 w-full max-w-sm pointer-events-none"
    >
      {toasts.map((t) => (
        <div key={t.id} className="pointer-events-auto">
          <Toast data={t} onDismiss={() => dismiss(t.id)} />
        </div>
      ))}
    </div>
  );
}
