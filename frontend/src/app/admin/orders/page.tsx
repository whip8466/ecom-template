'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiRequest } from '@/lib/api';
import { buildLoginRedirectHref } from '@/lib/auth-redirect';
import { useAuthStore } from '@/store/auth-store';
import type { Order } from '@/lib/types';
import { formatMoney } from '@/lib/format';

export default function AdminOrdersPage() {
  const router = useRouter();
  const { token, user } = useAuthStore();
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    if (!token) {
      router.push(buildLoginRedirectHref('/admin/orders'));
      return;
    }
    if (user?.role === 'CUSTOMER') {
      router.push('/');
      return;
    }

    apiRequest<{ data: Order[] }>('/api/admin/orders', { token })
      .then((res) => setOrders(res.data))
      .catch(() => undefined);
  }, [router, token, user]);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Order management</h1>
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="bg-slate-100">
            <tr>
              <th className="p-3">Order ID</th>
              <th className="p-3">Customer</th>
              <th className="p-3">Total</th>
              <th className="p-3">Status</th>
              <th className="p-3">Payment</th>
              <th className="p-3">Created</th>
              <th className="p-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id} className="border-t border-slate-100">
                <td className="p-3">#{order.id}</td>
                <td className="p-3">{order.user?.name} ({order.user?.email})</td>
                <td className="p-3">{formatMoney(order.totalAmountCents)}</td>
                <td className="p-3">{order.status}</td>
                <td className="p-3">{order.paymentStatus}</td>
                <td className="p-3">{new Date(order.createdAt).toLocaleDateString()}</td>
                <td className="p-3"><Link href={`/admin/orders/${order.id}`} className="text-blue-600">View</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
