'use client';

import { type FormEvent, useState } from 'react';
import { apiRequest } from '@/lib/api';

export function NewsletterFooterForm() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFeedback(null);
    const trimmed = email.trim();
    if (!trimmed) {
      setFeedback({ kind: 'err', text: 'Please enter your email.' });
      return;
    }
    setLoading(true);
    try {
      const page = `${window.location.pathname}${window.location.search}`.slice(0, 2048);
      const res = await apiRequest<{ ok?: boolean; message?: string }>('/api/newsletter', {
        method: 'POST',
        body: JSON.stringify({ email: trimmed, source: page }),
      });
      setFeedback({ kind: 'ok', text: res.message || 'Thanks for subscribing!' });
      setEmail('');
    } catch (err) {
      setFeedback({ kind: 'err', text: (err as Error).message || 'Something went wrong.' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-8 max-w-md">
      <h4 className="font-display text-sm font-semibold uppercase tracking-wider text-[var(--navy)]">
        Newsletter
      </h4>
      <p className="mt-2 text-sm text-[var(--muted)]">Subscribe for weekly updates and offers.</p>
      <form
        className="mt-4 flex flex-col gap-0 overflow-hidden rounded-md border border-[var(--sf-input-border)] bg-[var(--sf-input-bg)] sm:flex-row sm:gap-0 sm:border-[var(--border)] sm:bg-[var(--card-bg)]"
        onSubmit={onSubmit}
      >
        <label htmlFor="footer-newsletter-email" className="sr-only">
          Email address
        </label>
        <input
          id="footer-newsletter-email"
          type="email"
          name="email"
          autoComplete="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={loading}
          className="sf-field min-w-0 flex-1 rounded-none border-0 py-2.5 sm:py-2"
        />
        <button
          type="submit"
          disabled={loading}
          className="sf-btn-primary shrink-0 rounded-none py-2.5 text-sm sm:py-2"
        >
          {loading ? '…' : 'Subscribe'}
        </button>
      </form>
      {feedback ? (
        <p
          className={`mt-2 text-xs ${feedback.kind === 'ok' ? 'text-[var(--sf-btn-primary-bg)]' : 'text-red-600'}`}
          role="status"
        >
          {feedback.text}
        </p>
      ) : null}
    </div>
  );
}
