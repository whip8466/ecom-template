'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AdminPageShell } from '@/components/admin-shell';
import { apiRequest } from '@/lib/api';
import { handleInvalidTokenIfNeeded } from '@/lib/invalidate-session';
import { useAuthStore } from '@/store/auth-store';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000';

type ReviewStatus = 'PENDING' | 'APPROVED';

type ReviewRow = {
  id: number;
  rating: number;
  body: string;
  status: ReviewStatus;
  createdAt: string;
  product: {
    id: number;
    name: string;
    slug: string;
    categoryName: string | null;
    imageUrl: string | null;
  };
  orderId: number;
  customer: { id: number; email: string; displayName: string; initial: string };
};

function StarRating({ rating }: { rating: number }) {
  const n = Math.max(1, Math.min(5, Math.round(rating)));
  return (
    <span className="inline-flex gap-px text-base leading-none" aria-hidden>
      {Array.from({ length: 5 }).map((_, i) => (
        <span key={i} className={i < n ? 'text-[#f97316]' : 'text-[#d1d5db]'}>
          ★
        </span>
      ))}
    </span>
  );
}

function formatRelativeTime(iso: string) {
  const d = new Date(iso);
  const diffMs = Date.now() - d.getTime();
  const sec = Math.floor(diffMs / 1000);
  if (sec < 45) return 'Just now';
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min} minute${min === 1 ? '' : 's'} ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} hour${hr === 1 ? '' : 's'} ago`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day} day${day === 1 ? '' : 's'} ago`;
  return new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'short' }).format(d);
}

function StatusBadge({ status }: { status: ReviewStatus }) {
  if (status === 'APPROVED') {
    return (
      <span className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide text-emerald-800">
        Approved
      </span>
    );
  }
  return (
    <span className="inline-flex rounded-full border border-orange-200 bg-orange-50 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide text-orange-800">
      Pending
    </span>
  );
}

