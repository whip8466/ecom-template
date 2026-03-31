'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { apiRequest } from '@/lib/api';
import { withAuth } from '@/components/auth';
import { resolveMediaUrl } from '@/lib/media-url';
import { useAuthStore } from '@/store/auth-store';
import type { Address, Order, OrderItem } from '@/lib/types';
import { formatMoney } from '@/lib/format';

function formatOrderDate(iso: string) {
  try {
    return new Intl.DateTimeFormat('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function orderStatusHeadline(status: string): string {
  const map: Record<string, string> = {
    PENDING: 'Order received',
    CONFIRMED: 'Order confirmed',
    PROCESSING: 'Preparing for dispatch',
    SHIPPED: 'Shipped',
    DELIVERED: 'Delivered',
    CANCELLED: 'Cancelled',
  };
  return map[status] ?? status.replace(/_/g, ' ');
}

function orderStatusSubtext(status: string, paymentStatus: string): string {
  if (paymentStatus === 'FAILED') {
    return 'Payment could not be completed. Contact support if you need help.';
  }
  if (paymentStatus === 'PENDING') {
    return 'We are waiting for payment confirmation.';
  }
  if (status === 'DELIVERED') {
    return 'Your order has been delivered.';
  }
  if (status === 'SHIPPED') {
    return 'Your package is on the way.';
  }
  if (status === 'CANCELLED') {
    return 'This order was cancelled.';
  }
  return 'Thank you for shopping with us.';
}

function ShipToDropdown({ address }: { address: Address }) {
  const lines = [
    address.fullName,
    address.phone,
    address.addressLine1 + (address.addressLine2 ? `, ${address.addressLine2}` : ''),
    `${address.city}, ${address.state} ${address.postalCode}`,
    address.country,
  ].filter(Boolean);

  return (
    <details className="group relative max-w-[220px]">
      <summary className="cursor-pointer list-none text-sm font-medium text-[#0989ff] hover:text-[#0476df] hover:underline [&::-webkit-details-marker]:hidden">
        <span className="inline-flex items-center gap-1">
          {address.fullName}
          <svg className="h-3.5 w-3.5 shrink-0 text-[#7c8ea6]" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </span>
      </summary>
      <div className="absolute left-0 top-full z-20 mt-1 min-w-[260px] rounded-md border border-[#e5ecf6] bg-white p-3 text-xs leading-relaxed text-[#475467] shadow-md">
        {lines.map((line, i) => (
          <p key={i}>{line}</p>
        ))}
      </div>
    </details>
  );
}

function ProductThumb({ imageUrl }: { imageUrl: string | null | undefined }) {
  const [broken, setBroken] = useState(false);
  const resolved = resolveMediaUrl(imageUrl);

  if (!resolved || broken) {
    return (
      <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-md border border-[#e5ecf6] bg-[#f4f8ff] text-[#94a3b8] sm:h-24 sm:w-24">
        <svg className="h-9 w-9" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      </div>
    );
  }

  return (
    <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-md border border-[#e5ecf6] bg-white sm:h-24 sm:w-24">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={resolved}
        alt=""
        className="h-full w-full object-contain p-1.5"
        loading="lazy"
        onError={() => setBroken(true)}
      />
    </div>
  );
}

function OrderLineItem({
  item,
  showDivider,
  order,
}: {
  item: OrderItem;
  showDivider: boolean;
  order: Order;
}) {
  const href = item.productSlug ? `/products/${item.productSlug}` : '/shop';
  const reviewHref = item.productSlug ? `/products/${item.productSlug}#reviews` : '/shop';
  const canReview =
    order.paymentStatus === 'PAID' && order.status === 'DELIVERED';

  return (
    <div
      className={`flex flex-col gap-4 sm:flex-row sm:items-start ${
        showDivider ? 'mt-6 border-t border-[#e5ecf6] pt-6' : ''
      }`}
    >
      <ProductThumb imageUrl={item.productImageUrl} />
      <div className="min-w-0 flex-1">
        <Link href={href} className="text-[15px] font-semibold text-[#0989ff] hover:text-[#0476df] hover:underline">
          {item.productNameSnapshot}
        </Link>
        <p className="mt-1 text-sm text-[#64748b]">
          {item.colorName && <span>Colour: {item.colorName} · </span>}
          Qty: {item.quantity} · {formatMoney(item.subtotalCents)}
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            href={href}
            className="inline-flex rounded-md bg-[#0989ff] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#0476df]"
          >
            Buy it again
          </Link>
          {canReview && item.productSlug && !item.hasReview ? (
            <Link
              href={reviewHref}
              className="inline-flex rounded-md border border-[#d7e4f6] bg-white px-4 py-2 text-sm font-semibold text-[#0f1f40] transition hover:bg-[#f8fafc]"
            >
              Add review
            </Link>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function OrderCard({ order }: { order: Order }) {
  const detailHref = `/account/orders/${order.id}`;

  return (
    <article className="overflow-hidden rounded-md border border-[#e5ecf6] bg-white">
      <div className="border-b border-[#e5ecf6] bg-[#f8fafc] px-5 py-4 sm:px-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex flex-wrap gap-x-10 gap-y-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-[#7c8ea6]">Order placed</p>
              <p className="mt-1 text-sm text-[#0f1f40]">{formatOrderDate(order.createdAt)}</p>
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-[#7c8ea6]">Total</p>
              <p className="mt-1 text-sm font-semibold text-[#0989ff]">{formatMoney(order.totalAmountCents)}</p>
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-[#7c8ea6]">Ship to</p>
              <div className="mt-1">
                <ShipToDropdown address={order.address} />
              </div>
            </div>
          </div>
          <div className="text-left lg:text-right">
            <p className="text-xs text-[#7c8ea6]">
              ORDER # <span className="font-semibold text-[#0f1f40]">{order.id}</span>
            </p>
            <Link
              href={detailHref}
              className="mt-2 inline-block text-sm font-medium text-[#0989ff] hover:text-[#0476df] hover:underline"
            >
              Invoice
            </Link>
          </div>
        </div>
      </div>

      <div className="px-5 py-6 sm:px-6">
        <div className="flex flex-col gap-4 border-b border-[#edf2f8] pb-6 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-lg font-semibold text-[#0f1f40]">{orderStatusHeadline(order.status)}</p>
            <p className="mt-1 text-sm leading-relaxed text-[#64748b]">
              {orderStatusSubtext(order.status, order.paymentStatus)}
            </p>
          </div>
          <Link
            href={detailHref}
            className="inline-flex shrink-0 items-center justify-center rounded-md bg-[#0989ff] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0476df]"
          >
            View order details
          </Link>
        </div>

        {order.items.length > 0 && (
          <div className="pt-2">
            {order.items.map((item, index) => (
              <OrderLineItem key={item.id} item={item} order={order} showDivider={index > 0} />
            ))}
          </div>
        )}
      </div>
    </article>
  );
}

function MyOrdersPage() {
  const { token } = useAuthStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;

    apiRequest<{ data: Order[] }>('/api/user/orders', { token })
      .then((res) => setOrders(res.data))
      .catch((e) => setError((e as Error).message || 'Failed to fetch orders'))
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-10 w-48 animate-pulse rounded bg-[#e8edf6]" />
        <div className="h-40 animate-pulse rounded-md bg-[#f1f5f9]" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-semibold text-[#0f1f40]">Your orders</h1>
        <p className="mt-2 text-sm text-[#7c8ea6]">
          <Link href="/" className="hover:text-[#0989ff]">
            Home
          </Link>{' '}
          / Your orders
        </p>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {orders.length === 0 ? (
        <div className="rounded-md border border-dashed border-[#dce6f4] bg-white px-6 py-14 text-center">
          <p className="text-sm text-[#64748b]">You haven&apos;t placed any orders yet.</p>
          <Link
            href="/shop"
            className="mt-5 inline-flex rounded-md bg-[#0989ff] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#0476df]"
          >
            Continue shopping
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => (
            <OrderCard key={order.id} order={order} />
          ))}
        </div>
      )}
    </div>
  );
}

export default withAuth(MyOrdersPage);
