'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

interface DropdownContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const DropdownContext = React.createContext<DropdownContextValue | null>(null);

export function DropdownMenu({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!open) return;
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [open]);

  return (
    <DropdownContext.Provider value={{ open, setOpen }}>
      <div ref={containerRef} className="relative inline-block text-left">
        {children}
      </div>
    </DropdownContext.Provider>
  );
}

export function DropdownMenuTrigger({
  asChild,
  children,
  className,
}: {
  asChild?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  const ctx = React.useContext(DropdownContext);
  if (!ctx) throw new Error('DropdownMenuTrigger must be inside DropdownMenu');

  return (
    <div
      onClick={() => ctx.setOpen(!ctx.open)}
      className={cn('cursor-pointer inline-flex', className)}
    >
      {children}
    </div>
  );
}

export function DropdownMenuContent({
  align = 'end',
  children,
  className,
}: {
  align?: 'start' | 'end' | 'center';
  children: React.ReactNode;
  className?: string;
}) {
  const ctx = React.useContext(DropdownContext);
  if (!ctx) throw new Error('DropdownMenuContent must be inside DropdownMenu');

  if (!ctx.open) return null;

  return (
    <div
      className={cn(
        'absolute z-50 mt-2 min-w-[10rem] overflow-hidden rounded-xl border border-slate-200 bg-white p-1 text-slate-800 shadow-lg animate-fade-in-up focus:outline-none',
        align === 'end' && 'right-0',
        align === 'start' && 'left-0',
        align === 'center' && 'left-1/2 -translate-x-1/2',
        className
      )}
    >
      {children}
    </div>
  );
}

export function DropdownMenuItem({
  onClick,
  disabled,
  children,
  className,
}: {
  onClick?: () => void;
  disabled?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  const ctx = React.useContext(DropdownContext);

  const handleClick = () => {
    if (disabled) return;
    onClick?.();
    ctx?.setOpen(false);
  };

  return (
    <div
      onClick={handleClick}
      className={cn(
        'relative flex cursor-pointer select-none items-center rounded-lg px-3 py-2 text-xs font-medium outline-none transition-colors hover:bg-[#EEE8FA]/60 hover:text-[#6721F2] focus:bg-[#EEE8FA]/60 focus:text-[#6721F2]',
        disabled && 'pointer-events-none opacity-50',
        className
      )}
    >
      {children}
    </div>
  );
}

export function DropdownMenuSeparator({ className }: { className?: string }) {
  return <div className={cn('-mx-1 my-1 h-px bg-slate-100', className)} />;
}

export function DropdownMenuLabel({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('px-3 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider', className)}>
      {children}
    </div>
  );
}
