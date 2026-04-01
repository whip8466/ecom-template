'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { apiRequest } from '@/lib/api';
import type { BlogPost } from '@/lib/blog';

export function BlogPostClient() {
  const params = useParams();
  const slug = typeof params?.slug === 'string' ? params.slug : '';
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    apiRequest<{ data: BlogPost }>(`/api/blog/${encodeURIComponent(slug)}`)
      .then((res) => {
        if (!cancelled) setPost(res.data);
      })
      .catch((e) => {
        if (!cancelled) {
          setError((e as Error).message);
          setPost(null);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (!slug) {
    return <p className="px-4 py-10 text-sm text-red-600">Invalid URL.</p>;
  }
  if (loading) {
    return <p className="mx-auto max-w-3xl px-4 py-10 text-sm text-[#64748b]">Loading…</p>;
  }
  if (error || !post) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10">
        <p className="text-sm text-red-600">{error ?? 'Post not found.'}</p>
        <Link href="/blog" className="mt-4 inline-block text-sm text-[var(--sf-btn-primary-bg)] hover:underline">
          ← Back to blog
        </Link>
      </div>
    );
  }

  return (
    <article className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <Link href="/blog" className="text-sm font-medium text-[var(--sf-btn-primary-bg)] hover:underline">
        ← Blog
      </Link>
      {post.category ? (
        <p className="mt-4 text-xs font-medium uppercase tracking-wide text-[var(--sf-btn-primary-bg)]">{post.category.name}</p>
      ) : null}
      <h1 className="mt-2 text-3xl font-semibold text-[#1b2a4e]">{post.title}</h1>
      {post.publishedAt ? (
        <p className="mt-2 text-sm text-[#64748b]">{new Date(post.publishedAt).toLocaleDateString()}</p>
      ) : null}
      {post.coverImageUrl ? (
        <div
          className="mt-6 aspect-[2/1] w-full rounded-md bg-[#f3f7ff] bg-cover bg-center"
          style={{ backgroundImage: `url(${post.coverImageUrl})` }}
          role="img"
          aria-hidden
        />
      ) : null}
      <div
        className="blog-html-content mt-8 text-base leading-relaxed text-[#334155]"
        dangerouslySetInnerHTML={{ __html: post.body }}
      />
    </article>
  );
}
