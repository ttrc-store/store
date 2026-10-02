'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, RefreshCcw, ArrowLeft } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log to Sentry in Phase 6
    console.error('[TTRC Error Boundary]', error);
  }, [error]);

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 text-center">
      <div className="p-4 rounded-full bg-red-500/10 border border-red-500/30 mb-6">
        <AlertTriangle size={40} className="text-red-500" />
      </div>

      <h1 className="font-heading text-2xl sm:text-3xl font-bold text-foreground mb-3">
        Something went wrong
      </h1>
      <p className="text-muted-foreground text-sm sm:text-base max-w-md mb-8 leading-relaxed">
        An unexpected error occurred. Our team has been notified.
        {error.digest && (
          <span className="block mt-2 text-xs font-mono text-muted-foreground/60">
            Reference: {error.digest}
          </span>
        )}
      </p>

      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={reset}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-purple-700 text-white font-bold text-sm hover:bg-purple-800 transition-colors glow-purple-sm"
        >
          <RefreshCcw size={16} />
          Try Again
        </button>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-lg border border-border text-foreground font-semibold text-sm hover:bg-muted transition-colors"
        >
          <ArrowLeft size={16} />
          Go Home
        </Link>
      </div>
    </div>
  );
}
