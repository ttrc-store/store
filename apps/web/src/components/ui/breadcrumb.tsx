import * as React from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Breadcrumb({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <nav aria-label="Breadcrumb" className={cn('', className)}>
      {children}
    </nav>
  );
}

export function BreadcrumbList({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <ol
      className={cn('flex flex-wrap items-center gap-1 text-sm text-muted-foreground', className)}
      itemScope
      itemType="https://schema.org/BreadcrumbList"
    >
      {children}
    </ol>
  );
}

export function BreadcrumbItem({
  children,
  className,
  position,
}: {
  children: React.ReactNode;
  className?: string;
  position?: number;
}) {
  return (
    <li
      className={cn('flex items-center gap-1', className)}
      itemScope
      itemProp="itemListElement"
      itemType="https://schema.org/ListItem"
    >
      {children}
      {position !== undefined && <meta itemProp="position" content={String(position)} />}
    </li>
  );
}

export function BreadcrumbLink({
  href,
  children,
  className,
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Link
      href={href}
      itemProp="item"
      className={cn(
        'hover:text-foreground transition-colors hover:text-purple-700',
        className,
      )}
    >
      <span itemProp="name">{children}</span>
    </Link>
  );
}

export function BreadcrumbPage({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span
      aria-current="page"
      itemProp="name"
      className={cn('text-foreground font-semibold truncate max-w-[200px]', className)}
    >
      {children}
    </span>
  );
}

export function BreadcrumbSeparator({ className }: { className?: string }) {
  return (
    <li aria-hidden="true" className={cn('text-muted-foreground/40', className)}>
      <ChevronRight size={14} />
    </li>
  );
}

export function BreadcrumbEllipsis({ className }: { className?: string }) {
  return (
    <li aria-hidden="true" className={cn('text-muted-foreground', className)}>
      <span>…</span>
    </li>
  );
}
