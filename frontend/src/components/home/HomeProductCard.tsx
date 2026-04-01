'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { effectiveAvailableStockForLine } from '@/lib/inventory';
import type { Product } from '@/lib/types';
import { buildLoginRedirectHref } from '@/lib/auth-redirect';
import { formatMoney } from '@/lib/format';
import { useAuthStore } from '@/store/auth-store';
import { useCartStore } from '@/store/cart-store';
import { useWishlistStore } from '@/store/wishlist-store';

type HomeProductCardProps = {
  product: Product;
  badge?: 'new' | 'sale';
  discountPercent?: number;
};

function StarRating() {
  return (
    <div className="flex gap-0.5 text-[var(--accent)]" aria-hidden>
      {[1, 2, 3, 4, 5].map((i) => (
        <svg key={i} className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
        </svg>
      ))}
    </div>
  );
}

export function HomeProductCard({ product, badge, discountPercent }: HomeProductCardProps) {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const { items: cartItems, addToCart } = useCartStore();
  const { items: wishlistItems, toggleWishlist } = useWishlistStore();
  const imageUrl = product.images?.[0]?.imageUrl || 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=600&q=80';
  const hasDiscount = discountPercent != null && discountPercent > 0;
  const discountedCents = hasDiscount
    ? Math.round(product.priceCents * (1 - discountPercent / 100))
    : product.priceCents;
  const inCart = cartItems.some((item) => item.productId === product.id);
  const inWishlist = wishlistItems.some((item) => item.productId === product.id);
  const cardAvailable = effectiveAvailableStockForLine(product, null);
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
      imageUrl,
    });
  };

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--card-bg)] shadow-[var(--shadow-sm)] transition-premium hover:-translate-y-1 hover:shadow-[var(--shadow-lg)]">
      <div className="relative block aspect-[4/5] overflow-hidden bg-[var(--cream)]">
        <Link href={`/products/${product.slug}`} className="absolute inset-0 z-0">
          <span className="sr-only">View {product.name}</span>
        </Link>
        <div
          className="h-full w-full bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
          style={{ backgroundImage: `url(${imageUrl})` }}
        />
        <div className="pointer-events-none absolute inset-x-4 bottom-4 translate-y-3 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
          <button
            type="button"
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
            className="pointer-events-auto w-full rounded-lg bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-white shadow-md transition-premium hover:bg-[var(--accent-hover)]"
          >
            {inCart ? 'View Cart' : 'Add to Cart'}
          </button>
        </div>

        <div className="absolute bottom-2 right-2 flex translate-x-2 flex-col overflow-hidden rounded border border-[#e6edf6] bg-white opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100">
          <button
            type="button"
            aria-label={inCart ? 'View cart' : 'Add to cart'}
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
            className={`relative h-11 w-11 border-b border-[#edf2f8] transition-premium ${
              inCart ? 'bg-[var(--accent)] text-white' : 'bg-white text-[var(--navy)] hover:bg-[var(--accent)] hover:text-white'
            }`}
          >
            <svg className="mx-auto h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 3h2l.4 2m0 0L7 13h10l1.6-8H5.4zM9 19a1 1 0 100 2 1 1 0 000-2zm8 0a1 1 0 100 2 1 1 0 000-2z" />
            </svg>
            <span className="pointer-events-none absolute -left-20 top-1/2 hidden -translate-y-1/2 whitespace-nowrap rounded bg-[#0f1f40] px-2 py-1 text-[10px] text-white group-hover:block">
              {inCart ? 'View Cart' : 'Add to Cart'}
            </span>
          </button>
          <button
            type="button"
            aria-label="Quick view"
            onClick={() => router.push(`/products/${product.slug}`)}
            className="relative h-11 w-11 border-b border-[#edf2f8] bg-white text-[var(--navy)] transition-premium hover:bg-[var(--accent)] hover:text-white"
          >
            <svg className="mx-auto h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            <span className="pointer-events-none absolute -left-20 top-1/2 hidden -translate-y-1/2 whitespace-nowrap rounded bg-[#0f1f40] px-2 py-1 text-[10px] text-white group-hover:block">
              Quick View
            </span>
          </button>
          <button
            type="button"
            aria-label="Add to wishlist"
            onClick={handleWishlistToggle}
            className={`relative h-11 w-11 transition-premium ${
              inWishlist ? 'bg-[var(--accent)] text-white' : 'bg-white text-[var(--navy)] hover:bg-[var(--accent)] hover:text-white'
            }`}
          >
            <svg className="mx-auto h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            <span className="pointer-events-none absolute -left-28 top-1/2 hidden -translate-y-1/2 whitespace-nowrap rounded bg-[#0f1f40] px-2 py-1 text-[10px] text-white group-hover:block">
              Add to Wishlist
            </span>
          </button>
        </div>

        {badge && (
          <span
            className={`absolute left-3 top-3 rounded-full px-3 py-1 text-xs font-semibold ${
              badge === 'sale' ? 'bg-red-500 text-white' : 'bg-[var(--accent)] text-white'
            }`}
          >
            {badge === 'sale' && discountPercent ? `-${discountPercent}%` : 'New'}
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col p-5">
        {product.category && (
          <p className="text-xs font-medium uppercase tracking-wider text-[var(--muted)]">
            {product.category.name}
          </p>
        )}
        <h3 className="mt-1 font-display text-lg font-semibold text-[var(--navy)] transition-premium group-hover:text-[var(--accent)]">
          <Link href={`/products/${product.slug}`}>{product.name}</Link>
        </h3>
        <div className="mt-2">
          <StarRating />
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="font-semibold text-[var(--navy)]">{formatMoney(discountedCents)}</span>
          {hasDiscount && (
            <span className="text-sm text-[var(--muted)] line-through">{formatMoney(product.priceCents)}</span>
          )}
        </div>
        <Link
          href={`/products/${product.slug}`}
          className="mt-4 inline-flex w-fit items-center gap-2 text-sm font-medium text-[var(--accent)] transition-premium hover:gap-3"
        >
          Shop Now
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
        </Link>
      </div>
    </article>
  );
}
