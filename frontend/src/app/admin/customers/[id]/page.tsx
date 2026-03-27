'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { AdminPageShell } from '@/components/admin-shell';
import { handleInvalidTokenIfNeeded } from '@/lib/invalidate-session';
import { useAuthStore } from '@/store/auth-store';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000';

const P = { border: '#e3e6ed', muted: '#6e7891', text: '#31374a', primary: '#3874ff' };

type AddressDto = {
  id: number;
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  state: string;
  postalCode: string;
  country: string;
};

type OrderRow = {
  id: number;
  totalAmountCents: number;
  paymentStatus: string;
  status: string;
  createdAt: string;
  deliveryType: string;
  fulfillmentLabel: string;
};

type CustomerDetail = {
  customer: {
    id: number;
    name: string;
    email: string;
    phone: string | null;
    createdAt: string;
    updatedAt: string;
    isActive: boolean;
    stats: { following: number; projects: number; completion: number };
  };
  defaultAddress: AddressDto | null;
  orders: OrderRow[];
  orderTotal: number;
  notes: Note[];
  wishlist: unknown[];
  reviews: unknown[];
};

type Note = { id: number; body: string; createdAt: string };

function formatMoney(cents: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100);
}

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(iso));
}

function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }).format(new Date(iso));
}

function joinedLabel(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const months = ms / (30.44 * 24 * 60 * 60 * 1000);
  if (months < 1) return 'Joined recently';
  if (months < 12) return `Joined ${Math.floor(months)} months ago`;
  const y = Math.floor(months / 12);
  return y === 1 ? 'Joined 1 year ago' : `Joined ${y} years ago`;
}

function initials(name: string): string {
  const p = name.trim().split(/\s+/).filter(Boolean);
  if (!p.length) return '?';
  if (p.length === 1) return p[0].slice(0, 2).toUpperCase();
  return `${p[0][0]}${p[p.length - 1][0]}`.toUpperCase();
}

function paymentBadgeClass(s: string): string {
  switch (s) {
    case 'PAID':
      return 'bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200';
    case 'PENDING':
      return 'bg-amber-50 text-amber-800 ring-1 ring-amber-200';
    case 'FAILED':
      return 'bg-red-50 text-red-800 ring-1 ring-red-200';
    case 'CANCELLED':
      return 'bg-slate-100 text-slate-600 ring-1 ring-slate-200';
    default:
      return 'bg-slate-100 text-slate-700 ring-1 ring-slate-200';
  }
}

function fulfillmentBadgeClass(label: string): string {
  const u = label.toUpperCase();
  if (u.includes('FULFILLED') || u.includes('DELIVERED')) return 'bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200';
  if (u.includes('PICKUP') || u.includes('SHIP')) return 'bg-sky-50 text-sky-800 ring-1 ring-sky-200';
  if (u.includes('PARTIAL')) return 'bg-amber-50 text-amber-800 ring-1 ring-amber-200';
  if (u.includes('CANCEL')) return 'bg-red-50 text-red-800 ring-1 ring-red-200';
  if (u.includes('UNFULFILLED')) return 'bg-rose-50 text-rose-800 ring-1 ring-rose-200';
  return 'bg-slate-100 text-slate-700 ring-1 ring-slate-200';
}

