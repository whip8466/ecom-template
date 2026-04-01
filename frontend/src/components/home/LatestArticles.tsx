'use client';

import Link from 'next/link';

const posts = [
  {
    date: '14 January, 2026',
    title: 'The Modern Art Of Curated Living',
    category: 'Lifestyle',
    image: 'https://images.unsplash.com/photo-1463320726281-696a485928c7?w=900&q=80',
  },
  {
    date: '18 February, 2026',
    title: 'How fashion and climate can align',
    category: 'Fashion',
    image: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=900&q=80',
  },
  {
    date: '20 January, 2026',
    title: 'Sound, style, and the new luxury',
    category: 'Beauty',
    image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=900&q=80',
  },
];

export function LatestArticles() {
  return (
    <section className="border-b border-[var(--border)] bg-[var(--card-bg)] py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4">
          <h2 className="font-display text-3xl font-semibold text-[var(--navy)] sm:text-4xl">Latest news & articles</h2>
          <Link href="/blog" className="text-sm font-semibold text-[var(--accent)] transition-premium hover:text-[var(--accent-hover)]">
            View All Blog
          </Link>
        </div>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {posts.map((post) => (
            <article
              key={post.title}
              className="group overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border)] bg-white shadow-[var(--shadow-sm)] transition-premium hover:shadow-[var(--shadow)]"
            >
              <div className="aspect-[16/10] overflow-hidden bg-[var(--cream)]">
                <div
                  className="h-full w-full bg-cover bg-center transition-premium group-hover:scale-105"
                  style={{ backgroundImage: `url(${post.image})` }}
                />
              </div>
              <div className="p-6">
                <p className="text-xs uppercase tracking-wide text-[var(--muted)]">{post.date}</p>
                <h3 className="mt-2 font-display text-xl font-semibold text-[var(--navy)]">{post.title}</h3>
                <p className="mt-2 text-sm text-[var(--muted)]">{post.category}, News</p>
                <Link href="/" className="mt-4 inline-flex text-sm font-semibold text-[var(--accent)] transition-premium hover:text-[var(--accent-hover)]">
                  Read More
                </Link>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
