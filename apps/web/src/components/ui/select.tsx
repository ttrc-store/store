'use client';

import * as React from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

// ─── Context ──────────────────────────────────────────────────────────────────

interface SelectContextValue {
  value: string;
  onValueChange: (value: string) => void;
  open: boolean;
  setOpen: (open: boolean) => void;
}

const SelectContext = React.createContext<SelectContextValue | null>(null);

function useSelect() {
  const ctx = React.useContext(SelectContext);
  if (!ctx) throw new Error('Select components must be used within <Select>');
  return ctx;
}

// ─── Select Root ─────────────────────────────────────────────────────────────

interface SelectProps {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  children: React.ReactNode;
}

export function Select({ value: controlledValue, defaultValue = '', onValueChange, children }: SelectProps) {
  const [uncontrolledValue, setUncontrolledValue] = React.useState(defaultValue);
  const [open, setOpen] = React.useState(false);

  const value = controlledValue ?? uncontrolledValue;
  const handleValueChange = React.useCallback(
    (newValue: string) => {
      setUncontrolledValue(newValue);
      onValueChange?.(newValue);
      setOpen(false);
    },
    [onValueChange],
  );

  return (
    <SelectContext.Provider value={{ value, onValueChange: handleValueChange, open, setOpen }}>
      <div className="relative">{children}</div>
    </SelectContext.Provider>
  );
}

// ─── SelectTrigger ────────────────────────────────────────────────────────────

interface SelectTriggerProps {
  className?: string;
  children: React.ReactNode;
  id?: string;
}

export function SelectTrigger({ className, children, id }: SelectTriggerProps) {
  const { open, setOpen } = useSelect();

  return (
    <button
      id={id}
      type="button"
      role="combobox"
      aria-haspopup="listbox"
      aria-expanded={open}
      onClick={() => setOpen(!open)}
      className={cn(
        'flex h-10 w-full items-center justify-between rounded-lg border border-input bg-card px-3 py-2 text-sm text-foreground',
        'hover:border-ring/50 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background',
        'disabled:cursor-not-allowed disabled:opacity-50 transition-colors',
        className,
      )}
    >
      {children}
      <ChevronDown
        size={16}
        className={cn('text-muted-foreground transition-transform duration-200', open && 'rotate-180')}
      />
    </button>
  );
}

// ─── SelectValue ─────────────────────────────────────────────────────────────

export function SelectValue({ placeholder }: { placeholder?: string }) {
  const { value } = useSelect();

  if (!value && placeholder) {
    return <span className="text-muted-foreground">{placeholder}</span>;
  }
  return <span>{value}</span>;
}

// ─── SelectContent ────────────────────────────────────────────────────────────

export function SelectContent({ children, className }: { children: React.ReactNode; className?: string }) {
  const { open, setOpen } = useSelect();
  const ref = React.useRef<HTMLDivElement>(null);

  // Close on click outside
  React.useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.closest('[data-select-root]')?.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open, setOpen]);

  if (!open) return null;

  return (
    <div
      ref={ref}
      role="listbox"
      className={cn(
        'absolute z-50 mt-1 w-full rounded-lg border border-border bg-popover shadow-xl overflow-hidden',
        'animate-fade-in-up',
        className,
      )}
    >
      <div className="py-1 max-h-60 overflow-y-auto">{children}</div>
    </div>
  );
}

// ─── SelectItem ───────────────────────────────────────────────────────────────

export function SelectItem({
  value: itemValue,
  children,
  className,
}: {
  value: string;
  children: React.ReactNode;
  className?: string;
}) {
  const { value, onValueChange } = useSelect();
  const isSelected = value === itemValue;

  return (
    <button
      type="button"
      role="option"
      aria-selected={isSelected}
      onClick={() => onValueChange(itemValue)}
      className={cn(
        'flex w-full items-center justify-between px-3 py-2 text-sm text-foreground',
        'hover:bg-muted transition-colors cursor-pointer',
        isSelected && 'text-primary font-semibold bg-primary/5',
        className,
      )}
    >
      {children}
      {isSelected && <Check size={14} className="text-primary shrink-0" />}
    </button>
  );
}

// ─── SelectLabel ─────────────────────────────────────────────────────────────

export function SelectLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-3 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
      {children}
    </div>
  );
}

// ─── SelectSeparator ─────────────────────────────────────────────────────────

export function SelectSeparator() {
  return <div className="my-1 h-px bg-border" />;
}
