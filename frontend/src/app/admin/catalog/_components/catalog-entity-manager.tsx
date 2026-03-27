'use client';

import { useCallback, useEffect, useState } from 'react';
import { AdminPageShell, type AdminBreadcrumbItem } from '@/components/admin-shell';
import { apiRequest } from '@/lib/api';
import { useAuthStore } from '@/store/auth-store';

type Row = {
  id: number;
  name: string;
  slug: string;
  productCount?: number;
};

type Props = {
  breadcrumbs: AdminBreadcrumbItem[];
  title: string;
  description: string;
  apiPath: string;
  singular: string;
};

export function CatalogEntityManager({ breadcrumbs, title, description, apiPath, singular }: Props) {
  const token = useAuthStore((s) => s.token);
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const [editing, setEditing] = useState<Row | null>(null);
  const [editName, setEditName] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiRequest<{ data: Row[] }>(apiPath);
      setRows(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      setError((e as Error).message);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [apiPath]);

  useEffect(() => {
    void load();
  }, [load]);

  const create = async () => {
    const name = newName.trim();
    if (!name || !token) return;
    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      await apiRequest<{ data: Row }>(apiPath, {
        method: 'POST',
        body: JSON.stringify({ name }),
        token,
      });
      setNewName('');
      setMessage(`${singular.charAt(0).toUpperCase()}${singular.slice(1)} created.`);
      await load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const saveEdit = async () => {
    if (!editing || !token) return;
    const name = editName.trim();
    if (!name) return;
    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      await apiRequest<{ data: Row }>(`${apiPath}/${editing.id}`, {
        method: 'PUT',
        body: JSON.stringify({ name }),
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

  const remove = async (row: Row) => {
    if (!token) return;
    if (!window.confirm(`Delete “${row.name}”? This cannot be undone.`)) return;
    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      await apiRequest(`${apiPath}/${row.id}`, { method: 'DELETE', token });
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
      title={title}
      description={description}
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
          <h2 className="text-sm font-semibold text-[#1c2740]">Add {singular}</h2>
          <div className="mt-3 flex flex-wrap items-end gap-3">
            <label className="block min-w-[200px] flex-1 text-xs font-medium text-[#60759b]">
              Name
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder={`${singular} name`}
                className="mt-1 w-full rounded-admin border border-[#e3e6ed] px-3 py-2 text-sm text-[#1c2740]"
              />
            </label>
            <button
              type="button"
              disabled={!token || saving || !newName.trim()}
              onClick={() => void create()}
              className="rounded-admin bg-[#3874ff] px-4 py-2 text-sm font-medium text-white hover:bg-[#2d5fd6] disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Add'}
            </button>
          </div>
        </div>

        <div className="overflow-x-auto rounded-admin border border-[#e3e6ed] bg-white shadow-sm">
          <table className="w-full min-w-[520px] text-left text-sm">
            <thead className="border-b border-[#e3e6ed] bg-[#f9fafb] text-xs font-semibold uppercase tracking-wide text-[#60759b]">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Slug</th>
                <th className="px-4 py-3">Products</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-[#60759b]">
                    Loading…
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-[#60759b]">
                    No {title.toLowerCase()} yet. Add one above.
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr key={row.id} className="border-b border-[#f0f2f6] last:border-0">
                    <td className="px-4 py-3 font-medium text-[#1c2740]">{row.name}</td>
                    <td className="px-4 py-3 text-[#60759b]">{row.slug}</td>
                    <td className="px-4 py-3 text-[#60759b]">{row.productCount ?? 0}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => {
                          setEditing(row);
                          setEditName(row.name);
                        }}
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
          aria-labelledby="edit-catalog-title"
          className="w-full max-w-md rounded-admin border border-[#e3e6ed] bg-white p-6 shadow-xl"
        >
          <h2 id="edit-catalog-title" className="text-lg font-semibold text-[#1c2740]">
            Edit {singular}
          </h2>
          <label className="mt-4 block text-xs font-medium text-[#60759b]">
            Name
            <input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
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
