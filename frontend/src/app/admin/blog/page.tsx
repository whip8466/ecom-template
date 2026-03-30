'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AdminPageShell } from '@/components/admin-shell';
import { apiRequest } from '@/lib/api';
import type { BlogPost } from '@/lib/blog';
import { useAuthStore } from '@/store/auth-store';

const MENU_WIDTH = 192;

function BlogRowActions({
  post,
  deletingId,
  togglingId,
  onDelete,
  onPublishToggle,
  menu,
  onOpenMenu,
  onCloseMenu,
}: {
  post: BlogPost;
  deletingId: number | null;
  togglingId: number | null;
  onDelete: (id: number) => void;
  onPublishToggle: (id: number, publish: boolean) => void;
  menu: { postId: number; top: number; left: number } | null;
  onOpenMenu: (postId: number, rect: DOMRect) => void;
  onCloseMenu: () => void;
}) {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const open = menu?.postId === post.id;

  useEffect(() => {
    if (!open) return;
    const onMouseDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (menuRef.current?.contains(t)) return;
      if (triggerRef.current?.contains(t)) return;
      onCloseMenu();
    };
    document.addEventListener('mousedown', onMouseDown);
    return () => document.removeEventListener('mousedown', onMouseDown);
  }, [open, onCloseMenu]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCloseMenu();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onCloseMenu]);

  const busy = deletingId === post.id || togglingId === post.id;

  const handleTriggerClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    if (open) {
      onCloseMenu();
    } else {
      onOpenMenu(post.id, rect);
    }
  };

  const menuContent =
    open && typeof document !== 'undefined'
      ? createPortal(
          <div
            ref={menuRef}
            role="menu"
            className="fixed z-[300] w-48 rounded-md border border-[#e3e6ed] bg-white py-1 text-left shadow-lg"
            style={{
              top: menu!.top,
              left: menu!.left,
            }}
          >
            <Link
              role="menuitem"
              href={`/admin/blog/${post.id}/edit`}
              className="block px-3 py-2 text-sm text-[#1c2740] hover:bg-[#f5f7fa]"
              onClick={onCloseMenu}
            >
              Edit
            </Link>
            {post.publishedAt ? (
              <button
                type="button"
                role="menuitem"
                disabled={busy}
                className="block w-full px-3 py-2 text-left text-sm text-[#1c2740] hover:bg-[#f5f7fa] disabled:opacity-50"
                onClick={() => {
                  onCloseMenu();
                  void onPublishToggle(post.id, false);
                }}
              >
                {togglingId === post.id ? '…' : 'Unpublish'}
              </button>
            ) : (
              <button
                type="button"
                role="menuitem"
                disabled={busy}
                className="block w-full px-3 py-2 text-left text-sm text-[#1c2740] hover:bg-[#f5f7fa] disabled:opacity-50"
                onClick={() => {
                  onCloseMenu();
                  void onPublishToggle(post.id, true);
                }}
              >
                {togglingId === post.id ? '…' : 'Publish'}
              </button>
            )}
            {!post.publishedAt ? (
              <button
                type="button"
                role="menuitem"
                disabled={busy}
                className="block w-full px-3 py-2 text-left text-sm text-red-700 hover:bg-red-50 disabled:opacity-50"
                onClick={() => {
                  onCloseMenu();
                  void onDelete(post.id);
                }}
              >
                {deletingId === post.id ? '…' : 'Delete'}
              </button>
            ) : (
              <div className="border-t border-[#e3e6ed] px-3 py-2 text-xs text-[#64748b]">
                Unpublish to enable delete
              </div>
            )}
          </div>,
          document.body,
        )
      : null;

  return (
    <div className="flex justify-end">
      <button
        ref={triggerRef}
        type="button"
        aria-label="Post actions"
        aria-expanded={open}
        aria-haspopup="menu"
        disabled={busy && !open}
        onClick={handleTriggerClick}
        className="inline-flex h-8 w-8 items-center justify-center rounded-md text-[#475467] hover:bg-[#f2f4f7] disabled:opacity-50"
      >
        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
          <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
        </svg>
      </button>
      {menuContent}
    </div>
  );
}

