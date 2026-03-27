'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { apiRequest } from '@/lib/api';
import { buildLoginRedirectHref } from '@/lib/auth-redirect';
import { categoryInitials, type StorefrontCategory } from '@/lib/category-ui';
import { formatMoney } from '@/lib/format';
import { effectiveAvailableStockForLine } from '@/lib/inventory';
import type { Product } from '@/lib/types';
import { useAuthStore } from '@/store/auth-store';
import { useCartStore } from '@/store/cart-store';
import { useWishlistStore } from '@/store/wishlist-store';
import { HomeBanner } from '@/components/home/HomeBanner';

type ProductCardData = {
  id: number;
  slug: string;
  name: string;
  category: string;
  priceCents: number;
  price: string;
  oldPrice?: string;
  badge?: string;
  image: string;
  availableStock?: number;
};

function mapProductToCard(p: Product): ProductCardData {
  const hasSale = p.salePriceCents != null && p.salePriceCents < p.priceCents;
  const lineCents = hasSale ? p.salePriceCents! : p.priceCents;
  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    category: p.category?.name ?? 'Shop',
    priceCents: lineCents,
    price: formatMoney(lineCents),
    oldPrice: hasSale ? formatMoney(p.priceCents) : undefined,
    badge: hasSale ? 'Sale' : undefined,
    image: p.images?.[0]?.imageUrl || '',
    availableStock: effectiveAvailableStockForLine(p, null),
  };
}

type MiniListItem = { name: string; slug: string; price: string; image: string };

function productToMiniItem(p: Product): MiniListItem {
  const hasSale = p.salePriceCents != null && p.salePriceCents < p.priceCents;
  const lineCents = hasSale ? p.salePriceCents! : p.priceCents;
  return {
    name: p.name,
    slug: p.slug,
    price: formatMoney(lineCents),
    image: p.images?.[0]?.imageUrl || '',
  };
}

