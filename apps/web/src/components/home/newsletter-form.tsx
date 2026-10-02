'use client';

import * as React from 'react';
import { Send, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function NewsletterForm() {
  const [email, setEmail] = React.useState('');
  const [submitted, setSubmitted] = React.useState(false);
  const [error, setError] = React.useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="flex items-center gap-2 text-sm text-purple-200 bg-purple-900/50 p-4 rounded-xl border border-purple-700/50">
        <CheckCircle2 size={18} className="text-emerald-400" />
        <span>Thank you for subscribing! We&apos;ll keep you updated on new robotics releases.</span>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <div className="flex flex-col sm:flex-row gap-2 max-w-md mx-auto">
        <input
          type="email"
          placeholder="Enter your engineer/college email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="flex-1 px-4 py-3 rounded-xl bg-purple-950/70 border border-purple-800 text-white placeholder:text-purple-300 text-xs focus:outline-none focus:ring-2 focus:ring-[#AF87F8]"
        />
        <Button
          type="submit"
          className="bg-[#844AFB] hover:bg-[#6721F2] text-white font-bold text-xs px-6 py-3 rounded-xl shadow-md glow-purple-sm transition-all"
        >
          <Send size={14} className="mr-1.5" />
          Subscribe
        </Button>
      </div>
      {error && <p className="text-xs text-red-300">{error}</p>}
    </form>
  );
}
