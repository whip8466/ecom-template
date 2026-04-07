'use client';

import { useCallback, useEffect, useState } from 'react';
import { AdminPageShell } from '@/components/admin-shell';
import { ThemeInputsSection } from '@/components/admin/storefront-theme/ThemeInputsSection';
import { apiRequest } from '@/lib/api';
import type { ContactSettings } from '@/lib/contact-settings';
import {
  DEFAULT_STOREFRONT_THEME,
  mergeStorefrontTheme,
  themeTokensToJson,
  type StorefrontThemeTokens,
} from '@/lib/storefront-theme';
import { useAuthStore } from '@/store/auth-store';

const crumbs = [
  { label: 'Home', href: '/admin' as const },
  { label: 'Theme' },
  { label: 'Inputs' },
];

export default function AdminThemeInputsPage() {
  const token = useAuthStore((s) => s.token);
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [t, setT] = useState<StorefrontThemeTokens>(() => ({ ...DEFAULT_STOREFRONT_THEME }));

  const patch = useCallback((p: Partial<StorefrontThemeTokens>) => {
    setT((prev) => ({ ...prev, ...p }));
  }, []);

  useEffect(() => {
    setMounted(true);
  }, []);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const res = await apiRequest<{ data: ContactSettings }>('/api/contact-settings', { token });
      if (res.data) {
        setT(mergeStorefrontTheme(res.data.themeJson));
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (!mounted || !token) return;
    void load();
  }, [mounted, token, load]);

  const save = async () => {
    if (!token) return;
    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      await apiRequest<{ data: ContactSettings }>('/api/admin/theme-settings', {
        method: 'PATCH',
        body: JSON.stringify({ themeJson: themeTokensToJson(t) }),
        token,
      });
      setMessage('Theme saved. The storefront will use these controls on the next page load.');
      await load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const resetDefaults = () => {
    setT({ ...DEFAULT_STOREFRONT_THEME });
  };

  if (!mounted) {
    return (
      <AdminPageShell breadcrumbs={crumbs} title="Form & buttons" description="Storefront inputs and buttons.">
        <p className="text-sm text-[#64748b]">Loading…</p>
      </AdminPageShell>
    );
  }

  if (!token) {
    return (
      <AdminPageShell breadcrumbs={crumbs} title="Form & buttons" description="Storefront inputs and buttons.">
        <p className="text-sm text-[#64748b]">Sign in as admin to edit theme.</p>
      </AdminPageShell>
    );
  }

  return (
    <AdminPageShell
      breadcrumbs={crumbs}
      title="Form & buttons"
      description="These settings apply to public forms (contact, login, register, checkout, profile, newsletter). Uses hex colors and CSS lengths (e.g. 0.5rem, 8px)."
      actions={
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={resetDefaults}
            disabled={loading || saving}
            className="rounded-admin border border-[#e3e6ed] bg-white px-4 py-2 text-sm font-medium text-[#31374a] hover:bg-[#f8fafc] disabled:opacity-50"
          >
            Reset to defaults
          </button>
          <button
            type="button"
            onClick={() => void save()}
            disabled={saving || loading}
            className="rounded-admin bg-[#3874ff] px-4 py-2 text-sm font-medium text-white hover:bg-[#2d5fd6] disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      }
    >
      <div className="max-w-7xl space-y-8">
        {loading ? <p className="text-xs text-[#60759b]">Loading…</p> : null}
        {message ? <p className="text-sm text-green-700">{message}</p> : null}
        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        <ThemeInputsSection t={t} patch={patch} />
      </div>
    </AdminPageShell>
  );
}
