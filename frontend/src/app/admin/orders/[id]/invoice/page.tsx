'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { AdminPageShell } from '@/components/admin-shell';
import { grandTotalInWords } from '@/lib/amount-in-words';
import { useAuthStore } from '@/store/auth-store';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000';

const STORE_NAME = process.env.NEXT_PUBLIC_STORE_NAME ?? 'PhoenixMart';
const STORE_ADDRESS = process.env.NEXT_PUBLIC_STORE_ADDRESS ?? '36 Greendown Road, California, USA';
const STORE_GST = process.env.NEXT_PUBLIC_STORE_GST ?? '—';
const STORE_PAN = process.env.NEXT_PUBLIC_STORE_PAN ?? '—';

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

type Address = {
  id: number;
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string | null;
  city: string;
  state: string;
  postalCode: string;
  country: string;
};

type OrderDetail = {
  id: number;
  totalAmountCents: number;
  status: string;
  paymentStatus: string;
  createdAt: string;
  user: { id: number; name: string; email: string; phone: string | null } | null;
  address: Address | null;
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

function formatInvoiceDate(iso: string): string {
  const d = new Date(iso);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}.${mm}.${yyyy}`;
}

function formatAddressBlock(addr: Address, email?: string | null, phone?: string | null): string {
  const parts = [
    addr.fullName,
    addr.addressLine1,
    addr.addressLine2?.trim() || null,
    `${addr.city}, ${addr.state} ${addr.postalCode}`,
    addr.country,
  ].filter(Boolean) as string[];
  const contact: string[] = [];
  if (email) contact.push(email);
  if (phone) contact.push(phone);
  return [...parts, ...contact].join(', ');
}

function buildInvoiceHtml(order: OrderDetail): string {
  const invNo = `INV-${String(order.id).padStart(6, '0')}`;
  const date = formatInvoiceDate(order.createdAt);
  const billing = order.address
    ? formatAddressBlock(order.address, order.user?.email ?? null, order.user?.phone ?? order.address.phone)
    : '';
  const rows = order.items
    .map(
      (line, i) => `
    <tr>
      <td>${i + 1}</td>
      <td>${escapeHtml(line.productNameSnapshot)}</td>
      <td>${escapeHtml(line.colorName ?? '—')}</td>
      <td>—</td>
      <td>${line.quantity}</td>
      <td>${formatMoneyWhole(line.productPriceSnapshotCents)}</td>
      <td>—</td>
      <td>—</td>
      <td>$0.00</td>
      <td>${formatMoneyWhole(line.subtotalCents)}</td>
    </tr>`
    )
    .join('');

  return `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>Invoice ${invNo}</title>
  <style>
    body{font-family:system-ui,sans-serif;padding:24px;color:#1c2740;max-width:960px;margin:0 auto}
    h1{font-size:1.5rem;margin:0 0 16px}
    table{width:100%;border-collapse:collapse;font-size:13px}
    th,td{border:1px solid #e5ebf5;padding:8px;text-align:left}
    th{background:#f1f5f9}
    .num{text-align:right}
    .total{font-weight:bold}
  </style></head><body>
  <h1>Invoice ${invNo}</h1>
  <p>Date: ${date} · Order #${order.id}</p>
  <p>Billing: ${escapeHtml(billing)}</p>
  <table>
    <thead><tr><th>SL</th><th>Products</th><th>Color</th><th>Size</th><th>Qty</th><th>Price</th><th>Tax %</th><th>Type</th><th>Tax</th><th>Total</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>
  <p class="total">Grand total: ${formatMoney(order.totalAmountCents)}</p>
  </body></html>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export default function AdminOrderInvoicePage() {
  const params = useParams();
  const router = useRouter();
  const token = useAuthStore((s) => s.token);
  const id = Number(params.id);
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const loadOrder = useCallback(async () => {
    if (!token || !Number.isInteger(id) || id < 1) return;
    const res = await fetch(`${API_BASE}/api/admin/orders/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const json = (await res.json().catch(() => ({}))) as { data?: OrderDetail; message?: string };
    if (!res.ok) throw new Error(json.message || 'Failed to load order');
    setOrder(json.data ?? null);
  }, [token, id]);

  useEffect(() => {
    document.body.setAttribute('data-invoice-print', '1');
    return () => document.body.removeAttribute('data-invoice-print');
  }, []);

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
    loadOrder()
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
  }, [token, id, loadOrder]);

  const itemsSubtotalCents = order?.items.reduce((s, l) => s + l.subtotalCents, 0) ?? 0;
  const shippingCents = 0;
  const discountCents = 0;
  const taxCents = 0;
  const invoiceNo = order ? `INV-${String(order.id).padStart(6, '0')}` : '';

  const handleDownload = () => {
    if (!order) return;
    const html = buildInvoiceHtml(order);
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `invoice-${order.id}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <AdminPageShell
        breadcrumbs={[
          { label: 'Admin', href: '/admin' },
          { label: 'Orders', href: '/admin/orders' },
          { label: `#${id}`, href: `/admin/orders/${id}` },
          { label: 'Invoice' },
        ]}
        title="Invoice"
      >
        <div className="flex items-center justify-center py-24">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#246bfd] border-t-transparent" />
        </div>
      </AdminPageShell>
    );
  }

  if (error || !order) {
    return (
      <AdminPageShell breadcrumbs={[{ label: 'Admin', href: '/admin' }, { label: 'Orders', href: '/admin/orders' }]} title="Invoice">
        <div className="rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error || 'Order not found.'}</div>
        <button type="button" onClick={() => router.push('/admin/orders')} className="mt-4 text-sm font-medium text-[#246bfd] hover:underline">
          ← Back to orders
        </button>
      </AdminPageShell>
    );
  }

  const actions = (
    <div className="flex flex-wrap items-center gap-2 print:hidden">
      <button
        type="button"
        onClick={handleDownload}
        className="inline-flex h-9 items-center gap-1.5 rounded-admin border border-[#e5ebf5] bg-white px-3 text-sm font-medium text-[#475569] hover:bg-[#f8fafc]"
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
        Download invoice
      </button>
      <button
        type="button"
        onClick={() => window.print()}
        className="inline-flex h-9 items-center gap-1.5 rounded-admin border border-[#e5ebf5] bg-white px-3 text-sm font-medium text-[#475569] hover:bg-[#f8fafc]"
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
          />
        </svg>
        Print
      </button>
    </div>
  );

  const billingText = order.address
    ? formatAddressBlock(order.address, order.user?.email ?? null, order.user?.phone ?? order.address.phone)
    : '—';

  return (
    <AdminPageShell
      breadcrumbs={[
        { label: 'Admin', href: '/admin' },
        { label: 'Orders', href: '/admin/orders' },
        { label: `Order #${order.id}`, href: `/admin/orders/${order.id}` },
        { label: 'Invoice' },
      ]}
      title="Invoice"
      actions={actions}
    >
      <div className="mx-auto max-w-5xl bg-white print:max-w-none">
        {/* Meta grid — Phoenix-style grey panel */}
        <div className="rounded-admin border border-[#e5ebf5] bg-[#f8fafc] p-4 sm:p-6">
          <div className="grid gap-8 text-sm text-[#475569] lg:grid-cols-3">
            <div className="space-y-3">
              <p>
                <span className="font-medium text-[#64748b]">Invoice No:</span>{' '}
                <span className="font-semibold text-[#1c2740]">{invoiceNo}</span>
              </p>
              <p>
                <span className="font-medium text-[#64748b]">Invoice date:</span>{' '}
                <span className="text-[#1c2740]">{formatInvoiceDate(order.createdAt)}</span>
              </p>
            </div>
            <div className="space-y-3">
              <p>
                <span className="font-medium text-[#64748b]">Sold by:</span>{' '}
                <span className="text-[#1c2740]">
                  {STORE_NAME}, {STORE_ADDRESS}
                </span>
              </p>
              <p>
                <span className="font-medium text-[#64748b]">GST reg no:</span>{' '}
                <span className="text-[#1c2740]">{STORE_GST}</span>
              </p>
            </div>
            <div className="space-y-3">
              <p>
                <span className="font-medium text-[#64748b]">PAN no:</span>{' '}
                <span className="text-[#1c2740]">{STORE_PAN}</span>
              </p>
              <p>
                <span className="font-medium text-[#64748b]">Order no:</span>{' '}
                <span className="font-semibold text-[#1c2740]">A-{order.id}</span>
              </p>
              <p>
                <span className="font-medium text-[#64748b]">Order date:</span>{' '}
                <span className="text-[#1c2740]">{formatInvoiceDate(order.createdAt)}</span>
              </p>
            </div>
          </div>
          <div className="mt-8 grid gap-8 border-t border-[#e5ebf5] pt-8 text-sm lg:grid-cols-2">
            <div>
              <p className="font-medium text-[#64748b]">Billing address</p>
              <p className="mt-1 leading-relaxed text-[#1c2740]">{billingText}</p>
            </div>
            <div>
              <p className="font-medium text-[#64748b]">Shipping address</p>
              <p className="mt-1 leading-relaxed text-[#1c2740]">{order.address ? billingText : '—'}</p>
            </div>
          </div>
        </div>

        {/* Line items */}
        <div className="mt-6 overflow-hidden rounded-admin border border-[#e5ebf5]">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-[#e5ebf5] bg-[#e8f0fe] text-xs font-semibold uppercase tracking-wide text-[#1c2740]">
                  <th className="whitespace-nowrap px-3 py-3">SL no.</th>
                  <th className="min-w-[180px] px-3 py-3">Products</th>
                  <th className="px-3 py-3">Color</th>
                  <th className="px-3 py-3">Size</th>
                  <th className="px-3 py-3 text-right">Quantity</th>
                  <th className="px-3 py-3 text-right">Price</th>
                  <th className="px-3 py-3 text-right">Tax rate</th>
                  <th className="px-3 py-3">Tax type</th>
                  <th className="px-3 py-3 text-right">Tax</th>
                  <th className="px-3 py-3 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((line, i) => (
                  <tr key={line.id} className="border-b border-[#e5ebf5] last:border-0">
                    <td className="px-3 py-3 align-top tabular-nums text-[#475569]">{i + 1}</td>
                    <td className="px-3 py-3 align-top">
                      <div className="flex max-w-xs gap-2">
                        <div className="h-10 w-10 shrink-0 overflow-hidden rounded border border-[#e5ebf5] bg-[#f1f5f9]">
                          {line.productImageUrl ? (
                            <img src={line.productImageUrl} alt="" className="h-full w-full object-cover" />
                          ) : null}
                        </div>
                        <span className="font-medium text-[#1c2740]">{line.productNameSnapshot}</span>
                      </div>
                    </td>
                    <td className="px-3 py-3 align-top text-[#475569]">{line.colorName ?? '—'}</td>
                    <td className="px-3 py-3 align-top text-[#475569]">—</td>
                    <td className="px-3 py-3 align-top text-right tabular-nums text-[#475569]">{line.quantity}</td>
                    <td className="px-3 py-3 align-top text-right tabular-nums text-[#475569]">
                      {formatMoneyWhole(line.productPriceSnapshotCents)}
                    </td>
                    <td className="px-3 py-3 align-top text-right text-[#475569]">—</td>
                    <td className="px-3 py-3 align-top text-[#475569]">—</td>
                    <td className="px-3 py-3 align-top text-right tabular-nums text-[#475569]">{formatMoney(0)}</td>
                    <td className="px-3 py-3 align-top text-right font-medium tabular-nums text-[#1c2740]">
                      {formatMoneyWhole(line.subtotalCents)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="border-t border-[#e5ebf5] bg-[#f8fafc] px-4 py-3">
            <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
              <span className="font-semibold text-[#1c2740]">Subtotal</span>
              <span className="font-bold tabular-nums text-[#1c2740]">{formatMoneyWhole(itemsSubtotalCents)}</span>
            </div>
          </div>
          <div className="space-y-2 border-t border-[#e5ebf5] bg-white px-4 py-3 text-sm">
            <div className="flex justify-end gap-8">
              <span className="text-[#64748b]">Shipping cost</span>
              <span className="min-w-[100px] text-right tabular-nums text-[#1c2740]">
                {shippingCents ? formatMoney(shippingCents) : formatMoney(0)}
              </span>
            </div>
            <div className="flex justify-end gap-8">
              <span className="text-[#64748b]">Discount / voucher</span>
              <span
                className={`min-w-[100px] text-right font-medium tabular-nums ${discountCents ? 'text-red-600' : 'text-[#475569]'}`}
              >
                {discountCents ? `-${formatMoney(discountCents)}` : formatMoney(0)}
              </span>
            </div>
          </div>
          <div className="flex flex-col gap-3 border-t-2 border-[#e5ebf5] bg-[#eef2f7] px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-base font-semibold text-[#1c2740]">Grand total</span>
            <p className="flex-1 text-center text-sm leading-snug text-[#475569] sm:px-4">{grandTotalInWords(order.totalAmountCents)}</p>
            <span className="text-right text-xl font-bold tabular-nums text-[#1c2740]">{formatMoney(order.totalAmountCents)}</span>
          </div>
        </div>

        {/* Signatory + thank you */}
        <div className="mt-8 flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between print:mt-6">
          <p className="text-center text-sm text-[#64748b] sm:text-left print:mx-auto">
            Thank you for buying with {STORE_NAME} | {new Date().getFullYear()} © ThemeWagon
          </p>
          <div className="text-right print:ml-auto">
            <p className="text-lg font-semibold tracking-tight text-[#246bfd]">{STORE_NAME}</p>
            <p className="mt-1 text-xs text-[#64748b]">Authorized signatory</p>
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-3 border-t border-[#e4eaf5] pt-6 sm:flex-row sm:items-center sm:justify-between print:hidden">
          <Link
            href="/shop"
            className="inline-flex w-fit items-center justify-center rounded-admin bg-[#246bfd] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#1e5ae0]"
          >
            Browse more items
          </Link>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleDownload}
              className="inline-flex h-9 items-center gap-1.5 rounded-admin border border-[#e5ebf5] bg-white px-3 text-sm font-medium text-[#475569] hover:bg-[#f8fafc]"
            >
              Download invoice
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex h-9 items-center gap-1.5 rounded-admin border border-[#e5ebf5] bg-white px-3 text-sm font-medium text-[#475569] hover:bg-[#f8fafc]"
            >
              Print
            </button>
          </div>
        </div>

        <footer className="mt-10 flex flex-col gap-2 border-t border-[#e4eaf5] pt-4 text-sm text-[#8ea0bf] print:mt-8 sm:flex-row sm:items-center sm:justify-between">
          <span>Thank you for creating with Phoenix Tailwind | 2026 © ThemeWagon</span>
          <span>v1.0.0</span>
        </footer>
      </div>
    </AdminPageShell>
  );
}
