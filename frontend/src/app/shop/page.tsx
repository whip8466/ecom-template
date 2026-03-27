import { Suspense } from 'react';
import { ShopGridClient } from '@/components/shop/ShopGridClient';

export default function ShopPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-7xl px-4 py-16 text-center text-sm text-[#67748a] sm:px-6 lg:px-8">
          Loading…
        </div>
      }
    >
      <ShopGridClient />
    </Suspense>
  );
}
