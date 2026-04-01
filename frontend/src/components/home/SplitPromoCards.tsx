'use client';

import Link from 'next/link';

const promoCards = [
  {
    tag: 'Sale 20% Off',
    title: 'Smartphone BLU G91 Pro 2026',
    image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=900&q=80',
  },
  {
    tag: 'Sale 35% Off',
    title: 'HyperX Cloud II Wireless',
    image: 'https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?w=900&q=80',
  },
];

export function SplitPromoCards() {
  return (
    <section className="border-b border-[var(--border)] bg-[var(--card-bg)] py-14 sm:py-16">
      <div className="mx-auto grid max-w-7xl gap-6 px-4 sm:grid-cols-2 sm:px-6 lg:px-8">
        {promoCards.map((card) => (
          <article
            key={card.title}
            className="group relative overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border)] bg-[#edf4ff] p-8 shadow-[var(--shadow-sm)] transition-premium hover:shadow-[var(--shadow)]"
          >
            <div
              className="absolute inset-0 bg-cover bg-center opacity-20 transition-premium group-hover:scale-105"
              style={{ backgroundImage: `url(${card.image})` }}
            />
            <div className="relative max-w-xs">
              <p className="text-xs font-semibold uppercase tracking-wider text-[var(--accent)]">{card.tag}</p>
              <h3 className="mt-2 font-display text-2xl font-semibold text-[var(--navy)]">{card.title}</h3>
              <Link
                href="/"
                className="mt-6 inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-[var(--navy)] shadow-sm transition-premium hover:bg-[var(--accent)] hover:text-white"
              >
                Shop Now
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
