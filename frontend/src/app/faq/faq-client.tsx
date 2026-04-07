'use client';

import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { FaqCategoryIcon } from '@/components/faq/faq-category-icon';
import { apiRequest } from '@/lib/api';
import type { FaqCategoryPublic } from '@/lib/faq';

function AnswerBody({ text }: { text: string }) {
  const blocks = text.trim().split(/\n\n+/);
  return (
    <div className="space-y-3 text-sm leading-relaxed text-[#475467]">
      {blocks.map((block, i) => (
        <p key={i} className="whitespace-pre-wrap">
          {block}
        </p>
      ))}
    </div>
  );
}

export function FaqClient() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const cParam = searchParams.get('c');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<FaqCategoryPublic[]>([]);
  const [activeSlug, setActiveSlug] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    apiRequest<{ data: FaqCategoryPublic[] }>('/api/faqs')
      .then((res) => {
        if (cancelled) return;
        const rows = Array.isArray(res.data) ? res.data : [];
        setCategories(rows);
      })
      .catch((e) => {
        if (!cancelled) {
          setError((e as Error).message);
          setCategories([]);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (categories.length === 0) {
      setActiveSlug(null);
      return;
    }
    const fromQuery = cParam && categories.some((r) => r.slug === cParam) ? cParam : null;
    setActiveSlug(fromQuery ?? categories[0].slug);
  }, [categories, cParam]);

  const active = useMemo(
    () => categories.find((cat) => cat.slug === activeSlug) ?? categories[0] ?? null,
    [categories, activeSlug],
  );

  if (loading) {
    return (
      <div className="py-20 text-center text-sm text-[var(--muted)]">Loading…</div>
    );
  }

  if (error) {
    return (
      <div className="py-20 text-center text-sm text-red-600">
        {error}
      </div>
    );
  }

  if (categories.length === 0) {
    return (
      <div className="py-20 text-center text-sm text-[var(--muted)]">
        No questions have been published yet. Please check back later.
      </div>
    );
  }

  return (
    <div className="pb-12 sm:pb-16">
      <header className="mb-8 sm:mb-10">
        <p className="text-xs font-medium uppercase tracking-[0.12em] text-[var(--muted)]">Help</p>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <h1 className="font-display text-2xl font-semibold tracking-tight text-[var(--navy)] sm:text-3xl">
            Frequently asked questions
          </h1>
        </div>
        <nav className="mt-3 text-sm text-[var(--muted)] sm:inline-flex sm:items-center sm:gap-2">
          <Link href="/" className="text-[var(--accent)] transition-premium hover:underline">
            Home
          </Link>
          <span className="hidden sm:inline" aria-hidden>
            /
          </span>
          <span className="text-[var(--foreground)]">FAQ</span>
        </nav>
      </header>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,260px)_1fr] lg:items-start lg:gap-10">
        <nav
          className="lg:sticky lg:top-28"
          aria-label="FAQ categories"
        >
          <ul className="flex flex-col gap-2 sm:flex-row sm:flex-wrap lg:flex-col">
            {categories.map((cat) => {
              const isActive = active?.slug === cat.slug;
              return (
                <li key={cat.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveSlug(cat.slug);
                      router.replace(`${pathname}?c=${encodeURIComponent(cat.slug)}`, { scroll: false });
                    }}
                    className={`flex w-full items-center gap-3 rounded-[var(--radius)] border px-3 py-3 text-left text-sm font-medium transition-premium ${
                      isActive
                        ? 'border-[var(--accent)] bg-[var(--card-bg)] text-[var(--navy)] shadow-[var(--shadow-sm)]'
                        : 'border-[var(--border)] bg-[var(--card-bg)] text-[#475467] hover:border-[var(--border)] hover:bg-[var(--cream)]'
                    }`}
                  >
                    <span
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border bg-white ${
                        isActive ? 'border-[var(--border)] text-[var(--accent)]' : 'border-[var(--border)] text-[#7c8ea6]'
                      }`}
                    >
                      <FaqCategoryIcon iconKey={cat.iconKey} className="h-4 w-4" />
                    </span>
                    <span className="min-w-0 leading-snug">{cat.title}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="min-w-0 space-y-4">
          {active ? (
            active.items.map((item) => (
              <article
                key={item.id}
                className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--card-bg)] p-5 shadow-[var(--shadow-sm)] sm:p-6"
              >
                <h2 className="font-display text-lg font-semibold text-[#0f1f40] sm:text-xl">
                  {item.question}
                </h2>
                <div className="mt-3 border-t border-[#f0f4fa] pt-3">
                  <AnswerBody text={item.answer} />
                </div>
              </article>
            ))
          ) : (
            <p className="text-sm text-[var(--muted)]">Select a category.</p>
          )}
        </div>
      </div>
    </div>
  );
}