function ProductCard({ product }: { product: ProductCardData }) {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const { items: cartItems, addToCart } = useCartStore();
  const { items: wishlistItems, toggleWishlist } = useWishlistStore();
  const inCart = cartItems.some((item) => item.productId === product.id);
  const inWishlist = wishlistItems.some((item) => item.productId === product.id);
  const handleWishlistToggle = () => {
    if (!user) {
      router.push(buildLoginRedirectHref('/'));
      return;
    }
    toggleWishlist({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      priceCents: product.priceCents,
      imageUrl: product.image,
    });
  };

  return (
    <article className="group relative rounded-md border border-[#e4ebf4] bg-white p-3 transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="relative overflow-hidden rounded-md bg-[#f3f7ff]">
        <Link href={`/products/${product.slug}`} className="block">
          <div
            className="aspect-square bg-cover bg-center transition duration-300 group-hover:scale-105"
            style={{ backgroundImage: `url(${product.image})` }}
          />
          {product.badge && (
            <span className={`absolute left-2 top-2 rounded px-2 py-0.5 text-[10px] font-semibold text-white ${product.badge === 'New' ? 'bg-[#0989ff]' : 'bg-[#eb5757]'}`}>
              {product.badge}
            </span>
          )}
        </Link>
        <div className="absolute bottom-2 right-2 z-20 flex translate-x-2 flex-col overflow-hidden rounded border border-[#e6edf6] bg-white opacity-0 shadow-md transition-all duration-200 group-hover:translate-x-0 group-hover:opacity-100">
        <button
          type="button"
          title={inCart ? 'View Cart' : 'Add To Cart'}
          onClick={() => {
            if (inCart) {
              router.push('/cart');
              return;
            }
            const cap = product.availableStock ?? 999;
            if (cap < 1) return;
            addToCart({
              productId: product.id,
              slug: product.slug,
              name: product.name,
              priceCents: product.priceCents,
              imageUrl: product.image,
              quantity: 1,
              availableStock: cap,
            });
          }}
          className={`group/item relative grid h-12 w-12 place-items-center border-b border-[#edf2f8] transition ${
            inCart ? 'bg-[#0989ff] text-white' : 'text-[#0f1f40] hover:bg-[#0989ff] hover:text-white'
          }`}
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 3h2l.4 2m0 0L7 13h10l1.6-8H5.4zM9 19a1 1 0 100 2 1 1 0 000-2zm8 0a1 1 0 100 2 1 1 0 000-2z" />
          </svg>
          <span className="pointer-events-none absolute -left-[86px] top-1/2 hidden -translate-y-1/2 whitespace-nowrap rounded bg-[#0f1f40] px-2 py-1 text-[10px] text-white group-hover/item:block">
            {inCart ? 'View Cart' : 'Add To Cart'}
          </span>
        </button>
        <button
          type="button"
          title="Quick View"
          onClick={() => router.push(`/products/${product.slug}`)}
          className="group/item relative grid h-12 w-12 place-items-center border-b border-[#edf2f8] text-[#0f1f40] transition hover:bg-[#0989ff] hover:text-white"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
          <span className="pointer-events-none absolute -left-[76px] top-1/2 hidden -translate-y-1/2 whitespace-nowrap rounded bg-[#0f1f40] px-2 py-1 text-[10px] text-white group-hover/item:block">
            Quick View
          </span>
        </button>
        <button
          type="button"
          title="Add to Wishlist"
          onClick={handleWishlistToggle}
          className={`group/item relative grid h-12 w-12 place-items-center transition ${
            inWishlist ? 'bg-[#0989ff] text-white' : 'text-[#0f1f40] hover:bg-[#0989ff] hover:text-white'
          }`}
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
          <span className="pointer-events-none absolute -left-[104px] top-1/2 hidden -translate-y-1/2 whitespace-nowrap rounded bg-[#0f1f40] px-2 py-1 text-[10px] text-white group-hover/item:block">
            Add to Wishlist
          </span>
        </button>
      </div>
      </div>
      <p className="mt-3 text-[11px] uppercase tracking-wide text-[#7c8ea6]">{product.category}</p>
      <h3 className="mt-1 text-sm font-semibold text-[#1b2a4e]">
        <Link href={`/products/${product.slug}`} className="hover:text-[#0989ff]">{product.name}</Link>
      </h3>
      <p className="mt-2 text-xs text-[#f5a623]">★★★★★</p>
      <div className="mt-1 flex items-center gap-2 text-sm">
        <span className="font-semibold text-[#0989ff]">{product.price}</span>
        {product.oldPrice && <span className="text-[#7c8ea6] line-through">{product.oldPrice}</span>}
      </div>
    </article>
  );
}

function SmallListCard({ title, items }: { title: string; items: MiniListItem[] }) {
  if (items.length === 0) {
    return (
      <article className="rounded-md border border-[#e4ebf4] bg-white p-4">
        <h3 className="text-base font-semibold text-[#1b2a4e]">{title}</h3>
        <p className="mt-4 text-xs text-[#7c8ea6]">No products to show.</p>
      </article>
    );
  }
  return (
    <article className="rounded-md border border-[#e4ebf4] bg-white p-4">
      <h3 className="text-base font-semibold text-[#1b2a4e]">{title}</h3>
      <div className="mt-4 space-y-3">
        {items.map((item) => (
          <Link key={`${title}-${item.slug}`} href={`/products/${item.slug}`} className="flex items-center gap-3 rounded-md border border-[#edf2f8] p-2 transition hover:bg-[#f7fbff]">
            <div
              className="h-14 w-14 flex-none rounded bg-cover bg-center"
              style={{ backgroundImage: `url(${item.image})` }}
            />
            <div>
              <p className="text-xs text-[#1b2a4e]">{item.name}</p>
              <p className="text-xs font-semibold text-[#0989ff]">{item.price}</p>
            </div>
          </Link>
        ))}
      </div>
    </article>
  );
}

function HomeProductGrid({
  loading,
  emptyMessage,
  cards,
  keyPrefix,
}: {
  loading: boolean;
  emptyMessage: string;
  cards: ProductCardData[];
  keyPrefix: string;
}) {
  if (loading) {
    return <p className="text-sm text-[#7c8ea6]">Loading products…</p>;
  }
  if (cards.length === 0) {
    return <p className="text-sm text-[#7c8ea6]">{emptyMessage}</p>;
  }
  return (
    <>
      {cards.map((product) => (
        <ProductCard key={`${keyPrefix}-${product.id}`} product={product} />
      ))}
    </>
  );
}

export default function HomePage() {
  const [homeProducts, setHomeProducts] = useState<Product[]>([]);
  const [homeLoading, setHomeLoading] = useState(true);
  const [categories, setCategories] = useState<StorefrontCategory[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    apiRequest<{ data: Product[] }>('/api/products?limit=12')
      .then((res) => {
        if (!cancelled) setHomeProducts(res.data ?? []);
      })
      .catch(() => {
        if (!cancelled) setHomeProducts([]);
      })
      .finally(() => {
        if (!cancelled) setHomeLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    apiRequest<{ data: StorefrontCategory[] }>('/api/categories')
      .then((res) => {
        if (!cancelled) setCategories(Array.isArray(res.data) ? res.data : []);
      })
      .catch(() => {
        if (!cancelled) setCategories([]);
      })
      .finally(() => {
        if (!cancelled) setCategoriesLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const productCards = useMemo(() => homeProducts.map(mapProductToCard), [homeProducts]);

  return (
    <div className="bg-white">
      <HomeBanner />

      <section className="border-b border-[#e4ebf4] py-7">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-4 px-4 sm:grid-cols-3 sm:px-6 lg:grid-cols-6 lg:px-8">
          {categoriesLoading ? (
            <div className="col-span-full flex justify-center py-4 text-sm text-[#7c8ea6]">Loading categories…</div>
          ) : categories.length === 0 ? (
            <div className="col-span-full text-center text-sm text-[#7c8ea6]">No categories yet.</div>
          ) : (
            categories.map((item) => (
              <Link
                key={item.id}
                href={`/shop?category=${encodeURIComponent(item.slug)}`}
                className="block text-center transition hover:opacity-90"
              >
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#f1f6ff] text-sm font-semibold tracking-wide text-[#0989ff]">
                  {categoryInitials(item.name)}
                </div>
                <p className="mt-2 text-sm font-medium text-[#1b2a4e]">{item.name}</p>
                <p className="text-xs text-[#7c8ea6]">Shop now</p>
              </Link>
            ))
          )}
        </div>
      </section>

      <section className="py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-2xl font-semibold text-[#1b2a4e]">Trending Products</h2>
            <div className="flex items-center gap-5 text-sm">
              <button type="button" className="font-semibold text-[#0989ff]">Top Sellers</button>
              <button type="button" className="text-[#6f829f]">Featured</button>
              <button type="button" className="text-[#6f829f]">New Arrival</button>
            </div>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            <HomeProductGrid
              loading={homeLoading}
              emptyMessage="No products in the catalog yet."
              cards={productCards}
              keyPrefix="trending"
            />
          </div>
        </div>
      </section>

      <section className="bg-[#f7fbff] py-8">
        <div className="mx-auto grid max-w-7xl gap-4 px-4 sm:grid-cols-2 sm:px-6 lg:px-8">
          <article className="rounded-md border border-[#e4ebf4] bg-white p-6">
            <p className="text-xs font-semibold uppercase text-[#0989ff]">Weekend Sale</p>
            <h3 className="mt-2 text-2xl font-semibold text-[#1b2a4e]">Smartphone BLU G91 Pro 2022</h3>
            <Link href="/" className="mt-5 inline-block text-sm font-semibold text-[#0989ff]">Shop Now</Link>
          </article>
          <article className="rounded-md border border-[#d8e7ff] bg-[#eaf3ff] p-6">
            <p className="text-xs font-semibold uppercase text-[#0989ff]">Holiday Offer</p>
            <h3 className="mt-2 text-2xl font-semibold text-[#1b2a4e]">HyperX Cloud II Wireless</h3>
            <Link href="/" className="mt-5 inline-block text-sm font-semibold text-[#0989ff]">Shop Now</Link>
          </article>
        </div>
      </section>

      <section className="py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-2xl font-semibold text-[#1b2a4e]">Deal of The Day</h2>
            <Link href="/" className="text-sm font-semibold text-[#0989ff]">View All</Link>
          </div>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            <HomeProductGrid
              loading={homeLoading}
              emptyMessage="No products in the catalog yet."
              cards={productCards.slice(0, 4)}
              keyPrefix="deal"
            />
          </div>
        </div>
      </section>

      <section className="bg-[#0d86f8] py-10">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <div className="text-white">
            <p className="text-xs uppercase tracking-[0.2em] text-white/70">Mega Offer</p>
            <h3 className="mt-2 text-2xl font-semibold">Galaxy Tab S9 Plus Android Tablet</h3>
          </div>
          <Link href="/" className="rounded bg-white px-5 py-2.5 text-sm font-semibold text-[#0d86f8]">Shop Now</Link>
        </div>
      </section>

      <section className="py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-semibold text-[#1b2a4e]">Popular Products</h2>
          <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            <HomeProductGrid
              loading={homeLoading}
              emptyMessage="No products in the catalog yet."
              cards={productCards}
              keyPrefix="popular"
            />
          </div>
        </div>
      </section>

      <section className="bg-[#f7fbff] py-10">
        <div className="mx-auto grid max-w-7xl gap-4 px-4 md:grid-cols-3 sm:px-6 lg:px-8">
          <SmallListCard title="Discount Products" items={homeProducts.slice(0, 3).map(productToMiniItem)} />
          <SmallListCard title="Featured Products" items={homeProducts.slice(3, 6).map(productToMiniItem)} />
          <SmallListCard title="Selling Products" items={homeProducts.slice(6, 9).map(productToMiniItem)} />
        </div>
      </section>

      <section className="py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-2xl font-semibold text-[#1b2a4e]">Latest News & Articles</h2>
            <Link href="/" className="text-sm font-semibold text-[#0989ff]">View All Blog</Link>
          </div>
          <div className="grid gap-5 md:grid-cols-3">
            {[
              'https://images.unsplash.com/photo-1489515217757-5fd1be406fef?w=900&q=80',
              'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=900&q=80',
              'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=900&q=80',
            ].map((image, index) => (
              <article key={image} className="overflow-hidden rounded-md border border-[#e4ebf4] bg-white">
                <div className="aspect-16/10 bg-cover bg-center" style={{ backgroundImage: `url(${image})` }} />
                <div className="p-4">
                  <p className="text-xs text-[#7c8ea6]">Jan 0{index + 1}, 2026</p>
                  <h3 className="mt-2 text-base font-semibold text-[#1b2a4e]">Latest smart gadgets for your daily setup</h3>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-[#d8e7ff] bg-[#0d86f8] py-6">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <p className="text-sm font-medium text-white">Subscribe our Newsletter and get updates every week</p>
          <form className="flex w-full max-w-md overflow-hidden rounded sm:w-auto">
            <input
              type="email"
              placeholder="Enter your email"
              className="w-full bg-white px-4 py-2 text-sm text-[#1b2a4e] outline-none"
            />
            <button type="submit" className="bg-[#1b2a4e] px-4 py-2 text-sm font-semibold text-white">
              Subscribe
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
