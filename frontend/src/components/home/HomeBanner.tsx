'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { apiRequest } from '@/lib/api';
import { resolveHomeBannerCtaHref, type HomeBannerSlide } from '@/lib/home-banner';

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

  const cta = resolveHomeBannerCtaHref(slide.ctaHref);
  const ctaIsExternal = /^https?:\/\//i.test(cta);

  const shopNowClassName =
    'sf-btn-primary mt-7 inline-flex w-fit shrink-0 items-center gap-2 px-5 py-2.5 text-sm no-underline shadow-lg transition-premium focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white';

  return (
    <section
      className="group relative overflow-hidden bg-gradient-to-br from-[color-mix(in_srgb,var(--sf-btn-primary-hover)_55%,#0f172a)] via-[var(--sf-btn-primary-bg)] to-[color-mix(in_srgb,var(--sf-btn-primary-bg)_40%,#0f172a)]"
      role="region"
      aria-roledescription="carousel"
      aria-label="Featured promotions"
    >
      <div className="relative mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-12">
        <div className="grid min-h-[20rem] items-center gap-[1.8rem] sm:min-h-[22rem] lg:h-[26rem] lg:max-h-[26rem] lg:min-h-[26rem] lg:grid-cols-2 lg:gap-[2.7rem] lg:items-center lg:overflow-hidden">
          <div className="flex min-h-0 flex-col justify-center text-white lg:max-h-full lg:overflow-y-auto lg:pr-1">
            <p className="text-sm text-white/90">
              {slide.priceLine.split(/(\$[\d,.]+|₹[\d,]+)/).map((part, i) =>
                part.startsWith('$') || part.startsWith('₹') ? (
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
            {ctaIsExternal ? (
              <a href={cta} className={shopNowClassName} target="_blank" rel="noopener noreferrer">
                Shop Now
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </a>
            ) : (
              <Link href={cta} className={shopNowClassName}>
                Shop Now
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
            )}
          </div>
          <div className="flex h-[12.5rem] shrink-0 items-center justify-center sm:h-56 lg:h-[16rem] lg:max-h-[16rem] lg:justify-end xl:h-[18rem] xl:max-h-[18rem]">
            <img
              src={slide.imageUrl}
              alt={slide.imageAlt || slide.title}
              className="h-full max-h-full w-auto max-w-full object-contain object-center"
              loading={index === 0 ? 'eager' : 'lazy'}
              decoding="async"
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
