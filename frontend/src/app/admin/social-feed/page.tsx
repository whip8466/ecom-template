'use client';

import { useCallback, useEffect, useState } from 'react';
import { AdminPageShell } from '@/components/admin-shell';
import { apiRequest } from '@/lib/api';
import {
  SOCIAL_FEED_FILTER_TABS,
  type SocialFeedContentType,
  type SocialFeedPlatform,
  type SocialFeedPostAdmin,
  type SocialFeedSettings,
} from '@/lib/social-feed';
import { useAuthStore } from '@/store/auth-store';

const CONTENT_OPTIONS: { value: SocialFeedContentType; label: string }[] = SOCIAL_FEED_FILTER_TABS.filter(
  (t): t is { key: SocialFeedContentType; label: string } => t.key !== 'all',
).map((t) => ({ value: t.key, label: t.label }));

const PLATFORM_OPTIONS: { value: SocialFeedPlatform; label: string }[] = [
  { value: 'YOUTUBE', label: 'YouTube' },
  { value: 'INSTAGRAM', label: 'Instagram' },
  { value: 'FACEBOOK', label: 'Facebook' },
];

const emptyPostForm = {
  contentType: 'VIDEO' as SocialFeedContentType,
  platform: 'YOUTUBE' as SocialFeedPlatform,
  title: '',
  description: '',
  thumbnailUrl: '',
  externalUrl: '',
  ctaLabel: '',
  sortOrder: 0,
  isFeatured: false,
  isPublished: true,
};

