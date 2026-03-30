'use client';

import Link from 'next/link';
import { useParams, notFound } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { AdminPageShell } from '@/components/admin-shell';
import { apiRequest } from '@/lib/api';
import type { SitePageDto } from '@/lib/site-pages';
import { SITE_PAGE_LABELS, isSitePageSlug } from '@/lib/site-pages';
import { useAuthStore } from '@/store/auth-store';

export default function AdminContentEditPage() {
  const params = useParams();
  const slugParam = params?.slug;
  const slug = typeof slugParam === 'string' ? slugParam : '';
  const token = useAuthStore((s) => s.token);

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!token || !isSitePageSlug(slug)) return;
    setLoading(true);
    setError(null);
    try {
      const res = await apiRequest<{ data: SitePageDto }>(`/api/admin/site-pages/${encodeURIComponent(slug)}`, {
        token,
      });
      if (res.data) {
        setTitle(res.data.title);
        setBody(res.data.body);
        setUpdatedAt(res.data.updatedAt);
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [token, slug]);

  useEffect(() => {
    void load();
  }, [load]);

  if (!isSitePageSlug(slug)) {
    notFound();
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      const res = await apiRequest<{ data: SitePageDto }>(`/api/admin/site-pages/${encodeURIComponent(slug)}`, {
        method: 'PUT',
        token,
        body: JSON.stringify({ title: title.trim(), body }),
      });
      if (res.data?.updatedAt) setUpdatedAt(res.data.updatedAt);
      setMessage('Saved.');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  const label = SITE_PAGE_LABELS[slug];

  return (
    <AdminPageShell
      breadcrumbs={[
        { label: 'Admin', href: '/admin' },
        { label: 'Site pages', href: '/admin/content' },
        { label: label },
      ]}
      title={label}
    >
      <p className="mt-2 text-sm text-[#64748b]">
        <Link href="/admin/content" className="text-[#246bfd] hover:underline">
          ← Back to site pages
        </Link>
      </p>

      {!token ? (
        <p className="mt-8 text-sm text-[#64748b]">Sign in to edit content.</p>
      ) : loading ? (
        <p className="mt-8 text-sm text-[#64748b]">Loading…</p>
      ) : (
        <form onSubmit={onSubmit} className="mt-8 max-w-3xl space-y-6">
          {error && <p className="text-sm text-red-600">{error}</p>}
          {message && <p className="text-sm text-emerald-600">{message}</p>}
          {updatedAt && (
            <p className="text-xs text-[#94a3b8]">
              Last updated {new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(updatedAt))}
            </p>
          )}
          <div>
            <label htmlFor="site-page-title" className="mb-1 block text-sm font-medium text-[#1c2740]">
              Page title
            </label>
            <input
              id="site-page-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="h-11 w-full rounded-admin border border-[#e5ebf5] bg-white px-4 text-sm text-[#1c2740] outline-none focus:border-[#246bfd]"
              required
              maxLength={500}
            />
          </div>
          <div>
            <label htmlFor="site-page-body" className="mb-1 block text-sm font-medium text-[#1c2740]">
              Body (HTML)
            </label>
            <textarea
              id="site-page-body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={18}
              className="w-full rounded-admin border border-[#e5ebf5] bg-white px-4 py-3 font-mono text-sm text-[#1c2740] outline-none focus:border-[#246bfd]"
              placeholder="<p>Your content…</p>"
            />
            <p className="mt-1 text-xs text-[#94a3b8]">
              Public URL:{' '}
              <a
                href={
                  slug === 'about-us'
                    ? '/about-us'
                    : slug === 'privacy-policy'
                      ? '/privacy-policy'
                      : '/terms-of-service'
                }
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#246bfd] hover:underline"
              >
                View on store
              </a>
            </p>
          </div>
          <button
            type="submit"
            disabled={saving}
            className="rounded-admin bg-[#246bfd] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#1e5ee6] disabled:opacity-60"
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
        </form>
      )}
    </AdminPageShell>
  );
}
