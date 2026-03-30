'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { apiRequest } from '@/lib/api';
import { buildLoginRedirectHref } from '@/lib/auth-redirect';
import { categoryInitials, type StorefrontCategory } from '@/lib/category-ui';
import { DealCountdown } from '@/components/deal/DealCountdown';
import { effectiveListPriceCents, formatMoney } from '@/lib/format';
import { effectiveAvailableStockForLine } from '@/lib/inventory';
import type { Product } from '@/lib/types';
import { useAuthStore } from '@/store/auth-store';
import { useCartStore } from '@/store/cart-store';
import { useWishlistStore } from '@/store/wishlist-store';
import { BlogPostCard } from '@/components/blog/BlogPostCard';
import { HomeBanner } from '@/components/home/HomeBanner';
import { HomePromoBanners } from '@/components/home/HomePromoBanners';
import type { BlogPostSummary } from '@/lib/blog';
import type { DealOfDayRow } from '@/lib/deal-of-day';
import type { PromoBanner } from '@/lib/promo-banners';

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
  dealEndsAt?: string;
  onDealEnd?: () => void;
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

function mapDealRowToCard(row: DealOfDayRow, onDealEnd?: () => void): ProductCardData {
  const p = row.product;
  const listCents = effectiveListPriceCents(p);
  const dealCents = row.deal.dealPriceCents;
  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    category: p.category?.name ?? 'Shop',
    priceCents: dealCents,
    price: formatMoney(dealCents),
    oldPrice: listCents !== dealCents ? formatMoney(listCents) : undefined,
    badge: 'Deal',
    image: p.images?.[0]?.imageUrl || '',
    availableStock: effectiveAvailableStockForLine(p, null),
    dealEndsAt: row.deal.endsAt,
    onDealEnd,
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
            <span
              className={`absolute left-2 top-2 rounded px-2 py-0.5 text-[10px] font-semibold text-white ${product.badge === 'New'
                  ? 'bg-[#0989ff]'
                  : product.badge === 'Deal'
                    ? 'bg-[#c2410c]'
                    : 'bg-[#eb5757]'
                }`}
            >
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
            className={`group/item relative grid h-12 w-12 place-items-center border-b border-[#edf2f8] transition ${inCart ? 'bg-[#0989ff] text-white' : 'text-[#0f1f40] hover:bg-[#0989ff] hover:text-white'
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
            className={`group/item relative grid h-12 w-12 place-items-center transition ${inWishlist ? 'bg-[#0989ff] text-white' : 'text-[#0f1f40] hover:bg-[#0989ff] hover:text-white'
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
      {product.dealEndsAt && (
        <div className="mt-1 flex items-center gap-1 text-[11px] font-medium text-[#c2410c]">
          <span>Ends in</span>
          <DealCountdown
            endsAt={product.dealEndsAt}
            onEnd={product.onDealEnd}
            className="text-[11px] text-[#c2410c]"
          />
        </div>
      )}
    </article>
  );
}

type TrendingTab = 'top_sellers' | 'featured' | 'new_arrival';

const TRENDING_TABS: { label: string; value: TrendingTab }[] = [
  { label: 'Top Sellers', value: 'top_sellers' },
  { label: 'Featured', value: 'featured' },
  { label: 'New Arrival', value: 'new_arrival' },
];

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

export function HomePageClient({
  initialPromoBanners,
  initialDealOfDay = [],
}: {
  initialPromoBanners: PromoBanner[];
  initialDealOfDay?: DealOfDayRow[];
}) {
  const [homeProducts, setHomeProducts] = useState<Product[]>([]);
  const [homeLoading, setHomeLoading] = useState(true);
  const [dealRows, setDealRows] = useState<DealOfDayRow[]>(initialDealOfDay);
  const [dealLoading, setDealLoading] = useState(initialDealOfDay.length === 0);
  const [trendingTab, setTrendingTab] = useState<TrendingTab>('top_sellers');
  const [trendingProducts, setTrendingProducts] = useState<Product[]>([]);
  const [trendingLoading, setTrendingLoading] = useState(true);
  const [categories, setCategories] = useState<StorefrontCategory[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [blogPreview, setBlogPreview] = useState<BlogPostSummary[]>([]);
  const [blogPreviewLoading, setBlogPreviewLoading] = useState(true);

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

  const refetchDeals = useCallback(() => {
    apiRequest<{ data: DealOfDayRow[] }>('/api/deal-of-day')
      .then((res) => {
        setDealRows(Array.isArray(res.data) ? res.data : []);
      })
      .catch(() => {
        setDealRows([]);
      });
  }, []);

  useEffect(() => {
    let cancelled = false;
    apiRequest<{ data: DealOfDayRow[] }>('/api/deal-of-day')
      .then((res) => {
        if (!cancelled) setDealRows(Array.isArray(res.data) ? res.data : []);
      })
      .catch(() => {
        if (!cancelled) setDealRows([]);
      })
      .finally(() => {
        if (!cancelled) setDealLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    setTrendingLoading(true);
    apiRequest<{ data: Product[] }>(`/api/products?limit=8&trending=${trendingTab}`)
      .then((res) => {
        if (!cancelled) setTrendingProducts(res.data ?? []);
      })
      .catch(() => {
        if (!cancelled) setTrendingProducts([]);
      })
      .finally(() => {
        if (!cancelled) setTrendingLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [trendingTab]);

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

  useEffect(() => {
    let cancelled = false;
    apiRequest<{ data: BlogPostSummary[] }>('/api/blog')
      .then((res) => {
        const rows = Array.isArray(res.data) ? res.data : [];
        if (!cancelled) setBlogPreview(rows.slice(0, 3));
      })
      .catch(() => {
        if (!cancelled) setBlogPreview([]);
      })
      .finally(() => {
        if (!cancelled) setBlogPreviewLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const productCards = useMemo(() => homeProducts.map(mapProductToCard), [homeProducts]);
  /** Only real deals from GET /api/deal-of-day — no fallback to random catalog products. */
  const dealCards = useMemo(
    () => dealRows.map((row) => mapDealRowToCard(row, refetchDeals)),
    [dealRows, refetchDeals],
  );
  const dealSectionLoading = dealLoading;

  const trendingCards = useMemo(() => trendingProducts.map(mapProductToCard), [trendingProducts]);

  const trendingEmptyMessage =
    trendingTab === 'featured'
      ? 'No featured products yet.'
      : trendingTab === 'new_arrival'
        ? 'No new arrivals yet.'
        : 'No products match this list yet.';

  const showDealSection = dealSectionLoading || dealRows.length > 0;

  return (
    <div className="bg-white">
      <HomeBanner />

      <section className="border-b border-[#e8eef5] bg-white py-8 sm:py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {categoriesLoading ? (
            <p className="py-4 text-center text-sm text-[#64748b]">Loading categories…</p>
          ) : categories.length === 0 ? (
            <p className="py-4 text-center text-sm text-[#64748b]">No categories yet.</p>
          ) : (
            <div className="flex flex-wrap justify-center gap-x-6 gap-y-8 sm:gap-x-8 md:gap-x-10 lg:gap-x-12">
              {categories
                .filter((item) => item.parentId == null)
                .map((item) => (
                  <Link
                    key={item.id}
                    href={`/shop?category=${encodeURIComponent(item.slug)}`}
                    className="flex w-[5.75rem] flex-shrink-0 flex-col items-center text-center transition hover:opacity-90 sm:w-[6.5rem] md:w-28"
                  >
                    <div className="flex h-[5.5rem] w-[5.5rem] items-center justify-center rounded-full bg-[#E8F4FF] p-2.5 sm:h-[6.25rem] sm:w-[6.25rem] sm:p-3">
                      {item.iconUrl ? (
                        <span
                          className="block h-full w-full rounded-full bg-contain bg-center bg-no-repeat"
                          style={{ backgroundImage: `url(${item.iconUrl})` }}
                          role="img"
                          aria-hidden
                        />
                      ) : (
                        <span className="text-xs font-semibold text-[#0989ff] sm:text-sm">
                          {categoryInitials(item.name)}
                        </span>
                      )}
                    </div>
                    <p className="mt-3 max-w-[9rem] text-sm font-bold leading-tight text-[#0f172a]">{item.name}</p>
                    <p className="mt-1 text-xs text-[#64748b]">
                      {(() => {
                        const n = item.productCount ?? 0;
                        return `${n} ${n === 1 ? 'Product' : 'Products'}`;
                      })()}
                    </p>
                  </Link>
                ))}
            </div>
          )}
        </div>
      </section>

      <section className="py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-2xl font-semibold text-[#1b2a4e]">Trending Products</h2>
            <div className="flex items-center gap-5 text-sm">
              {TRENDING_TABS.map(({ label, value }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setTrendingTab(value)}
                  className={
                    trendingTab === value ? 'font-semibold text-[#0989ff]' : 'text-[#6f829f] hover:text-[#1b2a4e]'
                  }
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            <HomeProductGrid
              loading={trendingLoading}
              emptyMessage={trendingEmptyMessage}
              cards={trendingCards}
              keyPrefix="trending"
            />
          </div>
        </div>
      </section>

      <HomePromoBanners initialBanners={initialPromoBanners} />

      {showDealSection ? (
        <section className="bg-[#f7fbff] py-10">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-2xl font-semibold text-[#1b2a4e]">Deal of The Day</h2>
              </div>
              <Link href="/shop" className="shrink-0 text-sm font-semibold text-[#0989ff] sm:pt-1">
                View All
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
              <HomeProductGrid
                loading={dealSectionLoading}
                emptyMessage="No active deals."
                cards={dealCards}
                keyPrefix="deal"
              />
            </div>
          </div>
        </section>
      ) : null}

      <section className="py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-6 flex items-center justify-between gap-3">
            <h2 className="text-2xl font-semibold text-[#1b2a4e]">Latest News &amp; Articles</h2>
            <Link href="/blog" className="shrink-0 text-sm font-semibold text-[#0989ff] hover:underline">
              View All Blog
            </Link>
          </div>
          {blogPreviewLoading ? (
            <p className="py-8 text-center text-sm text-[#64748b]">Loading articles…</p>
          ) : blogPreview.length === 0 ? (
            <p className="rounded-md border border-dashed border-[#cdd9eb] bg-[#f8fafc] py-10 text-center text-sm text-[#64748b]">
              No articles yet. Check back soon.
            </p>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 md:grid-cols-3">
              {blogPreview.map((p) => (
                <BlogPostCard
                  key={p.id}
                  slug={p.slug}
                  title={p.title}
                  publishedAt={p.publishedAt}
                  coverImageUrl={p.coverImageUrl}
                />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
