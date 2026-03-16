'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { apiRequest } from '@/lib/api';
import type { User } from '@/lib/types';

type AuthState = {
  token: string | null;
  user: User | null;
  setSession: (token: string, user: User) => void;
  logout: () => void;
  refreshMe: () => Promise<void>;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      setSession: (token, user) => set({ token, user }),
      logout: () => set({ token: null, user: null }),
      refreshMe: async () => {
        const token = get().token;
        if (!token) return;
        const response = await apiRequest<{ user: User }>('/api/auth/me', { token });
        set({ user: response.user });
      },
    }),
    {
      name: 'eco-auth',
    }
  )
);
