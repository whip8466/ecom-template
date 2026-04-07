'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useState, type FormEvent } from 'react';
import { AdminPageShell } from '@/components/admin-shell';
import { ThemeInputsSection } from '@/components/admin/storefront-theme/ThemeInputsSection';
import { ThemeLayoutSection } from '@/components/admin/storefront-theme/ThemeLayoutSection';
import { apiRequest } from '@/lib/api';
import {
  DEFAULT_STOREFRONT_THEME,
  themeTokensToJson,
  type StorefrontThemeTokens,
} from '@/lib/storefront-theme';
import { useSuperAdminGate } from '../../use-super-admin-gate';

const inputClass =
  'mt-2 w-full rounded-admin border border-[#e3e6ed] px-3 py-2 text-sm text-[#31374a] placeholder:text-[#94a3b8] focus:border-[#3874ff] focus:outline-none focus:ring-1 focus:ring-[#3874ff]/25';

const labelClass = 'text-xs font-semibold uppercase tracking-wide text-[#64748b]';

type CreateBrandResponse = {
  data: {
    id: number;
    name: string;
    slug: string;
    isBlocked: boolean;
    createdAt: string;
    updatedAt: string;
  };
};

export default function SuperAdminNewBrandPage() {
  const router = useRouter();
  const { ready, token } = useSuperAdminGate();
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminFirstName, setAdminFirstName] = useState('');
  const [adminLastName, setAdminLastName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [theme, setTheme] = useState<StorefrontThemeTokens>(() => ({ ...DEFAULT_STOREFRONT_THEME }));
  const patchTheme = useCallback((p: Partial<StorefrontThemeTokens>) => {
    setTheme((prev) => ({ ...prev, ...p }));
  }, []);

  const resetThemeDefaults = () => {
    setTheme({ ...DEFAULT_STOREFRONT_THEME });
  };

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!token) return;
    setError(null);
    setSubmitting(true);
    try {
      const body: Record<string, unknown> = {
        name: name.trim(),
        slug: slug.trim().toLowerCase(),
      };
      if (adminEmail.trim()) {
        body.adminEmail = adminEmail.trim().toLowerCase();
        body.adminPassword = adminPassword;
        body.adminFirstName = adminFirstName.trim();
        body.adminLastName = adminLastName.trim();
      }
      const created = await apiRequest<CreateBrandResponse>('/api/super-admin/brands', {
        method: 'POST',
        token,
        body: JSON.stringify(body),
      });
      const newId = created.data?.id;
      if (newId != null) {
        await apiRequest(`/api/admin/theme-settings?brandId=${newId}`, {
          method: 'PATCH',
          token,
          body: JSON.stringify({ themeJson: themeTokensToJson(theme) }),
        });
      }
      router.push('/admin/super/brands');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Create failed');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AdminPageShell
      breadcrumbs={[
        { label: 'Admin', href: '/admin' },
        { label: 'Brands', href: '/admin/super/brands' },
        { label: 'Create brand' },
      ]}
      title="Create brand"
      description="Add a tenant brand, optional admin user, and storefront theme tokens for that brand."
    >
      {!ready ? (
        <div className="flex min-h-[40vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#3874ff] border-t-transparent" />
        </div>
      ) : (
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
                <p className="mt-0.5 text-xs text-[#94a3b8]">
                  Name and URL slug identify this tenant. Slug must be lowercase letters, numbers, and hyphens.
                </p>
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

              <div className="pt-6">
                <span className={labelClass}>Optional admin user</span>
                <p className="mt-0.5 text-xs text-[#94a3b8]">
                  If you provide an email, password and name are required. This user becomes an ADMIN for the new brand only.
                </p>
                <div className="mt-4 grid max-w-2xl gap-6 sm:grid-cols-2">
                  <label className="block">
                    <span className={labelClass}>Admin email</span>
                    <input
                      type="email"
                      value={adminEmail}
                      onChange={(e) => setAdminEmail(e.target.value)}
                      className={inputClass}
                      autoComplete="off"
                    />
                  </label>
                  <label className="block">
                    <span className={labelClass}>Admin password</span>
                    <input
                      type="password"
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      className={inputClass}
                      autoComplete="new-password"
                    />
                  </label>
                  <label className="block">
                    <span className={labelClass}>Admin first name</span>
                    <input
                      value={adminFirstName}
                      onChange={(e) => setAdminFirstName(e.target.value)}
                      className={inputClass}
                      autoComplete="given-name"
                    />
                  </label>
                  <label className="block">
                    <span className={labelClass}>Admin last name</span>
                    <input
                      value={adminLastName}
                      onChange={(e) => setAdminLastName(e.target.value)}
                      className={inputClass}
                      autoComplete="family-name"
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
                    Layout surfaces and form controls for this brand’s public site — same options as Theme → Layout and Theme → Inputs.
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
                {submitting ? 'Creating…' : 'Create brand'}
              </button>
            </div>
          </form>
        </div>
      )}
    </AdminPageShell>
  );
}
