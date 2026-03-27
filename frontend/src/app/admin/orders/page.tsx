'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { AdminPageShell } from '@/components/admin-shell';
import { useAuthStore } from '@/store/auth-store';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000';

type OrderRow = {
  id: number;
  totalAmountCents: number;
  status: string;
  paymentStatus: string;
  createdAt: string;
  itemCount: number;
  user: { id: number; name: string; email: string } | null;
  address: { id: number; city: string; state: string; country: string } | null;
};

type TabCounts = {
  all: number;
  pendingPayment: number;
  unfulfilled: number;
  completed: number;
  failed: number;
  cancelled: number;
  shipped: number;
};

type ViewId =
  | 'all'
  | 'pending_payment'
  | 'unfulfilled'
  | 'shipped'
  | 'completed'
  | 'failed'
  | 'cancelled';

const TABS: { id: ViewId; label: string; countKey: keyof TabCounts }[] = [
  { id: 'all', label: 'All', countKey: 'all' },
  { id: 'pending_payment', label: 'Pending payment', countKey: 'pendingPayment' },
  { id: 'unfulfilled', label: 'Unfulfilled', countKey: 'unfulfilled' },
  { id: 'shipped', label: 'Shipped', countKey: 'shipped' },
  { id: 'completed', label: 'Completed', countKey: 'completed' },
  { id: 'failed', label: 'Failed', countKey: 'failed' },
  { id: 'cancelled', label: 'Cancelled', countKey: 'cancelled' },
];

