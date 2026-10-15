'use client';

import * as React from 'react';
import { usePathname } from 'next/navigation';

interface StorefrontClientShellProps {
  initialIsAdmin?: boolean;
  header: React.ReactNode;
  footer: React.ReactNode;
  floating: React.ReactNode;
  children: React.ReactNode;
}

export function StorefrontClientShell({
  initialIsAdmin = false,
  header,
  footer,
  floating,
  children,
}: StorefrontClientShellProps) {
  const pathname = usePathname();
  const isAdmin = pathname ? pathname.startsWith('/admin') : initialIsAdmin;

  if (isAdmin) {
    return <>{children}</>;
  }

  return (
    <div className="relative min-h-screen flex flex-col bg-[#FDFDFD]">
      {/* Centralized subtle ambient gradient */}
      <div
        aria-hidden="true"
        className="fixed inset-0 pointer-events-none -z-10 bg-[#FDFDFD] [background:radial-gradient(120%_120%_at_50%_0%,#FDFDFD_50%,#EEE8FA_100%)] opacity-80"
      />
      {header}
      <main className="flex-1 pb-16 md:pb-0">{children}</main>
      {footer}
      {floating}
    </div>
  );
}
