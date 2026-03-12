'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiRequest } from '@/lib/api';
import { useAuthStore } from '@/store/auth-store';
import type { Order } from '@/lib/types';
import { formatMoney } from '@/lib/format';

export default function MyOrdersPage() {
  const router = useRouter();
  const { token } = useAuthStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) {
      router.push('/login');
      return;
    }

    apiRequest<{ data: Order[] }>('/api/user/orders', { token })
      .then((res) => setOrders(res.data))
      .catch((e) => setError((e as Error).message || 'Failed to fetch orders'));
  }, [router, token]);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">My orders</h1>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {orders.map((order) => (
        <div key={order.id} className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="font-medium">Order #{order.id}</p>
            <span className="rounded bg-slate-100 px-2 py-1 text-xs">{order.status}</span>
          </div>
          <p className="mt-1 text-sm text-slate-600">Total: {formatMoney(order.totalAmountCents)}</p>
          <p className="text-sm text-slate-600">Payment: {order.paymentStatus}</p>
          <Link href={`/account/orders/${order.id}`} className="mt-3 inline-block text-sm text-blue-600">
            View details
          </Link>
        </div>
      ))}
      {orders.length === 0 && <p className="text-sm text-slate-500">No orders yet.</p>}
    </div>
  );
}
