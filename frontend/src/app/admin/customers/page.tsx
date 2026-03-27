'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { useAuthStore } from '@/store/auth-store';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000';

const P = {
  primary: '#3874ff',
  border: '#e3e6ed',
  text: '#31374a',
  muted: '#6e7891',
  muted2: '#9aa3b8',
  surface: '#f9fafb',
};

type ViewId = 'all' | 'new' | 'abandoned' | 'locals' | 'email_subscribers' | 'top_reviews';

type CustomerRow = {
  id: number;
  name: string;
  email: string;
  orderCount: number;
  totalSpentCents: number;
  city: string;
  lastSeenAt: string;
  lastOrderAt: string | null;
  createdAt: string;
};

type Counts = {
  all: number;
  new: number;
  abandoned: number;
  locals: number;
  email_subscribers: number;
  top_reviews: number;
};

const TABS: { id: ViewId; label: string; countKey: keyof Counts }[] = [
  { id: 'all', label: 'All', countKey: 'all' },
  { id: 'new', label: 'New', countKey: 'new' },
  { id: 'abandoned', label: 'Abandoned checkouts', countKey: 'abandoned' },
  { id: 'locals', label: 'Locals', countKey: 'locals' },
  { id: 'email_subscribers', label: 'Email subscribers', countKey: 'email_subscribers' },
  { id: 'top_reviews', label: 'Top reviews', countKey: 'top_reviews' },
];

function formatMoney(cents: number): string {
  const n = Math.round(cents / 100);
  return `$ ${n.toLocaleString('en-US')}`;
}

function formatOrderDate(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(d);
}

function relativeTime(iso: string): string {
  const d = new Date(iso).getTime();
  const sec = Math.floor((Date.now() - d) / 1000);
  if (sec < 60) return 'just now';
  if (sec < 3600) return `${Math.floor(sec / 60)} min ago`;
  if (sec < 86400) return `${Math.floor(sec / 3600)} hours ago`;
  if (sec < 604800) return `${Math.floor(sec / 86400)} days ago`;
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(new Date(iso));
}

function initials(name: string): string {
  const p = name.trim().split(/\s+/).filter(Boolean);
  if (p.length === 0) return '?';
  if (p.length === 1) return p[0].slice(0, 2).toUpperCase();
  return `${p[0][0]}${p[p.length - 1][0]}`.toUpperCase();
}

