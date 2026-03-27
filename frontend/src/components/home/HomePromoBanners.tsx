'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { apiRequest } from '@/lib/api';
import type { PromoBanner } from '@/lib/promo-banners';

function CtaLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href || '/shop'}
      className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-[#0989ff] transition hover:text-[#0670cc]"
    >
      {label || 'Shop Now'}
      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
      </svg>
    </Link>
  );
}

type Props = {
  /** Rows from GET /api/promo-banners (e.g. loaded in server `page.tsx` from the database). */
  initialBanners?: PromoBanner[];
};

export function HomePromoBanners({ initialBanners }: Props) {
  const [banners, setBanners] = useState<PromoBanner[]>(() => initialBanners ?? []);

  useEffect(() => {
    let cancelled = false;
    apiRequest<{ data: PromoBanner[] }>('/api/promo-banners')
      .then((res) => {
        if (!cancelled) setBanners(Array.isArray(res.data) ? res.data : []);
      })
      .catch(() => {
        if (!cancelled) setBanners((prev) => prev);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (banners.length === 0) {
    return null;
  }

  const gridClass =
    banners.length >= 2
      ? 'grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] lg:items-stretch lg:gap-5'
      : 'grid grid-cols-1';

  return (
    <section className="bg-white py-8 sm:py-10">
      <div className={`mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 ${gridClass}`}>
        {banners.map((b) => {
          const isAccent = String(b.styleVariant ?? 'neutral').toLowerCase() === 'accent';

          if (isAccent) {
            return (
              <article
                key={b.id}
                className="relative flex min-h-[200px] flex-col overflow-hidden rounded-xl bg-[#c5e3f7] shadow-sm sm:min-h-[220px] sm:flex-row sm:items-stretch"
              >
                <div className="flex flex-1 flex-col justify-center p-6 sm:p-7">
                  {b.eyebrowLabel ? (
                    <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#0989ff]">
                      {b.eyebrowLabel}
                    </p>
                  ) : null}
                  <h3
                    className={`text-lg font-bold leading-tight tracking-tight text-[#0f172a] sm:text-xl ${
                      b.eyebrowLabel ? 'mt-1' : ''
                    }`}
                  >
                    {b.title}
                  </h3>
                  {b.subtitle ? (
                    <span className="mt-3 inline-flex w-fit rounded-md bg-[#0f172a] px-3 py-1.5 text-xs font-semibold leading-none text-white">
                      {b.subtitle}
                    </span>
                  ) : null}
                  <CtaLink href={b.ctaHref} label={b.ctaLabel} />
                </div>
                {b.imageUrl ? (
                  <div className="flex shrink-0 items-end justify-center px-4 pb-5 pt-0 sm:w-[48%] sm:justify-end sm:px-5 sm:pb-6 sm:pt-6">
                    <div
                      className="h-36 w-full max-w-[200px] bg-contain bg-bottom bg-no-repeat sm:h-44 sm:max-w-[220px]"
                      style={{ backgroundImage: `url(${b.imageUrl})` }}
                      role="img"
                      aria-label={b.imageAlt || b.title}
                    />
                  </div>
                ) : (
                  <div className="hidden sm:block sm:w-12 sm:shrink-0" aria-hidden />
                )}
              </article>
            );
          }

          return (
            <article
              key={b.id}
              className="relative flex min-h-[220px] flex-col overflow-hidden rounded-xl bg-[#f2f2f4] shadow-sm sm:min-h-[260px] lg:min-h-[280px]"
            >
              <div className="relative z-1 flex flex-1 flex-col p-6 sm:flex-row sm:items-center sm:gap-6 sm:p-8 md:pl-10">
                <div className="min-w-0 flex-1">
                  {b.eyebrowLabel ? (
                    <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#0989ff]">
                      {b.eyebrowLabel}
                    </p>
                  ) : null}
                  {b.subtitle ? (
                    <p
                      className={`text-sm font-normal leading-snug text-[#64748b] ${
                        b.eyebrowLabel ? 'mt-1' : ''
                      }`}
                    >
                      {b.subtitle}
                    </p>
                  ) : null}
                  <h3
                    className={`text-2xl font-bold leading-snug tracking-tight text-[#0f172a] sm:text-[1.75rem] sm:leading-tight ${
                      b.subtitle || b.eyebrowLabel ? 'mt-2' : ''
                    }`}
                  >
                    {b.title}
                  </h3>
                  <CtaLink href={b.ctaHref} label={b.ctaLabel} />
                </div>
                {b.imageUrl ? (
                  <div className="relative z-1 mt-6 flex shrink-0 justify-center sm:mt-0 sm:w-[42%] sm:max-w-[320px] sm:justify-end">
                    <div
                      className="aspect-square w-full max-w-[260px] bg-contain bg-center bg-no-repeat sm:aspect-auto sm:h-44 sm:max-h-none md:h-52"
                      style={{ backgroundImage: `url(${b.imageUrl})` }}
                      role="img"
                      aria-label={b.imageAlt || b.title}
                    />
                  </div>
                ) : null}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
