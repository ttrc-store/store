import Link from 'next/link';
import { Bot, ArrowLeft, Search } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 text-center">
      {/* Animated 404 */}
      <div className="relative mb-8">
        <div className="text-[120px] sm:text-[160px] font-heading font-extrabold leading-none text-zinc-800 dark:text-zinc-900 select-none">
          404
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="p-4 rounded-full bg-purple-50 border border-purple-200 animate-pulse-glow">
            <Bot size={48} className="text-purple-700" />
          </div>
        </div>
      </div>

      <h1 className="font-heading text-2xl sm:text-3xl font-bold text-foreground mb-3">
        Page Not Found
      </h1>
      <p className="text-muted-foreground text-sm sm:text-base max-w-md mb-8 leading-relaxed">
        Looks like this circuit is missing. The page you&apos;re looking for doesn&apos;t exist
        or has been moved.
      </p>

      <div className="flex flex-col sm:flex-row gap-3">
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-purple-700 text-white font-bold text-sm hover:bg-purple-800 transition-colors shadow-sm glow-purple-sm"
        >
          <ArrowLeft size={16} />
          Back to Home
        </Link>
        <Link
          href="/search"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-lg border border-border text-foreground font-semibold text-sm hover:bg-muted transition-colors"
        >
          <Search size={16} />
          Search Products
        </Link>
      </div>
    </div>
  );
}
