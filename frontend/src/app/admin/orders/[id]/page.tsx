'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { apiRequest } from '@/lib/api';
import { useAuthStore } from '@/store/auth-store';
import type { Order } from '@/lib/types';
import { formatMoney } from '@/lib/format';

const statuses = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];

export default function AdminOrderDetailsPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { token, user } = useAuthStore();
  const [order, setOrder] = useState<Order | null>(null);
  const [status, setStatus] = useState('PENDING');

  async function loadOrder() {
    if (!token) return;
    const res = await apiRequest<{ data: Order }>(`/api/admin/orders/${params.id}`, { token });
    setOrder(res.data);
    setStatus(res.data.status);
  }

  useEffect(() => {
    if (!token) {
      router.push('/login');
      return;
    }
    if (user?.role === 'CUSTOMER') {
      router.push('/');
      return;
    }

    loadOrder().catch(() => router.push('/admin/orders'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id, router, token, user]);

  async function updateStatus() {
    if (!token) return;
    await apiRequest(`/api/admin/orders/${params.id}/status`, {
      method: 'PATCH',
      token,
      body: JSON.stringify({ status }),
    });
    await loadOrder();
  }

  if (!order) return <p className="text-sm text-slate-600">Loading order...</p>;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Order #{order.id}</h1>
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <p className="font-medium">Customer</p>
        <p className="text-sm text-slate-600">{order.user?.name} ({order.user?.email})</p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <p className="font-medium">Shipping address</p>
        <p className="text-sm text-slate-600">
          {order.address.fullName}, {order.address.addressLine1}, {order.address.city}, {order.address.state}, {order.address.country}
        </p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <p className="font-medium">Items</p>
        {order.items.map((item) => (
          <div key={item.id} className="mt-2 border-t border-slate-100 pt-2 text-sm">
            <p>{item.productNameSnapshot} x {item.quantity}</p>
            <p className="text-slate-600">Color: {item.colorName || 'Default'}</p>
            <p>{formatMoney(item.subtotalCents)}</p>
          </div>
        ))}
        <p className="mt-2 font-semibold">Total: {formatMoney(order.totalAmountCents)}</p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <p className="font-medium">Update status</p>
        <div className="mt-2 flex gap-2">
          <select className="rounded border px-3 py-2" value={status} onChange={(e) => setStatus(e.target.value)}>
            {statuses.map((s) => <option key={s}>{s}</option>)}
          </select>
          <button className="rounded bg-slate-900 px-4 py-2 text-white" onClick={updateStatus}>Save</button>
        </div>
      </div>
    </div>
  );
}
