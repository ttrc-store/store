'use client';

import * as React from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

// ─── Dialog Context ───────────────────────────────────────────────────────────

interface DialogContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const DialogContext = React.createContext<DialogContextValue | null>(null);

function useDialog() {
  const ctx = React.useContext(DialogContext);
  if (!ctx) throw new Error('Dialog components must be used within <Dialog>');
  return ctx;
}

// ─── Dialog Root ──────────────────────────────────────────────────────────────

export function Dialog({
  open: controlledOpen,
  onOpenChange,
  children,
}: {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}) {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(false);
  const open = controlledOpen ?? uncontrolledOpen;
  const setOpen = React.useCallback(
    (value: boolean) => {
      setUncontrolledOpen(value);
      onOpenChange?.(value);
    },
    [onOpenChange],
  );

  // Close on Escape
  React.useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, setOpen]);

  // Prevent body scroll when open
  React.useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  return <DialogContext.Provider value={{ open, setOpen }}>{children}</DialogContext.Provider>;
}

// ─── DialogTrigger ────────────────────────────────────────────────────────────

export function DialogTrigger({ children, asChild }: { children: React.ReactNode; asChild?: boolean }) {
  const { setOpen } = useDialog();
  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<{ onClick?: () => void }>, {
      onClick: () => setOpen(true),
    });
  }
  return (
    <button type="button" onClick={() => setOpen(true)}>
      {children}
    </button>
  );
}

// ─── DialogPortal (simplified — renders inline for SSR compatibility) ─────────

export function DialogPortal({ children }: { children: React.ReactNode }) {
  const { open } = useDialog();
  if (!open) return null;
  return <>{children}</>;
}

// ─── DialogOverlay ────────────────────────────────────────────────────────────

export function DialogOverlay({ className }: { className?: string }) {
  const { setOpen } = useDialog();
  return (
    <div
      className={cn(
        'fixed inset-0 z-50 bg-black/60 backdrop-blur-sm',
        'animate-fade-in-up',
        className,
      )}
      onClick={() => setOpen(false)}
      aria-hidden="true"
    />
  );
}

// ─── DialogContent ────────────────────────────────────────────────────────────

export function DialogContent({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const { setOpen } = useDialog();

  return (
    <>
      <DialogOverlay />
      <div
        role="dialog"
        aria-modal="true"
        className={cn(
          'fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2',
          'w-full max-w-lg bg-popover border border-border rounded-xl shadow-2xl p-6',
          'animate-fade-in-up',
          className,
        )}
      >
        {children}
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label="Close dialog"
          className="absolute right-4 top-4 p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <X size={18} />
        </button>
      </div>
    </>
  );
}

// ─── DialogHeader / Footer / Title / Description ─────────────────────────────

export function DialogHeader({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('mb-4 space-y-1 pr-8', className)}>{children}</div>;
}

export function DialogFooter({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('mt-6 flex flex-col-reverse sm:flex-row sm:justify-end gap-2', className)}>{children}</div>;
}

export function DialogTitle({ children, className }: { children: React.ReactNode; className?: string }) {
  return <h2 className={cn('font-heading text-lg font-bold text-foreground', className)}>{children}</h2>;
}

export function DialogDescription({ children, className }: { children: React.ReactNode; className?: string }) {
  return <p className={cn('text-sm text-muted-foreground', className)}>{children}</p>;
}

// ─── DialogClose ─────────────────────────────────────────────────────────────

export function DialogClose({ children }: { children: React.ReactNode }) {
  const { setOpen } = useDialog();
  if (React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<{ onClick?: () => void }>, {
      onClick: () => setOpen(false),
    });
  }
  return <button type="button" onClick={() => setOpen(false)}>{children}</button>;
}
