'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { apiRequest } from '@/lib/api';
import {
  SOCIAL_FEED_FILTER_TABS,
  type SocialFeedContentType,
  type SocialFeedPayload,
  type SocialFeedPlatform,
  type SocialFeedPost,
} from '@/lib/social-feed';

function CtaLink({
  href,
  className,
  children,
}: {
  href: string;
  className?: string;
  children: React.ReactNode;
}) {
  const t = href.trim();
  if (!t) return null;
  if (t.startsWith('/')) {
    return (
      <Link href={t} className={className}>
        {children}
      </Link>
    );
  }
  return (
    <a href={t} target="_blank" rel="noopener noreferrer" className={className}>
      {children}
    </a>
  );
}

function PlatformIcon({ platform, className }: { platform: SocialFeedPlatform; className?: string }) {
  const cn = className ?? 'h-4 w-4';
  if (platform === 'YOUTUBE') {
    return (
      <svg className={cn} fill="currentColor" viewBox="0 0 24 24" aria-hidden>
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
      </svg>
    );
  }
  if (platform === 'INSTAGRAM') {
    return (
      <svg className={cn} fill="currentColor" viewBox="0 0 24 24" aria-hidden>
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
      </svg>
    );
  }
  return (
    <svg className={cn} fill="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

function PostCard({ post }: { post: SocialFeedPost }) {
  return (
    <article className="group flex flex-col overflow-hidden rounded-md border border-[#e5ecf6] bg-white shadow-[var(--shadow-sm)] transition-premium hover:border-[#0989ff]/40">
      <div className="relative aspect-[16/10] overflow-hidden bg-[#f1f5f9]">
        {post.thumbnailUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={post.thumbnailUrl}
            alt=""
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-[#94a3b8]">
            <PlatformIcon platform={post.platform} className="h-12 w-12 opacity-40" />
          </div>
        )}
        <span className="absolute left-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-white/95 text-[#475467] shadow-sm">
          <PlatformIcon platform={post.platform} />
        </span>
      </div>
      <div className="flex flex-1 flex-col p-4">
        <h3 className="font-display text-base font-semibold leading-snug text-[#0f1f40]">{post.title}</h3>
        <p className="mt-2 line-clamp-2 flex-1 text-sm leading-relaxed text-[#64748b]">{post.description}</p>
        <a
          href={post.externalUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-flex w-fit items-center gap-1.5 text-sm font-semibold text-[#0989ff] transition-premium hover:underline"
        >
          {post.ctaLabel}
          <span aria-hidden>→</span>
        </a>
      </div>
    </article>
  );
}

export function SocialFeedClient() {
  const [data, setData] = useState<SocialFeedPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | SocialFeedContentType>('all');

  useEffect(() => {
    let cancelled = false;
    apiRequest<{ data: SocialFeedPayload }>('/api/social-feed')
      .then((res) => {
        if (!cancelled) setData(res.data ?? null);
      })
      .catch(() => {
        if (!cancelled) setData(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const filteredPosts = useMemo(() => {
    if (!data?.posts) return [];
    if (filter === 'all') return data.posts;
    return data.posts.filter((p) => p.contentType === filter);
  }, [data?.posts, filter]);

  if (loading) {
    return (
      <div className="py-20 text-center text-sm text-[var(--muted)]">
        Loading…
      </div>
    );
  }

  if (!data) {
    return (
      <div className="py-20 text-center text-sm text-[var(--muted)]">
        Social feed is unavailable. Please try again later.
      </div>
    );
  }

  const { settings, featured } = data;
  const heroTitle = settings.heroTitle || 'Our Journey';
  const midCtaTitle = settings.ctaSectionTitle?.trim() || 'Love what you see?';

  return (
    <div className="pb-12 sm:pb-16">
      <header className="mb-8 text-center sm:mb-10 sm:text-left">
        <p className="text-xs font-medium uppercase tracking-[0.12em] text-[var(--muted)]">Social feed</p>
        <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight text-[var(--navy)] sm:text-3xl">
          {heroTitle}
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-[#64748b] sm:mx-0 sm:text-base">
          {settings.heroSubtitle}
        </p>
        <nav className="mt-5 text-sm text-[var(--muted)] sm:inline-flex sm:items-center sm:gap-2">
          <Link href="/" className="text-[var(--accent)] transition-premium hover:underline">
            Home
          </Link>
          <span className="hidden sm:inline" aria-hidden>
            /
          </span>
          <span className="text-[var(--foreground)]">Social feed</span>
        </nav>
      </header>

      {featured ? (
        <section className="mb-10 overflow-hidden rounded-md border border-[#e5ecf6] bg-white shadow-[var(--shadow-sm)]">
          <div className="grid gap-0 lg:grid-cols-[1.1fr_1fr]">
            <div className="relative aspect-[16/10] min-h-[200px] bg-[#f1f5f9] lg:aspect-auto lg:min-h-[280px]">
              {featured.thumbnailUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={featured.thumbnailUrl}
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full min-h-[200px] items-center justify-center text-[#94a3b8]">
                  <PlatformIcon platform={featured.platform} className="h-16 w-16 opacity-35" />
                </div>
              )}
              <span className="absolute left-3 top-3 rounded-full bg-white/95 px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-[#475467] shadow-sm">
                Featured
              </span>
            </div>
            <div className="flex flex-col justify-center p-6 sm:p-8">
              <p className="text-xs font-medium uppercase tracking-wide text-[#7c8ea6]">Highlight</p>
              <h2 className="mt-2 font-display text-xl font-semibold text-[#0f1f40] sm:text-2xl">{featured.title}</h2>
              <p className="mt-3 text-sm leading-relaxed text-[#64748b]">{featured.description}</p>
              <a
                href={featured.externalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-6 inline-flex w-fit items-center gap-2 rounded-md bg-[#0989ff] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#0476df]"
              >
                {featured.ctaLabel}
              </a>
            </div>
          </div>
        </section>
      ) : null}

      <section className="mb-6">
        <p className="mb-3 text-xs font-medium uppercase tracking-wide text-[#7c8ea6]">Browse by type</p>
        <div className="flex flex-wrap gap-2">
          {SOCIAL_FEED_FILTER_TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setFilter(tab.key)}
              className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition-premium ${
                filter === tab.key
                  ? 'border-[#0989ff] bg-[#0989ff] text-white'
                  : 'border-[#e5ecf6] bg-white text-[#475467] hover:border-[#0989ff]/50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </section>

      <section className="mb-12">
        {filteredPosts.length === 0 ? (
          <p className="rounded-md border border-dashed border-[#e5ecf6] bg-[#f8fafc] py-12 text-center text-sm text-[#64748b]">
            No posts in this category yet.
          </p>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filteredPosts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        )}
      </section>

      <section className="mb-12 rounded-md border border-[#e5ecf6] bg-white p-8 text-center shadow-[var(--shadow-sm)] sm:p-10">
        <h2 className="font-display text-xl font-semibold text-[#0f1f40]">{midCtaTitle}</h2>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          {settings.ctaShopUrl ? (
            <CtaLink
              href={settings.ctaShopUrl}
              className="inline-flex rounded-md bg-[#0989ff] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#0476df]"
            >
              Shop products
            </CtaLink>
          ) : null}
          {settings.ctaFollowUrl ? (
            <CtaLink
              href={settings.ctaFollowUrl}
              className="inline-flex rounded-md border border-[#d7e4f6] bg-white px-5 py-2.5 text-sm font-semibold text-[#0f1f40] hover:border-[#0989ff]"
            >
              Follow us
            </CtaLink>
          ) : null}
          {settings.ctaCommunityUrl ? (
            <CtaLink
              href={settings.ctaCommunityUrl}
              className="inline-flex rounded-md border border-[#d7e4f6] bg-white px-5 py-2.5 text-sm font-semibold text-[#0f1f40] hover:border-[#0989ff]"
            >
              Join community
            </CtaLink>
          ) : null}
        </div>
      </section>
    </div>
  );
}
