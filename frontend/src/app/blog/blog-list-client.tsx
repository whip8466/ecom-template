'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { BlogPostCard } from '@/components/blog/BlogPostCard';
import { apiRequest } from '@/lib/api';
import type { BlogPostSummary } from '@/lib/blog';

export function BlogListClient() {
  const searchParams = useSearchParams();
  const categorySlug = searchParams.get('category')?.trim() ?? '';
  const [posts, setPosts] = useState<BlogPostSummary[]>([]);
  const [categoryLabel, setCategoryLabel] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!categorySlug) {
      setCategoryLabel('');
      return;
    }
    let cancelled = false;
    apiRequest<{ data: { name: string; slug: string }[] }>('/api/blog/categories')
      .then((res) => {
        const rows = Array.isArray(res.data) ? res.data : [];
        const found = rows.find((c) => c.slug === categorySlug);
        if (!cancelled) setCategoryLabel(found?.name ?? categorySlug);
      })
      .catch(() => {
        if (!cancelled) setCategoryLabel(categorySlug);
      });
    return () => {
      cancelled = true;
    };
  }, [categorySlug]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    const path =
      categorySlug.length > 0
        ? `/api/blog?category=${encodeURIComponent(categorySlug)}`
        : '/api/blog';
    apiRequest<{ data: BlogPostSummary[] }>(path)
      .then((res) => {
        if (!cancelled) setPosts(Array.isArray(res.data) ? res.data : []);
      })
      .catch((e) => {
        if (!cancelled) {
          setError((e as Error).message);
          setPosts([]);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [categorySlug]);

  return (
    <section className="border-b border-[var(--border)] bg-[var(--card-bg)] py-10 sm:py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-[#1b2a4e] sm:text-[26px]">Latest News &amp; Articles</h1>
            {categorySlug ? (
              <p className="mt-2 text-sm text-[#64748b]">
                Category:{' '}
                <span className="font-medium text-[#1b2a4e]">{categoryLabel || categorySlug}</span>{' '}
                <Link href="/blog" className="font-semibold text-[var(--sf-btn-primary-bg)] hover:underline">
                  All posts
                </Link>
              </p>
            ) : (
              <p className="mt-2 text-sm text-[#64748b]">Stories, tips, and updates from our team.</p>
            )}
          </div>
        </div>

        {loading ? (
          <p className="py-12 text-center text-sm text-[#64748b]">Loading articles…</p>
        ) : null}
        {error ? <p className="py-8 text-center text-sm text-red-600">{error}</p> : null}

        {!loading && !error && posts.length === 0 ? (
          <p className="rounded-[var(--radius)] border border-dashed border-[var(--border)] bg-[var(--cream)] py-12 text-center text-sm text-[#64748b]">
            No articles yet. Check back soon.
          </p>
        ) : null}

        {!loading && !error && posts.length > 0 ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((p) => (
              <BlogPostCard
                key={p.id}
                slug={p.slug}
                title={p.title}
                publishedAt={p.publishedAt}
                coverImageUrl={p.coverImageUrl}
              />
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}
