'use client';

import { useState } from 'react';

export function NewsletterSignup() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setStatus('loading');
    // Simulate API call
    setTimeout(() => {
      setStatus('success');
      setEmail('');
    }, 800);
  }

  return (
    <section className="relative overflow-hidden bg-[var(--card-bg)] text-[var(--navy)]">
      <div
        className="absolute inset-0 opacity-[0.16]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%230989ff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />
      <div className="relative mx-auto max-w-4xl px-4 py-16 text-center sm:px-6 sm:py-20 lg:px-8">
        <h2 className="font-display text-3xl font-semibold sm:text-4xl">
          Subscribe to our Newsletter
        </h2>
        <p className="mt-3 text-[var(--muted)]">
          Get early access to new arrivals, exclusive offers, and styling tips.
        </p>
        <form onSubmit={handleSubmit} className="mx-auto mt-8 flex max-w-md flex-col gap-3 sm:flex-row">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            required
            disabled={status === 'loading'}
            className="flex-1 rounded-full border-2 border-[var(--border)] bg-[var(--background)] px-5 py-4 text-[var(--navy)] placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/30 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={status === 'loading'}
            className="rounded-full bg-[var(--accent)] px-8 py-4 font-semibold text-white transition-premium hover:bg-[var(--accent-hover)] hover:-translate-y-0.5 disabled:opacity-50"
          >
            {status === 'loading' ? 'Signing up…' : status === 'success' ? 'Subscribed!' : 'Sign Up'}
          </button>
        </form>
        {status === 'success' && (
          <p className="mt-4 text-sm text-[var(--accent)]">Thanks for subscribing. Check your inbox.</p>
        )}
      </div>
    </section>
  );
}
