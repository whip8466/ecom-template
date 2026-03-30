'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { AdminPageShell } from '@/components/admin-shell';
import { handleInvalidTokenIfNeeded } from '@/lib/invalidate-session';
import { useAuthStore } from '@/store/auth-store';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000';

type ReviewRow = {
  id: number;
  rating: number;
  body: string;
  createdAt: string;
  product: { id: number; name: string; slug: string };
  orderId: number;
  customer: { id: number; email: string; displayName: string };
};

function Stars({ rating }: { rating: number }) {
  const n = Math.max(1, Math.min(5, Math.round(rating)));
  return (
    <span className="inline-flex text-amber-400" aria-hidden>
      {Array.from({ length: 5 }).map((_, i) => (
        <span key={i}>{i < n ? '★' : '☆'}</span>
      ))}
    </span>
  );
}

export default function AdminProductReviewsPage() {
  const token = useAuthStore((s) => s.token);
  const [rows, setRows] = useState<ReviewRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [q, setQ] = useState('');

  const fetchReviews = useCallback(async () => {
    if (!token) {
      setRows([]);
      setTotal(0);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    const params = new URLSearchParams();
    params.set('page', String(page));
    params.set('limit', String(limit));
    if (q.trim()) params.set('q', q.trim());
    try {
      const res = await fetch(`${API_BASE}/api/admin/product-reviews?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        await handleInvalidTokenIfNeeded(res.status, data);
        throw new Error((data as { message?: string }).message || 'Failed to load reviews');
      }
      const payload = data as {
        data: ReviewRow[];
        total: number;
        page: number;
        limit: number;
      };
      setRows(payload.data);
      setTotal(payload.total);
    } catch (e) {
      setError((e as Error).message || 'Failed to load reviews');
      setRows([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [token, page, limit, q]);

  useEffect(() => {
    void fetchReviews();
  }, [fetchReviews]);

  const totalPages = Math.max(1, Math.ceil(total / limit));

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setQ(searchInput);
  };

  return (
    <AdminPageShell
      breadcrumbs={[
        { label: 'Admin', href: '/admin' },
        { label: 'Products', href: '/admin/product/list' },
        { label: 'Reviews' },
      ]}
      title="Product reviews"
    >
      <p className="mt-2 text-sm text-[#64748b]">
        Customer reviews from verified purchases (one review per order line).
      </p>

      <form onSubmit={handleSearchSubmit} className="mt-6 flex flex-wrap items-center gap-3">
        <input
          type="search"
          placeholder="Search by product name"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="h-10 min-w-[220px] flex-1 max-w-md rounded-admin border border-[#e5ebf5] bg-white px-4 py-2 text-sm text-[#1c2740] placeholder:text-[#94a3b8] focus:border-[#246bfd] focus:outline-none"
        />
        <button
          type="submit"
          className="h-10 rounded-admin bg-[#246bfd] px-4 text-sm font-medium text-white hover:bg-[#1e5ee6]"
        >
          Search
        </button>
        {q ? (
          <button
            type="button"
            onClick={() => {
              setSearchInput('');
              setQ('');
              setPage(1);
            }}
            className="h-10 rounded-admin border border-[#e5ebf5] bg-white px-4 text-sm font-medium text-[#475569] hover:bg-[#f8fafc]"
          >
            Clear
          </button>
        ) : null}
      </form>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      <div className="mt-6 overflow-hidden rounded-admin-card border border-[#e5ebf5] bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[880px] text-left text-sm">
            <thead>
              <tr className="border-b border-[#e5ebf5] bg-[#f8fafc] text-xs font-semibold uppercase tracking-wide text-[#64748b]">
                <th className="p-4">Product</th>
                <th className="p-4">Customer</th>
                <th className="p-4">Order</th>
                <th className="p-4">Rating</th>
                <th className="p-4">Review</th>
                <th className="p-4">Date</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-10 text-center text-[#64748b]">
                    Loading…
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-10 text-center text-[#64748b]">
                    No reviews yet.
                  </td>
                </tr>
              ) : (
                rows.map((r) => (
                  <tr key={r.id} className="border-b border-[#f1f5f9] last:border-0">
                    <td className="p-4 align-top">
                      <Link
                        href={`/admin/product/edit/${r.product.id}`}
                        className="font-medium text-[#246bfd] hover:underline"
                      >
                        {r.product.name}
                      </Link>
                      <p className="mt-0.5 text-xs text-[#94a3b8]">#{r.product.id}</p>
                    </td>
                    <td className="p-4 align-top">
                      <p className="font-medium text-[#1c2740]">{r.customer.displayName}</p>
                      <p className="mt-0.5 text-xs text-[#64748b]">{r.customer.email}</p>
                    </td>
                    <td className="p-4 align-top">
                      <Link
                        href={`/admin/orders/${r.orderId}`}
                        className="text-[#246bfd] hover:underline"
                      >
                        #{r.orderId}
                      </Link>
                    </td>
                    <td className="p-4 align-top whitespace-nowrap">
                      <Stars rating={r.rating} />
                      <span className="ml-2 text-xs tabular-nums text-[#64748b]">{r.rating}/5</span>
                    </td>
                    <td className="max-w-md p-4 align-top text-[#475569]">
                      <p className="line-clamp-3 whitespace-pre-wrap">{r.body}</p>
                    </td>
                    <td className="p-4 align-top whitespace-nowrap text-[#64748b]">
                      {new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'short' }).format(
                        new Date(r.createdAt),
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {total > 0 && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-[#64748b]">
          <p>
            Showing {(page - 1) * limit + 1}–{Math.min(page * limit, total)} of {total}
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="rounded-admin border border-[#e5ebf5] bg-white px-3 py-1.5 text-sm font-medium hover:bg-[#f8fafc] disabled:opacity-50"
            >
              Previous
            </button>
            <span className="tabular-nums">
              Page {page} / {totalPages}
            </span>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="rounded-admin border border-[#e5ebf5] bg-white px-3 py-1.5 text-sm font-medium hover:bg-[#f8fafc] disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}

      <footer className="mt-12 flex items-center justify-between border-t border-[#e4eaf5] pt-4 text-sm text-[#8ea0bf]">
        <span>Thank you for creating with Dhidi | 2026 © ThemeWagon</span>
        <span>v1.0.0</span>
      </footer>
    </AdminPageShell>
  );
}
