'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { apiRequest } from '@/lib/api';
import type { Product } from '@/lib/types';
import { formatMoney } from '@/lib/format';

type ProductsResponse = {
  data: Product[];
};

function Countdown({ endDate }: { endDate: Date }) {
  const [timeLeft, setTimeLeft] = useState(() => Math.max(0, endDate.getTime() - Date.now()));

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(Math.max(0, endDate.getTime() - Date.now()));
    }, 1000);
    return () => clearInterval(interval);
  }, [endDate]);

  const totalSeconds = Math.floor(timeLeft / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const units = [
    { label: 'Day', value: days },
    { label: 'Hrs', value: hours },
    { label: 'Min', value: minutes },
    { label: 'Sec', value: seconds },
  ];

  return (
    <div className="mt-4 grid grid-cols-4 gap-2 text-center">
      {units.map((unit) => (
        <div key={unit.label} className="rounded-lg bg-[var(--cream)] p-2">
          <p className="text-sm font-semibold text-[var(--navy)]">{String(unit.value).padStart(2, '0')}</p>
          <p className="text-[10px] uppercase tracking-wide text-[var(--muted)]">{unit.label}</p>
        </div>
      ))}
    </div>
  );
}

export function DealOfTheDay() {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await apiRequest<ProductsResponse>('/api/products?limit=4');
        if (!cancelled) setProducts(res.data.slice(0, 4));
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
    <section className="border-b border-[var(--border)] bg-[var(--cream)] py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4">
          <h2 className="font-display text-3xl font-semibold text-[var(--navy)] sm:text-4xl">Deal Of The Day</h2>
          <Link href="/" className="text-sm font-semibold text-[var(--accent)] transition-premium hover:text-[var(--accent-hover)]">
            View All Deals
          </Link>
        </div>

        {products.length === 0 ? (
          <div className="mt-8 rounded-[var(--radius-lg)] border border-dashed border-[var(--border)] bg-white p-8 text-center text-sm text-[var(--muted)]">
            No deal products found. Start backend to load live deals.
          </div>
        ) : (
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {products.map((product, i) => {
              const imageUrl =
                product.images?.[0]?.imageUrl ||
                'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=600&q=80';
              const discount = 10 + (i % 3) * 5;
              const dealPrice = Math.round(product.priceCents * (1 - discount / 100));
              const endDate = new Date(Date.now() + (48 + i * 9) * 60 * 60 * 1000);

              return (
                <article
                  key={product.id}
                  className="group overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border)] bg-white p-4 shadow-[var(--shadow-sm)] transition-premium hover:shadow-[var(--shadow)]"
                >
                  <div className="relative aspect-square overflow-hidden rounded-xl bg-[var(--cream)]">
                    <div
                      className="h-full w-full bg-cover bg-center transition-premium group-hover:scale-105"
                      style={{ backgroundImage: `url(${imageUrl})` }}
                    />
                    <span className="absolute left-3 top-3 rounded-full bg-[var(--accent)] px-2.5 py-1 text-[10px] font-semibold text-white">
                      -{discount}%
                    </span>
                  </div>
                  <p className="mt-4 text-xs uppercase tracking-wide text-[var(--muted)]">{product.category?.name}</p>
                  <h3 className="mt-1 font-display text-lg font-semibold text-[var(--navy)]">{product.name}</h3>
                  <p className="mt-2 text-sm">
                    <span className="font-semibold text-[var(--accent)]">{formatMoney(dealPrice)}</span>
                    <span className="ml-2 text-[var(--muted)] line-through">{formatMoney(product.priceCents)}</span>
                  </p>
                  <Countdown endDate={endDate} />
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
