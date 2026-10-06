'use client';

import * as React from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AccordionContextValue {
  openItems: Set<string>;
  toggleItem: (value: string) => void;
}

const AccordionContext = React.createContext<AccordionContextValue | null>(null);

export function Accordion({
  children,
  className,
  type = 'single',
}: {
  children: React.ReactNode;
  className?: string;
  type?: 'single' | 'multiple';
}) {
  const [openItems, setOpenItems] = React.useState<Set<string>>(new Set());

  const toggleItem = React.useCallback(
    (value: string) => {
      setOpenItems((prev) => {
        const next = new Set(type === 'single' ? [] : prev);
        if (prev.has(value)) {
          next.delete(value);
        } else {
          next.add(value);
        }
        return next;
      });
    },
    [type]
  );

  return (
    <AccordionContext.Provider value={{ openItems, toggleItem }}>
      <div className={cn('divide-y divide-slate-200 border-y border-slate-200', className)}>{children}</div>
    </AccordionContext.Provider>
  );
}

const AccordionItemContext = React.createContext<string>('');

export function AccordionItem({
  value,
  children,
  className,
}: {
  value: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <AccordionItemContext.Provider value={value}>
      <div className={cn('py-1', className)}>{children}</div>
    </AccordionItemContext.Provider>
  );
}

export function AccordionTrigger({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const value = React.useContext(AccordionItemContext);
  const ctx = React.useContext(AccordionContext);
  if (!ctx) throw new Error('AccordionTrigger must be used within Accordion');

  const isOpen = ctx.openItems.has(value);

  return (
    <button
      type="button"
      onClick={() => ctx.toggleItem(value)}
      className={cn(
        'flex w-full items-center justify-between py-3 font-semibold text-sm text-left transition-all hover:text-[#844AFB] cursor-pointer',
        className
      )}
    >
      <span>{children}</span>
      <ChevronDown
        className={cn('size-4 shrink-0 text-slate-500 transition-transform duration-200', isOpen && 'rotate-180 text-[#844AFB]')}
      />
    </button>
  );
}

export function AccordionContent({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const value = React.useContext(AccordionItemContext);
  const ctx = React.useContext(AccordionContext);
  if (!ctx) throw new Error('AccordionContent must be used within Accordion');

  const isOpen = ctx.openItems.has(value);
  if (!isOpen) return null;

  return (
    <div className={cn('pb-4 text-xs text-slate-600 leading-relaxed animate-fade-in-up', className)}>
      {children}
    </div>
  );
}
