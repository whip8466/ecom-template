'use client';

import Link from 'next/link';
import { AdminPageShell } from '@/components/admin-shell';

export default function AdminAddOrderPlaceholderPage() {
  return (
    <AdminPageShell
      breadcrumbs={[
        { label: 'Admin', href: '/admin' },
        { label: 'Orders', href: '/admin/orders' },
        { label: 'Add order' },
      ]}
      title="Add order"
      description="Orders are created when customers check out on the storefront."
    >
      <div className="max-w-lg rounded-sm border border-[#e5ebf5] bg-white p-6 text-sm text-[#475569]">
        <p>
          There is no draft-order flow in this app yet. To create an order, sign in as a customer, add products to the cart from the shop, and complete checkout.
        </p>
        <p className="mt-4">
          <Link href="/shop" className="font-medium text-[#246bfd] hover:underline">
            Go to shop
          </Link>
          {' · '}
          <Link href="/admin/orders" className="font-medium text-[#246bfd] hover:underline">
            Back to orders
          </Link>
        </p>
      </div>
    </AdminPageShell>
  );
}
