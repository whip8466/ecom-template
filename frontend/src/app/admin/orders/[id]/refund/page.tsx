'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { AdminPageShell } from '@/components/admin-shell';
import { useAuthStore } from '@/store/auth-store';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000';

type OrderItem = {
  id: number;
  productId: number;
  productNameSnapshot: string;
  productPriceSnapshotCents: number;
  colorName: string | null;
  quantity: number;
  subtotalCents: number;
  productSlug: string | null;
  productImageUrl: string | null;
};

type OrderDetail = {
  id: number;
  totalAmountCents: number;
  status: string;
  paymentStatus: string;
  createdAt: string;
  user: { id: number; name: string; email: string; phone: string | null } | null;
  items: OrderItem[];
};

function formatMoney(cents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(cents / 100);
}

function formatMoneyWhole(cents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

function parseMoneyInput(value: string): number | null {
  const t = value.trim().replace(/[$,]/g, '');
  if (t === '') return null;
  const n = Number.parseFloat(t);
  if (Number.isNaN(n) || n < 0) return null;
  return Math.round(n * 100);
}

function SortArrows() {
  return (
    <span className="ml-1 inline-flex flex-col text-[9px] leading-none text-[#cbd5e1]" aria-hidden>
      <span className="-mb-0.5">▲</span>
      <span>▼</span>
    </span>
  );
}

export default function AdminOrderRefundPage() {
  const params = useParams();
  const router = useRouter();
  const token = useAuthStore((s) => s.token);
  const id = Number(params.id);
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [amountInput, setAmountInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!token || !Number.isInteger(id) || id < 1) {
      setLoading(false);
      if (!token) setError('Sign in to view this page.');
      else setError('Invalid order.');
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError('');
    fetch(`${API_BASE}/api/admin/orders/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (res) => {
        const json = (await res.json().catch(() => ({}))) as { data?: OrderDetail; message?: string };
        if (!res.ok) throw new Error(json.message || 'Failed to load order');
        if (!cancelled) setOrder(json.data ?? null);
      })
      .catch((e) => {
        if (!cancelled) {
          setError((e as Error).message);
          setOrder(null);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [token, id]);

  useEffect(() => {
    if (!moreOpen) return;
    const close = (e: MouseEvent) => {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) setMoreOpen(false);
    };
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, [moreOpen]);

  const itemsSubtotalCents = order?.items.reduce((s, l) => s + l.subtotalCents, 0) ?? 0;
  const refundCents = parseMoneyInput(amountInput);
  const refundValid = refundCents != null && order != null && refundCents > 0 && refundCents <= order.totalAmountCents;

  const handleRefundSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!refundValid || !order) return;
    setSubmitting(true);
    window.setTimeout(() => {
      setSubmitting(false);
      window.alert(
        `Refund of ${formatMoney(refundCents)} would be processed here. Connect a payment/refund API to complete this action.`
      );
    }, 400);
  };

  if (loading) {
    return (
      <AdminPageShell
        breadcrumbs={[
          { label: 'Admin', href: '/admin' },
          { label: 'Orders', href: '/admin/orders' },
          { label: `#${id}`, href: `/admin/orders/${id}` },
          { label: 'Refund' },
        ]}
        title="Refund"
      >
        <div className="flex items-center justify-center py-24">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#246bfd] border-t-transparent" />
        </div>
      </AdminPageShell>
    );
  }

  if (error || !order) {
    return (
      <AdminPageShell
        breadcrumbs={[
          { label: 'Admin', href: '/admin' },
          { label: 'Orders', href: '/admin/orders' },
        ]}
        title="Refund"
      >
        <div className="rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error || 'Order not found.'}</div>
        <button type="button" onClick={() => router.push('/admin/orders')} className="mt-4 text-sm font-medium text-[#246bfd] hover:underline">
          ← Back to orders
        </button>
      </AdminPageShell>
    );
  }

  const actions = (
    <div className="relative" ref={moreRef}>
      <button
        type="button"
        onClick={() => setMoreOpen((o) => !o)}
        className="inline-flex h-9 items-center gap-1 rounded-admin border border-[#e5ebf5] bg-white px-3 text-sm font-medium text-[#475569] hover:bg-[#f8fafc]"
      >
        More actions
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {moreOpen ? (
        <div
          role="menu"
          className="absolute right-0 z-20 mt-1 min-w-[200px] rounded-admin border border-[#e5ebf5] bg-white py-1 shadow-lg"
        >
          <Link
            href={`/admin/orders/${order.id}`}
            className="block px-3 py-2 text-sm text-[#1c2740] hover:bg-[#f8fafc]"
            onClick={() => setMoreOpen(false)}
          >
            View order
          </Link>
          <Link href="/admin/orders" className="block px-3 py-2 text-sm text-[#1c2740] hover:bg-[#f8fafc]" onClick={() => setMoreOpen(false)}>
            Back to order list
          </Link>
        </div>
      ) : null}
    </div>
  );

  return (
    <AdminPageShell
      breadcrumbs={[
        { label: 'Admin', href: '/admin' },
        { label: 'Orders', href: '/admin/orders' },
        { label: `Order #${order.id}`, href: `/admin/orders/${order.id}` },
        { label: 'Refund' },
      ]}
      title="Refund"
      description={
        <span className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-[#60759b]">
          <span>
            Order:{' '}
            <Link href={`/admin/orders/${order.id}`} className="font-medium text-[#246bfd] hover:underline">
              #{order.id}
            </Link>
          </span>
          {order.user ? (
            <span>
              Customer ID:{' '}
              <span className="font-medium text-[#246bfd]">#{order.user.id}</span>
            </span>
          ) : null}
        </span>
      }
      actions={actions}
    >
      <div className="grid gap-6 lg:grid-cols-3 lg:items-start">
        <div className="lg:col-span-2">
          <div className="overflow-hidden rounded-admin border border-[#e5ebf5] bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead>
                  <tr className="border-b border-[#e5ebf5] bg-[#f8fafc] text-xs font-semibold uppercase tracking-wide text-[#64748b]">
                    <th className="p-4 font-medium">
                      <span className="inline-flex items-center gap-1">
                        Products
                        <SortArrows />
                      </span>
                    </th>
                    <th className="p-4 font-medium">
                      <span className="inline-flex items-center gap-1">
                        Color
                        <SortArrows />
                      </span>
                    </th>
                    <th className="p-4 font-medium">
                      <span className="inline-flex items-center gap-1">
                        Size
                        <SortArrows />
                      </span>
                    </th>
                    <th className="p-4 text-right font-medium">
                      <span className="inline-flex w-full items-center justify-end gap-1">
                        Price
                        <SortArrows />
                      </span>
                    </th>
                    <th className="p-4 text-right font-medium">
                      <span className="inline-flex w-full items-center justify-end gap-1">
                        Quantity
                        <SortArrows />
                      </span>
                    </th>
                    <th className="p-4 text-right font-medium">
                      <span className="inline-flex w-full items-center justify-end gap-1">
                        Total
                        <SortArrows />
                      </span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {order.items.map((line) => {
                    const href = line.productSlug ? `/products/${encodeURIComponent(line.productSlug)}` : null;
                    return (
                      <tr key={line.id} className="border-b border-[#e5ebf5] last:border-0">
                        <td className="p-4">
                          <div className="flex max-w-[min(100%,280px)] items-start gap-3">
                            <div className="h-12 w-12 shrink-0 overflow-hidden rounded border border-[#e5ebf5] bg-[#f1f5f9]">
                              {line.productImageUrl ? (
                                <img src={line.productImageUrl} alt="" className="h-full w-full object-cover" />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center text-[#94a3b8]">
                                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14" />
                                  </svg>
                                </div>
                              )}
                            </div>
                            <div className="min-w-0 pt-0.5">
                              {href ? (
                                <Link href={href} className="line-clamp-2 font-medium text-[#246bfd] hover:underline">
                                  {line.productNameSnapshot}
                                </Link>
                              ) : (
                                <span className="line-clamp-2 font-medium text-[#1c2740]">{line.productNameSnapshot}</span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="p-4 align-top text-[#475569]">{line.colorName ?? '—'}</td>
                        <td className="p-4 align-top text-[#475569]">—</td>
                        <td className="p-4 align-top text-right tabular-nums text-[#475569]">
                          {formatMoneyWhole(line.productPriceSnapshotCents)}
                        </td>
                        <td className="p-4 align-top text-right tabular-nums text-[#475569]">{line.quantity}</td>
                        <td className="p-4 align-top text-right font-medium tabular-nums text-[#1c2740]">
                          {formatMoneyWhole(line.subtotalCents)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="border-t border-[#e5ebf5] bg-white">
                    <td colSpan={5} className="p-4 text-right text-sm font-semibold text-[#1c2740]">
                      Items subtotal:
                    </td>
                    <td className="p-4 text-right text-base font-bold tabular-nums text-[#1c2740]">
                      {formatMoneyWhole(itemsSubtotalCents)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-admin border border-[#e5ebf5] bg-white p-5 shadow-sm">
            <h2 className="text-base font-semibold text-[#1c2740]">Summary</h2>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="text-[#64748b]">Items subtotal</dt>
                <dd className="tabular-nums text-[#1c2740]">{formatMoney(itemsSubtotalCents)}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-[#64748b]">Discount</dt>
                <dd className="tabular-nums text-[#94a3b8]">—</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-[#64748b]">Tax</dt>
                <dd className="tabular-nums text-[#94a3b8]">—</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-[#64748b]">Subtotal</dt>
                <dd className="tabular-nums text-[#1c2740]">{formatMoney(itemsSubtotalCents)}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-[#64748b]">Shipping cost</dt>
                <dd className="tabular-nums text-[#94a3b8]">—</dd>
              </div>
              <div className="border-t border-[#e5ebf5] pt-3">
                <div className="flex justify-between gap-3">
                  <dt className="text-base font-semibold text-[#1c2740]">Total</dt>
                  <dd className="text-base font-bold tabular-nums text-[#1c2740]">{formatMoney(order.totalAmountCents)}</dd>
                </div>
              </div>
            </dl>
          </div>

          <div className="rounded-admin border border-[#e5ebf5] bg-white p-5 shadow-sm">
            <h2 className="text-base font-semibold text-[#1c2740]">Refund amount</h2>
            <form onSubmit={handleRefundSubmit} className="mt-4 space-y-4">
              <div>
                <label htmlFor="refund-amount" className="sr-only">
                  Refund amount
                </label>
                <input
                  id="refund-amount"
                  type="text"
                  inputMode="decimal"
                  placeholder="Amount"
                  value={amountInput}
                  onChange={(e) => setAmountInput(e.target.value)}
                  className="w-full rounded-admin border border-[#e5ebf5] bg-white px-3 py-2.5 text-sm text-[#1c2740] placeholder:text-[#94a3b8] focus:border-[#246bfd] focus:outline-none focus:ring-1 focus:ring-[#246bfd]"
                />
                <p className="mt-1.5 text-xs text-[#64748b]">
                  Max {formatMoney(order.totalAmountCents)} (order total). Decimals allowed.
                </p>
              </div>
              <button
                type="submit"
                disabled={!refundValid || submitting}
                className="w-full rounded-admin bg-[#246bfd] py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#1e5ae0] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {refundValid && refundCents != null ? `Refund ${formatMoney(refundCents)}` : 'Refund'}
              </button>
            </form>
          </div>
        </div>
      </div>

      <footer className="mt-12 flex flex-col gap-2 border-t border-[#e4eaf5] pt-4 text-sm text-[#8ea0bf] sm:flex-row sm:items-center sm:justify-between">
        <span>Thank you for creating with Phoenix Tailwind | 2026 © ThemeWagon</span>
        <span>v1.0.0</span>
      </footer>
    </AdminPageShell>
  );
}