export default function AdminBlogListPage() {
  const token = useAuthStore((s) => s.token);
  const [mounted, setMounted] = useState(false);
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [togglingId, setTogglingId] = useState<number | null>(null);
  const [menu, setMenu] = useState<{ postId: number; top: number; left: number } | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const load = useCallback(() => {
    if (!token) return Promise.resolve();
    setLoading(true);
    setError(null);
    return apiRequest<{ data: BlogPost[] }>('/api/admin/blog-posts', { token })
      .then((res) => {
        setPosts(Array.isArray(res.data) ? res.data : []);
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

  const closeMenu = useCallback(() => setMenu(null), []);

  const openMenu = useCallback((postId: number, rect: DOMRect) => {
    const left = Math.min(
      Math.max(8, rect.right - MENU_WIDTH),
      typeof window !== 'undefined' ? window.innerWidth - MENU_WIDTH - 8 : rect.left,
    );
    setMenu({ postId, top: rect.bottom + 4, left });
  }, []);

  const remove = async (id: number) => {
    if (!token) return;
    if (!window.confirm('Delete this draft? This cannot be undone.')) return;
    setDeletingId(id);
    setError(null);
    try {
      await apiRequest(`/api/admin/blog-posts/${id}`, { method: 'DELETE', token });
      setPosts((prev) => prev.filter((p) => p.id !== id));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setDeletingId(null);
    }
  };

  const publishToggle = async (id: number, publish: boolean) => {
    if (!token) return;
    setTogglingId(id);
    setError(null);
    try {
      const res = await apiRequest<{ data: BlogPost }>(`/api/admin/blog-posts/${id}`, {
        method: 'PUT',
        token,
        body: JSON.stringify({ publish }),
      });
      setPosts((prev) => prev.map((p) => (p.id === id ? res.data : p)));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <AdminPageShell
      breadcrumbs={[{ label: 'Home', href: '/admin' }, { label: 'Blog' }]}
      title="Blog posts"
      description="Create and manage articles. Published posts are available from the public /api/blog endpoints."
      actions={
        <Link
          href="/admin/blog/new"
          className="rounded-admin bg-[#3874ff] px-4 py-2 text-sm font-medium text-white hover:bg-[#2d5fd6]"
        >
          Add blog post
        </Link>
      }
    >
      {!mounted ? (
        <p className="text-sm text-[#64748b]">Loading…</p>
      ) : !token ? (
        <p className="text-sm text-[#64748b]">Sign in as admin to manage blog posts.</p>
      ) : (
        <div className="space-y-4">
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          {loading ? <p className="text-sm text-[#60759b]">Loading posts…</p> : null}
          {!loading && posts.length === 0 ? (
            <p className="text-sm text-[#60759b]">No posts yet. Add your first article.</p>
          ) : null}
          {posts.length > 0 ? (
            <div className="overflow-x-auto rounded-admin border border-[#e3e6ed]">
              <table className="min-w-full divide-y divide-[#e3e6ed] text-sm">
                <thead className="bg-[#f8fafc] text-left text-xs font-semibold uppercase tracking-wide text-[#64748b]">
                  <tr>
                    <th className="px-4 py-3">Title</th>
                    <th className="px-4 py-3">Category</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Updated</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e3e6ed]">
                  {posts.map((p) => (
                    <tr key={p.id}>
                      <td className="px-4 py-3 font-medium text-[#1c2740]">{p.title}</td>
                      <td className="px-4 py-3 text-sm text-[#60759b]">{p.category?.name ?? '—'}</td>
                      <td className="px-4 py-3 text-[#60759b]">
                        {p.publishedAt ? (
                          <span className="text-green-700">Published</span>
                        ) : (
                          <span className="text-amber-700">Draft</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-[#64748b]">
                        {new Date(p.updatedAt).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <BlogRowActions
                          post={p}
                          deletingId={deletingId}
                          togglingId={togglingId}
                          onDelete={remove}
                          onPublishToggle={publishToggle}
                          menu={menu}
                          onOpenMenu={openMenu}
                          onCloseMenu={closeMenu}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </div>
      )}
    </AdminPageShell>
  );
}
