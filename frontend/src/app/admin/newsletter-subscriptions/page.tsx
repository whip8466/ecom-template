'use client';

import { useCallback, useEffect, useState } from 'react';
import { AdminPageShell } from '@/components/admin-shell';
import { apiRequest } from '@/lib/api';
import { useAuthStore } from '@/store/auth-store';

type Row = {
  id: number;
  email: string;
  source: string;
  createdAt: string;
};

type ApiResponse = {
  data: Row[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
};

const LIMIT = 50;

function formatDate(iso: string): string {
  const d = new Date(iso);
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(d);
}

export default function AdminNewsletterSubscriptionsPage() {
  const token = useAuthStore((s) => s.token);
  const [mounted, setMounted] = useState(false);
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState<Row[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: LIMIT, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const load = useCallback(async () => {
    if (!token) {
      setRows([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(LIMIT) });
      const res = await apiRequest<ApiResponse>(`/api/admin/newsletter-subscriptions?${params}`, { token });
      setRows(Array.isArray(res.data) ? res.data : []);
      setPagination(res.pagination);
    } catch (e) {
      setError((e as Error).message);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [token, page]);

  useEffect(() => {
    if (!mounted || !token) return;
    void load();
  }, [mounted, token, load]);

  const showSessionLoading = !mounted;

  return (
    <AdminPageShell
      breadcrumbs={[
        { label: 'Home', href: '/admin' },
        { label: 'Newsletter subscriptions' },
      ]}
      title="Newsletter subscriptions"
      description="Emails collected from the storefront footer signup form."
    >
      {showSessionLoading ? (
        <p className="text-sm text-[#64748b]">Loading…</p>
      ) : !token ? (
        <p className="text-sm text-[#64748b]">Sign in as admin to view newsletter signups.</p>
      ) : (
        <div className="space-y-4">
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          {loading && rows.length === 0 ? (
            <p className="text-xs text-[#60759b]">Loading…</p>
          ) : null}
          <div className="overflow-x-auto rounded-admin border border-[#e3e6ed] bg-white">
            <table className="min-w-full text-left text-sm text-[#31374a]">
              <thead className="border-b border-[#e3e6ed] bg-[#f9fafb] text-xs font-semibold uppercase tracking-wide text-[#6e7891]">
                <tr>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Page</th>
                  <th className="px-4 py-3">Subscribed</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 && !loading ? (
                  <tr>
                    <td colSpan={3} className="px-4 py-8 text-center text-[#6e7891]">
                      No subscriptions yet.
                    </td>
                  </tr>
                ) : (
                  rows.map((r) => (
                    <tr key={r.id} className="border-b border-[#f0f2f5] last:border-0">
                      <td className="px-4 py-3 font-medium">{r.email}</td>
                      <td className="px-4 py-3 text-[#6e7891]">{r.source}</td>
                      <td className="px-4 py-3 text-[#6e7891]">{formatDate(r.createdAt)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {pagination.totalPages > 1 ? (
            <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-[#6e7891]">
              <span>
                Page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={page <= 1 || loading}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="rounded-admin border border-[#e3e6ed] bg-white px-3 py-1.5 text-[#31374a] hover:bg-[#f9fafb] disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  type="button"
                  disabled={page >= pagination.totalPages || loading}
                  onClick={() => setPage((p) => p + 1)}
                  className="rounded-admin border border-[#e3e6ed] bg-white px-3 py-1.5 text-[#31374a] hover:bg-[#f9fafb] disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          ) : null}
        </div>
      )}
    </AdminPageShell>
  );
}
