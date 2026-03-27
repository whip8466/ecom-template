'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { AdminPageShell } from '@/components/admin-shell';
import { useAuthStore } from '@/store/auth-store';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000';

const PAYMENT_STATUSES = ['PENDING', 'PAID', 'FAILED'] as const;
const FULFILLMENT_STATUSES = [
  'PENDING',
  'CONFIRMED',
  'PROCESSING',
  'SHIPPED',
  'DELIVERED',
  'CANCELLED',
] as const;

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

function formatWhen(iso: string): string {
  return new Intl.DateTimeFormat('en-US', { dateStyle: 'long', timeStyle: 'short' }).format(new Date(iso));
}

/** e.g. "12 Nov, 2021" — matches Phoenix order detail */
function formatShippingDate(iso: string): string {
  const d = new Date(iso);
  const mon = d.toLocaleString('en-GB', { month: 'short' });
  return `${d.getDate()} ${mon}, ${d.getFullYear()}`;
}

function telHref(phone: string) {
  return `tel:${phone.replace(/[^\d+]/g, '')}`;
}

function AddressBlock({ addr }: { addr: Address }) {
  return (
    <>
      <span className="block text-[#344256]">{addr.fullName}</span>
      <span className="block text-[#344256]">{addr.addressLine1}</span>
      {addr.addressLine2?.trim() ? <span className="block text-[#344256]">{addr.addressLine2.trim()}</span> : null}
      <span className="block text-[#344256]">
        {addr.city}, {addr.state},
      </span>
      <span className="block text-[#344256]">{addr.country}</span>
    </>
  );
}

function IconUser() {
  return (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
    </svg>
  );
}

function IconEnvelope() {
  return (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
    </svg>
  );
}

function IconPhone() {
  return (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
    </svg>
  );
}

function IconHome() {
  return (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
    </svg>
  );
}

function IconCalendar() {
  return (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5a2.25 2.25 0 002.25-2.25m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5a2.25 2.25 0 012.25 2.25v7.5" />
    </svg>
  );
}

/** Square outline + check — matches mockup “gift order” row */
function IconGiftOrder() {
  return (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" aria-hidden>
      <rect x="3.75" y="3.75" width="16.5" height="16.5" rx="2" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 12.75l2.25 2.25 5.25-5.25" />
    </svg>
  );
}

function IconGiftBox() {
  return (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 11.25v8.25a1.5 1.5 0 01-1.5 1.5H5.25a1.5 1.5 0 01-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 109.375 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 1114.625 7.5H12m0 0V21m-8.625-9.75h18c.621 0 1.125-.504 1.125-1.125v-2.25c0-.621-.504-1.125-1.125-1.125h-18c-.621 0-1.125.504-1.125 1.125v2.25c0 .621.504 1.125 1.125 1.125z" />
    </svg>
  );
}

function IconDocument() {
  return (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V12.75a9 9 0 00-9-9z" />
    </svg>
  );
}