export default function AdminProductReviewsPage() {
  const token = useAuthStore((s) => s.token);
  const [rows, setRows] = useState<ReviewRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [q, setQ] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved'>('all');
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [busy, setBusy] = useState(false);
  const headerCheckboxRef = useRef<HTMLInputElement>(null);

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
    if (statusFilter !== 'all') params.set('status', statusFilter);
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
  }, [token, page, limit, q, statusFilter]);

  useEffect(() => {
    void fetchReviews();
  }, [fetchReviews]);

  useEffect(() => {
    setSelected((prev) => new Set([...prev].filter((id) => rows.some((r) => r.id === id))));
  }, [rows]);

  const totalPages = Math.max(1, Math.ceil(total / limit));
  const from = total === 0 ? 0 : (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  const idsOnPage = useMemo(() => rows.map((r) => r.id), [rows]);
  const allSelected = idsOnPage.length > 0 && idsOnPage.every((id) => selected.has(id));
  const someSelected = idsOnPage.some((id) => selected.has(id));

  useEffect(() => {
    const el = headerCheckboxRef.current;
    if (el) el.indeterminate = !allSelected && someSelected;
  }, [allSelected, someSelected]);

  const selectedPending = useMemo(
    () => [...selected].filter((id) => rows.find((r) => r.id === id)?.status === 'PENDING'),
    [selected, rows],
  );

  function toggleAll() {
    if (allSelected) {
      setSelected((prev) => {
        const next = new Set(prev);
        idsOnPage.forEach((id) => next.delete(id));
        return next;
      });
    } else {
      setSelected((prev) => {
        const next = new Set(prev);
        idsOnPage.forEach((id) => next.add(id));
        return next;
      });
    }
  }

  function toggleOne(id: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function bulkApprove(ids: number[]) {
    if (!token || ids.length === 0) return;
    setBusy(true);
    setError('');
    try {
      await apiRequest<{ data: { updated: number } }>('/api/admin/product-reviews/bulk-approve', {
        method: 'POST',
        token,
        body: JSON.stringify({ ids }),
      });
      setSelected(new Set());
      await fetchReviews();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function bulkDelete(ids: number[]) {
    if (!token || ids.length === 0) return;
    if (!window.confirm(`Delete ${ids.length} review(s)? This cannot be undone.`)) return;
    setBusy(true);
    setError('');
    try {
      await apiRequest<{ data: { deleted: number } }>('/api/admin/product-reviews/bulk-delete', {
        method: 'POST',
        token,
        body: JSON.stringify({ ids }),
      });
      setSelected(new Set());
      await fetchReviews();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function deleteOne(id: number) {
    if (!token) return;
    if (!window.confirm('Delete this review?')) return;
    setBusy(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE}/api/admin/product-reviews/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        await handleInvalidTokenIfNeeded(res.status, data);
        throw new Error((data as { message?: string }).message || 'Delete failed');
      }
      setSelected((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      await fetchReviews();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

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
        Customer reviews from verified purchases. Approve reviews before they appear on the product page. Shoppers are
        not notified about moderation.
      </p>

      <form onSubmit={handleSearchSubmit} className="mt-6 flex flex-wrap items-center gap-3">
        <input
          type="search"
          placeholder="Search by product name"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="h-10 min-w-[220px] flex-1 max-w-md rounded-admin border border-[#e5ebf5] bg-white px-4 py-2 text-sm text-[#1c2740] placeholder:text-[#94a3b8] focus:border-[#246bfd] focus:outline-none"
        />
        <label className="flex items-center gap-2 text-sm text-[#475569]">
          <span className="whitespace-nowrap">Status</span>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as 'all' | 'pending' | 'approved');
              setPage(1);
            }}
            className="h-10 rounded-admin border border-[#e5ebf5] bg-white px-3 text-sm text-[#1c2740]"
          >
            <option value="all">All</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
          </select>
        </label>
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

      {selected.size > 0 && (
        <div className="mt-4 flex flex-wrap items-center gap-2 rounded-admin border border-[#e5ebf5] bg-[#f8fafc] px-4 py-3 text-sm">
          <span className="font-medium text-[#1c2740]">{selected.size} selected</span>
          <button
            type="button"
            disabled={busy || selectedPending.length === 0}
            onClick={() => void bulkApprove(selectedPending)}
            className="rounded-admin bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            Approve selected
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => void bulkDelete([...selected])}
            className="rounded-admin border border-red-200 bg-white px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"
          >
            Delete selected
          </button>
        </div>
      )}

      <div className="mt-6 overflow-hidden rounded-admin-card border border-[#e5ebf5] bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[960px] text-left text-sm">
            <thead>
              <tr className="border-b border-[#e5ebf5] bg-[#f8fafc] text-xs font-semibold uppercase tracking-wide text-[#64748b]">
                <th className="w-10 p-3">
                  <input
                    ref={headerCheckboxRef}
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleAll}
                    aria-label="Select all on this page"
                    className="h-4 w-4 rounded border-[#cbd5e1]"
                  />
                </th>
                <th className="p-3">Product</th>
                <th className="p-3">Customer</th>
                <th className="p-3">Rating</th>
                <th className="p-3">Review</th>
                <th className="p-3">Status</th>
                <th className="p-3">Time</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="p-10 text-center text-[#64748b]">
                    Loading…
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-10 text-center text-[#64748b]">
                    No reviews yet.
                  </td>
                </tr>
              ) : (
                rows.map((r) => (
                  <tr key={r.id} className="border-b border-[#f1f5f9] last:border-0">
                    <td className="p-3 align-middle">
                      <input
                        type="checkbox"
                        checked={selected.has(r.id)}
                        onChange={() => toggleOne(r.id)}
                        aria-label={`Select review ${r.id}`}
                        className="h-4 w-4 rounded border-[#cbd5e1]"
                      />
                    </td>
                    <td className="p-3 align-middle">
                      <div className="flex items-start gap-3">
                        <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded border border-[#e5ebf5] bg-[#f8fafc]">
                          {r.product.imageUrl ? (
                            <img
                              src={r.product.imageUrl}
                              alt=""
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <span className="flex h-full w-full items-center justify-center text-xs font-semibold text-[#94a3b8]">
                              {r.product.name.slice(0, 1).toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div className="min-w-0">
                          <Link
                            href={
                              r.product.slug
                                ? `/products/${encodeURIComponent(r.product.slug)}`
                                : `/admin/product/edit/${r.product.id}`
                            }
                            className="font-semibold text-[#1c2740] hover:text-[#246bfd]"
                          >
                            {r.product.name}
                          </Link>
                          {r.product.categoryName ? (
                            <p className="mt-0.5 text-xs text-[#94a3b8]">{r.product.categoryName}</p>
                          ) : null}
                        </div>
                      </div>
                    </td>
                    <td className="p-3 align-middle">
                      <div className="flex items-center gap-2">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#eef2ff] text-sm font-semibold text-[#4f46e5]">
                          {r.customer.initial}
                        </span>
                        <span className="font-medium text-[#1c2740]">{r.customer.displayName}</span>
                      </div>
                    </td>
                    <td className="p-3 align-middle whitespace-nowrap">
                      <StarRating rating={r.rating} />
                    </td>
                    <td className="max-w-xs p-3 align-middle text-[#475569]">
                      <p className="line-clamp-2">{r.body}</p>
                    </td>
                    <td className="p-3 align-middle whitespace-nowrap">
                      <StatusBadge status={r.status} />
                    </td>
                    <td className="p-3 align-middle whitespace-nowrap text-[#64748b]">
                      {formatRelativeTime(r.createdAt)}
                    </td>
                    <td className="p-3 align-middle text-right">
                      <div className="flex flex-wrap justify-end gap-2">
                        {r.status === 'PENDING' ? (
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => void bulkApprove([r.id])}
                            className="rounded-admin border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-800 hover:bg-emerald-100 disabled:opacity-50"
                          >
                            Approve
                          </button>
                        ) : null}
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => void deleteOne(r.id)}
                          className="rounded-admin border border-red-200 px-2 py-1 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"
                        >
                          Delete
                        </button>
                      </div>
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
            {from} to {to} of {total} items
          </p>
          <div className="flex flex-wrap items-center gap-3">
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
    </AdminPageShell>
  );
}
