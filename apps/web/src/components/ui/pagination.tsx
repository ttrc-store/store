import * as React from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Pagination({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <nav role="navigation" aria-label="Pagination" className={cn('flex justify-center', className)}>
      {children}
    </nav>
  );
}

export function PaginationContent({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <ul className={cn('flex items-center gap-1', className)}>
      {children}
    </ul>
  );
}

export function PaginationItem({ className, children }: { className?: string; children: React.ReactNode }) {
  return <li className={cn('', className)}>{children}</li>;
}

export function PaginationLink({
  href,
  isActive,
  children,
  className,
  'aria-label': ariaLabel,
}: {
  href: string;
  isActive?: boolean;
  children: React.ReactNode;
  className?: string;
  'aria-label'?: string;
}) {
  return (
    <Link
      href={href}
      aria-label={ariaLabel}
      aria-current={isActive ? 'page' : undefined}
      className={cn(
        'flex h-9 w-9 items-center justify-center rounded-lg text-sm font-semibold transition-colors',
        isActive
          ? 'bg-purple-700 text-white shadow-sm glow-purple-sm'
          : 'text-foreground hover:bg-purple-50 border border-transparent hover:border-purple-200',
        className,
      )}
    >
      {children}
    </Link>
  );
}

export function PaginationPrevious({ href, className }: { href: string; className?: string }) {
  return (
    <PaginationLink href={href} aria-label="Go to previous page" className={cn('w-auto px-3 gap-1', className)}>
      <ChevronLeft size={16} />
      <span className="hidden sm:inline text-xs">Prev</span>
    </PaginationLink>
  );
}

export function PaginationNext({ href, className }: { href: string; className?: string }) {
  return (
    <PaginationLink href={href} aria-label="Go to next page" className={cn('w-auto px-3 gap-1', className)}>
      <span className="hidden sm:inline text-xs">Next</span>
      <ChevronRight size={16} />
    </PaginationLink>
  );
}

export function PaginationEllipsis({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn('flex h-9 w-9 items-center justify-center text-muted-foreground', className)}
    >
      <MoreHorizontal size={16} />
    </span>
  );
}
