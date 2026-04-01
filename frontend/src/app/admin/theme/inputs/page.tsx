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
  { label: 'Inputs' },
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

  const previewStyle = themeTokensToCssProperties(t);

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

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_min(280px,36%)] lg:items-start xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="rounded-admin border border-[#e3e6ed] bg-white p-6 shadow-sm">
            <h2 className="text-sm font-semibold text-[#1c2740]">Buttons</h2>
            <p className="mt-1 text-xs text-[#94a3b8]">Primary is also synced to site accent links and newsletter CTAs using `--accent`.</p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <ColorField label="Primary background" value={t.buttonPrimaryBg} onChange={(v) => patch({ buttonPrimaryBg: v })} />
              <ColorField label="Primary hover" value={t.buttonPrimaryHover} onChange={(v) => patch({ buttonPrimaryHover: v })} />
              <ColorField label="Secondary background" value={t.buttonSecondaryBg} onChange={(v) => patch({ buttonSecondaryBg: v })} />
              <ColorField label="Secondary border" value={t.buttonSecondaryBorder} onChange={(v) => patch({ buttonSecondaryBorder: v })} />
              <ColorField label="Secondary text" value={t.buttonSecondaryText} onChange={(v) => patch({ buttonSecondaryText: v })} />
              <ColorField label="Info background" value={t.buttonInfoBg} onChange={(v) => patch({ buttonInfoBg: v })} />
              <ColorField label="Info hover" value={t.buttonInfoHover} onChange={(v) => patch({ buttonInfoHover: v })} />
              <TextField label="Button radius" hint="all button types" value={t.buttonRadius} onChange={(v) => patch({ buttonRadius: v })} />
            </div>
          </div>
          <aside className="lg:sticky lg:top-4 lg:self-start">
            <div className="rounded-admin border border-[#e3e6ed] bg-[#f8fafc] p-6">
              <h2 className="text-sm font-semibold text-[#1c2740]">Live preview</h2>
              <p className="mt-1 text-xs text-[#94a3b8]">Input tokens only; updates as you edit.</p>
              <div
                className="mt-2 flex flex-wrap gap-2 rounded-admin border border-[#e5ecf6] bg-[#f8fafc] p-3"
                style={previewStyle as CSSProperties}
              >
                <button type="button" className="sf-btn-primary text-sm">
                  Primary
                </button>
                <button type="button" className="sf-btn-secondary text-sm">
                  Secondary
                </button>
                <button type="button" className="sf-btn-info text-sm">
                  Info
                </button>
              </div>
            </div>
          </aside>
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_min(280px,36%)] lg:items-start xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="min-w-0 rounded-admin border border-[#e3e6ed] bg-white p-6 shadow-sm">
            <h2 className="text-sm font-semibold text-[#1c2740]">Inputs & fields</h2>
            <p className="mt-1 text-xs text-[#94a3b8]">Text inputs, textareas, and selects share these tokens.</p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <TextField label="Input radius" value={t.inputRadius} onChange={(v) => patch({ inputRadius: v })} />
              <ColorField label="Border" value={t.inputBorder} onChange={(v) => patch({ inputBorder: v })} />
              <ColorField label="Background" value={t.inputBackground} onChange={(v) => patch({ inputBackground: v })} />
              <ColorField label="Text" value={t.inputText} onChange={(v) => patch({ inputText: v })} />
              <ColorField label="Placeholder" value={t.inputPlaceholder} onChange={(v) => patch({ inputPlaceholder: v })} />
              <ColorField label="Focus ring" value={t.inputFocusRing} onChange={(v) => patch({ inputFocusRing: v })} />
              <TextField label="Textarea min height" hint="e.g. 8rem" value={t.textareaMinHeight} onChange={(v) => patch({ textareaMinHeight: v })} />
              <ColorField label="Select background" value={t.selectBackground} onChange={(v) => patch({ selectBackground: v })} />
              <ColorField label="Label text" value={t.labelText} onChange={(v) => patch({ labelText: v })} />
              <ColorField label="Checkbox accent" value={t.checkboxAccent} onChange={(v) => patch({ checkboxAccent: v })} />
            </div>
          </div>

          <aside className="lg:sticky lg:top-4 lg:self-start">
            <div className="rounded-admin border border-[#e3e6ed] bg-[#f8fafc] p-6">
              <h2 className="text-sm font-semibold text-[#1c2740]">Live preview</h2>
              <p className="mt-1 text-xs text-[#94a3b8]">Input tokens only; updates as you edit.</p>
              <div
                className="mt-4 space-y-3 rounded-admin border border-[#e5ecf6] bg-white p-4"
                style={previewStyle as CSSProperties}
              >
                <label className="sf-label">Sample label</label>
                <input type="text" className="sf-field h-11 w-full" placeholder="Placeholder" readOnly />
                <textarea className="sf-field w-full" rows={3} readOnly placeholder="Textarea" />
                <label className="flex cursor-pointer items-center gap-2 text-sm text-[#475467]">
                  <input type="checkbox" className="sf-checkbox" defaultChecked />
                  Checkbox
                </label>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </AdminPageShell>
  );
}
