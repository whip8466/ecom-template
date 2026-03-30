'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { AdminPageShell } from '@/components/admin-shell';
import { apiRequest } from '@/lib/api';
import type { BlogCategory } from '@/lib/blog';
import { slugFromTitle } from '@/lib/slugify-title';
import { useAuthStore } from '@/store/auth-store';

export default function AdminBlogCategoriesPage() {
  const token = useAuthStore((s) => s.token);
  const [mounted, setMounted] = useState(false);
  const [items, setItems] = useState<BlogCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const load = useCallback(() => {
    if (!token) return Promise.resolve();
    setLoading(true);
    setError(null);
    return apiRequest<{ data: BlogCategory[] }>('/api/admin/blog-categories', { token })
      .then((res) => {
        setItems(Array.isArray(res.data) ? res.data : []);
      })
      .catch((e) => {
        setError((e as Error).message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [token]);

  useEffect(() => {
    if (!mounted || !token) return;
    void load();
  }, [mounted, token, load]);

  const createCategory = async () => {
    if (!token || !name.trim()) return;
    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      await apiRequest<{ data: BlogCategory }>('/api/admin/blog-categories', {
        method: 'POST',
        token,
        body: JSON.stringify({
          name: name.trim(),
          ...(slug.trim() ? { slug: slug.trim() } : {}),
        }),
      });
      setMessage('Category created.');
      setName('');
      setSlug('');
      await load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: number) => {
    if (!token) return;
    if (!window.confirm('Delete this category? Posts using it will be uncategorized.')) return;
    setDeletingId(id);
    setError(null);
    try {
      await apiRequest(`/api/admin/blog-categories/${id}`, { method: 'DELETE', token });
      await load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <AdminPageShell
      breadcrumbs={[
        { label: 'Home', href: '/admin' },
        { label: 'Blog', href: '/admin/blog' },
        { label: 'Categories' },
      ]}
      title="Blog categories"
      description={
        <>
          Categories appear in the Blog menu when they have at least one published post.{' '}
          <Link href="/admin/blog" className="font-semibold text-[#3874ff] hover:underline">
            Back to posts
          </Link>
        </>
      }
    >
      {!mounted ? (
        <p className="text-sm text-[#64748b]">Loading…</p>
      ) : !token ? (
        <p className="text-sm text-[#64748b]">Sign in as admin.</p>
      ) : (
        <div className="space-y-8">
          {message ? <p className="text-sm text-green-700">{message}</p> : null}
          {error ? <p className="text-sm text-red-600">{error}</p> : null}

          <div className="rounded-admin border border-[#e3e6ed] bg-white p-4 shadow-sm">
            <p className="text-sm font-semibold text-[#1c2740]">Add category</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <label className="block text-xs font-medium text-[#60759b]">
                Name
                <input
                  type="text"
                  className="mt-1 w-full rounded-admin border border-[#e3e6ed] px-3 py-2 text-sm text-[#1c2740]"
                  value={name}
                  onChange={(e) => {
                    const v = e.target.value;
                    setName(v);
                    setSlug(slugFromTitle(v));
                  }}
                  placeholder="e.g. News"
                />
              </label>
              <label className="block text-xs font-medium text-[#60759b]">
                Slug (optional)
                <input
                  type="text"
                  className="mt-1 w-full rounded-admin border border-[#e3e6ed] px-3 py-2 text-sm text-[#1c2740]"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="news"
                />
              </label>
            </div>
            <button
              type="button"
              disabled={saving || !name.trim()}
              onClick={() => void createCategory()}
              className="mt-3 rounded-admin bg-[#3874ff] px-4 py-2 text-sm font-medium text-white hover:bg-[#2d5fd6] disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Add category'}
            </button>
          </div>

          {loading ? <p className="text-sm text-[#60759b]">Loading…</p> : null}
          {items.length > 0 ? (
            <div className="overflow-x-auto rounded-admin border border-[#e3e6ed]">
              <table className="min-w-full divide-y divide-[#e3e6ed] text-sm">
                <thead className="bg-[#f8fafc] text-left text-xs font-semibold uppercase tracking-wide text-[#64748b]">
                  <tr>
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">Slug</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e3e6ed]">
                  {items.map((c) => (
                    <tr key={c.id}>
                      <td className="px-4 py-3 font-medium text-[#1c2740]">{c.name}</td>
                      <td className="px-4 py-3 text-[#60759b]">{c.slug}</td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          disabled={deletingId === c.id}
                          onClick={() => void remove(c.id)}
                          className="rounded-admin border border-red-200 px-2 py-1 text-xs text-red-700 hover:bg-red-50 disabled:opacity-50"
                        >
                          {deletingId === c.id ? '…' : 'Delete'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : !loading ? (
            <p className="text-sm text-[#60759b]">No categories yet.</p>
          ) : null}
        </div>
      )}
    </AdminPageShell>
  );
}
