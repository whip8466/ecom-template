'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { AdminPageShell } from '@/components/admin-shell';
import { ThemeInputsSection } from '@/components/admin/storefront-theme/ThemeInputsSection';
import { ThemeLayoutSection } from '@/components/admin/storefront-theme/ThemeLayoutSection';
import { useAuthStore } from '@/store/auth-store';
import { apiRequest } from '@/lib/api';
import type { ContactSettings } from '@/lib/contact-settings';
import {
  DEFAULT_STOREFRONT_THEME,
  mergeStorefrontTheme,
  themeTokensToJson,
  type StorefrontThemeTokens,
} from '@/lib/storefront-theme';
import { useSuperAdminGate } from '../../../use-super-admin-gate';

type BrandRow = {
  id: number;
  name: string;
  slug: string;
  isBlocked: boolean;
  staffCount: number;
  createdAt: string;
  updatedAt: string;
};

const inputClass =
  'mt-2 w-full rounded-admin border border-[#e3e6ed] px-3 py-2 text-sm text-[#31374a] placeholder:text-[#94a3b8] focus:border-[#3874ff] focus:outline-none focus:ring-1 focus:ring-[#3874ff]/25';

const labelClass = 'text-xs font-semibold uppercase tracking-wide text-[#64748b]';

export default function SuperAdminEditBrandPage() {
  const router = useRouter();
  const params = useParams();
  const rawId = params.id;
  const idStr = Array.isArray(rawId) ? rawId[0] : rawId;
  const brandId = typeof idStr === 'string' ? Number(idStr) : NaN;

  const { ready, token } = useSuperAdminGate();
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [theme, setTheme] = useState<StorefrontThemeTokens>(() => ({ ...DEFAULT_STOREFRONT_THEME }));
  const patchTheme = useCallback((p: Partial<StorefrontThemeTokens>) => {
    setTheme((prev) => ({ ...prev, ...p }));
  }, []);

  const resetThemeDefaults = () => {
    setTheme({ ...DEFAULT_STOREFRONT_THEME });
  };

  const load = useCallback(async () => {
    const t = useAuthStore.getState().token;
    if (!Number.isInteger(brandId) || brandId < 1) {
      setLoadError('Invalid brand');
      setLoading(false);
      return;
    }
    setLoadError(null);
    setLoading(true);
    try {
      if (!t) {
        setLoadError('Session expired. Sign in again.');
        return;
      }
      const res = await apiRequest<{ data: BrandRow[] }>('/api/super-admin/brands', { token: t });
      const row = (res.data ?? []).find((b) => b.id === brandId);
      if (!row) {
        setLoadError('Brand not found');
        return;
      }
      setName(row.name);
      setSlug(row.slug);

      const cs = await apiRequest<{ data: ContactSettings }>(`/api/contact-settings?brandId=${brandId}`, {
        token: t,
      });
      if (cs.data) {
        setTheme(mergeStorefrontTheme(cs.data.themeJson));
      }
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : 'Failed to load brand');
    } finally {
      setLoading(false);
    }
  }, [brandId]);

  useEffect(() => {
    if (!ready || !token) return;
    void load();
  }, [ready, token, load]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!token || !Number.isInteger(brandId) || brandId < 1) return;
    setError(null);
    setSubmitting(true);
    try {
      await apiRequest(`/api/super-admin/brands/${brandId}`, {
        method: 'PATCH',
        token,
        body: JSON.stringify({
          name: name.trim(),
          slug: slug.trim().toLowerCase(),
        }),
      });
      await apiRequest(`/api/admin/theme-settings?brandId=${brandId}`, {
        method: 'PATCH',
        token,
        body: JSON.stringify({ themeJson: themeTokensToJson(theme) }),
      });
      router.push('/admin/super/brands');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update failed');
    } finally {
      setSubmitting(false);
    }
  }

  if (!ready) {
    return (
      <AdminPageShell
        breadcrumbs={[
          { label: 'Admin', href: '/admin' },
          { label: 'Brands', href: '/admin/super/brands' },
          { label: 'Edit brand' },
        ]}
        title="Edit brand"
        description="Update brand details and storefront theme for this tenant."
      >
        <div className="flex min-h-[40vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#3874ff] border-t-transparent" />
        </div>
      </AdminPageShell>
    );
  }

  if (loading) {
    return (
      <AdminPageShell
        breadcrumbs={[
          { label: 'Admin', href: '/admin' },
          { label: 'Brands', href: '/admin/super/brands' },
          { label: 'Edit brand' },
        ]}
        title="Edit brand"
        description="Update brand details and storefront theme for this tenant."
      >
        <div className="flex min-h-[40vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#3874ff] border-t-transparent" />
        </div>
      </AdminPageShell>
    );
  }

  if (loadError) {
    return (
      <AdminPageShell
        breadcrumbs={[
          { label: 'Admin', href: '/admin' },
          { label: 'Brands', href: '/admin/super/brands' },
          { label: 'Edit brand' },
        ]}
        title="Edit brand"
        description="Update brand details and storefront theme for this tenant."
      >
        <div className="max-w-2xl space-y-4">
          <div className="rounded-admin border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
            {loadError}
          </div>
          <Link href="/admin/super/brands" className="text-sm font-medium text-[#3874ff] hover:underline">
            ← Back to brands
          </Link>
        </div>
      </AdminPageShell>
    );
  }

  return (
    <AdminPageShell
      breadcrumbs={[
        { label: 'Admin', href: '/admin' },
        { label: 'Brands', href: '/admin/super/brands' },
        { label: 'Edit brand' },
      ]}
      title="Edit brand"
      description="Update name and slug, and customize layout and form theme tokens for this storefront."
    >
      <div className="max-w-7xl space-y-8">
        {error ? (
          <div className="rounded-admin border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
            {error}
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="rounded-admin border border-[#e3e6ed] bg-white p-6 shadow-sm">
            <div className="border-b border-[#e3e6ed] pb-6">
              <span className={labelClass}>Brand details</span>
              <p className="mt-0.5 text-xs text-[#94a3b8]">Slug must stay unique and use lowercase letters, numbers, and hyphens only.</p>
              <div className="mt-4 grid max-w-2xl gap-6 sm:grid-cols-2">
                <label className="block">
                  <span className={labelClass}>Name</span>
                  <input
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={inputClass}
                    autoComplete="organization"
                  />
                </label>
                <label className="block">
                  <span className={labelClass}>Slug (URL)</span>
                  <input
                    required
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder="acme-store"
                    className={inputClass}
                    autoComplete="off"
                  />
                </label>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold tracking-tight text-[#1c2740]">Storefront theme</h2>
                <p className="mt-1 text-sm text-[#64748b]">
                  Layout and form tokens for this brand. Saved to the same settings used by Theme → Layout and Theme → Inputs for that tenant.
                </p>
              </div>
              <button
                type="button"
                onClick={resetThemeDefaults}
                disabled={submitting}
                className="rounded-admin border border-[#e3e6ed] bg-white px-4 py-2 text-sm font-medium text-[#31374a] hover:bg-[#f8fafc] disabled:opacity-50"
              >
                Reset theme to defaults
              </button>
            </div>

            <ThemeLayoutSection t={theme} patch={patchTheme} />
            <ThemeInputsSection t={theme} patch={patchTheme} />
          </div>

          <div className="flex flex-wrap justify-end gap-2 border-t border-[#e3e6ed] pt-6">
            <Link
              href="/admin/super/brands"
              className="rounded-admin border border-[#e3e6ed] bg-white px-4 py-2 text-sm font-medium text-[#475569] hover:bg-[#f8fafc]"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-admin bg-[#3874ff] px-4 py-2 text-sm font-medium text-white hover:bg-[#2d5fd6] disabled:opacity-50"
            >
              {submitting ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        </form>
      </div>
    </AdminPageShell>
  );
}
