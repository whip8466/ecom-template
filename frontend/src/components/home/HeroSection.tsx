'use client';

import Link from 'next/link';

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-[#0e6b88] text-white">
      {/* Subtle pattern overlay */}
      <div
        className="absolute inset-0 opacity-[0.12]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Ccircle cx='10' cy='10' r='2'/%3E%3Ccircle cx='50' cy='20' r='2'/%3E%3Ccircle cx='70' cy='60' r='2'/%3E%3Ccircle cx='20' cy='70' r='2'/%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />
      <div className="relative mx-auto flex max-w-7xl flex-col items-center gap-8 px-4 py-12 sm:px-6 lg:flex-row lg:justify-between lg:py-16 lg:px-8">
        <div className="max-w-lg text-center lg:text-left">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-white/70">
            New Collection 2025
          </p>
          <h1 className="mt-3 font-display text-4xl font-semibold leading-tight sm:text-5xl">
            The best tablet
            <br />
            Collection 2026
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-white/80 sm:text-base">
            Exclusive offer -25% off this week.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4 lg:justify-start">
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-md bg-white px-6 py-3 text-sm font-semibold text-[#0e6b88] shadow-lg transition-premium hover:-translate-y-0.5"
            >
              Shop Now
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>
        </div>
        <div className="relative flex-shrink-0">
          <div className="relative h-64 w-64 sm:h-80 sm:w-80 lg:h-96 lg:w-96">
            <div
              className="absolute inset-0 rounded-2xl bg-cover bg-center shadow-2xl"
              style={{
                backgroundImage: 'url(https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?w=900&q=80)',
              }}
            />
            <div className="absolute -left-3 top-5 rounded bg-white px-2 py-1 text-xs font-semibold text-[#0e6b88]">
              Starting at $274.00
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
