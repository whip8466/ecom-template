'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useCartStore } from '@/store/cart-store';
import { formatMoney } from '@/lib/format';

export default function CartPage() {
  const { items, removeFromCart, updateQuantity, clearCart } = useCartStore();
  const [couponCode, setCouponCode] = useState('');
  const [shippingMethod, setShippingMethod] = useState<'flat' | 'pickup' | 'free'>('flat');

  const subTotal = items.reduce((sum, item) => sum + item.priceCents * item.quantity, 0);
  const shippingCents =
    shippingMethod === 'flat' ? 2000 : shippingMethod === 'pickup' ? 2500 : 0;
  const total = subTotal + shippingCents;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-4xl font-semibold text-[#0f1f40]">Shopping Cart</h1>
      <p className="mt-2 text-sm text-[#7c8ea6]">
        <Link href="/" className="hover:text-[var(--sf-btn-primary-bg)]">Home</Link> / Shopping Cart
      </p>

      {items.length === 0 ? (
        <div className="mt-10 rounded-md border border-dashed border-[#d5e1f1] bg-white p-10 text-center">
          <p className="text-base text-[#475467]">Your cart is currently empty.</p>
          <Link href="/shop" className="sf-btn-primary mt-4 inline-flex px-5 py-2.5 text-sm">
            Continue Shopping
          </Link>
        </div>
      ) : (
        <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
          <section>
            <div className="overflow-hidden rounded-md border border-[#e5ecf6] bg-white">
              <div className="grid grid-cols-[minmax(0,1fr)_120px_160px_120px] bg-[#f7f8fa] px-5 py-3 text-sm font-semibold text-[#111827]">
                <p>Product</p>
                <p>Price</p>
                <p>Quantity</p>
                <p />
              </div>

              {items.map((item, index) => (
                <div
                  key={`${item.productId}-${item.variantId ?? item.colorName ?? 'default'}-${index}`}
                  className="grid grid-cols-[minmax(0,1fr)_120px_160px_120px] items-center gap-2 border-t border-[#edf2f8] px-5 py-5"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className="h-16 w-16 rounded bg-[#f4f8ff] bg-cover bg-center"
                      style={{ backgroundImage: `url(${item.imageUrl || ''})` }}
                    />
                    <div>
                      <Link
                        href={`/products/${item.slug}`}
                        className="font-medium text-[#0f1f40] hover:text-[var(--sf-btn-primary-bg)]"
                      >
                        {item.name}
                      </Link>
                      {(item.variantLabel || item.colorName) && (
                        <p className="mt-1 text-xs text-[#7c8ea6]">
                          {item.variantLabel
                            ? `Options: ${item.variantLabel}`
                            : `Color: ${item.colorName}`}
                        </p>
                      )}
                    </div>
                  </div>
                  <p className="text-sm font-medium text-[#0f1f40]">{formatMoney(item.priceCents)}</p>

                  <div className="flex flex-col gap-1">
                    <div className="flex h-9 w-fit items-center rounded-full border border-[#d7e4f6]">
                      <button
                        type="button"
                        onClick={() => updateQuantity(index, item.quantity - 1)}
                        className="h-full w-9 text-[#0f1f40]"
                      >
                        -
                      </button>
                      <span className="w-8 text-center text-sm font-semibold text-[#0f1f40]">{item.quantity}</span>
                      <button
                        type="button"
                        disabled={
                          item.availableStock != null &&
                          item.quantity >= item.availableStock
                        }
                        onClick={() => updateQuantity(index, item.quantity + 1)}
                        className="h-full w-9 text-[#0f1f40] disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        +
                      </button>
                    </div>
                    {item.availableStock != null && item.availableStock >= 0 && (
                      <span className="text-xs text-[#94a3b8]">
                        Max {item.availableStock} in stock
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    className="text-sm text-[#667085] hover:text-[#ef4444]"
                    onClick={() => removeFromCart(index)}
                  >
                    × Remove
                  </button>
                </div>
              ))}
            </div>

            <div className="mt-4 flex flex-wrap items-end justify-between gap-3 rounded-md border border-[#e5ecf6] bg-white p-4">
              <div className="w-full max-w-md">
                <label htmlFor="coupon" className="sf-label mb-2">
                  Coupon Code:
                </label>
                <div className="flex gap-2">
                  <input
                    id="coupon"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    placeholder="Enter Coupon Code"
                    className="sf-field h-10 flex-1"
                  />
                  <button type="button" className="sf-btn-primary h-10 px-6 text-sm">
                    Apply
                  </button>
                </div>
              </div>

              <input
                type="button"
                value="Clear Cart"
                onClick={clearCart}
                className="sf-btn-secondary h-10 cursor-pointer px-5 text-sm"
              />
            </div>
          </section>

          <aside className="h-fit rounded-md border border-[#e5ecf6] bg-white p-5 shadow-[0_10px_30px_rgba(16,24,40,0.08)]">
            <div className="flex items-center justify-between border-b border-[#edf2f8] pb-3">
              <span className="text-lg font-semibold text-[#0f1f40]">Subtotal</span>
              <span className="text-lg font-semibold text-[#0f1f40]">{formatMoney(subTotal)}</span>
            </div>

            <div className="mt-4">
              <p className="text-sm font-semibold text-[#111827]">Shipping</p>
              <div className="mt-3 space-y-2 text-sm text-[#475467]">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="shipping"
                    className="accent-[var(--sf-checkbox-accent)]"
                    checked={shippingMethod === 'flat'}
                    onChange={() => setShippingMethod('flat')}
                  />
                  Flat rate:{' '}
                  <span className="text-[var(--sf-btn-primary-bg)]">{formatMoney(2000)}</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="shipping"
                    className="accent-[var(--sf-checkbox-accent)]"
                    checked={shippingMethod === 'pickup'}
                    onChange={() => setShippingMethod('pickup')}
                  />
                  Local pickup:{' '}
                  <span className="text-[var(--sf-btn-primary-bg)]">{formatMoney(2500)}</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="shipping"
                    className="accent-[var(--sf-checkbox-accent)]"
                    checked={shippingMethod === 'free'}
                    onChange={() => setShippingMethod('free')}
                  />
                  Free shipping
                </label>
              </div>
            </div>

            <div className="mt-5 flex items-center justify-between border-t border-[#edf2f8] pt-4">
              <span className="text-xl font-semibold text-[#0f1f40]">Total</span>
              <span className="text-xl font-semibold text-[#0f1f40]">{formatMoney(total)}</span>
            </div>

            <Link href="/checkout" className="sf-btn-primary mt-5 inline-flex w-full justify-center py-3 text-sm no-underline">
              Proceed to Checkout
            </Link>
          </aside>
        </div>
      )}
    </div>
  );
}
