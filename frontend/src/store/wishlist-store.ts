'use client';

import { create } from 'zustand';
import { apiRequest } from '@/lib/api';
import { useAuthStore } from '@/store/auth-store';

/** Bumps when the user mutates the wishlist or clears it; stale in-flight GETs must not overwrite newer state. */
let wishlistFetchEpoch = 0;

export type WishlistItem = {
  productId: number;
  slug: string;
  name: string;
  priceCents: number;
  imageUrl?: string;
};

type WishlistState = {
  items: WishlistItem[];
  fetchWishlist: (token: string) => Promise<void>;
  clearWishlist: () => void;
  toggleWishlist: (item: WishlistItem) => Promise<void>;
  isInWishlist: (productId: number) => boolean;
};

export const useWishlistStore = create<WishlistState>()((set, get) => ({
  items: [],
  clearWishlist: () => {
    wishlistFetchEpoch += 1;
    try {
      localStorage.removeItem('eco-wishlist');
    } catch {
      /* ignore */
    }
    set({ items: [] });
  },
  fetchWishlist: async (token) => {
    const epoch = ++wishlistFetchEpoch;
    try {
      localStorage.removeItem('eco-wishlist');
    } catch {
      /* ignore */
    }
    const res = await apiRequest<{ data: WishlistItem[] }>('/api/user/wishlist', { token });
    if (epoch !== wishlistFetchEpoch) return;
    set({ items: res.data });
  },
  toggleWishlist: async (item) => {
    const token = useAuthStore.getState().token;
    if (!token) return;
    wishlistFetchEpoch += 1;
    const exists = get().items.some((x) => x.productId === item.productId);
    try {
      if (exists) {
        await apiRequest(`/api/user/wishlist/${item.productId}`, { method: 'DELETE', token });
        set((s) => ({ items: s.items.filter((x) => x.productId !== item.productId) }));
      } else {
        const res = await apiRequest<{ data: WishlistItem }>('/api/user/wishlist', {
          method: 'POST',
          body: JSON.stringify({ productId: item.productId }),
          token,
        });
        set((s) => ({
          items: [...s.items.filter((x) => x.productId !== res.data.productId), res.data],
        }));
      }
    } catch {
      await get().fetchWishlist(token);
    }
  },
  isInWishlist: (productId) => get().items.some((item) => item.productId === productId),
}));
