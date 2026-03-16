'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { buildLoginRedirectHref } from '@/lib/auth-redirect';
import { useAuthStore } from '@/store/auth-store';

export default function AdminDashboardPage() {
  const router = useRouter();
  const { token, user } = useAuthStore();

  useEffect(() => {
    if (!token) {
      router.push(buildLoginRedirectHref('/admin'));
      return;
    }
    if (user && user.role === 'CUSTOMER') {
      router.push('/');
    }
  }, [router, token, user]);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Admin dashboard</h1>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Link href="/admin/products" className="rounded-xl border border-slate-200 bg-white p-4 font-medium">Products</Link>
        <Link href="/admin/categories" className="rounded-xl border border-slate-200 bg-white p-4 font-medium">Categories</Link>
        <Link href="/admin/orders" className="rounded-xl border border-slate-200 bg-white p-4 font-medium">Orders</Link>
      </div>
    </div>
  );
}
