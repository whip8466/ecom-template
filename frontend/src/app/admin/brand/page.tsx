'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AdminPageShell } from '@/components/admin-shell';
import { apiAssetUrl } from '@/lib/api-asset-url';
import { apiRequest } from '@/lib/api';
import { coerceBool } from '@/lib/brand-visibility';
import type { ContactSettings } from '@/lib/contact-settings';
import { useAuthStore } from '@/store/auth-store';

export default function AdminBrandPage() {
  const token = useAuthStore((s) => s.token);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [mounted, setMounted] = useState(false);
  const [brandName, setBrandName] = useState('Dhidi');
  const [footerTagline, setFooterTagline] = useState('');
  const [brandLogoUrl, setBrandLogoUrl] = useState<string | null>(null);
  const [showBrandLogo, setShowBrandLogo] = useState(true);
  const [showBrandName, setShowBrandName] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [logoBusy, setLogoBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

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
        setBrandName(res.data.brandName?.trim() || 'Dhidi');
        setFooterTagline(res.data.footerTagline ?? '');
        setBrandLogoUrl(res.data.brandLogoUrl?.trim() ? res.data.brandLogoUrl : null);
        setShowBrandLogo(coerceBool(res.data.showBrandLogo, true));
        setShowBrandName(coerceBool(res.data.showBrandName, true));
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
    const bn = brandName.trim();
    const ft = footerTagline.trim();
    if (!bn) {
      setError('Brand name is required.');
      return;
    }
    if (!ft) {
      setError('Footer tagline is required.');
      return;
    }
    if (!showBrandLogo && !showBrandName) {
      setError('Turn on at least one: Show brand logo or Show brand name (storefront header and footer).');
      return;
    }
    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      const payload = { brandName: bn, footerTagline: ft, showBrandLogo, showBrandName };
      await apiRequest<{ data: ContactSettings }>('/api/admin/brand-settings', {
        method: 'PATCH',
        body: JSON.stringify(payload),
        token,
      });
      setMessage('Brand details saved. The storefront header, footer, and site metadata will update shortly.');
      await load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const uploadLogo = async (file: File) => {
    if (!token) return;
    setLogoBusy(true);
    setMessage(null);
    setError(null);
    try {
      const fd = new FormData();
      fd.append('file', file);
      await apiRequest<{ data: ContactSettings }>('/api/admin/brand-logo', {
        method: 'POST',
        body: fd,
        token,
      });
      await load();
      setMessage('Logo uploaded. It appears in the storefront header and footer.');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLogoBusy(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeLogo = async () => {
    if (!token) return;
    setLogoBusy(true);
    setMessage(null);
    setError(null);
    try {
      await apiRequest<{ data: ContactSettings }>('/api/admin/brand-logo', {
        method: 'DELETE',
        token,
      });
      await load();
      setMessage('Logo removed.');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLogoBusy(false);
    }
  };

  if (!mounted) {
    return (
      <AdminPageShell
        breadcrumbs={[{ label: 'Home', href: '/admin' }, { label: 'Brand' }]}
        title="Brand"
        description="Store name and footer copy shown across the public site."
      >
        <p className="text-sm text-[#64748b]">Loading…</p>
      </AdminPageShell>
    );
  }

  if (!token) {
    return (
      <AdminPageShell
        breadcrumbs={[{ label: 'Home', href: '/admin' }, { label: 'Brand' }]}
        title="Brand"
        description="Store name and footer copy shown across the public site."
      >
        <p className="text-sm text-[#64748b]">Sign in as admin to edit brand settings.</p>
      </AdminPageShell>
    );
  }

  return (
    <AdminPageShell
      breadcrumbs={[{ label: 'Home', href: '/admin' }, { label: 'Brand' }]}
      title="Brand"
      description="These values power the storefront logo label, footer, and default page title. Contact emails, phone, and address are still managed on the Contact Us page."
      actions={
        <button
          type="button"
          onClick={() => void save()}
          disabled={saving || loading}
          className="rounded-admin bg-[#3874ff] px-4 py-2 text-sm font-medium text-white hover:bg-[#2d5fd6] disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Save changes'}
        </button>
      }
    >
      <div className="max-w-2xl space-y-6">
        {loading ? <p className="text-xs text-[#60759b]">Loading settings…</p> : null}
        {message ? <p className="text-sm text-green-700">{message}</p> : null}
        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        <div className="rounded-admin border border-[#e3e6ed] bg-white p-6 shadow-sm">
          <div className="border-b border-[#e3e6ed] pb-6">
            <span className="text-xs font-semibold uppercase tracking-wide text-[#64748b]">Brand logo</span>
            <p className="mt-0.5 text-xs text-[#94a3b8]">
              PNG, JPEG, WebP, GIF, or SVG. Max 2&nbsp;MB. Shown in the header and footer; brand name below is still used for the page title and accessibility.
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
              className="sr-only"
              aria-label="Upload brand logo"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void uploadLogo(f);
              }}
            />
            <div className="mt-3 flex flex-wrap items-center gap-4">
              {brandLogoUrl ? (
                <div className="flex h-16 max-w-[220px] items-center rounded-admin border border-[#e3e6ed] bg-[#f8fafc] px-3 py-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={apiAssetUrl(brandLogoUrl)}
                    alt="Current logo preview"
                    className="max-h-12 w-auto max-w-full object-contain object-left"
                  />
                </div>
              ) : (
                <span className="text-sm text-[#94a3b8]">No logo uploaded — the brand name is shown as text.</span>
              )}
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={logoBusy || loading}
                  onClick={() => fileInputRef.current?.click()}
                  className="rounded-admin border border-[#e3e6ed] bg-white px-3 py-2 text-sm font-medium text-[#31374a] hover:bg-[#f8fafc] disabled:opacity-50"
                >
                  {logoBusy ? 'Working…' : brandLogoUrl ? 'Replace logo' : 'Upload logo'}
                </button>
                {brandLogoUrl ? (
                  <button
                    type="button"
                    disabled={logoBusy || loading}
                    onClick={() => void removeLogo()}
                    className="rounded-admin px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
                  >
                    Remove logo
                  </button>
                ) : null}
              </div>
            </div>
            <label className="mt-4 flex cursor-pointer items-start gap-2">
              <input
                type="checkbox"
                checked={showBrandLogo}
                onChange={(e) => setShowBrandLogo(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-[#e3e6ed] text-[#3874ff] focus:ring-[#3874ff]"
              />
              <span className="text-sm text-[#31374a]">
                <span className="font-medium">Show brand logo</span>
                <span className="mt-0.5 block text-xs text-[#94a3b8]">
                  Visible only when a logo file is uploaded above.
                </span>
              </span>
            </label>
          </div>

          <div className="mt-6">
            <span className="text-xs font-semibold uppercase tracking-wide text-[#64748b]">Brand name</span>
            <p className="mt-0.5 text-xs text-[#94a3b8]">
              Used for the browser tab title, screen readers, and as the visible name when no logo is set.
            </p>
            <input
              type="text"
              value={brandName}
              onChange={(e) => setBrandName(e.target.value)}
              className="mt-2 w-full rounded-admin border border-[#e3e6ed] px-3 py-2 text-sm text-[#31374a]"
              maxLength={120}
            />
            <label className="mt-3 flex cursor-pointer items-start gap-2">
              <input
                type="checkbox"
                checked={showBrandName}
                onChange={(e) => setShowBrandName(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-[#e3e6ed] text-[#3874ff] focus:ring-[#3874ff]"
              />
              <span className="text-sm text-[#31374a]">
                <span className="font-medium">Show brand name</span>
                <span className="mt-0.5 block text-xs text-[#94a3b8]">
                  Text label next to or instead of the logo; also used in the footer copyright when enabled.
                </span>
              </span>
            </label>
          </div>

          <label className="mt-6 block">
            <span className="text-xs font-semibold uppercase tracking-wide text-[#64748b]">Footer tagline</span>
            <p className="mt-0.5 text-xs text-[#94a3b8]">
              Short description under the brand in the footer. Also used as the default meta description. Line breaks are preserved.
            </p>
            <textarea
              value={footerTagline}
              onChange={(e) => setFooterTagline(e.target.value)}
              rows={4}
              className="mt-2 w-full rounded-admin border border-[#e3e6ed] px-3 py-2 text-sm text-[#31374a]"
            />
          </label>
        </div>

        <p className="text-sm text-[#64748b]">
          For the Contact page headline, emails, phone, map, and social links, use{' '}
          <Link href="/admin/contact" className="font-medium text-[#3874ff] hover:underline">
            Contact Us
          </Link>
          .
        </p>
      </div>
    </AdminPageShell>
  );
}
