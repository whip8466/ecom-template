'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { apiRequest } from '@/lib/api';
import { buildLoginRedirectHref } from '@/lib/auth-redirect';
import type { ProductReviewPublic, ProductReviewSummary } from '@/lib/types';
import { useAuthStore } from '@/store/auth-store';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000';

type EligibleItem = { orderItemId: number; orderId: number; purchasedAt: string };

function StarRating({ rating }: { rating: number }) {
  return (
    <span className="text-[#f5a623]" aria-hidden>
      {Array.from({ length: 5 }).map((_, i) => (
        <span key={i}>{i < rating ? '★' : '☆'}</span>
      ))}
    </span>
  );
}

type Props = {
  productId: number;
  initial: ProductReviewSummary;
};

export function ProductReviewsSection({ productId, initial }: Props) {
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);
  const [reviews, setReviews] = useState<ProductReviewPublic[]>(initial.reviews);
  const [averageRating, setAverageRating] = useState<number | null>(initial.averageRating);
  const [count, setCount] = useState(initial.count);
  const [eligible, setEligible] = useState<EligibleItem[]>([]);
  const [loadingEligibility, setLoadingEligibility] = useState(false);
  const [selectedOrderItemId, setSelectedOrderItemId] = useState<number | null>(null);
  const [rating, setRating] = useState(5);
  const [body, setBody] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const refreshList = useCallback(async () => {
    const res = await fetch(`${API_BASE}/api/products/${productId}/reviews`, { cache: 'no-store' });
    if (!res.ok) return;
    const json = (await res.json()) as { data: ProductReviewSummary };
    setReviews(json.data.reviews);
    setAverageRating(json.data.averageRating);
    setCount(json.data.count);
  }, [productId]);

  useEffect(() => {
    if (!user || !token) {
      setEligible([]);
      setSelectedOrderItemId(null);
      return;
    }
    let cancelled = false;
    setLoadingEligibility(true);
    apiRequest<{ data: { eligibleOrderItems: EligibleItem[] } }>(
      `/api/products/${productId}/review-eligibility`,
      { token },
    )
      .then((res) => {
        if (cancelled) return;
        const items = res.data.eligibleOrderItems;
        setEligible(items);
        setSelectedOrderItemId(items[0]?.orderItemId ?? null);
      })
      .catch(() => {
        if (!cancelled) {
          setEligible([]);
          setSelectedOrderItemId(null);
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingEligibility(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user, token, productId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!token || selectedOrderItemId == null) {
      setError('Choose a purchase to attach this review to.');
      return;
    }
    setSubmitting(true);
    try {
      await apiRequest('/api/reviews', {
        method: 'POST',
        token,
        body: JSON.stringify({
          orderItemId: selectedOrderItemId,
          productId,
          rating,
          body,
        }),
      });
      setBody('');
      setSuccess('Thank you for your review.');
      await refreshList();
      setEligible((prev) => {
        const next = prev.filter((x) => x.orderItemId !== selectedOrderItemId);
        setSelectedOrderItemId(next[0]?.orderItemId ?? null);
        return next;
      });
    } catch (err) {
      setError((err as Error).message || 'Could not submit review');
    } finally {
      setSubmitting(false);
    }
  }

  const loginHref = buildLoginRedirectHref(typeof window !== 'undefined' ? window.location.pathname : '/');

  return (
    <div className="mt-5 space-y-8">
      {count > 0 && averageRating != null && (
        <p className="text-sm text-[#475467]">
          <span className="font-semibold text-[#0f1f40]">{averageRating.toFixed(1)}</span> out of 5 ·{' '}
          <span className="text-[#7b8aa3]">
            {count} {count === 1 ? 'review' : 'reviews'}
          </span>
        </p>
      )}

      {!user && (
        <p className="rounded-md border border-[#e4ebf5] bg-[#f8fbff] px-4 py-3 text-sm text-[#475467]">
          <Link href={loginHref} className="font-medium text-[#0989ff] hover:underline">
            Sign in
          </Link>{' '}
          to write a review after you purchase this product (one review per paid order).
        </p>
      )}

      {user && token && (
        <>
          {loadingEligibility ? (
            <p className="text-sm text-[#7b8aa3]">Checking your purchases…</p>
          ) : eligible.length > 0 ? (
            <form onSubmit={handleSubmit} className="rounded-md border border-[#e4ebf5] bg-[#fafcff] p-4">
              <h3 className="text-sm font-semibold text-[#0f1f40]">Write a review</h3>
              <p className="mt-1 text-xs text-[#7b8aa3]">
                Verified purchase only — one review per order line. Your name will appear as on your account.
              </p>
              {eligible.length > 1 && (
                <label className="mt-3 block text-sm text-[#475467]">
                  <span className="mb-1 block font-medium">Purchase</span>
                  <select
                    value={selectedOrderItemId ?? ''}
                    onChange={(e) => setSelectedOrderItemId(Number(e.target.value))}
                    className="mt-1 w-full max-w-md rounded border border-[#d6e2f1] bg-white px-3 py-2 text-sm text-[#0f1f40]"
                  >
                    {eligible.map((row) => (
                      <option key={row.orderItemId} value={row.orderItemId}>
                        Order #{row.orderId} ·{' '}
                        {new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium' }).format(new Date(row.purchasedAt))}
                      </option>
                    ))}
                  </select>
                </label>
              )}
              <div className="mt-3">
                <span className="text-sm font-medium text-[#475467]">Rating</span>
                <div className="mt-2 flex flex-wrap gap-2">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setRating(n)}
                      className={`rounded border px-3 py-1.5 text-sm font-medium transition ${
                        rating === n
                          ? 'border-[#0989ff] bg-[#0989ff] text-white'
                          : 'border-[#d6e2f1] bg-white text-[#0f1f40] hover:border-[#0989ff]'
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>
              <label className="mt-4 block text-sm text-[#475467]">
                <span className="mb-1 block font-medium">Your review</span>
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  rows={4}
                  required
                  minLength={1}
                  maxLength={5000}
                  placeholder="Share your experience with this product…"
                  className="mt-1 w-full rounded border border-[#d6e2f1] bg-white px-3 py-2 text-sm text-[#0f1f40] placeholder:text-[#94a3b8]"
                />
              </label>
              {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
              {success && <p className="mt-2 text-sm text-emerald-600">{success}</p>}
              <button
                type="submit"
                disabled={submitting || !body.trim()}
                className="mt-4 rounded bg-[#0f1f40] px-5 py-2 text-sm font-semibold text-white hover:bg-[#102b57] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submitting ? 'Submitting…' : 'Submit review'}
              </button>
            </form>
          ) : (
            <p className="text-sm text-[#7b8aa3]">
              You can submit a review here after you buy this product and your order is paid. Each paid order can
              include one review for this item.
            </p>
          )}
        </>
      )}

      <div>
        <h3 className="text-sm font-semibold text-[#0f1f40]">Customer reviews</h3>
        {reviews.length === 0 ? (
          <p className="mt-3 text-sm text-[#7b8aa3]">No reviews yet. Be the first to review this product.</p>
        ) : (
          <ul className="mt-4 space-y-5">
            {reviews.map((r) => (
              <li key={r.id} className="border-b border-[#edf2f8] pb-5 last:border-0 last:pb-0">
                <div className="flex flex-wrap items-center gap-2">
                  <StarRating rating={r.rating} />
                  <span className="text-sm font-medium text-[#0f1f40]">{r.authorLabel}</span>
                  <span className="text-xs text-[#94a3b8]">
                    {new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium' }).format(new Date(r.createdAt))}
                  </span>
                </div>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-[#475467]">{r.body}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