export default function CustomerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = String(params.id ?? '');
  const token = useAuthStore((s) => s.token);

  const [data, setData] = useState<CustomerDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [noteDraft, setNoteDraft] = useState('');
  const [notes, setNotes] = useState<Note[]>([]);
  const [resetMsg, setResetMsg] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const load = useCallback(async () => {
    if (!token || !id) {
      setData(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/admin/customers/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (!res.ok) {
        await handleInvalidTokenIfNeeded(res.status, json);
        throw new Error((json as { message?: string }).message || 'Failed to load');
      }
      const detail = json as CustomerDetail;
      setData(detail);
      setNotes(Array.isArray(detail.notes) ? detail.notes : []);
    } catch (e) {
      setError((e as Error).message);
      setData(null);
      setNotes([]);
    } finally {
      setLoading(false);
    }
  }, [token, id]);

  useEffect(() => {
    load();
  }, [load]);

  const addNote = async () => {
    const t = noteDraft.trim();
    if (!t || !token) return;
    setActionLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/admin/customers/${id}/notes`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ body: t }),
      });
      const j = await res.json();
      if (!res.ok) {
        await handleInvalidTokenIfNeeded(res.status, j);
        throw new Error((j as { message?: string }).message || 'Failed to save note');
      }
      const note = (j as { note: Note }).note;
      setNotes((prev) => [note, ...prev]);
      setNoteDraft('');
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setActionLoading(false);
    }
  };

  const deleteCustomer = async () => {
    if (!token || !data) return;
    if (!window.confirm(`Deactivate customer “${data.customer.name}”? They will not be able to sign in.`)) return;
    setActionLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/admin/customers/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        await handleInvalidTokenIfNeeded(res.status, j);
        throw new Error((j as { message?: string }).message || 'Delete failed');
      }
      router.push('/admin/customers');
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setActionLoading(false);
    }
  };

  const resetPassword = async () => {
    if (!token) return;
    setActionLoading(true);
    setResetMsg(null);
    try {
      const res = await fetch(`${API_BASE}/api/admin/customers/${id}/reset-password`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const j = await res.json();
      if (!res.ok) {
        await handleInvalidTokenIfNeeded(res.status, j);
        throw new Error((j as { message?: string }).message || 'Reset failed');
      }
      setResetMsg(`Temporary password: ${(j as { temporaryPassword: string }).temporaryPassword}`);
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-[#6e7891]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#3874ff] border-t-transparent" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="mx-auto max-w-lg rounded-admin border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
        {error || 'Customer not found.'}{' '}
        <Link href="/admin/customers" className="font-medium text-[#3874ff] underline">
          Back to Customers
        </Link>
      </div>
    );
  }

  const { customer, defaultAddress, orders, orderTotal } = data;
  const addrLine = defaultAddress
    ? [defaultAddress.addressLine1, defaultAddress.addressLine2, `${defaultAddress.city}, ${defaultAddress.state} ${defaultAddress.postalCode}`, defaultAddress.country]
        .filter(Boolean)
        .join('\n')
    : 'No address on file.';

  return (
    <AdminPageShell
      breadcrumbs={[
        { label: 'Page 1', href: '/admin' },
        { label: 'Page 2', href: '/admin/customers' },
        { label: 'Default' },
      ]}
      title="Customer details"
      description={<span className="text-[#9aa3b8]">Profile, orders, and notes</span>}
      actions={
        <>
          <button
            type="button"
            onClick={deleteCustomer}
            disabled={actionLoading}
            className="inline-flex items-center gap-2 rounded-admin border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
          >
            Delete customer
          </button>
          <button
            type="button"
            onClick={resetPassword}
            disabled={actionLoading}
            className="inline-flex items-center gap-2 rounded-admin border border-[#31374a] bg-white px-4 py-2 text-sm font-medium text-[#31374a] hover:bg-[#f5f7fa] disabled:opacity-50"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
            Reset password
          </button>
        </>
      }
      className="mx-auto max-w-[1400px]"
    >
      {resetMsg && (
        <div className="mb-4 rounded-admin border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900" role="status">
          {resetMsg}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left column */}
        <div className="space-y-6 lg:col-span-4">
          <div className="rounded-admin-card border bg-white p-6 shadow-[0_1px_2px_rgba(15,23,42,0.04)]" style={{ borderColor: P.border }}>
            <div className="flex flex-col items-center text-center">
              <div className="flex h-28 w-28 items-center justify-center rounded-full bg-[#edf5ff] text-3xl font-semibold text-[#3874ff]">
                {initials(customer.name)}
              </div>
              <h2 className="mt-4 text-lg font-bold text-[#31374a]">{customer.name}</h2>
              <p className="mt-1 text-sm text-[#6e7891]">{joinedLabel(customer.createdAt)}</p>
              <div className="mt-3 flex gap-3 text-[#c5cad3]" aria-hidden>
                <span title="LinkedIn (placeholder)">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                  </svg>
                </span>
                <span title="X (placeholder)">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                </span>
              </div>
            </div>
            <div className="mt-6 grid grid-cols-3 gap-2 border-t border-[#e3e6ed] pt-6 text-center text-sm">
              <div>
                <p className="font-semibold text-[#31374a]">{customer.stats.following}</p>
                <p className="text-xs text-[#9aa3b8]">Following</p>
              </div>
              <div>
                <p className="font-semibold text-[#31374a]">{customer.stats.projects}</p>
                <p className="text-xs text-[#9aa3b8]">Projects</p>
              </div>
              <div>
                <p className="font-semibold text-[#31374a]">{customer.stats.completion}%</p>
                <p className="text-xs text-[#9aa3b8]">Completion</p>
              </div>
            </div>
          </div>

          <div className="rounded-admin-card border bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]" style={{ borderColor: P.border }}>
            <div className="flex items-center justify-between border-b border-[#e3e6ed] pb-3">
              <h3 className="font-semibold text-[#31374a]">Default Address</h3>
              <button type="button" className="text-[#9aa3b8] hover:text-[#3874ff]" aria-label="Edit address">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </button>
            </div>
            <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-[#4f607f]">{addrLine}</p>
            {defaultAddress && (
              <>
                <a href={`mailto:${customer.email}`} className="mt-2 inline-block text-sm font-medium text-[#3874ff] hover:underline">
                  {customer.email}
                </a>
                <p className="mt-1 text-sm text-[#4f607f]">{defaultAddress.phone}</p>
              </>
            )}
            {!defaultAddress && (
              <a href={`mailto:${customer.email}`} className="mt-2 inline-block text-sm font-medium text-[#3874ff] hover:underline">
                {customer.email}
              </a>
            )}
          </div>

          <div className="rounded-admin-card border bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]" style={{ borderColor: P.border }}>
            <h3 className="font-semibold text-[#31374a]">Notes on customer</h3>
            <textarea
              value={noteDraft}
              onChange={(e) => setNoteDraft(e.target.value)}
              rows={4}
              placeholder="Write a note…"
              className="mt-3 w-full resize-y rounded-admin border border-[#e3e6ed] bg-[#f5f7fa] px-3 py-2 text-sm text-[#31374a] placeholder:text-[#9aa3b8] focus:border-[#85a9ff] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#85a9ff]"
            />
            <button
              type="button"
              onClick={addNote}
              disabled={actionLoading}
              className="mt-3 w-full rounded-admin bg-[#3874ff] py-2.5 text-sm font-medium text-white hover:bg-[#2d62e0] disabled:opacity-50"
            >
              Add Note
            </button>
            <ul className="mt-6 space-y-4 border-t border-[#e3e6ed] pt-6">
              {notes.length === 0 ? (
                <li className="text-sm text-[#9aa3b8]">No notes yet.</li>
              ) : (
                notes.map((n) => (
                  <li
                    key={n.id}
                    className="relative pl-4 text-sm text-[#4f607f] before:absolute before:left-0 before:top-1.5 before:h-2 before:w-2 before:bg-[#3874ff]"
                  >
                    <span>{n.body}</span>
                    <span className="mt-1 block text-xs text-[#9aa3b8]">— {formatDate(n.createdAt)}</span>
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-8 lg:col-span-8">
          <section>
            <h3 className="mb-4 text-base font-bold text-[#31374a]">
              Orders ({orderTotal})
            </h3>
            <div className="overflow-hidden rounded-admin-card border bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]" style={{ borderColor: P.border }}>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] text-sm">
                  <thead>
                    <tr className="border-b bg-[#f9fafb] text-left text-xs font-semibold uppercase tracking-wide text-[#9aa3b8]">
                      <th className="p-3">Order #</th>
                      <th className="p-3">Total</th>
                      <th className="p-3">Payment</th>
                      <th className="p-3">Fulfilment</th>
                      <th className="p-3">Delivery</th>
                      <th className="p-3">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-[#6e7891]">
                          No orders yet.
                        </td>
                      </tr>
                    ) : (
                      orders.map((o) => (
                        <tr key={o.id} className="border-b border-[#e3e6ed] last:border-0">
                          <td className="p-3">
                            <Link href={`/admin/orders/${o.id}`} className="font-medium text-[#3874ff] hover:underline">
                              #{o.id}
                            </Link>
                          </td>
                          <td className="p-3 tabular-nums text-[#31374a]">{formatMoney(o.totalAmountCents)}</td>
                          <td className="p-3">
                            <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase ${paymentBadgeClass(o.paymentStatus)}`}>
                              {o.paymentStatus}
                            </span>
                          </td>
                          <td className="p-3">
                            <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase ${fulfillmentBadgeClass(o.fulfillmentLabel)}`}>
                              {o.fulfillmentLabel}
                            </span>
                          </td>
                          <td className="p-3 text-[#4f607f]">{o.deliveryType}</td>
                          <td className="p-3 whitespace-nowrap text-[#6e7891]">{formatDateTime(o.createdAt)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          <section>
            <h3 className="mb-4 text-base font-bold text-[#31374a]">Wishlist (0)</h3>
            <div className="overflow-hidden rounded-admin-card border bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]" style={{ borderColor: P.border }}>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[600px] text-sm">
                  <thead>
                    <tr className="border-b bg-[#f9fafb] text-left text-xs font-semibold uppercase tracking-wide text-[#9aa3b8]">
                      <th className="p-3">Products</th>
                      <th className="p-3">Color</th>
                      <th className="p-3">Size</th>
                      <th className="p-3">Price</th>
                      <th className="p-3">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-[#6e7891]">
                        Wishlist is not available in this build.
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          <section>
            <h3 className="mb-4 text-base font-bold text-[#31374a]">Ratings &amp; reviews (0)</h3>
            <div className="overflow-hidden rounded-admin-card border bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]" style={{ borderColor: P.border }}>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[600px] text-sm">
                  <thead>
                    <tr className="border-b bg-[#f9fafb] text-left text-xs font-semibold uppercase tracking-wide text-[#9aa3b8]">
                      <th className="p-3">Product</th>
                      <th className="p-3">Rating</th>
                      <th className="p-3">Review</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-[#6e7891]">
                        Reviews are not available in this build.
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        </div>
      </div>

      <footer className="mt-12 flex flex-col gap-2 border-t border-[#e3e6ed] pt-6 text-sm text-[#9aa3b8] sm:flex-row sm:items-center sm:justify-between">
        <span>Thank you for creating with Phoenix Tailwind | 2026 © ThemeWagon</span>
        <span>v1.0.0</span>
      </footer>
    </AdminPageShell>
  );
}