export default function AdminSocialFeedPage() {
  const token = useAuthStore((s) => s.token);
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [settings, setSettings] = useState<SocialFeedSettings | null>(null);
  const [savingSettings, setSavingSettings] = useState(false);

  const [posts, setPosts] = useState<SocialFeedPostAdmin[]>([]);
  const [postForm, setPostForm] = useState(emptyPostForm);
  const [editingPostId, setEditingPostId] = useState<number | null>(null);
  const [savingPost, setSavingPost] = useState(false);
  const [deletingPostId, setDeletingPostId] = useState<number | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const [sRes, pRes] = await Promise.all([
        apiRequest<{ data: SocialFeedSettings }>('/api/admin/social-feed-settings', { token }),
        apiRequest<{ data: SocialFeedPostAdmin[] }>('/api/admin/social-feed-posts', { token }),
      ]);
      setSettings(sRes.data ?? null);
      setPosts(Array.isArray(pRes.data) ? pRes.data : []);
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

  const saveSettings = async () => {
    if (!token || !settings) return;
    setSavingSettings(true);
    setMessage(null);
    setError(null);
    try {
      const res = await apiRequest<{ data: SocialFeedSettings }>('/api/admin/social-feed-settings', {
        method: 'PUT',
        body: JSON.stringify({
          heroTitle: settings.heroTitle.trim(),
          heroSubtitle: settings.heroSubtitle,
          ctaSectionTitle: settings.ctaSectionTitle?.trim() || null,
          ctaShopUrl: settings.ctaShopUrl?.trim() || null,
          ctaFollowUrl: settings.ctaFollowUrl?.trim() || null,
          ctaCommunityUrl: settings.ctaCommunityUrl?.trim() || null,
        }),
        token,
      });
      if (res.data) setSettings(res.data);
      setMessage('Settings saved.');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSavingSettings(false);
    }
  };

  const resetPostForm = () => {
    setPostForm(emptyPostForm);
    setEditingPostId(null);
  };

  const editPost = (p: SocialFeedPostAdmin) => {
    setEditingPostId(p.id);
    setPostForm({
      contentType: p.contentType,
      platform: p.platform,
      title: p.title,
      description: p.description,
      thumbnailUrl: p.thumbnailUrl ?? '',
      externalUrl: p.externalUrl,
      ctaLabel: p.ctaLabelOverride?.trim() ? p.ctaLabelOverride : '',
      sortOrder: p.sortOrder,
      isFeatured: p.isFeatured,
      isPublished: p.isPublished,
    });
  };

  const savePost = async () => {
    if (!token) return;
    if (!postForm.title.trim() || !postForm.description.trim() || !postForm.externalUrl.trim()) {
      setError('Post title, description, and external URL are required.');
      return;
    }
    setSavingPost(true);
    setMessage(null);
    setError(null);
    try {
      const body = {
        contentType: postForm.contentType,
        platform: postForm.platform,
        title: postForm.title.trim(),
        description: postForm.description.trim(),
        thumbnailUrl: postForm.thumbnailUrl.trim() || null,
        externalUrl: postForm.externalUrl.trim(),
        ctaLabel: postForm.ctaLabel.trim() || null,
        sortOrder: postForm.sortOrder,
        isFeatured: postForm.isFeatured,
        isPublished: postForm.isPublished,
      };
      if (editingPostId) {
        await apiRequest<{ data: SocialFeedPostAdmin }>(`/api/admin/social-feed-posts/${editingPostId}`, {
          method: 'PATCH',
          body: JSON.stringify(body),
          token,
        });
      } else {
        await apiRequest<{ data: SocialFeedPostAdmin }>('/api/admin/social-feed-posts', {
          method: 'POST',
          body: JSON.stringify(body),
          token,
        });
      }
      await load();
      resetPostForm();
      setMessage('Post saved.');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSavingPost(false);
    }
  };

  const deletePost = async (id: number) => {
    if (!token) return;
    if (!window.confirm('Delete this post? This cannot be undone.')) return;
    setDeletingPostId(id);
    setError(null);
    try {
      await apiRequest(`/api/admin/social-feed-posts/${id}`, { method: 'DELETE', token });
      await load();
      if (editingPostId === id) resetPostForm();
      setMessage('Post deleted.');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setDeletingPostId(null);
    }
  };

  if (!mounted) {
    return (
      <AdminPageShell breadcrumbs={[{ label: 'Home', href: '/admin' }, { label: 'Social feed' }]} title="Social feed" description="Manage the public Social feed page.">
        <p className="text-sm text-[#64748b]">Loading…</p>
      </AdminPageShell>
    );
  }

  if (!token) {
    return (
      <AdminPageShell breadcrumbs={[{ label: 'Home', href: '/admin' }, { label: 'Social feed' }]} title="Social feed" description="Manage the public Social feed page.">
        <p className="text-sm text-[#64748b]">Sign in as admin to edit.</p>
      </AdminPageShell>
    );
  }

  if (loading && !settings) {
    return (
      <AdminPageShell breadcrumbs={[{ label: 'Home', href: '/admin' }, { label: 'Social feed' }]} title="Social feed" description="Manage the public Social feed page.">
        <p className="text-sm text-[#64748b]">Loading…</p>
      </AdminPageShell>
    );
  }

  if (!settings) {
    return (
      <AdminPageShell breadcrumbs={[{ label: 'Home', href: '/admin' }, { label: 'Social feed' }]} title="Social feed" description="Manage the public Social feed page.">
        <p className="text-sm text-red-600">Could not load settings. Run migrations and restart the API.</p>
      </AdminPageShell>
    );
  }

  const inputClass =
    'mt-1 w-full rounded-admin border border-[#e3e6ed] px-3 py-2 text-sm text-[#31374a]';
  const labelClass = 'text-xs font-semibold uppercase tracking-wide text-[#64748b]';

  return (
    <AdminPageShell
      breadcrumbs={[{ label: 'Home', href: '/admin' }, { label: 'Social feed' }]}
      title="Social feed"
      description="Hero, featured post, grid items, and mid-page CTAs on /social-feed."
      actions={
        <button
          type="button"
          onClick={() => void saveSettings()}
          disabled={savingSettings}
          className="rounded-admin bg-[#3874ff] px-4 py-2 text-sm font-medium text-white hover:bg-[#2d5fd6] disabled:opacity-50"
        >
          {savingSettings ? 'Saving…' : 'Save page settings'}
        </button>
      }
    >
      <div className="space-y-10">
        {message ? <p className="text-sm text-green-700">{message}</p> : null}
        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        <div className="max-w-2xl space-y-4 rounded-admin border border-[#e3e6ed] bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-[#101828]">Hero & copy</h2>
          <label className="block">
            <span className={labelClass}>Title</span>
            <input
              type="text"
              value={settings.heroTitle}
              onChange={(e) => setSettings((s) => (s ? { ...s, heroTitle: e.target.value } : s))}
              className={inputClass}
            />
          </label>
          <label className="block">
            <span className={labelClass}>Subtitle</span>
            <textarea
              value={settings.heroSubtitle}
              onChange={(e) => setSettings((s) => (s ? { ...s, heroSubtitle: e.target.value } : s))}
              rows={3}
              className={inputClass}
            />
          </label>
        </div>

        <div className="max-w-2xl space-y-4 rounded-admin border border-[#e3e6ed] bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-[#101828]">Mid-page CTA</h2>
          <label className="block">
            <span className={labelClass}>Section title</span>
            <input
              type="text"
              value={settings.ctaSectionTitle ?? ''}
              onChange={(e) => setSettings((s) => (s ? { ...s, ctaSectionTitle: e.target.value || null } : s))}
              placeholder="Love what you see?"
              className={inputClass}
            />
          </label>
          <div className="grid gap-4 sm:grid-cols-3">
            <label className="block">
              <span className={labelClass}>Shop products URL</span>
              <input
                type="text"
                value={settings.ctaShopUrl ?? ''}
                onChange={(e) => setSettings((s) => (s ? { ...s, ctaShopUrl: e.target.value || null } : s))}
                className={inputClass}
              />
            </label>
            <label className="block">
              <span className={labelClass}>Follow us URL</span>
              <input
                type="text"
                value={settings.ctaFollowUrl ?? ''}
                onChange={(e) => setSettings((s) => (s ? { ...s, ctaFollowUrl: e.target.value || null } : s))}
                className={inputClass}
              />
            </label>
            <label className="block">
              <span className={labelClass}>Join community URL</span>
              <input
                type="text"
                value={settings.ctaCommunityUrl ?? ''}
                onChange={(e) => setSettings((s) => (s ? { ...s, ctaCommunityUrl: e.target.value || null } : s))}
                className={inputClass}
              />
            </label>
          </div>
        </div>

        <div className="max-w-5xl space-y-4 rounded-admin border border-[#e3e6ed] bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-[#101828]">Posts & featured</h2>
            {editingPostId ? (
              <button type="button" onClick={resetPostForm} className="text-sm text-[#64748b] hover:text-[#31374a]">
                Cancel edit
              </button>
            ) : null}
          </div>
          <p className="text-xs text-[#94a3b8]">Mark one post as featured for the large highlight card. It appears above the grid and is not repeated in the grid.</p>

          <div className="grid gap-4 border-t border-[#f0f2f5] pt-4 sm:grid-cols-2 lg:grid-cols-3">
            <label className="block">
              <span className={labelClass}>Content type</span>
              <select
                value={postForm.contentType}
                onChange={(e) => setPostForm((f) => ({ ...f, contentType: e.target.value as SocialFeedContentType }))}
                className={inputClass}
              >
                {CONTENT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className={labelClass}>Platform</span>
              <select
                value={postForm.platform}
                onChange={(e) => setPostForm((f) => ({ ...f, platform: e.target.value as SocialFeedPlatform }))}
                className={inputClass}
              >
                {PLATFORM_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className={labelClass}>Sort order</span>
              <input
                type="number"
                value={postForm.sortOrder}
                onChange={(e) => setPostForm((f) => ({ ...f, sortOrder: Number(e.target.value) || 0 }))}
                className={inputClass}
              />
            </label>
          </div>
          <label className="block">
            <span className={labelClass}>Title</span>
            <input
              type="text"
              value={postForm.title}
              onChange={(e) => setPostForm((f) => ({ ...f, title: e.target.value }))}
              className={inputClass}
            />
          </label>
          <label className="block">
            <span className={labelClass}>Description</span>
            <textarea
              value={postForm.description}
              onChange={(e) => setPostForm((f) => ({ ...f, description: e.target.value }))}
              rows={3}
              className={inputClass}
            />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className={labelClass}>Thumbnail URL</span>
              <input
                type="url"
                value={postForm.thumbnailUrl}
                onChange={(e) => setPostForm((f) => ({ ...f, thumbnailUrl: e.target.value }))}
                className={inputClass}
              />
            </label>
            <label className="block">
              <span className={labelClass}>External URL</span>
              <input
                type="url"
                value={postForm.externalUrl}
                onChange={(e) => setPostForm((f) => ({ ...f, externalUrl: e.target.value }))}
                className={inputClass}
              />
            </label>
          </div>
          <label className="block">
            <span className={labelClass}>CTA label (optional)</span>
            <input
              type="text"
              value={postForm.ctaLabel}
              onChange={(e) => setPostForm((f) => ({ ...f, ctaLabel: e.target.value }))}
              placeholder="Defaults: Watch on YouTube / View on Instagram / …"
              className={inputClass}
            />
          </label>
          <label className="flex cursor-pointer items-center gap-2 text-sm text-[#475467]">
            <input
              type="checkbox"
              checked={postForm.isFeatured}
              onChange={(e) => setPostForm((f) => ({ ...f, isFeatured: e.target.checked }))}
            />
            Featured (highlight card)
          </label>
          <label className="flex cursor-pointer items-center gap-2 text-sm text-[#475467]">
            <input
              type="checkbox"
              checked={postForm.isPublished}
              onChange={(e) => setPostForm((f) => ({ ...f, isPublished: e.target.checked }))}
            />
            Published
          </label>
          <button
            type="button"
            onClick={() => void savePost()}
            disabled={savingPost}
            className="rounded-admin bg-[#3874ff] px-4 py-2 text-sm font-medium text-white hover:bg-[#2d5fd6] disabled:opacity-50"
          >
            {savingPost ? 'Saving…' : editingPostId ? 'Update post' : 'Add post'}
          </button>

          <div className="mt-6 overflow-x-auto rounded-admin border border-[#e3e6ed]">
            <table className="min-w-full text-left text-sm text-[#31374a]">
              <thead className="border-b border-[#e3e6ed] bg-[#f9fafb] text-xs font-semibold uppercase tracking-wide text-[#6e7891]">
                <tr>
                  <th className="px-3 py-2">Order</th>
                  <th className="px-3 py-2">Type</th>
                  <th className="px-3 py-2">Title</th>
                  <th className="px-3 py-2">Featured</th>
                  <th className="px-3 py-2">Published</th>
                  <th className="px-3 py-2"> </th>
                </tr>
              </thead>
              <tbody>
                {posts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-3 py-6 text-center text-[#6e7891]">
                      No posts yet.
                    </td>
                  </tr>
                ) : (
                  posts.map((p) => (
                    <tr key={p.id} className="border-b border-[#f0f2f5] align-top last:border-0">
                      <td className="whitespace-nowrap px-3 py-2">{p.sortOrder}</td>
                      <td className="px-3 py-2">{(p.contentType as string)}</td>
                      <td className="max-w-[200px] px-3 py-2">{p.title}</td>
                      <td className="px-3 py-2">{p.isFeatured ? 'Yes' : '—'}</td>
                      <td className="px-3 py-2">{p.isPublished ? 'Yes' : 'No'}</td>
                      <td className="whitespace-nowrap px-3 py-2">
                        <button
                          type="button"
                          onClick={() => editPost(p)}
                          className="text-[#3874ff] hover:underline"
                        >
                          Edit
                        </button>
                        <span className="mx-2 text-[#e3e6ed]">|</span>
                        <button
                          type="button"
                          onClick={() => void deletePost(p.id)}
                          disabled={deletingPostId === p.id}
                          className="text-red-600 hover:underline disabled:opacity-50"
                        >
                          {deletingPostId === p.id ? '…' : 'Delete'}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <p className="text-xs text-[#94a3b8]">
          Public storefront:{' '}
          <a href="/social-feed" className="text-[#3874ff] hover:underline" target="_blank" rel="noreferrer">
            /social-feed
          </a>
        </p>
      </div>
    </AdminPageShell>
  );
}
