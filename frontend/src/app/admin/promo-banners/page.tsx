'use client';

import { useEffect, useRef, useState } from 'react';
import { AdminPageShell } from '@/components/admin-shell';
import { apiRequest } from '@/lib/api';
import type { PromoBanner, PromoBannerStyleVariant } from '@/lib/promo-banners';
import { useAuthStore } from '@/store/auth-store';

type EditableBanner = Omit<PromoBanner, 'id'> & { id?: number };

export default function AdminPromoBannersPage() {
  const token = useAuthStore((s) => s.token);
  const [mounted, setMounted] = useState(false);
  const [banners, setBanners] = useState<EditableBanner[]>([]);
  const [fetching, setFetching] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const userEditedRef = useRef(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !token) return;

    let cancelled = false;
    setFetching(true);
    setError(null);

    (async () => {
      try {
        const res = await apiRequest<{ data: PromoBanner[] }>('/api/admin/promo-banners', { token });
        if (cancelled) return;
        if (userEditedRef.current) return;

        const rows = Array.isArray(res.data) ? res.data : [];
        if (rows.length === 0) {
          setBanners([]);
        } else {
          setBanners(
            rows.map((b, i) => ({
              sortOrder: b.sortOrder ?? i,
              eyebrowLabel: b.eyebrowLabel ?? '',
              title: b.title ?? '',
              subtitle: b.subtitle ?? null,
              imageUrl: b.imageUrl ?? null,
              imageAlt: b.imageAlt ?? '',
              ctaLabel: b.ctaLabel || 'Shop Now',
              ctaHref: b.ctaHref || '/shop',
              styleVariant: (b.styleVariant === 'accent' ? 'accent' : 'neutral') as PromoBannerStyleVariant,
              isActive: b.isActive !== false,
              id: b.id,
            })),
          );
        }
      } catch (e) {
        if (!cancelled) {
          setError((e as Error).message);
          if (!userEditedRef.current) setBanners([]);
        }
      } finally {
        if (!cancelled) setFetching(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [mounted, token]);

  const updateBanner = (i: number, patch: Partial<EditableBanner>) => {
    userEditedRef.current = true;
    setBanners((prev) => prev.map((s, j) => (j === i ? { ...s, ...patch } : s)));
  };

  const move = (from: number, to: number) => {
    if (to < 0 || to >= banners.length) return;
    userEditedRef.current = true;
    setBanners((prev) => {
      const next = [...prev];
      const [row] = next.splice(from, 1);
      next.splice(to, 0, row);
      return next.map((s, order) => ({ ...s, sortOrder: order }));
    });
  };

  const addBanner = () => {
    userEditedRef.current = true;
    setBanners((prev) => {
      const order = prev.length;
      const next: EditableBanner = {
        sortOrder: order,
        eyebrowLabel: '',
        title: '',
        subtitle: null,
        imageUrl: null,
        imageAlt: '',
        ctaLabel: 'Shop Now',
        ctaHref: '/shop',
        styleVariant: 'neutral',
        isActive: true,
      };
      return [...prev, next];
    });
  };

  const removeBanner = (i: number) => {
    userEditedRef.current = true;
    setBanners((prev) => prev.filter((_, j) => j !== i).map((s, order) => ({ ...s, sortOrder: order })));
  };

  const save = async () => {
    if (!token) return;
    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      const payload = {
        banners: banners.map((b, i) => ({
          sortOrder: i,
          eyebrowLabel: b.eyebrowLabel.trim(),
          title: b.title.trim(),
          subtitle: b.subtitle?.trim() ? b.subtitle.trim() : null,
          imageUrl: b.imageUrl?.trim() ? b.imageUrl.trim() : null,
          imageAlt: (b.imageAlt ?? '').trim(),
          ctaLabel: (b.ctaLabel || 'Shop Now').trim() || 'Shop Now',
          ctaHref: (b.ctaHref || '/shop').trim() || '/shop',
          styleVariant: b.styleVariant === 'accent' ? 'accent' : 'neutral',
          isActive: b.isActive !== false,
        })),
      };
      await apiRequest('/api/admin/promo-banners', {
        method: 'PUT',
        body: JSON.stringify(payload),
        token,
      });
      setMessage('Promo banners saved.');
      userEditedRef.current = false;
      const refreshed = await apiRequest<{ data: PromoBanner[] }>('/api/admin/promo-banners', { token });
      const rows = Array.isArray(refreshed.data) ? refreshed.data : [];
      if (rows.length === 0) setBanners([]);
      else {
        setBanners(
          rows.map((b, i) => ({
            sortOrder: b.sortOrder ?? i,
            eyebrowLabel: b.eyebrowLabel ?? '',
            title: b.title ?? '',
            subtitle: b.subtitle ?? null,
            imageUrl: b.imageUrl ?? null,
            imageAlt: b.imageAlt ?? '',
            ctaLabel: b.ctaLabel || 'Shop Now',
            ctaHref: b.ctaHref || '/shop',
            styleVariant: (b.styleVariant === 'accent' ? 'accent' : 'neutral') as PromoBannerStyleVariant,
            isActive: b.isActive !== false,
            id: b.id,
          })),
        );
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const showSessionLoading = !mounted;
  const canSave = mounted && !!token && !saving;

  return (
    <AdminPageShell
      breadcrumbs={[
        { label: 'Home', href: '/admin' },
        { label: 'Promo banners' },
      ]}
      title="Promo banners"
      description="Manage the two-column promotional tiles below Trending Products on the home page (eyebrow, title, optional subtitle and image, CTA)."
      actions={
        <button
          type="button"
          onClick={() => void save()}
          disabled={!canSave}
          className="rounded-admin bg-[#3874ff] px-4 py-2 text-sm font-medium text-white hover:bg-[#2d5fd6] disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Save changes'}
        </button>
      }
    >
      {showSessionLoading ? (
        <p className="text-sm text-[#64748b]">Loading…</p>
      ) : !token ? (
        <p className="text-sm text-[#64748b]">Sign in as admin to manage promo banners.</p>
      ) : (
        <div className="space-y-6">
          {fetching ? (
            <p className="text-xs text-[#60759b]">Loading saved banners from server…</p>
          ) : null}
          {message ? <p className="text-sm text-green-700">{message}</p> : null}
          {error ? <p className="text-sm text-red-600">{error}</p> : null}

          {banners.length === 0 ? (
            <div className="rounded-admin border border-dashed border-[#c5d0e5] bg-[#f9fafb] px-6 py-12 text-center">
              <p className="text-sm font-medium text-[#1c2740]">No promo banners yet</p>
              <p className="mt-2 text-sm text-[#60759b]">
                Add tiles to show offers on the home page. Typical layout uses two tiles side by side.
              </p>
              <button
                type="button"
                onClick={() => addBanner()}
                className="mt-6 inline-flex rounded-admin bg-[#3874ff] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#2d5fd6]"
              >
                Add banner
              </button>
            </div>
          ) : (
            <>
              {banners.map((b, i) => (
                <div
                  key={`promo-${b.id ?? i}-${i}`}
                  className="rounded-admin border border-[#e3e6ed] bg-white p-4 shadow-sm"
                >
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-[#1c2740]">Banner {i + 1}</span>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        className="rounded-admin border border-[#e3e6ed] px-2 py-1 text-xs text-[#31374a] hover:bg-[#f5f7fa] disabled:opacity-40"
                        disabled={i === 0}
                        onClick={() => move(i, i - 1)}
                      >
                        Up
                      </button>
                      <button
                        type="button"
                        className="rounded-admin border border-[#e3e6ed] px-2 py-1 text-xs text-[#31374a] hover:bg-[#f5f7fa] disabled:opacity-40"
                        disabled={i === banners.length - 1}
                        onClick={() => move(i, i + 1)}
                      >
                        Down
                      </button>
                      <button
                        type="button"
                        className="rounded-admin border border-red-200 px-2 py-1 text-xs text-red-700 hover:bg-red-50"
                        onClick={() => removeBanner(i)}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="block text-xs font-medium text-[#60759b]">
                      Eyebrow (e.g. Weekend Sale)
                      <input
                        className="mt-1 w-full rounded-admin border border-[#e3e6ed] px-3 py-2 text-sm text-[#1c2740]"
                        value={b.eyebrowLabel}
                        onChange={(e) => updateBanner(i, { eyebrowLabel: e.target.value })}
                      />
                    </label>
                    <label className="block text-xs font-medium text-[#60759b]">
                      Title
                      <input
                        className="mt-1 w-full rounded-admin border border-[#e3e6ed] px-3 py-2 text-sm text-[#1c2740]"
                        value={b.title}
                        onChange={(e) => updateBanner(i, { title: e.target.value })}
                      />
                    </label>
                    <label className="block text-xs font-medium text-[#60759b] sm:col-span-2">
                      Subtitle (optional, e.g. discount line)
                      <input
                        className="mt-1 w-full rounded-admin border border-[#e3e6ed] px-3 py-2 text-sm text-[#1c2740]"
                        placeholder="Sale 20% off all store"
                        value={b.subtitle ?? ''}
                        onChange={(e) =>
                          updateBanner(i, { subtitle: e.target.value.trim() ? e.target.value : null })
                        }
                      />
                    </label>
                    <label className="block text-xs font-medium text-[#60759b] sm:col-span-2">
                      Image URL (optional)
                      <input
                        className="mt-1 w-full rounded-admin border border-[#e3e6ed] px-3 py-2 text-sm text-[#1c2740]"
                        value={b.imageUrl ?? ''}
                        onChange={(e) =>
                          updateBanner(i, { imageUrl: e.target.value.trim() ? e.target.value : null })
                        }
                      />
                    </label>
                    <label className="block text-xs font-medium text-[#60759b]">
                      Image alt text
                      <input
                        className="mt-1 w-full rounded-admin border border-[#e3e6ed] px-3 py-2 text-sm text-[#1c2740]"
                        value={b.imageAlt}
                        onChange={(e) => updateBanner(i, { imageAlt: e.target.value })}
                      />
                    </label>
                    <label className="block text-xs font-medium text-[#60759b]">
                      Style
                      <select
                        className="mt-1 w-full rounded-admin border border-[#e3e6ed] px-3 py-2 text-sm text-[#1c2740]"
                        value={b.styleVariant}
                        onChange={(e) =>
                          updateBanner(i, {
                            styleVariant: e.target.value === 'accent' ? 'accent' : 'neutral',
                          })
                        }
                      >
                        <option value="neutral">Neutral (white card)</option>
                        <option value="accent">Accent (blue card)</option>
                      </select>
                    </label>
                    <label className="block text-xs font-medium text-[#60759b]">
                      CTA label
                      <input
                        className="mt-1 w-full rounded-admin border border-[#e3e6ed] px-3 py-2 text-sm text-[#1c2740]"
                        value={b.ctaLabel}
                        onChange={(e) => updateBanner(i, { ctaLabel: e.target.value })}
                      />
                    </label>
                    <label className="block text-xs font-medium text-[#60759b]">
                      CTA link
                      <input
                        className="mt-1 w-full rounded-admin border border-[#e3e6ed] px-3 py-2 text-sm text-[#1c2740]"
                        placeholder="/shop"
                        value={b.ctaHref}
                        onChange={(e) => updateBanner(i, { ctaHref: e.target.value })}
                      />
                    </label>
                    <label className="flex items-center gap-2 text-sm text-[#31374a] sm:col-span-2">
                      <input
                        type="checkbox"
                        checked={b.isActive !== false}
                        onChange={(e) => updateBanner(i, { isActive: e.target.checked })}
                      />
                      Active (shown on storefront)
                    </label>
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={addBanner}
                className="rounded-admin border border-dashed border-[#3874ff] px-4 py-2 text-sm font-medium text-[#3874ff] hover:bg-[#edf5ff]"
              >
                + Add another banner
              </button>
            </>
          )}
        </div>
      )}
    </AdminPageShell>
  );
}
