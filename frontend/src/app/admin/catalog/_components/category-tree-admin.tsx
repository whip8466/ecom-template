'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { AdminPageShell, type AdminBreadcrumbItem } from '@/components/admin-shell';
import { apiRequest } from '@/lib/api';
import { useAuthStore } from '@/store/auth-store';

export type CategoryRow = {
  id: number;
  name: string;
  slug: string;
  parentId: number | null;
  iconUrl: string | null;
  depth: number;
  productCount: number;
};

function subtreeIdSet(rows: CategoryRow[], rootId: number): Set<number> {
  const byParent = new Map<number | null, number[]>();
  for (const r of rows) {
    const k = r.parentId;
    if (!byParent.has(k)) byParent.set(k, []);
    byParent.get(k)!.push(r.id);
  }
  const out = new Set<number>([rootId]);
  const stack = [...(byParent.get(rootId) ?? [])];
  while (stack.length) {
    const id = stack.pop()!;
    out.add(id);
    for (const ch of byParent.get(id) ?? []) stack.push(ch);
  }
  return out;
}

type Props = {
  breadcrumbs: AdminBreadcrumbItem[];
};

export function CategoryTreeAdmin({ breadcrumbs }: Props) {
  const token = useAuthStore((s) => s.token);
  const [rows, setRows] = useState<CategoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [newName, setNewName] = useState('');
  const [newParentId, setNewParentId] = useState<string>('');
  const [newIconUrl, setNewIconUrl] = useState('');

  const [editing, setEditing] = useState<CategoryRow | null>(null);
  const [editName, setEditName] = useState('');
  const [editParentId, setEditParentId] = useState<string>('');
  const [editIconUrl, setEditIconUrl] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiRequest<{ data: CategoryRow[] }>('/api/categories');
      setRows(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      setError((e as Error).message);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const parentOptionsForNew = useMemo(() => rows, [rows]);

  const parentOptionsForEdit = useMemo(() => {
    if (!editing) return rows;
    const blocked = subtreeIdSet(rows, editing.id);
    return rows.filter((r) => !blocked.has(r.id));
  }, [rows, editing]);

  const create = async () => {
    const name = newName.trim();
    if (!name || !token) return;
    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      const parentId =
        newParentId === '' ? null : Number.parseInt(newParentId, 10);
      if (newParentId !== '' && !Number.isFinite(parentId)) {
        setError('Invalid parent category');
        setSaving(false);
        return;
      }
      const iconUrl = newIconUrl.trim();
      await apiRequest<{ data: unknown }>('/api/categories', {
        method: 'POST',
        body: JSON.stringify({
          name,
          parentId,
          iconUrl: iconUrl || null,
        }),
        token,
      });
      setNewName('');
      setNewParentId('');
      setNewIconUrl('');
      setMessage('Category created.');
      await load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const openEdit = (row: CategoryRow) => {
    setEditing(row);
    setEditName(row.name);
    setEditParentId(row.parentId == null ? '' : String(row.parentId));
    setEditIconUrl(row.iconUrl ?? '');
  };

  const saveEdit = async () => {
    if (!editing || !token) return;
    const name = editName.trim();
    if (!name) return;
    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      const parentId =
        editParentId === '' ? null : Number.parseInt(editParentId, 10);
      if (editParentId !== '' && !Number.isFinite(parentId)) {
        setError('Invalid parent category');
        setSaving(false);
        return;
      }
      const iconUrl = editIconUrl.trim();
      await apiRequest<{ data: unknown }>(`/api/categories/${editing.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          name,
          parentId,
          iconUrl: iconUrl || null,
        }),
        token,
      });
      setEditing(null);
      setMessage('Changes saved.');
      await load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (row: CategoryRow) => {
    if (!token) return;
    if (!window.confirm(`Delete “${row.name}”? Subcategories must be removed first.`)) return;
    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      await apiRequest(`/api/categories/${row.id}`, { method: 'DELETE', token });
      setMessage('Deleted.');
      await load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <AdminPageShell
        breadcrumbs={breadcrumbs}
        title="Categories"
        description="Nested categories with optional icon URLs. Slugs include the parent path. Filtering the shop by a parent category includes products in all subcategories."
        actions={
          <button
            type="button"
            onClick={() => void load()}
            disabled={loading}
            className="rounded-admin border border-[#e3e6ed] px-4 py-2 text-sm font-medium text-[#31374a] hover:bg-[#f5f7fa] disabled:opacity-50"
          >
            Refresh
          </button>
        }
      >
        <div className="space-y-6">
          {message ? <p className="text-sm text-green-700">{message}</p> : null}
          {error ? <p className="text-sm text-red-600">{error}</p> : null}

          <div className="rounded-admin border border-[#e3e6ed] bg-white p-4 shadow-sm">
            <h2 className="text-sm font-semibold text-[#1c2740]">Add category</h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <label className="block text-xs font-medium text-[#60759b] sm:col-span-2">
                Name
                <input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Category name"
                  className="mt-1 w-full rounded-admin border border-[#e3e6ed] px-3 py-2 text-sm text-[#1c2740]"
                />
              </label>
              <label className="block text-xs font-medium text-[#60759b]">
                Parent (optional)
                <select
                  value={newParentId}
                  onChange={(e) => setNewParentId(e.target.value)}
                  className="mt-1 w-full rounded-admin border border-[#e3e6ed] px-3 py-2 text-sm text-[#1c2740]"
                >
                  <option value="">— Top level —</option>
                  {parentOptionsForNew.map((c) => (
                    <option key={c.id} value={c.id}>
                      {'\u2014 '.repeat(c.depth)}
                      {c.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-xs font-medium text-[#60759b]">
                Icon image URL (optional)
                <input
                  value={newIconUrl}
                  onChange={(e) => setNewIconUrl(e.target.value)}
                  placeholder="https://…"
                  className="mt-1 w-full rounded-admin border border-[#e3e6ed] px-3 py-2 text-sm text-[#1c2740]"
                />
              </label>
            </div>
            <button
              type="button"
              disabled={!token || saving || !newName.trim()}
              onClick={() => void create()}
              className="mt-4 rounded-admin bg-[#3874ff] px-4 py-2 text-sm font-medium text-white hover:bg-[#2d5fd6] disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Add category'}
            </button>
          </div>

          <div className="overflow-x-auto rounded-admin border border-[#e3e6ed] bg-white shadow-sm">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="border-b border-[#e3e6ed] bg-[#f9fafb] text-xs font-semibold uppercase tracking-wide text-[#60759b]">
                <tr>
                  <th className="px-4 py-3">Icon</th>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Slug</th>
                  <th className="px-4 py-3">Products (subtree)</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-[#60759b]">
                      Loading…
                    </td>
                  </tr>
                ) : rows.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-[#60759b]">
                      No categories yet.
                    </td>
                  </tr>
                ) : (
                  rows.map((row) => (
                    <tr key={row.id} className="border-b border-[#f0f2f6] last:border-0">
                      <td className="px-4 py-2">
                        <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-[#E8F4FF] text-xs font-semibold text-[#3874ff]">
                          {row.iconUrl ? (
                            <span
                              className="h-full w-full bg-contain bg-center bg-no-repeat"
                              style={{ backgroundImage: `url(${row.iconUrl})` }}
                              aria-hidden
                            />
                          ) : (
                            <span className="px-1 text-center leading-tight">—</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-2 font-medium text-[#1c2740]">
                        <span style={{ paddingLeft: row.depth * 12 }} className="inline-block">
                          {row.depth > 0 ? <span className="text-[#c5d0e5">└ </span> : null}
                          {row.name}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-[#60759b]">{row.slug}</td>
                      <td className="px-4 py-2 text-[#60759b]">{row.productCount}</td>
                      <td className="px-4 py-2 text-right">
                        <button
                          type="button"
                          onClick={() => openEdit(row)}
                          className="mr-2 text-sm font-medium text-[#3874ff] hover:underline"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          disabled={saving}
                          onClick={() => void remove(row)}
                          className="text-sm font-medium text-red-600 hover:underline disabled:opacity-50"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </AdminPageShell>

      {editing ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div
            role="dialog"
            aria-modal
            aria-labelledby="edit-cat-title"
            className="w-full max-w-md rounded-admin border border-[#e3e6ed] bg-white p-6 shadow-xl"
          >
            <h2 id="edit-cat-title" className="text-lg font-semibold text-[#1c2740]">
              Edit category
            </h2>
            <label className="mt-4 block text-xs font-medium text-[#60759b]">
              Name
              <input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="mt-1 w-full rounded-admin border border-[#e3e6ed] px-3 py-2 text-sm text-[#1c2740]"
              />
            </label>
            <label className="mt-3 block text-xs font-medium text-[#60759b]">
              Parent
              <select
                value={editParentId}
                onChange={(e) => setEditParentId(e.target.value)}
                className="mt-1 w-full rounded-admin border border-[#e3e6ed] px-3 py-2 text-sm text-[#1c2740]"
              >
                <option value="">— Top level —</option>
                {parentOptionsForEdit.map((c) => (
                  <option key={c.id} value={c.id}>
                    {'\u2014 '.repeat(c.depth)}
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="mt-3 block text-xs font-medium text-[#60759b]">
              Icon image URL
              <input
                value={editIconUrl}
                onChange={(e) => setEditIconUrl(e.target.value)}
                placeholder="https://…"
                className="mt-1 w-full rounded-admin border border-[#e3e6ed] px-3 py-2 text-sm text-[#1c2740]"
              />
            </label>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="rounded-admin border border-[#e3e6ed] px-4 py-2 text-sm font-medium text-[#31374a] hover:bg-[#f5f7fa]"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={saving || !editName.trim()}
                onClick={() => void saveEdit()}
                className="rounded-admin bg-[#3874ff] px-4 py-2 text-sm font-medium text-white hover:bg-[#2d5fd6] disabled:opacity-50"
              >
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
