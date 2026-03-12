'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';

export default function OrderSuccessPage() {
  const params = useParams<{ id: string }>();

  return (
    <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-6">
      <h1 className="text-2xl font-semibold text-emerald-800">Order placed successfully</h1>
      <p className="mt-2 text-sm text-emerald-700">Order #{params.id} has been created.</p>
      <div className="mt-4 flex gap-3">
        <Link href="/account/orders" className="rounded-md bg-emerald-700 px-4 py-2 text-white">
          View my orders
        </Link>
        <Link href="/" className="rounded-md border border-emerald-700 px-4 py-2 text-emerald-700">
          Continue shopping
        </Link>
      </div>
    </div>
  );
}
