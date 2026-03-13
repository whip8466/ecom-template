'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiRequest } from '@/lib/api';
import { formatMoney } from '@/lib/format';
import type { Product } from '@/lib/types';
import { MOCK_PRODUCTS } from '@/lib/mock-products';
import { useCartStore } from '@/store/cart-store';
import { useWishlistStore } from '@/store/wishlist-store';

type ProductsResponse = {
  data: Product[];
};

type ShopGridClientProps = {
  initialQuery: string;
  initialCategory: string;
};

export function ShopGridClient({ initialQuery, initialCategory }: ShopGridClientProps) {
  const router = useRouter();
  const { items: cartItems, addToCart } = useCartStore();
  const { items: wishlistItems, toggleWishlist } = useWishlistStore();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'default' | 'low' | 'high'>('default');
  const [maxPrice, setMaxPrice] = useState(0);
  const [minPrice, setMinPrice] = useState(0);
  const [priceLimit, setPriceLimit] = useState(0);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [onSaleOnly, setOnSaleOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [activeCategory, setActiveCategory] = useState(initialCategory);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 9;

  useEffect(() => {
    setSearchQuery(initialQuery);
  }, [initialQuery]);

  useEffect(() => {
    setActiveCategory(initialCategory);
  }, [initialCategory]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setLoading(true);
        const res = await apiRequest<ProductsResponse>('/api/products?limit=200');
        if (cancelled) return;
        const apiProducts = res.data ?? [];
        const nextProducts = [
          ...apiProducts,
          ...MOCK_PRODUCTS.filter(
            (dummyProduct) => !apiProducts.some((apiProduct) => apiProduct.slug === dummyProduct.slug),
          ),
        ];
        const computedMaxPrice = nextProducts.reduce(
          (max, product) => Math.max(max, product.priceCents),
          0,
        );
        setProducts(nextProducts);
        setMaxPrice(computedMaxPrice);
        setMinPrice(0);
        setPriceLimit(computedMaxPrice);
      } catch {
        if (!cancelled) {
          const computedMaxPrice = MOCK_PRODUCTS.reduce(
            (max, product) => Math.max(max, product.priceCents),
            0,
          );
          setProducts(MOCK_PRODUCTS);
          setMaxPrice(computedMaxPrice);
          setMinPrice(0);
          setPriceLimit(computedMaxPrice);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const categories = useMemo(() => {
    const map = new Map<string, number>();
    products.forEach((product) => {
      const key = product.category?.name || 'Uncategorized';
      map.set(key, (map.get(key) || 0) + 1);
    });
    return [...map.entries()]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [products]);

  const filteredProducts = useMemo(() => {
    const normalizedQuery = searchQuery.toLowerCase();
    const normalizedCategory = activeCategory.toLowerCase();

    const base = products.filter((product, index) => {
      const productName = product.name.toLowerCase();
      const categoryName = product.category?.name?.toLowerCase() || '';

      const matchesQuery =
        !normalizedQuery ||
        productName.includes(normalizedQuery) ||
        categoryName.includes(normalizedQuery);

      const matchesCategory =
        !normalizedCategory || categoryName.includes(normalizedCategory);

      const withinPrice = product.priceCents >= minPrice && product.priceCents <= priceLimit;
      const matchesStock = !inStockOnly || product.stock > 0;
      const matchesSale = !onSaleOnly || index % 3 === 0;

      return matchesQuery && matchesCategory && withinPrice && matchesStock && matchesSale;
    });

    if (sortBy === 'low') {
      return [...base].sort((a, b) => a.priceCents - b.priceCents);
    }
    if (sortBy === 'high') {
      return [...base].sort((a, b) => b.priceCents - a.priceCents);
    }
    return base;
  }, [activeCategory, inStockOnly, minPrice, onSaleOnly, priceLimit, products, searchQuery, sortBy]);

  const topRated = filteredProducts.slice(0, 4);
  const hasPriceFilter = maxPrice > 0 && (minPrice > 0 || priceLimit < maxPrice);
  const hasActiveFilters =
    !!searchQuery ||
    !!activeCategory ||
    inStockOnly ||
    onSaleOnly ||
    hasPriceFilter;
  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedProducts = filteredProducts.slice(startIndex, endIndex);
  const showingStart = filteredProducts.length === 0 ? 0 : startIndex + 1;
  const showingEnd = Math.min(endIndex, filteredProducts.length);
  const safeMaxPrice = Math.max(maxPrice, 1);
  const minPercent = (minPrice / safeMaxPrice) * 100;
  const maxPercent = (priceLimit / safeMaxPrice) * 100;

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, activeCategory, inStockOnly, onSaleOnly, minPrice, priceLimit, sortBy]);

  useEffect(() => {
    setCurrentPage((page) => Math.min(page, totalPages));
  }, [totalPages]);

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
                  setMinPrice(Math.min(nextMin, priceLimit));
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
                  setPriceLimit(Math.max(nextMax, minPrice));
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
              <input type="checkbox" checked={onSaleOnly} onChange={(e) => setOnSaleOnly(e.target.checked)} />
              On sale
            </label>
            <label className="mt-2 flex items-center gap-2 text-sm text-[#475467]">
              <input type="checkbox" checked={inStockOnly} onChange={(e) => setInStockOnly(e.target.checked)} />
              In stock
            </label>
          </section>

          <section className="rounded-md border border-[#e5ecf6] bg-white p-4">
            <h2 className="text-sm font-semibold text-[#12213f]">Categories</h2>
            <div className="mt-3 space-y-2 text-sm">
              <button
                type="button"
                onClick={() => setActiveCategory('')}
                className={`flex w-full items-center justify-between rounded px-2 py-1.5 text-left ${
                  activeCategory ? 'text-[#344054] hover:bg-[#f5f9ff]' : 'bg-[#0989ff]/10 font-semibold text-[#0989ff]'
                }`}
              >
                <span>All Categories</span>
                <span>{products.length}</span>
              </button>
              {categories.map((category) => (
                <button
                  key={category.name}
                  type="button"
                  onClick={() => setActiveCategory(category.name)}
                  className={`flex w-full items-center justify-between rounded px-2 py-1.5 text-left ${
                    activeCategory.toLowerCase() === category.name.toLowerCase()
                      ? 'bg-[#0989ff]/10 font-semibold text-[#0989ff]'
                      : 'text-[#344054] hover:bg-[#f5f9ff]'
                  }`}
                >
                  <span>{category.name}</span>
                  <span>{category.count}</span>
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

                {!!searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="inline-flex items-center gap-1 rounded-full border border-[#d6e2f1] px-3 py-1 text-xs font-medium text-[#1f2f4e] hover:bg-[#f5f9ff]"
                  >
                    Search: {searchQuery}
                    <span aria-hidden>×</span>
                  </button>
                )}

                {!!activeCategory && (
                  <button
                    type="button"
                    onClick={() => setActiveCategory('')}
                    className="inline-flex items-center gap-1 rounded-full border border-[#d6e2f1] px-3 py-1 text-xs font-medium text-[#1f2f4e] hover:bg-[#f5f9ff]"
                  >
                    Category: {activeCategory}
                    <span aria-hidden>×</span>
                  </button>
                )}

                {inStockOnly && (
                  <button
                    type="button"
                    onClick={() => setInStockOnly(false)}
                    className="inline-flex items-center gap-1 rounded-full border border-[#d6e2f1] px-3 py-1 text-xs font-medium text-[#1f2f4e] hover:bg-[#f5f9ff]"
                  >
                    In stock
                    <span aria-hidden>×</span>
                  </button>
                )}

                {onSaleOnly && (
                  <button
                    type="button"
                    onClick={() => setOnSaleOnly(false)}
                    className="inline-flex items-center gap-1 rounded-full border border-[#d6e2f1] px-3 py-1 text-xs font-medium text-[#1f2f4e] hover:bg-[#f5f9ff]"
                  >
                    On sale
                    <span aria-hidden>×</span>
                  </button>
                )}

                {hasPriceFilter && (
                  <button
                    type="button"
                    onClick={() => {
                      setMinPrice(0);
                      setPriceLimit(maxPrice);
                    }}
                    className="inline-flex items-center gap-1 rounded-full border border-[#d6e2f1] px-3 py-1 text-xs font-medium text-[#1f2f4e] hover:bg-[#f5f9ff]"
                  >
                    Price: {formatMoney(minPrice)} - {formatMoney(priceLimit)}
                    <span aria-hidden>×</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setActiveCategory('');
                    setInStockOnly(false);
                    setOnSaleOnly(false);
                    setMinPrice(0);
                    setPriceLimit(maxPrice);
                  }}
                  className="ml-auto text-xs font-semibold text-[#0989ff] hover:text-[#0476df]"
                >
                  Clear all filters
                </button>
              </div>
            </div>
          )}

          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-md border border-[#e5ecf6] bg-white px-4 py-2.5">
            <p className="text-sm text-[#67748a]">
              Showing {showingStart}-{showingEnd} of {filteredProducts.length} results
            </p>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'default' | 'low' | 'high')}
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
          ) : filteredProducts.length === 0 ? (
            <div className="rounded-md border border-dashed border-[#cdd9eb] bg-white p-10 text-center text-sm text-[#67748a]">
              No products found for your current filters.
            </div>
          ) : (
            <>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {paginatedProducts.map((product, index) => {
                const imageUrl = product.images?.[0]?.imageUrl || '';
                const isSale = (startIndex + index) % 3 === 0;
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
                          addToCart({
                            productId: product.id,
                            slug: product.slug,
                            name: product.name,
                            priceCents: product.priceCents,
                            imageUrl,
                            colorName: product.availableColors?.[0]?.colorName,
                            quantity: 1,
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
                        onClick={() =>
                          toggleWishlist({
                            productId: product.id,
                            slug: product.slug,
                            name: product.name,
                            priceCents: product.priceCents,
                            imageUrl,
                          })
                        }
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
                  onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                  disabled={currentPage === 1}
                  className="rounded border border-[#d7e4f6] px-3 py-1.5 text-sm text-[#344054] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Prev
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    type="button"
                    onClick={() => setCurrentPage(page)}
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
                  onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
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
