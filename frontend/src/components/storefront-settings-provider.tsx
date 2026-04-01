'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { apiRequest } from '@/lib/api';
import type { ContactSettings } from '@/lib/contact-settings';

type StorefrontSettingsContextValue = {
  contactSettings: ContactSettings | null;
};

const StorefrontSettingsContext = createContext<StorefrontSettingsContextValue | null>(null);

export function useStorefrontSettings(): StorefrontSettingsContextValue {
  const ctx = useContext(StorefrontSettingsContext);
  if (!ctx) {
    throw new Error('useStorefrontSettings must be used within StorefrontSettingsProvider');
  }
  return ctx;
}

export function StorefrontSettingsProvider({ children }: { children: ReactNode }) {
  const [contactSettings, setContactSettings] = useState<ContactSettings | null>(null);

  const loadContactSettings = useCallback(async () => {
    try {
      const res = await apiRequest<{ data: ContactSettings }>('/api/contact-settings');
      setContactSettings(res.data ?? null);
    } catch {
      setContactSettings(null);
    }
  }, []);

  useEffect(() => {
    void loadContactSettings();
  }, [loadContactSettings]);

  const value = useMemo(() => ({ contactSettings }), [contactSettings]);

  return (
    <StorefrontSettingsContext.Provider value={value}>{children}</StorefrontSettingsContext.Provider>
  );
}
