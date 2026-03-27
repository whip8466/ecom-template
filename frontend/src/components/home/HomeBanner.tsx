'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { apiRequest } from '@/lib/api';
import type { HomeBannerSlide } from '@/lib/home-banner';

export function HomeBanner() {
  const [slides, setSlides] = useState<HomeBannerSlide[]>([]);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    let cancelled = false;
    apiRequest<{ data: HomeBannerSlide[] }>('/api/home-banner')
      .then((res) => {
        if (cancelled || !Array.isArray(res.data)) return;
        setSlides(res.data);
        setIndex(0);
      })
      .catch(() => {
        if (!cancelled) setSlides([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const count = slides.length;
  const slide = slides[Math.min(index, Math.max(0, count - 1))] ?? slides[0];

  useEffect(() => {
    if (index >= count) setIndex(0);
  }, [count, index]);

  const go = useCallback(
    (next: number) => {
      if (count < 1) return;
      const i = ((next % count) + count) % count;
      setIndex(i);
    },
    [count],
  );

  const prev = useCallback(() => go(index - 1), [go, index]);
  const next = useCallback(() => go(index + 1), [go, index]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'ArrowRight') next();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [prev, next]);

  if (!slide || count === 0) {
    return null;
  }

  const cta = slide.ctaHref?.startsWith('/') ? slide.ctaHref : '/shop';

  return (
    <section
      className="group relative overflow-hidden bg-gradient-to-br from-[#0a5a72] via-[#0d6f8f] to-[#0a4d63]"
      role="region"
      aria-roledescription="carousel"
      aria-label="Featured promotions"
    >
      <div
        className="pointer-events-none absolute -right-16 bottom-0 top-0 w-1/2 opacity-[0.12]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200'%3E%3Cpath fill='%23ffffff' d='M160 20c20 40-10 90-50 110-30 15-60 5-80-15 50-30 90-50 130-95z'/%3E%3Cpath fill='%23ffffff' d='M180 120c-10 35-45 55-85 60 25-40 50-75 85-60z'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'right center',
          backgroundSize: '70% auto',
        }}
        aria-hidden
      />
      <div className="pointer-events-none absolute -right-24 top-0 h-72 w-72 rounded-full bg-[#0989ff]/15 blur-3xl" aria-hidden />

      <div className="relative mx-auto max-w-7xl px-4 py-[2.7rem] sm:px-6 lg:px-8 lg:py-[3.6rem]">
        <div
          key={index}
          className="grid items-center gap-[1.8rem] lg:grid-cols-2 lg:gap-[2.7rem]"
        >
          <div className="text-white">
            <p className="text-sm text-white/90">
              {slide.priceLine.split(/(\$[\d,.]+)/).map((part, i) =>
                part.startsWith('$') ? (
                  <strong key={i} className="font-semibold text-white">
                    {part}
                  </strong>
                ) : (
                  <span key={i}>{part}</span>
                ),
              )}
            </p>
            <h1 className="mt-2.5 max-w-xl font-display text-[1.62rem] font-bold leading-tight sm:text-[2.025rem] lg:text-[2.48rem] lg:leading-[1.15]">
              {slide.title}
            </h1>
            <p className="mt-3.5 max-w-lg text-base text-white/95">
              {slide.offerPrefix}
              <span className="relative mx-0.5 inline-block font-serif text-2xl font-medium italic text-amber-300 sm:text-3xl">
                {slide.offerHighlight}
                <span
                  className="absolute -bottom-0.5 left-0 right-0 mx-auto h-0.5 max-w-[95%] rounded-full bg-amber-300/90"
                  aria-hidden
                />
              </span>
              {slide.offerSuffix}
            </p>
            <Link
              href={cta}
              className="mt-7 inline-flex items-center gap-2 rounded-md bg-white px-5 py-2.5 text-sm font-semibold text-[#0d6f8f] shadow-lg transition hover:bg-[#f0f9ff]"
            >
              Shop Now
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>
          <div className="flex justify-center lg:justify-end">
            <div
              className="aspect-square w-full max-w-[min(100%,25.2rem)] rounded-2xl bg-cover bg-center shadow-2xl ring-1 ring-white/10"
              style={{ backgroundImage: `url(${slide.imageUrl})` }}
              role="img"
              aria-label={slide.imageAlt}
            />
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={prev}
        className="absolute left-2 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 text-white opacity-0 shadow-md backdrop-blur-sm pointer-events-none transition-opacity duration-200 hover:bg-white/25 group-hover:pointer-events-auto group-hover:opacity-100 focus-visible:pointer-events-auto focus-visible:opacity-100 max-md:pointer-events-auto max-md:opacity-100 sm:left-4 sm:h-11 sm:w-11"
        aria-label="Previous slide"
      >
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      <button
        type="button"
        onClick={next}
        className="absolute right-2 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 text-white opacity-0 shadow-md backdrop-blur-sm pointer-events-none transition-opacity duration-200 hover:bg-white/25 group-hover:pointer-events-auto group-hover:opacity-100 focus-visible:pointer-events-auto focus-visible:opacity-100 max-md:pointer-events-auto max-md:opacity-100 sm:right-4 sm:h-11 sm:w-11"
        aria-label="Next slide"
      >
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>

      <div className="relative z-10 flex justify-center gap-2 pb-3 pt-1.5" role="tablist" aria-label="Slide indicators">
        {slides.map((_, i) => (
          <button
            key={i}
            type="button"
            role="tab"
            aria-selected={i === index}
            aria-label={`Go to slide ${i + 1} of ${count}`}
            onClick={() => go(i)}
            className={`h-2.5 w-2.5 rounded-full transition sm:h-3 sm:w-3 ${
              i === index ? 'bg-white scale-110' : 'bg-white/35 hover:bg-white/55'
            }`}
          />
        ))}
      </div>
    </section>
  );
}
