'use client';

import Link from 'next/link';
import { withAuth } from '@/components/auth';
import { useWishlistStore } from '@/store/wishlist-store';
import { useCartStore } from '@/store/cart-store';
import { formatMoney } from '@/lib/format';

function WishlistPage() {
  const { items, toggleWishlist } = useWishlistStore();
  const addToCart = useCartStore((state) => state.addToCart);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-4xl font-semibold text-[#0f1f40]">Wishlist</h1>
      <p className="mt-2 text-sm text-[#7c8ea6]">
        <Link href="/" className="hover:text-[var(--sf-btn-primary-bg)]">Home</Link> / Wishlist
      </p>

      {items.length === 0 ? (
        <div className="mt-8 rounded-[var(--radius)] border border-dashed border-[var(--border)] bg-[var(--card-bg)] p-10 text-center">
          <p className="text-base text-[#475467]">Your wishlist is empty.</p>
          <Link
            href="/shop"
            className="sf-btn-primary mt-4 inline-flex px-5 py-2.5 text-sm no-underline"
          >
            Continue Shopping
          </Link>
        </div>
      ) : (
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {items.map((item) => (
            <article key={item.productId} className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--card-bg)] p-3">
              <Link href={`/products/${item.slug}`} className="block overflow-hidden rounded-[var(--radius)] bg-[var(--cream)]">
                <div
                  className="aspect-square bg-cover bg-center"
                  style={{ backgroundImage: `url(${item.imageUrl || ''})` }}
                />
              </Link>
              <h3 className="mt-3 text-sm font-semibold text-[#0f1f40]">
                <Link href={`/products/${item.slug}`} className="hover:text-[var(--sf-btn-primary-bg)]">
                  {item.name}
                </Link>
              </h3>
              <p className="mt-1 text-sm font-semibold text-[var(--sf-btn-primary-bg)]">{formatMoney(item.priceCents)}</p>

              <div className="mt-4 flex gap-2">
                <button
                  type="button"
                  onClick={() =>
                    addToCart({
                      productId: item.productId,
                      slug: item.slug,
                      name: item.name,
                      priceCents: item.priceCents,
                      imageUrl: item.imageUrl,
                      quantity: 1,
                    })
                  }
                  className="sf-btn-primary flex-1 px-3 py-2 text-xs"
                >
                  Add To Cart
                </button>
                <button
                  type="button"
                  onClick={() =>
                    toggleWishlist({
                      productId: item.productId,
                      slug: item.slug,
                      name: item.name,
                      priceCents: item.priceCents,
                      imageUrl: item.imageUrl,
                    })
                  }
                  className="sf-btn-secondary px-3 py-2 text-xs font-medium"
                >
                  Remove
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

export default withAuth(WishlistPage);
