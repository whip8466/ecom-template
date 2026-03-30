'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { apiRequest } from '@/lib/api';
import { withAuth } from '@/components/auth';
import { resolveMediaUrl } from '@/lib/media-url';
import { useAuthStore } from '@/store/auth-store';
import type { Order, OrderItem } from '@/lib/types';
import { formatMoney } from '@/lib/format';

function formatOrderDateTime(iso: string) {
  try {
    return new Intl.DateTimeFormat('en-IN', { dateStyle: 'long', timeStyle: 'short' }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function formatShippingDateLabel(iso: string) {
  try {
    const d = new Date(iso);
    const mon = d.toLocaleString('en-IN', { month: 'short' });
    return `${d.getDate()} ${mon}, ${d.getFullYear()}`;
  } catch {
    return '—';
  }
}

function paymentStatusLabel(s: string): string {
  const map: Record<string, string> = {
    PAID: 'Paid',
    PENDING: 'Pending',
    FAILED: 'Failed',
  };
  return map[s] ?? s.replace(/_/g, ' ');
}

function fulfillmentStatusLabel(s: string): string {
  const map: Record<string, string> = {
    PENDING: 'Pending',
    CONFIRMED: 'Confirmed',
    PROCESSING: 'Processing',
    SHIPPED: 'Shipped',
    DELIVERED: 'Delivered',
    CANCELLED: 'Cancelled',
  };
  return map[s] ?? s.replace(/_/g, ' ');
}

function splitColorSize(colorName: string | null | undefined): { color: string; size: string } {
  if (!colorName?.trim()) return { color: '—', size: '—' };
  const parts = colorName.split(/\s*·\s*/).map((x) => x.trim()).filter(Boolean);
  if (parts.length >= 2) return { color: parts[0], size: parts.slice(1).join(' · ') };
  return { color: parts[0], size: '—' };
}

function ItemThumb({ item }: { item: OrderItem }) {
  const [broken, setBroken] = useState(false);
  const src = resolveMediaUrl(item.productImageUrl);
  const href = item.productSlug ? `/products/${item.productSlug}` : '/shop';

  if (!src || broken) {
    return (
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded border border-[#e5ecf6] bg-[#f4f8ff] text-[#94a3b8]">
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </div>
    );
  }

  return (
    <Link href={href} className="relative block h-12 w-12 shrink-0 overflow-hidden rounded border border-[#e5ecf6] bg-white">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt="" className="h-full w-full object-contain p-0.5" onError={() => setBroken(true)} loading="lazy" />
    </Link>
  );
}

function MyOrderDetailsPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const { token } = useAuthStore();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    apiRequest<{ data: Order }>(`/api/user/orders/${params.id}`, { token })
      .then((res) => setOrder(res.data))
      .catch(() => router.push('/account/orders'))
      .finally(() => setLoading(false));
  }, [params.id, router, token]);

  const itemsSubtotalCents = useMemo(
    () => (order?.items ?? []).reduce((s, i) => s + i.subtotalCents, 0),
    [order],
  );

  const shippingCents = useMemo(() => {
    if (!order) return 0;
    return Math.max(0, order.totalAmountCents - itemsSubtotalCents);
  }, [order, itemsSubtotalCents]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-10 w-56 animate-pulse rounded bg-[#e8edf6]" />
        <div className="h-64 animate-pulse rounded-md bg-[#f1f5f9]" />
      </div>
    );
  }

  if (!order) return null;

  const u = order.user;

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-[#0f1f40] sm:text-4xl">Order #{order.id}</h1>
          <p className="mt-2 text-sm text-[#64748b]">{formatOrderDateTime(order.createdAt)}</p>
        </div>
        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex items-center justify-center gap-2 self-start rounded-md border border-[#d7e4f6] bg-white px-4 py-2.5 text-sm font-semibold text-[#0f1f40] shadow-sm transition hover:bg-[#f8fafc] print:hidden"
        >
          <svg className="h-4 w-4 text-[#0989ff]" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Invoice
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main column */}
        <div className="space-y-6 lg:col-span-2">
          {/* Items table */}
          <section className="overflow-hidden rounded-md border border-[#e5ecf6] bg-white">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead>
                  <tr className="border-b border-[#e5ecf6] bg-[#f8fafc] text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">
                    <th className="px-4 py-3">Products</th>
                    <th className="px-3 py-3">Color</th>
                    <th className="px-3 py-3">Size</th>
                    <th className="px-3 py-3 text-right">Price</th>
                    <th className="px-3 py-3 text-right">Qty</th>
                    <th className="px-4 py-3 text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items.map((item) => {
                    const { color, size } = splitColorSize(item.colorName);
                    const href = item.productSlug ? `/products/${item.productSlug}` : '/shop';
                    return (
                      <tr key={item.id} className="border-b border-[#edf2f8] last:border-0">
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            <ItemThumb item={item} />
                            <Link href={href} className="font-medium text-[#0989ff] hover:text-[#0476df] hover:underline">
                              {item.productNameSnapshot}
                            </Link>
                          </div>
                        </td>
                        <td className="px-3 py-4 text-[#475467]">{color}</td>
                        <td className="px-3 py-4 text-[#475467]">{size}</td>
                        <td className="px-3 py-4 text-right text-[#0f1f40]">{formatMoney(item.productPriceSnapshotCents)}</td>
                        <td className="px-3 py-4 text-right text-[#475467]">{item.quantity}</td>
                        <td className="px-4 py-4 text-right font-medium text-[#0f1f40]">{formatMoney(item.subtotalCents)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="flex justify-end border-t border-[#e5ecf6] bg-[#f8fafc] px-4 py-3 text-sm">
              <span className="text-[#64748b]">Items subtotal</span>
              <span className="ml-4 font-semibold text-[#0f1f40]">{formatMoney(itemsSubtotalCents)}</span>
            </div>
          </section>

          {/* Billing / Shipping / Other */}
          <section className="rounded-md border border-[#e5ecf6] bg-white p-5 sm:p-6">
            <div className="grid gap-8 md:grid-cols-3">
              <div>
                <h3 className="text-sm font-semibold text-[#0f1f40]">Billing details</h3>
                <ul className="mt-4 space-y-3 text-sm text-[#475467]">
                  {u?.name && (
                    <li className="flex gap-2">
                      <span className="shrink-0 text-[#0989ff]">
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" aria-hidden>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                        </svg>
                      </span>
                      <span>{u.name}</span>
                    </li>
                  )}
                  {u?.email && (
                    <li className="flex gap-2">
                      <span className="shrink-0 text-[#0989ff]">
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" aria-hidden>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                        </svg>
                      </span>
                      <a href={`mailto:${u.email}`} className="text-[#0989ff] hover:underline">
                        {u.email}
                      </a>
                    </li>
                  )}
                  {u?.phone && (
                    <li className="flex gap-2">
                      <span className="shrink-0 text-[#0989ff]">
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" aria-hidden>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                        </svg>
                      </span>
                      <a href={`tel:${u.phone.replace(/\s/g, '')}`} className="text-[#0989ff] hover:underline">
                        {u.phone}
                      </a>
                    </li>
                  )}
                  {!u && <li className="text-[#94a3b8]">—</li>}
                </ul>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-[#0f1f40]">Shipping details</h3>
                <ul className="mt-4 space-y-3 text-sm text-[#475467]">
                  <li className="flex gap-2">
                    <span className="shrink-0 text-[#0989ff]">
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" aria-hidden>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5a2.25 2.25 0 002.25-2.25m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5a2.25 2.25 0 012.25 2.25v7.5" />
                      </svg>
                    </span>
                    <span>Order date: {formatShippingDateLabel(order.createdAt)}</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="shrink-0 text-[#0989ff]">
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" aria-hidden>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
                      </svg>
                    </span>
                    <span className="leading-relaxed">
                      <span className="block font-medium text-[#0f1f40]">{order.address.fullName}</span>
                      {order.address.phone && <span className="block">{order.address.phone}</span>}
                      <span className="block">{order.address.addressLine1}</span>
                      {order.address.addressLine2?.trim() ? <span className="block">{order.address.addressLine2}</span> : null}
                      <span className="block">
                        {order.address.city}, {order.address.state} {order.address.postalCode}
                      </span>
                      <span className="block">{order.address.country}</span>
                    </span>
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-[#0f1f40]">Other details</h3>
                <ul className="mt-4 space-y-2 text-sm text-[#64748b]">
                  <li className="flex justify-between gap-2">
                    <span>Gift order</span>
                    <span className="text-[#475467]">No</span>
                  </li>
                  <li className="flex justify-between gap-2">
                    <span>Gift message</span>
                    <span className="text-[#475467]">—</span>
                  </li>
                </ul>
              </div>
            </div>
          </section>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <section className="rounded-md border border-[#e5ecf6] bg-white p-5 sm:p-6">
            <h3 className="text-base font-semibold text-[#0f1f40]">Summary</h3>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between gap-4 text-[#475467]">
                <dt>Items subtotal</dt>
                <dd className="font-medium text-[#0f1f40]">{formatMoney(itemsSubtotalCents)}</dd>
              </div>
              <div className="flex justify-between gap-4 text-[#475467]">
                <dt>Discount</dt>
                <dd className="text-[#0f1f40]">{formatMoney(0)}</dd>
              </div>
              <div className="flex justify-between gap-4 text-[#475467]">
                <dt>Tax</dt>
                <dd className="text-[#0f1f40]">{formatMoney(0)}</dd>
              </div>
              <div className="flex justify-between gap-4 text-[#475467]">
                <dt>Shipping</dt>
                <dd className="text-[#0f1f40]">{shippingCents === 0 ? 'Free' : formatMoney(shippingCents)}</dd>
              </div>
              <div className="flex justify-between gap-4 border-t border-[#e5ecf6] pt-4 text-base font-semibold text-[#0f1f40]">
                <dt>Total</dt>
                <dd className="text-[#0989ff]">{formatMoney(order.totalAmountCents)}</dd>
              </div>
            </dl>
          </section>

          <section className="rounded-md border border-[#e5ecf6] bg-white p-5 sm:p-6">
            <h3 className="text-base font-semibold text-[#0f1f40]">Order status</h3>
            <dl className="mt-4 space-y-4 text-sm">
              <div>
                <dt className="text-[#64748b]">Payment status</dt>
                <dd className="mt-1 font-medium text-[#0f1f40]">{paymentStatusLabel(order.paymentStatus)}</dd>
              </div>
              <div>
                <dt className="text-[#64748b]">Fulfillment status</dt>
                <dd className="mt-1 font-medium text-[#0f1f40]">{fulfillmentStatusLabel(order.status)}</dd>
              </div>
            </dl>
          </section>
        </div>
      </div>
    </div>
  );
}

export default withAuth(MyOrderDetailsPage);
