'use client';

import { useEffect, useRef, useState } from 'react';
import { AdminPageShell } from '@/components/admin-shell';
import { apiRequest } from '@/lib/api';
import type { HomeBannerSlide } from '@/lib/home-banner';
import { useAuthStore } from '@/store/auth-store';

type EditableSlide = Omit<HomeBannerSlide, 'id'> & { id?: number };

export default function AdminHomeBannerPage() {
  const token = useAuthStore((s) => s.token);
  /** Client mount — do not rely on Zustand _hasHydrated (can stay false if rehydrate never fires). */
  const [mounted, setMounted] = useState(false);
  const [slides, setSlides] = useState<EditableSlide[]>([]);
  const [fetching, setFetching] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  /** If user adds/edits before GET returns, do not overwrite local state from the server. */
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
        const res = await apiRequest<{ data: HomeBannerSlide[] }>('/api/admin/home-banner', { token });
        if (cancelled) return;
        if (userEditedRef.current) return;

        const rows = Array.isArray(res.data) ? res.data : [];
        if (rows.length === 0) {
          setSlides([]);
        } else {
          setSlides(
            rows.map((s, i) => ({
              sortOrder: s.sortOrder ?? i,
              priceLine: s.priceLine ?? '',
              title: s.title ?? '',
              offerPrefix: s.offerPrefix ?? '',
              offerHighlight: s.offerHighlight ?? '',
              offerSuffix: s.offerSuffix ?? '',
              imageUrl: s.imageUrl ?? '',
              imageAlt: s.imageAlt ?? '',
              ctaHref: s.ctaHref || '/shop',
              isActive: s.isActive !== false,
              id: s.id,
            })),
          );
        }
      } catch (e) {
        if (!cancelled) {
          setError((e as Error).message);
          if (!userEditedRef.current) setSlides([]);
        }
      } finally {
        if (!cancelled) setFetching(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [mounted, token]);

  const updateSlide = (i: number, patch: Partial<EditableSlide>) => {
    userEditedRef.current = true;
    setSlides((prev) => prev.map((s, j) => (j === i ? { ...s, ...patch } : s)));
  };

  const move = (from: number, to: number) => {
    if (to < 0 || to >= slides.length) return;
    userEditedRef.current = true;
    setSlides((prev) => {
      const next = [...prev];
      const [row] = next.splice(from, 1);
      next.splice(to, 0, row);
      return next.map((s, i) => ({ ...s, sortOrder: i }));
    });
  };

  const addSlide = () => {
    userEditedRef.current = true;
    setSlides((prev) => {
      const order = prev.length;
      const next: EditableSlide = {
        sortOrder: order,
        priceLine: '',
        title: '',
        offerPrefix: '',
        offerHighlight: '',
        offerSuffix: '',
        imageUrl: '',
        imageAlt: '',
        ctaHref: '/shop',
        isActive: true,
      };
      return [...prev, next];
    });
  };

  const removeSlide = (i: number) => {
    userEditedRef.current = true;
    setSlides((prev) => prev.filter((_, j) => j !== i).map((s, order) => ({ ...s, sortOrder: order })));
  };

  const save = async () => {
    if (!token) return;
    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      const payload = {
        slides: slides.map((s, i) => ({
          sortOrder: i,
          priceLine: s.priceLine.trim(),
          title: s.title.trim(),
          offerPrefix: s.offerPrefix,
          offerHighlight: s.offerHighlight.trim(),
          offerSuffix: s.offerSuffix,
          imageUrl: s.imageUrl.trim(),
          imageAlt: s.imageAlt.trim(),
          ctaHref: (s.ctaHref || '/shop').trim() || '/shop',
          isActive: s.isActive !== false,
        })),
      };
      await apiRequest('/api/admin/home-banner', {
        method: 'PUT',
        body: JSON.stringify(payload),
        token,
      });
      setMessage('Home banner saved.');
      userEditedRef.current = false;
      const refreshed = await apiRequest<{ data: HomeBannerSlide[] }>('/api/admin/home-banner', { token });
      const rows = Array.isArray(refreshed.data) ? refreshed.data : [];
      if (rows.length === 0) setSlides([]);
      else {
        setSlides(
          rows.map((s, i) => ({
            sortOrder: s.sortOrder ?? i,
            priceLine: s.priceLine ?? '',
            title: s.title ?? '',
            offerPrefix: s.offerPrefix ?? '',
            offerHighlight: s.offerHighlight ?? '',
            offerSuffix: s.offerSuffix ?? '',
            imageUrl: s.imageUrl ?? '',
            imageAlt: s.imageAlt ?? '',
            ctaHref: s.ctaHref || '/shop',
            isActive: s.isActive !== false,
            id: s.id,
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
  /** Allow save during initial fetch so users can add slides and persist without waiting on GET. */
  const canSave = mounted && !!token && !saving;

  return (
    <AdminPageShell
      breadcrumbs={[
        { label: 'Home', href: '/admin' },
        { label: 'Home banner' },
      ]}
      title="Home banner"
      description="Edit storefront hero carousel slides (text, offer line, image URL, and CTA link)."
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
        <p className="text-sm text-[#64748b]">Sign in as admin to manage the banner.</p>
      ) : (
        <div className="space-y-6">
          {fetching ? (
            <p className="text-xs text-[#60759b]">Loading saved banner from server…</p>
          ) : null}
          {message ? <p className="text-sm text-green-700">{message}</p> : null}
          {error ? <p className="text-sm text-red-600">{error}</p> : null}

          {slides.length === 0 ? (
            <div className="rounded-admin border border-dashed border-[#c5d0e5] bg-[#f9fafb] px-6 py-12 text-center">
              <p className="text-sm font-medium text-[#1c2740]">No banner slides yet</p>
              <p className="mt-2 text-sm text-[#60759b]">
                Add at least one slide to show the hero carousel on the home page. You can edit fields after adding.
              </p>
              <button
                type="button"
                onClick={() => addSlide()}
                className="mt-6 inline-flex rounded-admin bg-[#3874ff] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#2d5fd6]"
              >
                Add slide
              </button>
            </div>
          ) : (
            <>
              {slides.map((slide, i) => (
                <div
                  key={`slide-${slide.id ?? i}-${i}`}
                  className="rounded-admin border border-[#e3e6ed] bg-white p-4 shadow-sm"
                >
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-[#1c2740]">Slide {i + 1}</span>
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
                        disabled={i === slides.length - 1}
                        onClick={() => move(i, i + 1)}
                      >
                        Down
                      </button>
                      <button
                        type="button"
                        className="rounded-admin border border-red-200 px-2 py-1 text-xs text-red-700 hover:bg-red-50"
                        onClick={() => removeSlide(i)}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="block text-xs font-medium text-[#60759b]">
                      Price line
                      <input
                        className="mt-1 w-full rounded-admin border border-[#e3e6ed] px-3 py-2 text-sm text-[#1c2740]"
                        value={slide.priceLine}
                        onChange={(e) => updateSlide(i, { priceLine: e.target.value })}
                      />
                    </label>
                    <label className="block text-xs font-medium text-[#60759b]">
                      Title (headline)
                      <input
                        className="mt-1 w-full rounded-admin border border-[#e3e6ed] px-3 py-2 text-sm text-[#1c2740]"
                        value={slide.title}
                        onChange={(e) => updateSlide(i, { title: e.target.value })}
                      />
                    </label>
                    <label className="block text-xs font-medium text-[#60759b]">
                      Offer prefix
                      <input
                        className="mt-1 w-full rounded-admin border border-[#e3e6ed] px-3 py-2 text-sm text-[#1c2740]"
                        value={slide.offerPrefix}
                        onChange={(e) => updateSlide(i, { offerPrefix: e.target.value })}
                      />
                    </label>
                    <label className="block text-xs font-medium text-[#60759b]">
                      Offer highlight (e.g. -35% off)
                      <input
                        className="mt-1 w-full rounded-admin border border-[#e3e6ed] px-3 py-2 text-sm text-[#1c2740]"
                        value={slide.offerHighlight}
                        onChange={(e) => updateSlide(i, { offerHighlight: e.target.value })}
                      />
                    </label>
                    <label className="block text-xs font-medium text-[#60759b] sm:col-span-2">
                      Offer suffix
                      <input
                        className="mt-1 w-full rounded-admin border border-[#e3e6ed] px-3 py-2 text-sm text-[#1c2740]"
                        value={slide.offerSuffix}
                        onChange={(e) => updateSlide(i, { offerSuffix: e.target.value })}
                      />
                    </label>
                    <label className="block text-xs font-medium text-[#60759b] sm:col-span-2">
                      Image URL
                      <input
                        className="mt-1 w-full rounded-admin border border-[#e3e6ed] px-3 py-2 text-sm text-[#1c2740]"
                        value={slide.imageUrl}
                        onChange={(e) => updateSlide(i, { imageUrl: e.target.value })}
                      />
                    </label>
                    <label className="block text-xs font-medium text-[#60759b]">
                      Image alt text
                      <input
                        className="mt-1 w-full rounded-admin border border-[#e3e6ed] px-3 py-2 text-sm text-[#1c2740]"
                        value={slide.imageAlt}
                        onChange={(e) => updateSlide(i, { imageAlt: e.target.value })}
                      />
                    </label>
                    <label className="block text-xs font-medium text-[#60759b]">
                      CTA link (path)
                      <input
                        className="mt-1 w-full rounded-admin border border-[#e3e6ed] px-3 py-2 text-sm text-[#1c2740]"
                        placeholder="/shop"
                        value={slide.ctaHref}
                        onChange={(e) => updateSlide(i, { ctaHref: e.target.value })}
                      />
                    </label>
                    <label className="flex items-center gap-2 text-sm text-[#31374a] sm:col-span-2">
                      <input
                        type="checkbox"
                        checked={slide.isActive !== false}
                        onChange={(e) => updateSlide(i, { isActive: e.target.checked })}
                      />
                      Active (shown on storefront)
                    </label>
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={addSlide}
                className="rounded-admin border border-dashed border-[#3874ff] px-4 py-2 text-sm font-medium text-[#3874ff] hover:bg-[#edf5ff]"
              >
                + Add another slide
              </button>
            </>
          )}
        </div>
      )}
    </AdminPageShell>
  );
}
