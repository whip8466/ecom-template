'use client';

import { useEffect, useState } from 'react';
import { apiRequest } from '@/lib/api';
import type { Product } from '@/lib/types';
import { HomeProductCard } from './HomeProductCard';

type ProductsResponse = {
  data: Product[];
};

export function NewArrivalsSection() {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await apiRequest<ProductsResponse>('/api/products?limit=5');
        if (!cancelled) setProducts(res.data.slice(0, 5));
      } catch {
        if (!cancelled) setProducts([]);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="border-b border-[var(--border)] bg-[var(--card-bg)] py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h2 className="font-display text-3xl font-semibold text-[var(--navy)] sm:text-4xl">New Arrivals</h2>
        {products.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-dashed border-[var(--border)] bg-[var(--cream)] p-8 text-center text-sm text-[var(--muted)]">
            No arrivals available. Start backend to load products.
          </div>
        ) : (
          <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-5">
            {products.map((product) => (
              <HomeProductCard key={product.id} product={product} badge="new" />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
