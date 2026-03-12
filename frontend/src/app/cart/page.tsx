'use client';

import Link from 'next/link';
import { useCartStore } from '@/store/cart-store';
import { formatMoney } from '@/lib/format';

export default function CartPage() {
  const { items, removeFromCart, updateQuantity } = useCartStore();
  const total = items.reduce((sum, item) => sum + item.priceCents * item.quantity, 0);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Your cart</h1>
      {items.length === 0 && (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-500">
          Cart is empty.
        </div>
      )}
      {items.map((item, index) => (
        <div key={`${item.productId}-${item.colorName}-${index}`} className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div>
              <p className="font-medium">{item.name}</p>
              <p className="text-sm text-slate-500">Color: {item.colorName || 'Default'}</p>
              <p className="text-sm text-slate-500">{formatMoney(item.priceCents)}</p>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={1}
                value={item.quantity}
                onChange={(e) => updateQuantity(index, Number(e.target.value))}
                className="w-20 rounded-md border border-slate-300 px-2 py-1.5"
              />
              <button
                className="rounded-md border border-slate-300 px-3 py-1.5 text-sm"
                onClick={() => removeFromCart(index)}
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      ))}

      {items.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-lg font-semibold">Total: {formatMoney(total)}</p>
          <Link href="/checkout" className="mt-3 inline-block rounded-md bg-slate-900 px-4 py-2 text-white">
            Proceed to checkout
          </Link>
        </div>
      )}
    </div>
  );
}
