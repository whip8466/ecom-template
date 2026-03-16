'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type CartItem = {
  productId: number;
  slug: string;
  name: string;
  priceCents: number;
  imageUrl?: string;
  colorName?: string;
  quantity: number;
};

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
          const existingIndex = state.items.findIndex(
            (x) => x.productId === item.productId && x.colorName === item.colorName
          );
          if (existingIndex > -1) {
            const next = [...state.items];
            next[existingIndex].quantity += item.quantity;
            return { items: next };
          }
          return { items: [...state.items, item] };
        }),
      removeFromCart: (index) =>
        set((state) => ({ items: state.items.filter((_, i) => i !== index) })),
      updateQuantity: (index, quantity) =>
        set((state) => {
          const next = [...state.items];
          next[index].quantity = Math.max(1, quantity);
          return { items: next };
        }),
      clearCart: () => set({ items: [] }),
    }),
    {
      name: 'eco-cart',
    }
  )
);
