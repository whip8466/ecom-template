'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiRequest } from '@/lib/api';
import { useAuthStore } from '@/store/auth-store';
import type { Category } from '@/lib/types';

export default function AdminCategoriesPage() {
  const router = useRouter();
  const { token, user } = useAuthStore();
  const [categories, setCategories] = useState<Category[]>([]);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);

  async function loadCategories() {
    const res = await apiRequest<{ data: Category[] }>('/api/categories');
    setCategories(res.data);
  }

  useEffect(() => {
    if (!token) {
      router.push('/login');
      return;
    }
    if (user?.role === 'CUSTOMER') {
      router.push('/');
      return;
    }

    const run = async () => {
      const res = await apiRequest<{ data: Category[] }>('/api/categories');
      setCategories(res.data);
    };

    run().catch(() => undefined);
  }, [router, token, user]);

  async function saveCategory() {
    if (!token) return;
    await apiRequest(editingId ? `/api/admin/categories/${editingId}` : '/api/admin/categories', {
      method: editingId ? 'PUT' : 'POST',
      token,
      body: JSON.stringify({ name, slug: slug || undefined }),
    });
    setName('');
    setSlug('');
    setEditingId(null);
    await loadCategories();
  }

  async function deleteCategory(id: number) {
    if (!token) return;
    await apiRequest(`/api/admin/categories/${id}`, { method: 'DELETE', token });
    await loadCategories();
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Manage categories</h1>
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          <input className="rounded border px-3 py-2" placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
          <input className="rounded border px-3 py-2" placeholder="Slug (optional)" value={slug} onChange={(e) => setSlug(e.target.value)} />
          <button className="rounded bg-slate-900 px-4 py-2 text-white" onClick={saveCategory}>{editingId ? 'Update' : 'Create'}</button>
        </div>
      </div>
      {categories.map((category) => (
        <div key={category.id} className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">{category.name}</p>
              <p className="text-sm text-slate-600">{category.slug}</p>
            </div>
            <div className="flex gap-2">
              <button className="rounded border px-3 py-1.5 text-sm" onClick={() => { setEditingId(category.id); setName(category.name); setSlug(category.slug); }}>Edit</button>
              <button className="rounded border px-3 py-1.5 text-sm" onClick={() => deleteCategory(category.id)}>Delete</button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
