'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { apiRequest } from '@/lib/api';
import { buildLoginRedirectHref } from '@/lib/auth-redirect';
import { useAuthStore } from '@/store/auth-store';
import type { Order } from '@/lib/types';
import { formatMoney } from '@/lib/format';

export default function MyOrderDetailsPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const { token } = useAuthStore();
  const [order, setOrder] = useState<Order | null>(null);

  useEffect(() => {
    if (!token) {
      router.push(buildLoginRedirectHref(`/account/orders/${params.id}`));
      return;
    }

    apiRequest<{ data: Order }>(`/api/user/orders/${params.id}`, { token })
      .then((res) => setOrder(res.data))
      .catch(() => router.push('/account/orders'));
  }, [params.id, router, token]);

  if (!order) return <p className="text-sm text-slate-600">Loading order...</p>;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Order #{order.id}</h1>
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <p className="text-sm">Status: <span className="font-medium">{order.status}</span></p>
        <p className="text-sm">Payment: <span className="font-medium">{order.paymentStatus}</span></p>
      </div>
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="font-medium">Items</h2>
        {order.items.map((item) => (
          <div key={item.id} className="mt-2 border-t border-slate-100 pt-2 text-sm">
            <p>{item.productNameSnapshot} x {item.quantity}</p>
            <p className="text-slate-600">Color: {item.colorName || 'Default'}</p>
            <p>{formatMoney(item.subtotalCents)}</p>
          </div>
        ))}
        <p className="mt-3 font-semibold">Total: {formatMoney(order.totalAmountCents)}</p>
      </div>
    </div>
  );
}
