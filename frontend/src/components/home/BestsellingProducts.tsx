'use client';

import { useEffect, useState } from 'react';
import { apiRequest } from '@/lib/api';
import type { Product } from '@/lib/types';
import { HomeProductCard } from './HomeProductCard';

type ProductsResponse = {
  data: Product[];
  pagination: { page: number; totalPages: number };
};

type TrendingTab = 'top_sellers' | 'featured' | 'new_arrival';

const tabs: { label: string; value: TrendingTab }[] = [
  { label: 'Top Sellers', value: 'top_sellers' },
  { label: 'Featured', value: 'featured' },
  { label: 'New Arrival', value: 'new_arrival' },
];

export function BestsellingProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [activeTab, setActiveTab] = useState<TrendingTab>('top_sellers');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setLoading(true);
        const res = await apiRequest<ProductsResponse>(
          `/api/products?limit=8&trending=${activeTab}`,
        );
        if (!cancelled) setProducts(res.data ?? []);
      } catch {
        if (!cancelled) setProducts([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [activeTab]);

  return (
    <section className="border-b border-[var(--border)] bg-[var(--card-bg)] py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h2 className="font-display text-3xl font-semibold text-[var(--navy)] sm:text-4xl">
          Trending Products
        </h2>
        <div className="mt-6 flex flex-wrap gap-4 border-b border-[var(--border)]">
          {tabs.map(({ label, value }) => (
            <button
              key={value}
              type="button"
              onClick={() => setActiveTab(value)}
              className={`border-b-2 pb-3 text-sm font-medium transition-premium ${
                activeTab === value
                  ? 'border-[var(--accent)] text-[var(--accent)]'
                  : 'border-transparent text-[var(--muted)] hover:text-[var(--navy)]'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="animate-pulse rounded-2xl border border-[var(--border)] bg-[var(--cream)]">
                <div className="aspect-[4/5] rounded-t-2xl bg-[var(--border)]" />
                <div className="space-y-3 p-5">
                  <div className="h-3 w-1/4 rounded bg-[var(--border)]" />
                  <div className="h-5 w-3/4 rounded bg-[var(--border)]" />
                  <div className="h-4 w-1/3 rounded bg-[var(--border)]" />
                </div>
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="mt-12 rounded-2xl border border-dashed border-[var(--border)] bg-[var(--cream)] py-16 text-center text-[var(--muted)]">
            <p>No products available right now.</p>
            <p className="mt-1 text-sm">Start the backend to load products.</p>
          </div>
        ) : (
          <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {products.slice(0, 8).map((product, i) => (
              <HomeProductCard
                key={product.id}
                product={product}
                badge={i % 4 === 0 ? 'new' : i % 4 === 2 ? 'sale' : undefined}
                discountPercent={i % 4 === 2 ? 15 : undefined}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
