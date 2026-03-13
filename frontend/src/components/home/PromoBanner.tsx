'use client';

import Link from 'next/link';

export function PromoBanner() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-r from-[#ecf4ff] to-[#f8fbff] text-[var(--navy)]">
      <div
        className="absolute inset-0 opacity-[0.2]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%230989ff' fill-opacity='1' fill-rule='evenodd'%3E%3Cpath d='M0 40L40 0H20L0 20M40 20V40H20'/%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />
      <div className="relative mx-auto flex max-w-7xl flex-col items-center gap-8 px-4 py-16 sm:px-6 lg:flex-row lg:justify-between lg:py-20 lg:px-8">
        <div className="max-w-xl text-center lg:text-left">
          <p className="text-sm font-medium uppercase tracking-widest text-[var(--accent)]">
            Limited time offer
          </p>
          <h2 className="mt-2 font-display text-3xl font-semibold leading-tight sm:text-4xl lg:text-5xl">
            Smart Home, Smart Life.
          </h2>
          <p className="mt-4 text-base text-[var(--muted)]">
            Refresh your space with our curated home collection. Premium quality, delivered to your door.
          </p>
          <Link
            href="/"
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-[var(--accent)] px-8 py-4 font-semibold text-white shadow-lg transition-premium hover:-translate-y-0.5 hover:bg-[var(--accent-hover)] hover:shadow-xl"
          >
            Shop the Collection
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </div>
        <div className="relative flex-shrink-0">
          <div className="relative h-64 w-64 rounded-2xl sm:h-80 sm:w-80">
            <div
              className="absolute inset-0 rounded-2xl bg-cover bg-center shadow-2xl ring-4 ring-[var(--accent)]/15"
              style={{
                backgroundImage: 'url(https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80)',
              }}
            />
            <div className="absolute -bottom-2 -right-2 h-20 w-20 rounded-xl bg-[var(--accent)]" />
          </div>
        </div>
      </div>
    </section>
  );
}
