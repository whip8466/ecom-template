'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type WishlistItem = {
  productId: number;
  slug: string;
  name: string;
  priceCents: number;
  imageUrl?: string;
};

type WishlistState = {
  items: WishlistItem[];
  toggleWishlist: (item: WishlistItem) => void;
  isInWishlist: (productId: number) => boolean;
};

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      items: [],
      toggleWishlist: (item) =>
        set((state) => {
          const exists = state.items.some((x) => x.productId === item.productId);
          if (exists) {
            return { items: state.items.filter((x) => x.productId !== item.productId) };
          }
          return { items: [...state.items, item] };
        }),
      isInWishlist: (productId) => get().items.some((item) => item.productId === productId),
    }),
    {
      name: 'eco-wishlist',
    },
  ),
);