function formatMoney(cents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

function formatOrderDate(iso: string): string {
  const d = new Date(iso);
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(d);
}

function customerInitials(name: string | undefined | null): string {
  const n = (name ?? '').trim();
  if (!n) return '?';
  const parts = n.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

function paymentBadgeClass(paymentStatus: string): string {
  switch (paymentStatus) {
    case 'PAID':
      return 'bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200';
    case 'PENDING':
      return 'bg-amber-50 text-amber-800 ring-1 ring-amber-200';
    case 'FAILED':
      return 'bg-red-50 text-red-800 ring-1 ring-red-200';
    default:
      return 'bg-slate-100 text-slate-700 ring-1 ring-slate-200';
  }
}

function fulfillmentLabel(status: string): string {
  switch (status) {
    case 'DELIVERED':
      return 'COMPLETED';
    case 'SHIPPED':
      return 'SHIPPED';
    case 'CANCELLED':
      return 'CANCELLED';
    case 'PENDING':
    case 'CONFIRMED':
    case 'PROCESSING':
      return 'UNFULFILLED';
    default:
      return status;
  }
}

function fulfillmentBadgeClass(status: string): string {
  switch (status) {
    case 'DELIVERED':
      return 'bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200';
    case 'SHIPPED':
      return 'bg-sky-50 text-sky-800 ring-1 ring-sky-200';
    case 'CANCELLED':
      return 'bg-slate-100 text-slate-600 ring-1 ring-slate-200';
    case 'PENDING':
    case 'CONFIRMED':
    case 'PROCESSING':
      return 'bg-rose-50 text-rose-800 ring-1 ring-rose-200';
    default:
      return 'bg-slate-100 text-slate-700 ring-1 ring-slate-200';
  }
}

function deliveryTypeLabel(): string {
  return 'Standard shipping';
}

export default function AdminOrdersPage() {
  const token = useAuthStore((s) => s.token);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [counts, setCounts] = useState<TabCounts | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<ViewId>('all');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('');
  const [fulfillmentStatus, setFulfillmentStatus] = useState('');
  const [listError, setListError] = useState('');

  const totalPages = Math.max(1, Math.ceil(total / limit));
  const startItem = total === 0 ? 0 : (page - 1) * limit + 1;
  const endItem = Math.min(page * limit, total);

  const fetchOrders = useCallback(async () => {
    if (!token) {
      setLoading(false);
      setOrders([]);
      setTotal(0);
      setCounts(null);
      return;
    }
    setLoading(true);
    setListError('');
    try {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', String(limit));
      params.set('view', view);
      if (search) params.set('q', search);
      if (paymentStatus) params.set('paymentStatus', paymentStatus);
      if (fulfillmentStatus) params.set('fulfillmentStatus', fulfillmentStatus);

      const res = await fetch(`${API_BASE}/api/admin/orders?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = (await res.json().catch(() => ({}))) as {
        data?: OrderRow[];
        pagination?: { total: number };
        counts?: TabCounts;
        message?: string;
      };
      if (!res.ok) {
        throw new Error(json.message || 'Failed to load orders');
      }
      setOrders(Array.isArray(json.data) ? json.data : []);
      setTotal(json.pagination?.total ?? 0);
      if (json.counts) setCounts(json.counts);
    } catch (e) {
      setListError((e as Error).message || 'Failed to load orders');
      setOrders([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [token, page, limit, view, search, paymentStatus, fulfillmentStatus]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput.trim());
    setPage(1);
  };

  const clearFilters = () => {
    setSearchInput('');
    setSearch('');
    setView('all');
    setPage(1);
  };

  return (
    <AdminPageShell
      breadcrumbs={[
        { label: 'Admin', href: '/admin' },
        { label: 'Orders' },
      ]}
      title="Orders"
      actions={
        <Link
          href="/admin/orders/new"
          className="inline-flex h-10 items-center gap-2 rounded-admin bg-[#246bfd] px-4 py-2 text-sm font-medium text-white hover:bg-[#1e5ae0]"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add order
        </Link>
      }
    >
      <div className="mt-2 flex flex-wrap gap-x-[1.333rem] gap-y-2 border-b border-[#e5ebf5] pb-1">
        {TABS.map((tab) => {
          const n = counts ? counts[tab.countKey] : '—';
          const active = view === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setView(tab.id);
                setPage(1);
              }}
              className={`whitespace-nowrap px-1 pb-3 text-sm font-medium transition ${
                active
                  ? 'border-b-2 border-[#246bfd] text-[#246bfd]'
                  : 'border-b-2 border-transparent text-[#64748b] hover:text-[#1c2740]'
              }`}
            >
              {tab.label} ({n})
            </button>
          );
        })}
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <form onSubmit={handleSearchSubmit} className="flex min-w-[200px] max-w-md flex-1">
          <input
            type="search"
            placeholder="Search orders (id, customer name or email)"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="h-10 w-full rounded-admin border border-[#e5ebf5] bg-white px-4 py-2 text-sm text-[#1c2740] placeholder:text-[#94a3b8] focus:border-[#246bfd] focus:outline-none"
          />
        </form>
        <select
          value={paymentStatus}
          onChange={(e) => {
            setPaymentStatus(e.target.value);
            setPage(1);
          }}
          className="h-10 min-w-[160px] rounded-admin border border-[#e5ebf5] bg-white px-4 py-2 text-sm text-[#1c2740] focus:border-[#246bfd] focus:outline-none"
          aria-label="Payment status"
        >
          <option value="">Payment status</option>
          <option value="PENDING">Pending</option>
          <option value="PAID">Paid</option>
          <option value="FAILED">Failed</option>
        </select>
        <select
          value={fulfillmentStatus}
          onChange={(e) => {
            setFulfillmentStatus(e.target.value);
            setPage(1);
          }}
          className="h-10 min-w-[180px] rounded-admin border border-[#e5ebf5] bg-white px-4 py-2 text-sm text-[#1c2740] focus:border-[#246bfd] focus:outline-none"
          aria-label="Fulfillment status"
        >
          <option value="">Fulfillment status</option>
          <option value="UNFULFILLED">Unfulfilled</option>
          <option value="SHIPPED">Shipped</option>
          <option value="COMPLETED">Completed</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
        <button
          type="button"
          onClick={clearFilters}
          className="h-10 rounded-admin border border-[#e5ebf5] bg-white px-4 py-2 text-sm font-medium text-[#475569] hover:bg-[#f8fafc]"
        >
          Clear filters
        </button>
        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            className="flex h-10 items-center gap-2 rounded-admin border border-[#e5ebf5] bg-white px-4 py-2 text-sm font-medium text-[#475569] hover:bg-[#f8fafc]"
            disabled
            title="Export coming soon"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Export
          </button>
        </div>
      </div>

      {!token ? (
        <div className="mt-6 rounded border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Sign in as an admin or manager to view orders.
        </div>
      ) : null}

      {listError ? (
        <div className="mt-4 rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          {listError}
        </div>
      ) : null}

      <div className="mt-6 overflow-hidden rounded-admin border border-[#e5ebf5] bg-white">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#246bfd] border-t-transparent" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[960px] text-left text-sm">
              <thead>
                <tr className="border-b border-[#e5ebf5] bg-[#f8fafc] text-[#64748b]">
                  <th className="p-4 font-medium">Order</th>
                  <th className="p-4 font-medium">Total</th>
                  <th className="p-4 font-medium">Customer</th>
                  <th className="p-4 font-medium">Payment status</th>
                  <th className="p-4 font-medium">Fulfillment status</th>
                  <th className="p-4 font-medium">Delivery type</th>
                  <th className="p-4 font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-[#64748b]">
                      No orders found.
                    </td>
                  </tr>
                ) : (
                  orders.map((row) => (
                    <tr key={row.id} className="border-b border-[#e5ebf5] hover:bg-[#f9fbff]">
                      <td className="p-4">
                        <Link
                          href={`/admin/orders/${row.id}`}
                          className="font-medium text-[#246bfd] hover:underline"
                        >
                          #{row.id}
                        </Link>
                      </td>
                      <td className="p-4 font-medium text-[#1c2740]">{formatMoney(row.totalAmountCents)}</td>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#eef4ff] text-xs font-semibold text-[#246bfd]">
                            {customerInitials(row.user?.name)}
                          </span>
                          <span className="text-[#1c2740]">{row.user?.name ?? '—'}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <span
                          className={`inline-flex rounded px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${paymentBadgeClass(row.paymentStatus)}`}
                        >
                          {row.paymentStatus}
                        </span>
                      </td>
                      <td className="p-4">
                        <span
                          className={`inline-flex rounded px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${fulfillmentBadgeClass(row.status)}`}
                        >
                          {fulfillmentLabel(row.status)}
                        </span>
                      </td>
                      <td className="p-4 text-[#475569]">{deliveryTypeLabel()}</td>
                      <td className="p-4 text-[#64748b]">{formatOrderDate(row.createdAt)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
        <p className="text-sm text-[#64748b]">
          {startItem} to {endItem} items of {total}
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="rounded-admin border border-[#e5ebf5] bg-white p-2 text-[#475569] hover:bg-[#f8fafc] disabled:opacity-50 disabled:hover:bg-white"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            const p = totalPages <= 5 ? i + 1 : Math.max(1, Math.min(page - 2, totalPages - 4)) + i;
            return (
              <button
                key={p}
                type="button"
                onClick={() => setPage(p)}
                className={`h-9 min-w-9 rounded-admin px-2 text-sm font-medium ${
                  page === p ? 'bg-[#246bfd] text-white' : 'border border-[#e5ebf5] bg-white text-[#475569] hover:bg-[#f8fafc]'
                }`}
              >
                {p}
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="rounded-admin border border-[#e5ebf5] bg-white p-2 text-[#475569] hover:bg-[#f8fafc] disabled:opacity-50 disabled:hover:bg-white"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      <footer className="mt-12 flex items-center justify-between border-t border-[#e4eaf5] pt-4 text-sm text-[#8ea0bf]">
        <span>Thank you for creating with Phoenix Tailwind | 2026 © ThemeWagon</span>
        <span>v1.0.0</span>
      </footer>
    </AdminPageShell>
  );
}
