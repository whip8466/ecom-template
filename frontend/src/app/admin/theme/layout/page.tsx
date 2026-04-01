'use client';

import { useCallback, useEffect, useState, type CSSProperties } from 'react';
import { AdminPageShell } from '@/components/admin-shell';
import { apiRequest } from '@/lib/api';
import type { ContactSettings } from '@/lib/contact-settings';
import {
  DEFAULT_STOREFRONT_THEME,
  mergeStorefrontTheme,
  themeTokensToCssProperties,
  themeTokensToJson,
  type StorefrontThemeTokens,
} from '@/lib/storefront-theme';
import { useAuthStore } from '@/store/auth-store';

const crumbs = [
  { label: 'Home', href: '/admin' as const },
  { label: 'Theme' },
  { label: 'Layout' },
];

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-[#64748b]">{label}</span>
      <div className="mt-1 flex items-center gap-2">
        <input
          type="color"
          value={value.length === 7 ? value : '#0989ff'}
          onChange={(e) => onChange(e.target.value)}
          className="h-9 w-12 cursor-pointer rounded border border-[#e3e6ed] bg-white p-0.5"
          aria-label={label}
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="min-w-0 flex-1 rounded-admin border border-[#e3e6ed] px-2 py-1.5 font-mono text-sm text-[#31374a]"
          spellCheck={false}
        />
      </div>
    </label>
  );
}

function TextField({
  label,
  hint,
  value,
  onChange,
}: {
  label: string;
  hint?: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-[#64748b]">{label}</span>
      {hint ? <span className="ml-1 text-[11px] text-[#94a3b8]">({hint})</span> : null}
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-admin border border-[#e3e6ed] px-2 py-1.5 text-sm text-[#31374a]"
      />
    </label>
  );
}

export default function AdminThemeLayoutPage() {
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
      setMessage('Theme saved. The storefront will use these values on the next page load.');
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
      <AdminPageShell breadcrumbs={crumbs} title="Layout" description="Cards and sections.">
        <p className="text-sm text-[#64748b]">Loading…</p>
      </AdminPageShell>
    );
  }

  if (!token) {
    return (
      <AdminPageShell breadcrumbs={crumbs} title="Layout" description="Cards and sections.">
        <p className="text-sm text-[#64748b]">Sign in as admin to edit theme.</p>
      </AdminPageShell>
    );
  }

  const previewStyle = themeTokensToCssProperties(t);

  return (
    <AdminPageShell
      breadcrumbs={crumbs}
      title="Layout"
      description="Storefront page background, card and section surfaces, borders, corner radii, and shadows. These map to global CSS variables used across the shop and home pages."
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

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_min(280px,38%)] lg:items-start xl:grid-cols-[minmax(0,1fr)_380px]">
          <div className="min-w-0 space-y-8">
            <div className="rounded-admin border border-[#e3e6ed] bg-white p-6 shadow-sm">
              <h2 className="text-sm font-semibold text-[#1c2740]">Surfaces</h2>
              <p className="mt-1 text-xs text-[#94a3b8]">
                Page canvas, card surfaces (product tiles, headers), and muted section bands alternate across the storefront.
              </p>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <ColorField label="Page background" value={t.layoutPageBackground} onChange={(v) => patch({ layoutPageBackground: v })} />
                <ColorField label="Card / section surface" value={t.layoutCardBackground} onChange={(v) => patch({ layoutCardBackground: v })} />
                <ColorField
                  label="Muted section background"
                  value={t.layoutSectionMutedBackground}
                  onChange={(v) => patch({ layoutSectionMutedBackground: v })}
                />
                <ColorField label="Border" value={t.layoutBorder} onChange={(v) => patch({ layoutBorder: v })} />
              </div>
            </div>

            <div className="rounded-admin border border-[#e3e6ed] bg-white p-6 shadow-sm">
              <h2 className="text-sm font-semibold text-[#1c2740]">Radius & shadows</h2>
              <p className="mt-1 text-xs text-[#94a3b8]">
                Radii apply where components use <code className="font-mono text-[11px]">var(--radius)</code> or{' '}
                <code className="font-mono text-[11px]">var(--radius-lg)</code>. Shadows use standard CSS{' '}
                <code className="font-mono text-[11px]">box-shadow</code> syntax.
              </p>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <TextField label="Default radius" hint="e.g. 0.75rem" value={t.layoutRadius} onChange={(v) => patch({ layoutRadius: v })} />
                <TextField label="Large radius" hint="e.g. 1rem" value={t.layoutRadiusLarge} onChange={(v) => patch({ layoutRadiusLarge: v })} />
                <div className="sm:col-span-2">
                  <TextField label="Shadow small" value={t.layoutShadowSm} onChange={(v) => patch({ layoutShadowSm: v })} />
                </div>
                <div className="sm:col-span-2">
                  <TextField label="Shadow medium" value={t.layoutShadow} onChange={(v) => patch({ layoutShadow: v })} />
                </div>
                <div className="sm:col-span-2">
                  <TextField label="Shadow large" value={t.layoutShadowLg} onChange={(v) => patch({ layoutShadowLg: v })} />
                </div>
              </div>
            </div>
          </div>

          <aside className="lg:sticky lg:top-4 lg:self-start">
            <div className="rounded-admin border border-[#e3e6ed] bg-[#f8fafc] p-6">
              <h2 className="text-sm font-semibold text-[#1c2740]">Live preview</h2>
              <p className="mt-1 text-xs text-[#94a3b8]">Section strip and card sample.</p>
              <div
                className="mt-4 overflow-hidden rounded-admin border border-[#e5ecf6]"
                style={{ ...previewStyle, background: 'var(--background)' } as CSSProperties}
              >
                <div
                  className="border-b px-4 py-6"
                  style={{ background: 'var(--cream)', borderColor: 'var(--border)' }}
                >
                  <p className="text-xs font-medium text-[#64748b]">Muted section</p>
                </div>
                <div className="p-4">
                  <div
                    className="border p-4"
                    style={
                      {
                        borderRadius: 'var(--radius-lg)',
                        background: 'var(--card-bg)',
                        borderColor: 'var(--border)',
                        borderWidth: 1,
                        borderStyle: 'solid',
                        boxShadow: 'var(--shadow)',
                      } as CSSProperties
                    }
                  >
                    <p className="text-sm font-medium text-[#1c2740]">Card</p>
                    <p className="mt-1 text-xs text-[#64748b]">Border, radius, and shadow follow your tokens.</p>
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </AdminPageShell>
  );
}
