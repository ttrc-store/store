'use client';

import * as React from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

// ─── Sheet Context ────────────────────────────────────────────────────────────

interface SheetContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
  side: 'left' | 'right' | 'top' | 'bottom';
}

const SheetContext = React.createContext<SheetContextValue | null>(null);

function useSheet() {
  const ctx = React.useContext(SheetContext);
  if (!ctx) throw new Error('Sheet components must be used within <Sheet>');
  return ctx;
}

// ─── Sheet Root ───────────────────────────────────────────────────────────────

export function Sheet({
  open: controlledOpen,
  onOpenChange,
  side = 'right',
  children,
}: {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  side?: 'left' | 'right' | 'top' | 'bottom';
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

  React.useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, setOpen]);

  React.useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  return (
    <SheetContext.Provider value={{ open, setOpen, side }}>
      {children}
    </SheetContext.Provider>
  );
}

// ─── SheetTrigger ─────────────────────────────────────────────────────────────

export function SheetTrigger({ children, asChild }: { children: React.ReactNode; asChild?: boolean }) {
  const { setOpen } = useSheet();
  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<{ onClick?: () => void }>, {
      onClick: () => setOpen(true),
    });
  }
  return <button type="button" onClick={() => setOpen(true)}>{children}</button>;
}

// ─── SheetContent ─────────────────────────────────────────────────────────────

const SIDE_CLASSES = {
  right: 'right-0 top-0 h-full w-full max-w-sm translate-x-full data-[open=true]:translate-x-0',
  left: 'left-0 top-0 h-full w-full max-w-sm -translate-x-full data-[open=true]:translate-x-0',
  top: 'top-0 left-0 w-full h-auto max-h-[80vh] -translate-y-full data-[open=true]:translate-y-0',
  bottom: 'bottom-0 left-0 w-full h-auto max-h-[80vh] translate-y-full data-[open=true]:translate-y-0',
} as const;

export function SheetContent({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const { open, setOpen, side } = useSheet();

  return (
    <>
      {/* Overlay */}
      <div
        className={cn(
          'fixed inset-0 z-50 bg-black/60 backdrop-blur-sm transition-opacity duration-300',
          open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none',
        )}
        onClick={() => setOpen(false)}
        aria-hidden="true"
      />
      {/* Panel */}
      <div
        role="dialog"
        aria-modal="true"
        data-open={open}
        className={cn(
          'fixed z-50 bg-popover border-border shadow-2xl transition-transform duration-300 ease-in-out flex flex-col',
          side === 'right' && 'border-l',
          side === 'left' && 'border-r',
          side === 'top' && 'border-b',
          side === 'bottom' && 'border-t',
          SIDE_CLASSES[side],
          className,
        )}
      >
        {children}
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label="Close panel"
          className="absolute right-4 top-4 p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <X size={18} />
        </button>
      </div>
    </>
  );
}

// ─── SheetHeader / Footer / Title / Description ───────────────────────────────

export function SheetHeader({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('px-6 py-5 border-b border-border pr-12', className)}>{children}</div>;
}

export function SheetFooter({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('px-6 py-4 border-t border-border mt-auto', className)}>{children}</div>;
}

export function SheetTitle({ children, className }: { children: React.ReactNode; className?: string }) {
  return <h2 className={cn('font-heading text-lg font-bold text-foreground', className)}>{children}</h2>;
}

export function SheetDescription({ children, className }: { children: React.ReactNode; className?: string }) {
  return <p className={cn('text-sm text-muted-foreground mt-1', className)}>{children}</p>;
}

export function SheetClose({ children }: { children: React.ReactNode }) {
  const { setOpen } = useSheet();
  if (React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<{ onClick?: () => void }>, {
      onClick: () => setOpen(false),
    });
  }
  return <button type="button" onClick={() => setOpen(false)}>{children}</button>;
}

/** Scrollable body area within the sheet */
export function SheetBody({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('flex-1 overflow-y-auto px-6 py-4', className)}>{children}</div>;
}
