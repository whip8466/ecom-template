'use client';

import { useCallback, useEffect, useState } from 'react';
import { AdminPageShell } from '@/components/admin-shell';
import { FaqCategoryIcon } from '@/components/faq/faq-category-icon';
import { apiRequest } from '@/lib/api';
import {
  FAQ_ICON_KEYS,
  FAQ_ICON_LABELS,
  type FaqCategoryAdmin,
  type FaqIconKey,
  type FaqItemAdmin,
} from '@/lib/faq';
import { slugFromTitle } from '@/lib/slugify-title';
import { useAuthStore } from '@/store/auth-store';

export default function AdminFaqPage() {
  const token = useAuthStore((s) => s.token);
  const [mounted, setMounted] = useState(false);

  const [categories, setCategories] = useState<FaqCategoryAdmin[]>([]);
  const [items, setItems] = useState<FaqItemAdmin[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);

  const [loadingCats, setLoadingCats] = useState(false);
  const [loadingItems, setLoadingItems] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const [catTitle, setCatTitle] = useState('');
  const [catSlug, setCatSlug] = useState('');
  const [catIcon, setCatIcon] = useState<FaqIconKey>('document');
  const [catSort, setCatSort] = useState(0);
  const [editingCatId, setEditingCatId] = useState<number | null>(null);
  const [savingCat, setSavingCat] = useState(false);
  const [deletingCatId, setDeletingCatId] = useState<number | null>(null);

  const [q, setQ] = useState('');
  const [a, setA] = useState('');
  const [itemSort, setItemSort] = useState(0);
  const [itemActive, setItemActive] = useState(true);
  const [editingItemId, setEditingItemId] = useState<number | null>(null);
  const [savingItem, setSavingItem] = useState(false);
  const [deletingItemId, setDeletingItemId] = useState<number | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const loadCategories = useCallback(() => {
    if (!token) return Promise.resolve();
    setLoadingCats(true);
    setError(null);
    return apiRequest<{ data: FaqCategoryAdmin[] }>('/api/admin/faq-categories', { token })
      .then((res) => {
        const rows = Array.isArray(res.data) ? res.data : [];
        setCategories(rows);
        setSelectedCategoryId((prev) => {
          if (rows.length === 0) return null;
          if (prev != null && rows.some((c) => c.id === prev)) return prev;
          return rows[0].id;
        });
      })
      .catch((e) => {
        setError((e as Error).message);
      })
      .finally(() => {
        setLoadingCats(false);
      });
  }, [token]);

  const loadItems = useCallback(() => {
    if (!token || selectedCategoryId == null) {
      setItems([]);
      return Promise.resolve();
    }
    setLoadingItems(true);
    setError(null);
    return apiRequest<{ data: FaqItemAdmin[] }>(
      `/api/admin/faq-items?categoryId=${selectedCategoryId}`,
      { token },
    )
      .then((res) => {
        setItems(Array.isArray(res.data) ? res.data : []);
      })
      .catch((e) => {
        setError((e as Error).message);
        setItems([]);
      })
      .finally(() => {
        setLoadingItems(false);
      });
  }, [token, selectedCategoryId]);

  useEffect(() => {
    if (!mounted || !token) return;
    void loadCategories();
  }, [mounted, token, loadCategories]);

  useEffect(() => {
    if (!mounted || !token) return;
    void loadItems();
  }, [mounted, token, selectedCategoryId, loadItems]);

  const resetCategoryForm = () => {
    setCatTitle('');
    setCatSlug('');
    setCatIcon('document');
    setCatSort(0);
    setEditingCatId(null);
  };

  const startEditCategory = (c: FaqCategoryAdmin) => {
    setEditingCatId(c.id);
    setCatTitle(c.title);
    setCatSlug(c.slug);
    setCatIcon(c.iconKey);
    setCatSort(c.sortOrder);
  };

  const saveCategory = async () => {
    if (!token || !catTitle.trim()) return;
    setSavingCat(true);
    setMessage(null);
    setError(null);
    try {
      if (editingCatId != null) {
        await apiRequest<{ data: FaqCategoryAdmin }>(`/api/admin/faq-categories/${editingCatId}`, {
          method: 'PUT',
          token,
          body: JSON.stringify({
            title: catTitle.trim(),
            slug: catSlug.trim() || undefined,
            iconKey: catIcon,
            sortOrder: catSort,
          }),
        });
        setMessage('Category updated.');
      } else {
        await apiRequest<{ data: FaqCategoryAdmin }>('/api/admin/faq-categories', {
          method: 'POST',
          token,
          body: JSON.stringify({
            title: catTitle.trim(),
            slug: catSlug.trim() || undefined,
            iconKey: catIcon,
            sortOrder: catSort,
          }),
        });
        setMessage('Category created.');
      }
      resetCategoryForm();
      await loadCategories();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSavingCat(false);
    }
  };

  const removeCategory = async (id: number) => {
    if (!token) return;
    if (!window.confirm('Delete this category and all of its FAQ entries?')) return;
    setDeletingCatId(id);
    setError(null);
    try {
      await apiRequest(`/api/admin/faq-categories/${id}`, { method: 'DELETE', token });
      setMessage('Category deleted.');
      if (editingCatId === id) resetCategoryForm();
      await loadCategories();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setDeletingCatId(null);
    }
  };

  const resetItemForm = () => {
    setQ('');
    setA('');
    setItemSort(0);
    setItemActive(true);
    setEditingItemId(null);
  };

  const startEditItem = (it: FaqItemAdmin) => {
    setEditingItemId(it.id);
    setQ(it.question);
    setA(it.answer);
    setItemSort(it.sortOrder);
    setItemActive(it.isActive);
  };

  const saveItem = async () => {
    if (!token || selectedCategoryId == null || !q.trim() || !a.trim()) return;
    setSavingItem(true);
    setMessage(null);
    setError(null);
    try {
      if (editingItemId != null) {
        await apiRequest<{ data: FaqItemAdmin }>(`/api/admin/faq-items/${editingItemId}`, {
          method: 'PUT',
          token,
          body: JSON.stringify({
            question: q.trim(),
            answer: a.trim(),
            sortOrder: itemSort,
            isActive: itemActive,
          }),
        });
        setMessage('FAQ updated.');
      } else {
        await apiRequest<{ data: FaqItemAdmin }>('/api/admin/faq-items', {
          method: 'POST',
          token,
          body: JSON.stringify({
            categoryId: selectedCategoryId,
            question: q.trim(),
            answer: a.trim(),
            sortOrder: itemSort,
            isActive: itemActive,
          }),
        });
        setMessage('FAQ added.');
      }
      resetItemForm();
      await loadCategories();
      await loadItems();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSavingItem(false);
    }
  };

  const removeItem = async (id: number) => {
    if (!token) return;
    if (!window.confirm('Delete this FAQ?')) return;
    setDeletingItemId(id);
    setError(null);
    try {
      await apiRequest(`/api/admin/faq-items/${id}`, { method: 'DELETE', token });
      setMessage('FAQ deleted.');
      if (editingItemId === id) resetItemForm();
      await loadCategories();
      await loadItems();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setDeletingItemId(null);
    }
  };

  const canSave = mounted && !!token && !savingCat && !savingItem;

  return (
    <AdminPageShell
      breadcrumbs={[
        { label: 'Home', href: '/admin' },
        { label: 'FAQ' },
      ]}
      title="FAQ"
      description="Manage FAQ categories and questions. Only active questions are shown on the storefront; categories with no visible questions are hidden."
    >
      {!mounted ? (
        <p className="text-sm text-[#64748b]">Loading…</p>
      ) : !token ? (
        <p className="text-sm text-[#64748b]">Sign in as admin.</p>
      ) : (
        <div className="space-y-6">
          {message ? <p className="text-sm text-green-700">{message}</p> : null}
          {error ? <p className="text-sm text-red-600">{error}</p> : null}

          <div className="rounded-admin border border-[#e3e6ed] bg-white p-4 shadow-sm">
            <p className="text-sm font-semibold text-[#1c2740]">
              {editingCatId != null ? 'Edit category' : 'Add category'}
            </p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <label className="block text-xs font-medium text-[#60759b] sm:col-span-2">
                Title
                <input
                  type="text"
                  className="mt-1 w-full rounded-admin border border-[#e3e6ed] px-3 py-2 text-sm text-[#1c2740]"
                  value={catTitle}
                  onChange={(e) => {
                    const v = e.target.value;
                    setCatTitle(v);
                    if (editingCatId == null) setCatSlug(slugFromTitle(v));
                  }}
                  placeholder="e.g. Shipping & delivery"
                />
              </label>
              <label className="block text-xs font-medium text-[#60759b]">
                Slug (optional)
                <input
                  type="text"
                  className="mt-1 w-full rounded-admin border border-[#e3e6ed] px-3 py-2 text-sm text-[#1c2740]"
                  value={catSlug}
                  onChange={(e) => setCatSlug(e.target.value)}
                  placeholder="auto from title"
                />
              </label>
              <label className="block text-xs font-medium text-[#60759b]">
                Sort order
                <input
                  type="number"
                  className="mt-1 w-full rounded-admin border border-[#e3e6ed] px-3 py-2 text-sm text-[#1c2740]"
                  value={catSort}
                  onChange={(e) => setCatSort(Number(e.target.value) || 0)}
                  min={0}
                />
              </label>
              <label className="block text-xs font-medium text-[#60759b] sm:col-span-2">
                Sidebar icon
                <select
                  className="mt-1 w-full rounded-admin border border-[#e3e6ed] px-3 py-2 text-sm text-[#1c2740]"
                  value={catIcon}
                  onChange={(e) => setCatIcon(e.target.value as FaqIconKey)}
                >
                  {FAQ_ICON_KEYS.map((k) => (
                    <option key={k} value={k}>
                      {FAQ_ICON_LABELS[k]}
                    </option>
                  ))}
                </select>
              </label>
              <div className="flex items-end gap-2 sm:col-span-2">
                <span className="flex h-10 w-10 items-center justify-center rounded-admin border border-[#e3e6ed] bg-[#f8fafc] text-[#3874ff]">
                  <FaqCategoryIcon iconKey={catIcon} className="h-5 w-5" />
                </span>
                {editingCatId != null ? (
                  <button
                    type="button"
                    onClick={() => resetCategoryForm()}
                    className="rounded-admin border border-[#e3e6ed] px-3 py-2 text-sm text-[#60759b] hover:bg-[#f5f7fa]"
                  >
                    Cancel
                  </button>
                ) : null}
                <button
                  type="button"
                  disabled={!canSave || savingCat || !catTitle.trim()}
                  onClick={() => void saveCategory()}
                  className="rounded-admin bg-[#3874ff] px-4 py-2 text-sm font-medium text-white hover:bg-[#2d5fd6] disabled:opacity-50"
                >
                  {savingCat ? 'Saving…' : editingCatId != null ? 'Update category' : 'Add category'}
                </button>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto rounded-admin border border-[#e3e6ed]">
            <table className="min-w-full divide-y divide-[#e3e6ed] text-sm">
              <thead className="bg-[#f8fafc] text-left text-xs font-semibold uppercase tracking-wide text-[#64748b]">
                <tr>
                  <th className="px-4 py-3">Title</th>
                  <th className="px-4 py-3">Slug</th>
                  <th className="px-4 py-3">Icon</th>
                  <th className="px-4 py-3">Sort</th>
                  <th className="px-4 py-3">FAQs</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e3e6ed]">
                {loadingCats ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-6 text-[#60759b]">
                      Loading…
                    </td>
                  </tr>
                ) : categories.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-6 text-[#60759b]">
                      No categories yet.
                    </td>
                  </tr>
                ) : (
                  categories.map((c) => (
                    <tr key={c.id}>
                      <td className="px-4 py-3 font-medium text-[#1c2740]">{c.title}</td>
                      <td className="px-4 py-3 text-[#60759b]">{c.slug}</td>
                      <td className="px-4 py-3">
                        <span className="inline-flex text-[#3874ff]">
                          <FaqCategoryIcon iconKey={c.iconKey} className="h-5 w-5" />
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[#60759b]">{c.sortOrder}</td>
                      <td className="px-4 py-3 text-[#60759b]">{c.itemCount}</td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => startEditCategory(c)}
                          className="mr-2 rounded-admin border border-[#e3e6ed] px-2 py-1 text-xs text-[#3874ff] hover:bg-[#edf5ff]"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          disabled={deletingCatId === c.id}
                          onClick={() => void removeCategory(c.id)}
                          className="rounded-admin border border-red-200 px-2 py-1 text-xs text-red-700 hover:bg-red-50 disabled:opacity-50"
                        >
                          {deletingCatId === c.id ? '…' : 'Delete'}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="rounded-admin border border-[#e3e6ed] bg-white p-4 shadow-sm">
            <p className="text-sm font-semibold text-[#1c2740]">Questions & answers</p>
            <p className="mt-1 text-xs text-[#60759b]">
              Inactive entries are hidden on the public FAQ page. Use blank lines in the answer for paragraphs.
            </p>
            <div className="mt-3 max-w-md">
              <label className="block text-xs font-medium text-[#60759b]">
                Category
                <select
                  className="mt-1 w-full rounded-admin border border-[#e3e6ed] px-3 py-2 text-sm text-[#1c2740]"
                  value={selectedCategoryId ?? ''}
                  onChange={(e) => setSelectedCategoryId(Number(e.target.value) || null)}
                  disabled={categories.length === 0}
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {selectedCategoryId != null ? (
              <>
                <div className="mt-4 overflow-x-auto rounded-admin border border-[#e3e6ed]">
                  <table className="min-w-full divide-y divide-[#e3e6ed] text-sm">
                    <thead className="bg-[#f8fafc] text-left text-xs font-semibold uppercase tracking-wide text-[#64748b]">
                      <tr>
                        <th className="px-4 py-3">Question</th>
                        <th className="w-20 px-4 py-3">Sort</th>
                        <th className="w-24 px-4 py-3">Active</th>
                        <th className="w-40 px-4 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#e3e6ed] bg-white">
                      {loadingItems ? (
                        <tr>
                          <td colSpan={4} className="px-4 py-6 text-[#60759b]">
                            Loading…
                          </td>
                        </tr>
                      ) : items.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="px-4 py-6 text-[#60759b]">
                            No FAQs in this category yet.
                          </td>
                        </tr>
                      ) : (
                        items.map((it) => (
                          <tr key={it.id}>
                            <td className="max-w-md px-4 py-3 font-medium text-[#1c2740]">
                              <span className="line-clamp-2">{it.question}</span>
                            </td>
                            <td className="px-4 py-3 text-[#60759b]">{it.sortOrder}</td>
                            <td className="px-4 py-3 text-[#60759b]">{it.isActive ? 'Yes' : 'No'}</td>
                            <td className="px-4 py-3 text-right">
                              <button
                                type="button"
                                onClick={() => startEditItem(it)}
                                className="mr-2 rounded-admin border border-[#e3e6ed] px-2 py-1 text-xs text-[#3874ff] hover:bg-[#edf5ff]"
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                disabled={deletingItemId === it.id}
                                onClick={() => void removeItem(it.id)}
                                className="rounded-admin border border-red-200 px-2 py-1 text-xs text-red-700 hover:bg-red-50 disabled:opacity-50"
                              >
                                {deletingItemId === it.id ? '…' : 'Delete'}
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                <p className="mt-6 text-xs font-medium text-[#60759b]">Add or edit an entry</p>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <label className="block text-xs font-medium text-[#60759b] sm:col-span-2">
                    Question
                    <input
                      type="text"
                      className="mt-1 w-full rounded-admin border border-[#e3e6ed] px-3 py-2 text-sm text-[#1c2740]"
                      value={q}
                      onChange={(e) => setQ(e.target.value)}
                      placeholder="Question as shown to customers"
                    />
                  </label>
                  <label className="block text-xs font-medium text-[#60759b] sm:col-span-2">
                    Answer
                    <textarea
                      rows={4}
                      className="mt-1 w-full rounded-admin border border-[#e3e6ed] px-3 py-2 text-sm text-[#1c2740]"
                      value={a}
                      onChange={(e) => setA(e.target.value)}
                      placeholder="Answer (use blank lines between paragraphs)"
                    />
                  </label>
                  <label className="block text-xs font-medium text-[#60759b]">
                    Sort order
                    <input
                      type="number"
                      className="mt-1 w-full rounded-admin border border-[#e3e6ed] px-3 py-2 text-sm text-[#1c2740]"
                      value={itemSort}
                      onChange={(e) => setItemSort(Number(e.target.value) || 0)}
                      min={0}
                    />
                  </label>
                  <label className="flex items-center gap-2 pt-6 text-sm text-[#1c2740]">
                    <input
                      type="checkbox"
                      checked={itemActive}
                      onChange={(e) => setItemActive(e.target.checked)}
                    />
                    Active on storefront
                  </label>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {editingItemId != null ? (
                    <button
                      type="button"
                      onClick={() => resetItemForm()}
                      className="rounded-admin border border-[#e3e6ed] px-3 py-2 text-sm text-[#60759b] hover:bg-[#f5f7fa]"
                    >
                      Cancel
                    </button>
                  ) : null}
                  <button
                    type="button"
                    disabled={!canSave || savingItem || !q.trim() || !a.trim()}
                    onClick={() => void saveItem()}
                    className="rounded-admin bg-[#3874ff] px-4 py-2 text-sm font-medium text-white hover:bg-[#2d5fd6] disabled:opacity-50"
                  >
                    {savingItem ? 'Saving…' : editingItemId != null ? 'Update FAQ' : 'Add FAQ'}
                  </button>
                </div>
              </>
            ) : (
              <p className="mt-4 text-sm text-[#60759b]">Create a category first.</p>
            )}
          </div>
        </div>
      )}
    </AdminPageShell>
  );
}