export default function AdminCustomersPage() {
  const token = useAuthStore((s) => s.token);
  const [view, setView] = useState<ViewId>('all');
  const [page, setPage] = useState(1);
  const [q, setQ] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [country, setCountry] = useState('');
  const [vip, setVip] = useState<'all' | '1'>('all');
  const [rows, setRows] = useState<CustomerRow[]>([]);
  const [counts, setCounts] = useState<Counts | null>(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setQ(searchInput), 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  const load = useCallback(async () => {
    if (!token) {
      setRows([]);
      setCounts(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    const params = new URLSearchParams({
      page: String(page),
      limit: '10',
      view,
      ...(q.trim() ? { q: q.trim() } : {}),
      ...(country.trim() ? { country: country.trim() } : {}),
      ...(vip !== 'all' ? { vip } : {}),
    });
    try {
      const res = await fetch(`${API_BASE}/api/admin/customers?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (!res.ok) {
        setError((json as { message?: string }).message || 'Failed to load customers');
        setRows([]);
        return;
      }
      const body = json as { data: CustomerRow[]; counts: Counts; pagination: typeof pagination };
      setRows(body.data);
      setCounts(body.counts);
      setPagination(body.pagination);
    } catch {
      setError('Network error');
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [token, page, view, q, country, vip]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    setPage(1);
  }, [view, q, country, vip]);

  const exportCsv = () => {
    const header = ['Customer', 'Email', 'Orders', 'Total spent', 'City', 'Last seen', 'Last order'];
    const lines = [
      header.join(','),
      ...rows.map((r) =>
        [
          `"${r.name.replace(/"/g, '""')}"`,
          r.email,
          r.orderCount,
          (r.totalSpentCents / 100).toFixed(2),
          `"${r.city}"`,
          r.lastSeenAt,
          r.lastOrderAt ?? '',
        ].join(',')
      ),
    ];
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'customers.csv';
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const from = pagination.total === 0 ? 0 : (pagination.page - 1) * pagination.limit + 1;
  const to = Math.min(pagination.page * pagination.limit, pagination.total);

  const pageWindow = (() => {
    const tp = pagination.totalPages;
    const p = pagination.page;
    if (tp <= 5) return Array.from({ length: tp }, (_, i) => i + 1);
    let start = Math.max(1, p - 2);
    let end = Math.min(tp, start + 4);
    if (end - start < 4) start = Math.max(1, end - 4);
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  })();

  return (
    <div className="relative mx-auto max-w-[1400px] pb-16 font-sans">
      {/* Breadcrumbs */}
      <nav className="mb-3 text-xs" style={{ color: P.muted2 }}>
        <Link href="/admin" className="hover:text-[#3874ff]">
          Page 1
        </Link>
        <span className="mx-1.5 opacity-60">
          &gt;
        </span>
        <Link href="/admin/orders" className="hover:text-[#3874ff]">
          Page 2
        </Link>
        <span className="mx-1.5 opacity-60">
          &gt;
        </span>
        <span className="text-[#31374a]">Default</span>
      </nav>

      <h1 className="text-[1.375rem] font-bold tracking-tight text-[#31374a]">Customers</h1>

      {/* Tabs */}
      <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 border-b" style={{ borderColor: P.border }}>
        {TABS.map((tab) => {
          const count = counts?.[tab.countKey] ?? 0;
          const active = view === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setView(tab.id)}
              className={`relative -mb-px pb-3 text-sm font-medium transition ${
                active ? 'text-[#3874ff]' : 'text-[#6e7891] hover:text-[#31374a]'
              }`}
            >
              {tab.label}{' '}
              <span className={active ? 'text-[#3874ff]' : 'text-[#9aa3b8]'}>({count.toLocaleString()})</span>
              {active && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#3874ff]" />}
            </button>
          );
        })}
      </div>

      {/* Toolbar */}
      <div className="mt-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[200px] flex-1 sm:max-w-xs">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#9aa3b8]">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </span>
            <input
              type="search"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search customers"
              className="h-10 w-full rounded-admin border bg-[#f5f7fa] py-2 pl-9 pr-3 text-sm outline-none focus:border-[#85a9ff] focus:bg-white focus:ring-1 focus:ring-[#85a9ff]"
              style={{ borderColor: P.border, color: P.text }}
            />
          </div>
          <select
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            className="h-10 rounded-admin border bg-white px-3 text-sm text-[#31374a]"
            style={{ borderColor: P.border }}
          >
            <option value="">Country</option>
            <option value="United States">United States</option>
            <option value="India">India</option>
            <option value="Hungary">Hungary</option>
            <option value="United Kingdom">United Kingdom</option>
          </select>
          <select
            value={vip}
            onChange={(e) => setVip(e.target.value as 'all' | '1')}
            className="h-10 rounded-admin border bg-white px-3 text-sm text-[#31374a]"
            style={{ borderColor: P.border }}
          >
            <option value="all">VIP</option>
            <option value="1">5+ orders</option>
          </select>
          <button
            type="button"
            className="h-10 rounded-admin border px-3 text-sm font-medium text-[#6e7891] hover:bg-[#f5f7fa]"
            style={{ borderColor: P.border }}
          >
            More filters
          </button>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={exportCsv}
            className="inline-flex h-10 items-center gap-2 rounded-admin border bg-white px-3 text-sm font-medium text-[#31374a] hover:bg-[#f5f7fa]"
            style={{ borderColor: P.border }}
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Export
          </button>
          <Link
            href="/admin/customers/new"
            className="inline-flex h-10 items-center gap-1.5 rounded-admin bg-[#3874ff] px-4 text-sm font-medium text-white shadow-sm hover:bg-[#2d62e0]"
          >
            <span className="text-lg leading-none">+</span> Add customer
          </Link>
        </div>
      </div>

      {/* Table */}
      <div
        className="mt-5 overflow-hidden rounded-admin-card border bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]"
        style={{ borderColor: P.border }}
      >
        {error && (
          <div className="border-b border-red-100 bg-red-50 px-4 py-2 text-sm text-red-800">{error}</div>
        )}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[960px] text-sm">
            <thead>
              <tr className="border-b bg-[#f9fafb] text-left text-xs font-semibold uppercase tracking-wide" style={{ borderColor: P.border, color: P.muted2 }}>
                <th className="w-10 p-3">
                  <input type="checkbox" className="rounded-admin" style={{ borderColor: P.border }} aria-label="Select all" />
                </th>
                <th className="p-3">
                  <span className="inline-flex items-center gap-1">
                    Customer
                    <SortChevron />
                  </span>
                </th>
                <th className="p-3">
                  <span className="inline-flex items-center gap-1">
                    Email
                    <SortChevron />
                  </span>
                </th>
                <th className="p-3">
                  <span className="inline-flex items-center gap-1">
                    Orders
                    <SortChevron />
                  </span>
                </th>
                <th className="p-3">
                  <span className="inline-flex items-center gap-1">
                    Total spent
                    <SortChevron />
                  </span>
                </th>
                <th className="p-3">
                  <span className="inline-flex items-center gap-1">
                    City
                    <SortChevron />
                  </span>
                </th>
                <th className="p-3">
                  <span className="inline-flex items-center gap-1">
                    Last seen
                    <SortChevron />
                  </span>
                </th>
                <th className="p-3">
                  <span className="inline-flex items-center gap-1">
                    Last order
                    <SortChevron />
                  </span>
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-[#6e7891]">
                    Loading…
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-[#6e7891]">
                    No customers found.
                  </td>
                </tr>
              ) : (
                rows.map((r, i) => (
                  <tr
                    key={r.id}
                    className="border-b transition hover:bg-[#fafcff]"
                    style={{ borderColor: P.border, backgroundColor: i % 2 === 1 ? '#fafbfc' : '#fff' }}
                  >
                    <td className="p-3">
                      <input type="checkbox" className="rounded-admin" style={{ borderColor: P.border }} aria-label={`Select ${r.name}`} />
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#edf5ff] text-xs font-semibold text-[#3874ff]">
                          {initials(r.name)}
                        </span>
                        <span className="font-medium text-[#31374a]">{r.name}</span>
                      </div>
                    </td>
                    <td className="p-3">
                      <a href={`mailto:${r.email}`} className="text-[#3874ff] hover:underline">
                        {r.email}
                      </a>
                    </td>
                    <td className="p-3 tabular-nums text-[#31374a]">{r.orderCount}</td>
                    <td className="p-3 tabular-nums text-[#31374a]">{formatMoney(r.totalSpentCents)}</td>
                    <td className="p-3 text-[#31374a]">{r.city}</td>
                    <td className="p-3 text-[#6e7891]">{relativeTime(r.lastSeenAt)}</td>
                    <td className="whitespace-nowrap p-3 text-[#6e7891]">{formatOrderDate(r.lastOrderAt)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t px-4 py-3 text-sm" style={{ borderColor: P.border, color: P.muted }}>
          <div className="flex flex-wrap items-center gap-2">
            <span>
              {from} to {to} items of {pagination.total.toLocaleString()}
            </span>
            <button type="button" className="font-medium text-[#3874ff] hover:underline">
              View all &gt;
            </button>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="rounded-admin border px-2 py-1 text-[#31374a] hover:bg-[#f5f7fa] disabled:opacity-40"
              style={{ borderColor: P.border }}
            >
              ‹
            </button>
            {pageWindow.map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => setPage(num)}
                className={`min-w-8 rounded-admin border px-2 py-1 text-sm ${
                  page === num ? 'border-[#3874ff] bg-[#edf5ff] font-semibold text-[#3874ff]' : 'border-[#e3e6ed] text-[#31374a] hover:bg-[#f5f7fa]'
                }`}
              >
                {num}
              </button>
            ))}
            <button
              type="button"
              disabled={page >= pagination.totalPages}
              onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
              className="rounded-admin border px-2 py-1 text-[#31374a] hover:bg-[#f5f7fa] disabled:opacity-40"
              style={{ borderColor: P.border }}
            >
              ›
            </button>
          </div>
        </div>
      </div>

      <footer className="mt-10 flex flex-col gap-2 border-t pt-6 text-sm sm:flex-row sm:items-center sm:justify-between" style={{ borderColor: P.border, color: P.muted2 }}>
        <span>Thank you for creating with Phoenix Tailwind | 2026 © ThemeWagon</span>
        <span>v1.0.0</span>
      </footer>

      {/* Floating UI (Phoenix reference) */}
      <div className="pointer-events-none fixed bottom-6 right-6 z-20 flex flex-col items-end gap-3">
        <div className="pointer-events-auto flex cursor-pointer items-center gap-2 rounded-l-admin border bg-white py-2 pl-2 pr-3 text-xs font-semibold uppercase tracking-wide text-[#6e7891] shadow-md" style={{ borderColor: P.border }}>
          <span className="rounded-admin bg-[#f5f7fa] p-1.5">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </span>
          Customize
        </div>
        <button
          type="button"
          className="pointer-events-auto flex items-center gap-2 rounded-full border bg-white py-2 pl-2 pr-4 text-sm font-medium text-[#31374a] shadow-lg"
          style={{ borderColor: P.border }}
        >
          <span className="relative flex h-9 w-9 items-center justify-center rounded-full bg-[#25c16f] text-white">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-[#25c16f]" />
          </span>
          Chat demo
        </button>
      </div>
    </div>
  );
}

function SortChevron() {
  return (
    <span className="inline-flex flex-col text-[#c5cad3]">
      <svg className="-mb-1 h-3 w-3" viewBox="0 0 12 12" fill="currentColor" aria-hidden>
        <path d="M6 3L10 7H2z" />
      </svg>
      <svg className="h-3 w-3 rotate-180" viewBox="0 0 12 12" fill="currentColor" aria-hidden>
        <path d="M6 3L10 7H2z" />
      </svg>
    </span>
  );
}
