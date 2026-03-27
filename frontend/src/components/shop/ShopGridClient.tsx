'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { apiRequest } from '@/lib/api';
import { buildLoginRedirectHref } from '@/lib/auth-redirect';
import { formatMoney } from '@/lib/format';
import { effectiveAvailableStockForLine } from '@/lib/inventory';
import type { Product } from '@/lib/types';
import { useAuthStore } from '@/store/auth-store';
import { useCartStore } from '@/store/cart-store';
import { useWishlistStore } from '@/store/wishlist-store';

type ProductsResponse = {
  data: Product[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
};

type ShopMeta = {
  minPriceCents: number;
  maxPriceCents: number;
  totalProducts: number;
};

type CategoryRow = {
  id: number;
  name: string;
  slug: string;
  productCount: number;
};

const PAGE_SIZE = 9;

function parseNonNegativeInt(s: string | null, fallback: number): number {
  if (s == null || s === '') return fallback;
  const n = Number.parseInt(s, 10);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
}

function parsePage(s: string | null): number {
  const n = Number.parseInt(s || '1', 10);
  return Number.isFinite(n) && n > 0 ? n : 1;
}

/** Build API query from current URL-style params */
function buildProductsApiQuery(sp: URLSearchParams, limit: number): string {
  const p = new URLSearchParams();
  const q = sp.get('q')?.trim();
  const category = sp.get('category')?.trim();
  const minPrice = sp.get('minPrice')?.trim();
  const maxPrice = sp.get('maxPrice')?.trim();
  const inStock = sp.get('inStock');
  const sale = sp.get('sale');
  const sort = sp.get('sort')?.trim() || 'default';
  const page = parsePage(sp.get('page'));

  if (q) p.set('q', q);
  if (category) p.set('category', category);
  if (minPrice !== undefined && minPrice !== '') p.set('minPrice', minPrice);
  if (maxPrice !== undefined && maxPrice !== '') p.set('maxPrice', maxPrice);
  if (inStock === '1') p.set('inStock', '1');
  if (sale === '1') p.set('discount', '1');
  if (sort === 'low') p.set('sort', 'price_asc');
  else if (sort === 'high') p.set('sort', 'price_desc');
  else p.set('sort', 'default');
  p.set('page', String(page));
  p.set('limit', String(limit));
  return p.toString();
}

export function ShopGridClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const user = useAuthStore((state) => state.user);
  const { items: cartItems, addToCart } = useCartStore();
  const { items: wishlistItems, toggleWishlist } = useWishlistStore();

  const [products, setProducts] = useState<Product[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: PAGE_SIZE, total: 0, totalPages: 1 });
  const [topRated, setTopRated] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [shopMeta, setShopMeta] = useState<ShopMeta | null>(null);
  const [categories, setCategories] = useState<CategoryRow[]>([]);

  const catalogMaxPrice = shopMeta?.maxPriceCents ?? 0;

  const urlQ = searchParams.get('q')?.trim() ?? '';
  const urlCategory = searchParams.get('category')?.trim() ?? '';
  const urlMinPrice = parseNonNegativeInt(searchParams.get('minPrice'), 0);
  const urlMaxPriceRaw = searchParams.get('maxPrice');
  const urlMaxPrice =
    urlMaxPriceRaw != null && urlMaxPriceRaw !== ''
      ? parseNonNegativeInt(urlMaxPriceRaw, catalogMaxPrice || 1)
      : null;
  const urlInStock = searchParams.get('inStock') === '1';
  const urlSale = searchParams.get('sale') === '1';
  const urlSort = (searchParams.get('sort') || 'default') as 'default' | 'low' | 'high';

  const effectiveMaxForSlider =
    urlMaxPrice != null && catalogMaxPrice > 0 ? urlMaxPrice : catalogMaxPrice || 1;
  const minPrice = urlMinPrice;
  const priceLimit = catalogMaxPrice > 0 ? Math.min(effectiveMaxForSlider, catalogMaxPrice) : effectiveMaxForSlider;

  const pushParams = useCallback(
    (patch: Record<string, string | null | undefined>) => {
      const p = new URLSearchParams(searchParams.toString());
      Object.entries(patch).forEach(([k, v]) => {
        if (v === null || v === undefined || v === '') p.delete(k);
        else p.set(k, v);
      });
      const s = p.toString();
      router.replace(s ? `/shop?${s}` : '/shop', { scroll: false });
    },
    [router, searchParams]
  );

  useEffect(() => {
    let cancelled = false;
    apiRequest<{ data: CategoryRow[] }>('/api/categories')
      .then((res) => {
        if (!cancelled) setCategories(Array.isArray(res.data) ? res.data : []);
      })
      .catch(() => {
        if (!cancelled) setCategories([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    apiRequest<ShopMeta>('/api/shop-meta')
      .then((m) => {
        if (!cancelled) setShopMeta(m);
      })
      .catch(() => {
        if (!cancelled) setShopMeta({ minPriceCents: 0, maxPriceCents: 0, totalProducts: 0 });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const searchParamsKey = searchParams.toString();

  useEffect(() => {
    if (!shopMeta) return;
    const meta = shopMeta;
    let cancelled = false;
    async function load() {
      try {
        setLoading(true);
        const sp = new URLSearchParams(searchParamsKey);
        if (!sp.get('maxPrice') && meta.maxPriceCents > 0) {
          sp.set('maxPrice', String(meta.maxPriceCents));
        }
        const qMain = buildProductsApiQuery(sp, PAGE_SIZE);
        const spTop = new URLSearchParams(sp.toString());
        spTop.set('page', '1');
        const qTop = buildProductsApiQuery(spTop, 4);

        const [mainRes, topRes] = await Promise.all([
          apiRequest<ProductsResponse>(`/api/products?${qMain}`),
          apiRequest<ProductsResponse>(`/api/products?${qTop}`),
        ]);
        if (cancelled) return;
        setProducts(mainRes.data ?? []);
        setPagination(mainRes.pagination);
        setTopRated(topRes.data ?? []);
      } catch {
        if (!cancelled) {
          setProducts([]);
          setPagination({ page: 1, limit: PAGE_SIZE, total: 0, totalPages: 1 });
          setTopRated([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [searchParamsKey, shopMeta]);

  const hasPriceFilter =
    catalogMaxPrice > 0 && (urlMinPrice > 0 || (urlMaxPrice != null && urlMaxPrice < catalogMaxPrice));
  const hasActiveFilters =
    !!urlQ ||
    !!urlCategory ||
    urlInStock ||
    urlSale ||
    hasPriceFilter;

  const totalPages = pagination.totalPages;
  const currentPage = pagination.page;
  const total = pagination.total;
  const showingStart = total === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const showingEnd = Math.min(currentPage * PAGE_SIZE, total);

  const safeMaxPrice = Math.max(catalogMaxPrice, 1);
  const minPercent = (minPrice / safeMaxPrice) * 100;
  const maxPercent = (priceLimit / safeMaxPrice) * 100;

  const categoryNameLookup = useMemo(() => {
    const m = new Map<string, string>();
    categories.forEach((c) => m.set(c.slug, c.name));
    return m;
  }, [categories]);

  const handleWishlistToggle = (product: Product, imageUrl: string) => {
    if (!user) {
      router.push(buildLoginRedirectHref('/shop'));
      return;
    }
    toggleWishlist({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      priceCents: product.priceCents,
      imageUrl,
    });
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-semibold text-[#12213f]">Shop Grid</h1>
      <p className="mt-1 text-sm text-[#67748a]">
        <Link href="/" className="hover:text-[#0989ff]">Home</Link> / Shop Grid
      </p>

      <div className="mt-6 grid gap-8 lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="space-y-6">
          <section className="rounded-md border border-[#e5ecf6] bg-white p-4">
            <h2 className="text-sm font-semibold text-[#12213f]">Price Filter</h2>
            <div className="mt-3 relative h-10">
              <div className="absolute left-0 right-0 top-1/2 h-2 -translate-y-1/2 rounded bg-[#dbe2ec]" />
              <div
                className="absolute top-1/2 h-2 -translate-y-1/2 rounded bg-[#0989ff]"
                style={{
                  left: `${minPercent}%`,
                  width: `${Math.max(maxPercent - minPercent, 0)}%`,
                }}
              />
              <input
                type="range"
                min={0}
                max={safeMaxPrice}
                value={minPrice}
                onChange={(e) => {
                  const nextMin = Number(e.target.value);
                  const nextMax = Math.max(priceLimit, nextMin);
                  pushParams({
                    minPrice: String(nextMin),
                    maxPrice: String(nextMax),
                    page: '1',
                  });
                }}
                className="price-range-input z-20"
              />
              <input
                type="range"
                min={0}
                max={safeMaxPrice}
                value={priceLimit}
                onChange={(e) => {
                  const nextMax = Number(e.target.value);
                  const nextMin = Math.min(minPrice, nextMax);
                  pushParams({
                    minPrice: String(nextMin),
                    maxPrice: String(nextMax),
                    page: '1',
                  });
                }}
                className="price-range-input z-30"
              />
            </div>
            <div className="mt-2 flex items-center justify-between text-xs text-[#67748a]">
              <span>{formatMoney(minPrice)}</span>
              <span>{formatMoney(priceLimit)}</span>
            </div>
          </section>

          <section className="rounded-md border border-[#e5ecf6] bg-white p-4">
            <h2 className="text-sm font-semibold text-[#12213f]">Product Status</h2>
            <label className="mt-3 flex items-center gap-2 text-sm text-[#475467]">
              <input
                type="checkbox"
                checked={urlSale}
                onChange={(e) => pushParams({ sale: e.target.checked ? '1' : null, page: '1' })}
              />
              On sale
            </label>
            <label className="mt-2 flex items-center gap-2 text-sm text-[#475467]">
              <input
                type="checkbox"
                checked={urlInStock}
                onChange={(e) => pushParams({ inStock: e.target.checked ? '1' : null, page: '1' })}
              />
              In stock
            </label>
          </section>

          <section className="rounded-md border border-[#e5ecf6] bg-white p-4">
            <h2 className="text-sm font-semibold text-[#12213f]">Categories</h2>
            <div className="mt-3 space-y-2 text-sm">
              <button
                type="button"
                onClick={() => pushParams({ category: null, page: '1' })}
                className={`flex w-full items-center justify-between rounded px-2 py-1.5 text-left ${
                  urlCategory ? 'text-[#344054] hover:bg-[#f5f9ff]' : 'bg-[#0989ff]/10 font-semibold text-[#0989ff]'
                }`}
              >
                <span>All Categories</span>
                <span>{shopMeta?.totalProducts ?? 0}</span>
              </button>
              {categories.map((category) => (
                <button
                  key={category.slug}
                  type="button"
                  onClick={() => pushParams({ category: category.slug, page: '1' })}
                  className={`flex w-full items-center justify-between rounded px-2 py-1.5 text-left ${
                    urlCategory.toLowerCase() === category.slug.toLowerCase()
                      ? 'bg-[#0989ff]/10 font-semibold text-[#0989ff]'
                      : 'text-[#344054] hover:bg-[#f5f9ff]'
                  }`}
                >
                  <span>{category.name}</span>
                  <span>{category.productCount}</span>
                </button>
              ))}
            </div>
          </section>

          <section className="rounded-md border border-[#e5ecf6] bg-white p-4">
            <h2 className="text-sm font-semibold text-[#12213f]">Top Rated Products</h2>
            <div className="mt-3 space-y-3">
              {topRated.length === 0 ? (
                <p className="text-sm text-[#67748a]">No products found.</p>
              ) : (
                topRated.map((product) => (
                  <Link key={product.id} href={`/products/${product.slug}`} className="flex gap-3 rounded p-1 hover:bg-[#f8fbff]">
                    <div
                      className="h-14 w-14 rounded bg-[#f4f8ff] bg-cover bg-center"
                      style={{ backgroundImage: `url(${product.images?.[0]?.imageUrl || ''})` }}
                    />
                    <div>
                      <p className="text-[11px] text-[#f5a623]">★★★★★</p>
                      <p className="text-xs font-semibold text-[#12213f]">{product.name}</p>
                      <p className="text-xs text-[#0989ff]">{formatMoney(product.priceCents)}</p>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </section>
        </aside>

        <section>
          {hasActiveFilters && (
            <div className="mb-4 rounded-md border border-[#e5ecf6] bg-white px-4 py-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wide text-[#667085]">
                  Selected filters:
                </span>

                {!!urlQ && (
                  <button
                    type="button"
                    onClick={() => pushParams({ q: null })}
                    className="inline-flex items-center gap-1 rounded-full border border-[#d6e2f1] px-3 py-1 text-xs font-medium text-[#1f2f4e] hover:bg-[#f5f9ff]"
                  >
                    Search: {urlQ}
                    <span aria-hidden>×</span>
                  </button>
                )}

                {!!urlCategory && (
                  <button
                    type="button"
                    onClick={() => pushParams({ category: null })}
                    className="inline-flex items-center gap-1 rounded-full border border-[#d6e2f1] px-3 py-1 text-xs font-medium text-[#1f2f4e] hover:bg-[#f5f9ff]"
                  >
                    Category: {categoryNameLookup.get(urlCategory) || urlCategory}
                    <span aria-hidden>×</span>
                  </button>
                )}

                {urlInStock && (
                  <button
                    type="button"
                    onClick={() => pushParams({ inStock: null })}
                    className="inline-flex items-center gap-1 rounded-full border border-[#d6e2f1] px-3 py-1 text-xs font-medium text-[#1f2f4e] hover:bg-[#f5f9ff]"
                  >
                    In stock
                    <span aria-hidden>×</span>
                  </button>
                )}

                {urlSale && (
                  <button
                    type="button"
                    onClick={() => pushParams({ sale: null })}
                    className="inline-flex items-center gap-1 rounded-full border border-[#d6e2f1] px-3 py-1 text-xs font-medium text-[#1f2f4e] hover:bg-[#f5f9ff]"
                  >
                    On sale
                    <span aria-hidden>×</span>
                  </button>
                )}

                {hasPriceFilter && (
                  <button
                    type="button"
                    onClick={() =>
                      pushParams({
                        minPrice: null,
                        maxPrice: catalogMaxPrice > 0 ? String(catalogMaxPrice) : null,
                        page: '1',
                      })
                    }
                    className="inline-flex items-center gap-1 rounded-full border border-[#d6e2f1] px-3 py-1 text-xs font-medium text-[#1f2f4e] hover:bg-[#f5f9ff]"
                  >
                    Price: {formatMoney(minPrice)} - {formatMoney(priceLimit)}
                    <span aria-hidden>×</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => router.replace('/shop', { scroll: false })}
                  className="ml-auto text-xs font-semibold text-[#0989ff] hover:text-[#0476df]"
                >
                  Clear all filters
                </button>
              </div>
            </div>
          )}

          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-md border border-[#e5ecf6] bg-white px-4 py-2.5">
            <p className="text-sm text-[#67748a]">
              Showing {showingStart}-{showingEnd} of {total} results
            </p>
            <select
              value={urlSort}
              onChange={(e) =>
                pushParams({ sort: e.target.value === 'default' ? null : e.target.value, page: '1' })
              }
              className="rounded border border-[#dfe8f5] bg-white px-3 py-1.5 text-sm text-[#344054] outline-none"
            >
              <option value="default">Default sorting</option>
              <option value="low">Price: low to high</option>
              <option value="high">Price: high to low</option>
            </select>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="animate-pulse rounded-md border border-[#e5ecf6] bg-white p-3">
                  <div className="aspect-square rounded bg-[#edf3ff]" />
                  <div className="mt-3 h-3 w-1/3 rounded bg-[#edf3ff]" />
                  <div className="mt-2 h-4 w-2/3 rounded bg-[#edf3ff]" />
                  <div className="mt-2 h-3 w-1/2 rounded bg-[#edf3ff]" />
                </div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="rounded-md border border-dashed border-[#cdd9eb] bg-white p-10 text-center text-sm text-[#67748a]">
              No products found for your current filters.
            </div>
          ) : (
            <>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {products.map((product, index) => {
                const imageUrl = product.images?.[0]?.imageUrl || '';
                const isSale = (showingStart - 1 + index) % 3 === 0;
                const cardAvailable = effectiveAvailableStockForLine(product, null);
                const inCart = cartItems.some((item) => item.productId === product.id);
                const inWishlist = wishlistItems.some((item) => item.productId === product.id);
                return (
                  <article key={product.id} className="group relative rounded-md border border-[#e5ecf6] bg-white p-3">
                    <div className="relative overflow-hidden rounded bg-[#f4f8ff]">
                      <Link href={`/products/${product.slug}`} className="block">
                        <div className="aspect-square bg-cover bg-center transition duration-300 group-hover:scale-105" style={{ backgroundImage: `url(${imageUrl})` }} />
                        {isSale && (
                          <span className="absolute right-2 top-2 rounded bg-[#ff5a72] px-2 py-0.5 text-[10px] font-semibold text-white">
                            Out Of Stock
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
                          if (cardAvailable < 1) return;
                          addToCart({
                            productId: product.id,
                            slug: product.slug,
                            name: product.name,
                            priceCents: product.priceCents,
                            imageUrl,
                            colorName: product.availableColors?.[0]?.colorName,
                            quantity: 1,
                            availableStock: cardAvailable,
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
                        onClick={() => handleWishlistToggle(product, imageUrl)}
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

                    <p className="mt-3 text-xs text-[#667085]">{product.category?.name || 'Uncategorized'}</p>
                    <h3 className="mt-1 text-sm font-semibold text-[#12213f]">
                      <Link href={`/products/${product.slug}`} className="hover:text-[#0989ff]">{product.name}</Link>
                    </h3>
                    <p className="mt-1 text-xs text-[#f5a623]">★★★★★</p>
                    <p className="mt-1 text-sm font-semibold text-[#0989ff]">{formatMoney(product.priceCents)}</p>
                  </article>
                );
              })}
            </div>
            {totalPages > 1 && (
              <div className="mt-6 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => pushParams({ page: String(Math.max(1, currentPage - 1)) })}
                  disabled={currentPage === 1}
                  className="rounded border border-[#d7e4f6] px-3 py-1.5 text-sm text-[#344054] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Prev
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    type="button"
                    onClick={() => pushParams({ page: String(page) })}
                    className={`rounded px-3 py-1.5 text-sm ${
                      page === currentPage
                        ? 'bg-[#0989ff] font-semibold text-white'
                        : 'border border-[#d7e4f6] text-[#344054] hover:bg-[#f5f9ff]'
                    }`}
                  >
                    {page}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => pushParams({ page: String(Math.min(totalPages, currentPage + 1)) })}
                  disabled={currentPage === totalPages}
                  className="rounded border border-[#d7e4f6] px-3 py-1.5 text-sm text-[#344054] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            )}
            </>
          )}
        </section>
      </div>
    </div>
  );
}
