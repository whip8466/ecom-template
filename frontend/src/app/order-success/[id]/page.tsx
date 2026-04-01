'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';

export default function OrderSuccessPage() {
  const params = useParams<{ id: string }>();

  return (
    <div className="rounded-xl border border-[var(--sf-input-border)] bg-[var(--card-bg)] p-6 shadow-[var(--shadow-sm)]">
      <h1 className="text-2xl font-semibold text-[var(--navy)]">Order placed successfully</h1>
      <p className="mt-2 text-sm text-[var(--muted)]">
        Order #{params.id} has been created.
      </p>
      <div className="mt-4 flex flex-wrap gap-3">
        <Link href="/account/orders" className="sf-btn-primary px-4 py-2 text-sm no-underline">
          View my orders
        </Link>
        <Link href="/" className="sf-btn-secondary px-4 py-2 text-sm no-underline">
          Continue shopping
        </Link>
      </div>
    </div>
  );
}
