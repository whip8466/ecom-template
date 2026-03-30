'use client';

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { apiRequest } from '@/lib/api';
import type { User } from '@/lib/types';

type AuthState = {
  token: string | null;
  user: User | null;
  _hasHydrated: boolean;
  setSession: (token: string, user: User) => void;
  logout: () => void;
  setHasHydrated: (value: boolean) => void;
  refreshMe: () => Promise<void>;
};

/** No-op storage so persist middleware always mounts (SSR / blocked localStorage). */
const noopWebStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
} as unknown as Storage;

function getStorage(): Storage {
  if (typeof window === 'undefined') return noopWebStorage;
  try {
    return window.localStorage;
  } catch {
    return noopWebStorage;
  }
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      _hasHydrated: false,
      setSession: (token, user) => set({ token, user }),
      logout: () => set({ token: null, user: null }),
      setHasHydrated: (value) => set({ _hasHydrated: value }),
      refreshMe: async () => {
        const token = get().token;
        if (!token) return;
        const response = await apiRequest<{ user: User }>('/api/auth/me', { token });
        set({ user: response.user });
      },
    }),
    {
      name: 'eco-auth',
      storage: createJSONStorage(getStorage),
      onRehydrateStorage: () => () => {
        useAuthStore.getState().setHasHydrated(true);
      },
      partialize: (s) => ({ token: s.token, user: s.user }),
    }
  )
);
