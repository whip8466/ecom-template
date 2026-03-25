'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type CartItem = {
  productId: number;
  slug: string;
  name: string;
  priceCents: number;
  imageUrl?: string;
  /** Legacy simple color; also used as a human-readable option summary when variants are not used. */
  colorName?: string;
  variantId?: number;
  variantLabel?: string;
  quantity: number;
  /** Max purchasable qty when added (aligned with product / variant stock); caps quantity in cart. */
  availableStock?: number;
};

function isSameCartLine(a: CartItem, b: CartItem): boolean {
  if (a.productId !== b.productId) return false;
  if (a.variantId != null || b.variantId != null) {
    return a.variantId === b.variantId;
  }
  return (a.colorName ?? '') === (b.colorName ?? '');
}

type CartState = {
  items: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (index: number) => void;
  updateQuantity: (index: number, quantity: number) => void;
  clearCart: () => void;
};

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      addToCart: (item) =>
        set((state) => {
          if (item.availableStock === 0) return state;

          const cap = item.availableStock;
          const applyCap = (q: number) => {
            const n = Math.max(1, q);
            if (cap != null && Number.isFinite(cap) && cap > 0) return Math.min(n, cap);
            return n;
          };

          const existingIndex = state.items.findIndex((x) => isSameCartLine(x, item));
          if (existingIndex > -1) {
            const next = [...state.items];
            const mergedQty = next[existingIndex].quantity + item.quantity;
            next[existingIndex].quantity = applyCap(mergedQty);
            if (item.availableStock != null) {
              next[existingIndex].availableStock = item.availableStock;
            }
            return { items: next };
          }
          return { items: [...state.items, { ...item, quantity: applyCap(item.quantity) }] };
        }),
      removeFromCart: (index) =>
        set((state) => ({ items: state.items.filter((_, i) => i !== index) })),
      updateQuantity: (index, quantity) =>
        set((state) => {
          const next = [...state.items];
          const row = next[index];
          if (!row) return state;
          let q = Math.max(1, quantity);
          const cap = row.availableStock;
          if (cap != null && Number.isFinite(cap) && cap > 0) {
            q = Math.min(q, cap);
          }
          next[index].quantity = q;
          return { items: next };
        }),
      clearCart: () => set({ items: [] }),
    }),
    {
      name: 'eco-cart',
    }
  )
);
