'use client';

import Link from 'next/link';

const categories = [
  {
    name: 'Fashion',
    slug: 'fashion',
    image: 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=400&q=80',
    count: '120+',
  },
  {
    name: 'Beauty',
    slug: 'beauty',
    image: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400&q=80',
    count: '85+',
  },
  {
    name: 'Home Decor',
    slug: 'home-decor',
    image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&q=80',
    count: '200+',
  },
  {
    name: 'Lifestyle',
    slug: 'lifestyle',
    image: 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=400&q=80',
    count: '95+',
  },
  {
    name: 'Accessories',
    slug: 'accessories',
    image: 'https://images.unsplash.com/photo-1611652022419-a9419f74343a?w=400&q=80',
    count: '150+',
  },
];

export function FeaturedCategories() {
  return (
    <section className="border-b border-[var(--border)] bg-[var(--card-bg)] py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <p className="text-center text-xs font-medium uppercase tracking-[0.2em] text-[var(--muted)]">
          Shop by category
        </p>
        <h2 className="mt-2 text-center font-display text-3xl font-semibold text-[var(--navy)] sm:text-4xl">
          Featured Categories
        </h2>
        <div className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5">
          {categories.map((cat) => (
            <Link
              key={cat.slug}
              href={`/?category=${cat.slug}`}
              className="group flex flex-col items-center rounded-2xl p-6 transition-premium hover:bg-[var(--cream)] hover:shadow-[var(--shadow)]"
            >
              <div className="relative h-24 w-24 overflow-hidden rounded-full bg-[var(--cream)] sm:h-28 sm:w-28">
                <div
                  className="h-full w-full bg-cover bg-center transition-transform duration-300 group-hover:scale-110"
                  style={{ backgroundImage: `url(${cat.image})` }}
                />
              </div>
              <span className="mt-4 text-center text-sm font-medium text-[var(--navy)]">
                {cat.name}
              </span>
              <span className="mt-0.5 text-xs text-[var(--muted)]">{cat.count} products</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