function DetailRow({ icon, label, children }: { icon: ReactNode; label: string; children: ReactNode }) {
  return (
    <div className="flex gap-3">
      <span className="mt-0.5 shrink-0 text-[#94a3b8]" aria-hidden>
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-normal text-[#64748b]">{label}</p>
        <div className="mt-1 text-sm leading-relaxed text-[#344256]">{children}</div>
      </div>
    </div>
  );
}

function linkClass() {
  return 'font-medium text-[#246bfd] hover:underline';
}

function paymentLabel(s: string): string {
  if (s === 'PENDING') return 'Pending';
  if (s === 'PAID') return 'Paid';
  if (s === 'FAILED') return 'Failed';
  return s;
}

function fulfillmentLabel(s: string): string {
  const map: Record<string, string> = {
    PENDING: 'Unfulfilled',
    CONFIRMED: 'Unfulfilled',
    PROCESSING: 'Processing',
    SHIPPED: 'Shipped',
    DELIVERED: 'Delivered',
    CANCELLED: 'Cancelled',
  };
  return map[s] ?? s;
}

export default function AdminOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const token = useAuthStore((s) => s.token);
  const id = Number(params.id);
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [savingField, setSavingField] = useState<'payment' | 'fulfillment' | null>(null);
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);

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
    if (!token || !Number.isInteger(id) || id < 1) {
      setLoading(false);
      if (!token) setError('Sign in to view this order.');
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

  useEffect(() => {
    if (!moreOpen) return;
    const close = (e: MouseEvent) => {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) setMoreOpen(false);
    };
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, [moreOpen]);

  const patchOrder = async (patch: { paymentStatus?: string; status?: string }, field: 'payment' | 'fulfillment') => {
    if (!token || !order) return;
    setSavingField(field);
    setError('');
    try {
      const res = await fetch(`${API_BASE}/api/admin/orders/${order.id}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(patch),
      });
      const json = (await res.json().catch(() => ({}))) as { data?: OrderDetail; message?: string };
      if (!res.ok) throw new Error(json.message || 'Failed to update order');
      if (json.data) setOrder(json.data);
      else await loadOrder();
    } catch (e) {
      setError((e as Error).message || 'Update failed');
    } finally {
      setSavingField(null);
    }
  };

  const itemsSubtotalCents = order?.items.reduce((sum, line) => sum + line.subtotalCents, 0) ?? 0;

  if (loading) {
    return (
      <AdminPageShell
        breadcrumbs={[
          { label: 'Admin', href: '/admin' },
          { label: 'Orders', href: '/admin/orders' },
          { label: `#${id}` },
        ]}
        title={`Order #${id}`}
      >
        <div className="flex items-center justify-center py-24">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#246bfd] border-t-transparent" />
        </div>
      </AdminPageShell>
    );
  }

  if (error && !order) {
    return (
      <AdminPageShell
        breadcrumbs={[
          { label: 'Admin', href: '/admin' },
          { label: 'Orders', href: '/admin/orders' },
          { label: 'Not found' },
        ]}
        title="Order"
      >
        <div className="rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error || 'Order not found.'}</div>
        <button
          type="button"
          onClick={() => router.push('/admin/orders')}
          className="mt-4 text-sm font-medium text-[#246bfd] hover:underline"
        >
          ← Back to orders
        </button>
      </AdminPageShell>
    );
  }

  if (!order) return null;

  const shellActions = (
    <div className="flex flex-wrap items-center gap-2">
      <Link
        href={`/admin/orders/${order.id}/invoice`}
        className="inline-flex h-9 items-center gap-1.5 rounded-admin border border-[#e5ebf5] bg-white px-3 text-sm font-medium text-[#475569] hover:bg-[#f8fafc]"
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
        Invoice
      </Link>
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
      <Link
        href={`/admin/orders/${order.id}/refund`}
        className="inline-flex h-9 items-center rounded-admin border border-[#e5ebf5] bg-white px-3 text-sm font-medium text-[#475569] hover:bg-[#f8fafc]"
      >
        Refund
      </Link>
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
            className="absolute right-0 z-20 mt-1 min-w-[180px] rounded-admin border border-[#e5ebf5] bg-white py-1 shadow-lg"
          >
            <Link
              href={`/admin/orders/${order.id}/invoice`}
              className="block px-3 py-2 text-sm text-[#1c2740] hover:bg-[#f8fafc]"
              onClick={() => setMoreOpen(false)}
            >
              View invoice
            </Link>
            <Link
              href="/admin/orders"
              className="block px-3 py-2 text-sm text-[#1c2740] hover:bg-[#f8fafc]"
              onClick={() => setMoreOpen(false)}
            >
              Back to order list
            </Link>
          </div>
        ) : null}
      </div>
    </div>
  );

  return (
    <AdminPageShell
      breadcrumbs={[
        { label: 'Admin', href: '/admin' },
        { label: 'Orders', href: '/admin/orders' },
        { label: `Order #${order.id}` },
      ]}
      title={`Order #${order.id}`}
      description={
        <span className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-[#60759b]">
          <span>{formatWhen(order.createdAt)}</span>
          {order.user ? (
            <>
              <span className="text-[#c5d0e5]">·</span>
              <span>
                Customer ID:{' '}
                <span className="font-medium text-[#246bfd]">#{order.user.id}</span>
              </span>
            </>
          ) : null}
        </span>
      }
      actions={shellActions}
    >
      {error ? (
        <div className="mb-4 rounded border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-900" role="status">
          {error}
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-3 lg:items-start print:grid-cols-1">
        <div className="space-y-6 lg:col-span-2">
          <div className="overflow-hidden rounded-admin border border-[#e5ebf5] bg-white">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead>
                  <tr className="border-b border-[#e5ebf5] bg-[#f8fafc] text-xs font-semibold uppercase tracking-wide text-[#64748b]">
                    <th className="p-4 font-medium">Products</th>
                    <th className="p-4 font-medium">Color</th>
                    <th className="p-4 font-medium">Size</th>
                    <th className="p-4 font-medium text-right">Price</th>
                    <th className="p-4 font-medium text-right">Qty</th>
                    <th className="p-4 font-medium text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items.map((line) => {
                    const href = line.productSlug ? `/products/${encodeURIComponent(line.productSlug)}` : null;
                    return (
                      <tr key={line.id} className="border-b border-[#e5ebf5] last:border-0">
                        <td className="p-4">
                          <div className="flex max-w-xs items-start gap-3">
                            <div className="h-14 w-14 shrink-0 overflow-hidden rounded border border-[#e5ebf5] bg-[#f1f5f9]">
                              {line.productImageUrl ? (
                                <img src={line.productImageUrl} alt="" className="h-full w-full object-cover" />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center text-[#94a3b8]">
                                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14"
                                    />
                                  </svg>
                                </div>
                              )}
                            </div>
                            <div className="min-w-0 pt-0.5">
                              {href ? (
                                <Link href={href} className="font-medium text-[#246bfd] hover:underline">
                                  {line.productNameSnapshot}
                                </Link>
                              ) : (
                                <span className="font-medium text-[#1c2740]">{line.productNameSnapshot}</span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="p-4 align-top text-[#475569]">{line.colorName ?? '—'}</td>
                        <td className="p-4 align-top text-[#475569]">—</td>
                        <td className="p-4 align-top text-right text-[#475569]">
                          {formatMoneyWhole(line.productPriceSnapshotCents)}
                        </td>
                        <td className="p-4 align-top text-right text-[#475569]">{line.quantity}</td>
                        <td className="p-4 align-top text-right font-medium text-[#1c2740]">
                          {formatMoneyWhole(line.subtotalCents)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="border-t border-[#e5ebf5] bg-[#f8fafc]">
                    <td colSpan={5} className="p-4 text-right text-sm font-semibold text-[#1c2740]">
                      Items subtotal
                    </td>
                    <td className="p-4 text-right text-sm font-semibold text-[#1c2740]">
                      {formatMoneyWhole(itemsSubtotalCents)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          <div className="overflow-hidden rounded-admin border border-[#e5ebf5] bg-white">
            <div className="grid grid-cols-1 divide-y divide-[#e5ebf5] lg:grid-cols-3 lg:divide-x lg:divide-y-0">
              {/* Billing details — Phoenix: icon + label + value; links in blue */}
              <section className="p-5 sm:p-6">
                <h2 className="text-base font-semibold tracking-tight text-[#1c2740]">Billing details</h2>
                {order.user && order.address ? (
                  <div className="mt-5 space-y-5">
                    <DetailRow icon={<IconUser />} label="Customer">
                      <a href={`mailto:${order.user.email}`} className={linkClass()}>
                        {order.user.name ?? order.address.fullName}
                      </a>
                    </DetailRow>
                    <DetailRow icon={<IconEnvelope />} label="Email">
                      <a href={`mailto:${order.user.email}`} className={linkClass()}>
                        {order.user.email}
                      </a>
                    </DetailRow>
                    <DetailRow icon={<IconPhone />} label="Phone">
                      <a href={telHref(order.user.phone ?? order.address.phone)} className={linkClass()}>
                        {order.user.phone ?? order.address.phone}
                      </a>
                    </DetailRow>
                    <DetailRow icon={<IconHome />} label="Address">
                      <AddressBlock addr={order.address} />
                    </DetailRow>
                  </div>
                ) : (
                  <p className="mt-5 text-sm text-[#94a3b8]">—</p>
                )}
              </section>

              {/* Shipping details */}
              <section className="p-5 sm:p-6">
                <h2 className="text-base font-semibold tracking-tight text-[#1c2740]">Shipping details</h2>
                {order.user && order.address ? (
                  <div className="mt-5 space-y-5">
                    <DetailRow icon={<IconEnvelope />} label="Email">
                      <a href={`mailto:${order.user.email}`} className={linkClass()}>
                        {order.user.email}
                      </a>
                    </DetailRow>
                    <DetailRow icon={<IconPhone />} label="Phone">
                      <a href={telHref(order.address.phone)} className={linkClass()}>
                        {order.address.phone}
                      </a>
                    </DetailRow>
                    <DetailRow icon={<IconCalendar />} label="Shipping Date">
                      <span className="text-[#344256]">{formatShippingDate(order.createdAt)}</span>
                    </DetailRow>
                    <DetailRow icon={<IconHome />} label="Address">
                      <AddressBlock addr={order.address} />
                    </DetailRow>
                  </div>
                ) : (
                  <p className="mt-5 text-sm text-[#94a3b8]">—</p>
                )}
              </section>

              {/* Other details — gift fields not in API; placeholder layout matches mockup */}
              <section className="p-5 sm:p-6">
                <h2 className="text-base font-semibold tracking-tight text-[#1c2740]">Other details</h2>
                <div className="mt-5 space-y-5">
                  <DetailRow icon={<IconGiftOrder />} label="Gift order">
                    <span className="text-[#344256]">No</span>
                  </DetailRow>
                  <DetailRow icon={<IconGiftBox />} label="Wrapping">
                    <span className="text-[#94a3b8]">—</span>
                  </DetailRow>
                  <DetailRow icon={<IconUser />} label="Recipient">
                    <span className="text-[#94a3b8]">—</span>
                  </DetailRow>
                  <DetailRow icon={<IconDocument />} label="Gift Message">
                    <div className="min-h-18 rounded border border-dashed border-[#e2e8f0] bg-[#fafbfc] px-3 py-2 text-[#94a3b8]">
                      —
                    </div>
                  </DetailRow>
                </div>
              </section>
            </div>
          </div>
        </div>

        <div className="space-y-4 print:mt-6">
          <div className="rounded-admin border border-[#e5ebf5] bg-white p-4">
            <h2 className="text-sm font-semibold text-[#1c2740]">Summary</h2>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between gap-2">
                <dt className="text-[#64748b]">Items subtotal</dt>
                <dd className="font-medium text-[#1c2740]">{formatMoney(itemsSubtotalCents)}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-[#64748b]">Discount</dt>
                <dd className="text-right text-emerald-700">—</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-[#64748b]">Tax</dt>
                <dd className="text-[#475569]">—</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-[#64748b]">Shipping</dt>
                <dd className="text-[#475569]">—</dd>
              </div>
              <div className="border-t border-[#e5ebf5] pt-3">
                <div className="flex justify-between gap-2">
                  <dt className="text-base font-semibold text-[#1c2740]">Total</dt>
                  <dd className="text-lg font-semibold text-[#1c2740]">{formatMoney(order.totalAmountCents)}</dd>
                </div>
              </div>
            </dl>
          </div>

          <div className="rounded-admin border border-[#e5ebf5] bg-white p-4">
            <h2 className="text-sm font-semibold text-[#1c2740]">Order status</h2>
            <div className="mt-4 space-y-4">
              <div>
                <label htmlFor="payment-status" className="block text-xs font-medium uppercase tracking-wide text-[#64748b]">
                  Payment status
                </label>
                <select
                  id="payment-status"
                  value={order.paymentStatus}
                  disabled={savingField === 'payment'}
                  onChange={(e) => {
                    const v = e.target.value;
                    if (v === order.paymentStatus) return;
                    void patchOrder({ paymentStatus: v }, 'payment');
                  }}
                  className="mt-1.5 w-full rounded-admin border border-[#e5ebf5] bg-white px-3 py-2 text-sm text-[#1c2740] focus:border-[#246bfd] focus:outline-none disabled:opacity-60"
                >
                  {PAYMENT_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {paymentLabel(s)}
                    </option>
                  ))}
                </select>
                {savingField === 'payment' ? (
                  <p className="mt-1 text-xs text-[#64748b]">Saving…</p>
                ) : null}
              </div>
              <div>
                <label htmlFor="fulfillment-status" className="block text-xs font-medium uppercase tracking-wide text-[#64748b]">
                  Fulfillment status
                </label>
                <select
                  id="fulfillment-status"
                  value={order.status}
                  disabled={savingField === 'fulfillment'}
                  onChange={(e) => {
                    const v = e.target.value;
                    if (v === order.status) return;
                    void patchOrder({ status: v }, 'fulfillment');
                  }}
                  className="mt-1.5 w-full rounded-admin border border-[#e5ebf5] bg-white px-3 py-2 text-sm text-[#1c2740] focus:border-[#246bfd] focus:outline-none disabled:opacity-60"
                >
                  {FULFILLMENT_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {fulfillmentLabel(s)}
                    </option>
                  ))}
                </select>
                {savingField === 'fulfillment' ? (
                  <p className="mt-1 text-xs text-[#64748b]">Saving…</p>
                ) : null}
              </div>
            </div>
          </div>

          <Link href="/admin/orders" className="inline-block text-sm font-medium text-[#246bfd] hover:underline print:hidden">
            ← Back to orders
          </Link>
        </div>
      </div>

      <footer className="mt-12 hidden border-t border-[#e4eaf5] pt-4 text-sm text-[#8ea0bf] print:block print:mt-8">
        <div className="flex justify-between">
          <span>Thank you for creating with Phoenix Tailwind | 2026 © ThemeWagon</span>
          <span>v1.0.0</span>
        </div>
      </footer>
    </AdminPageShell>
  );
}
