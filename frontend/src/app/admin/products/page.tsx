'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiRequest } from '@/lib/api';
import type { Category, Product } from '@/lib/types';
import { useAuthStore } from '@/store/auth-store';
import { formatMoney } from '@/lib/format';

type ProductForm = {
  name: string;
  slug: string;
  shortDescription: string;
  description: string;
  priceCents: number;
  stock: number;
  categoryId: number;
  images: Array<{ imageUrl: string }>;
  colors: Array<{ colorName: string; colorCode: string; stock?: number }>;
};

const initial: ProductForm = {
  name: '',
  slug: '',
  shortDescription: '',
  description: '',
  priceCents: 1000,
  stock: 1,
  categoryId: 0,
  images: [{ imageUrl: '' }],
  colors: [{ colorName: '', colorCode: '#000000', stock: 0 }],
};

export default function AdminProductsPage() {
  const router = useRouter();
  const { token, user } = useAuthStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [form, setForm] = useState(initial);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  async function loadData() {
    if (!token) return;
    const [productsRes, categoriesRes] = await Promise.all([
      apiRequest<{ data: Product[] }>('/api/products', {}),
      apiRequest<{ data: Category[] }>('/api/categories', { token }),
    ]);
    setProducts(productsRes.data);
    setCategories(categoriesRes.data);
    setForm((f) => (f.categoryId || !categoriesRes.data[0] ? f : { ...f, categoryId: categoriesRes.data[0].id }));
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

    loadData()
      .catch((e) => setError((e as Error).message || 'Failed to load data'))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router, token, user]);

  async function saveProduct() {
    if (!token) return;
    try {
      setError('');
      if (!form.categoryId) {
        setError('Please select a category');
        return;
      }

      const payload = {
        ...form,
        images: form.images.filter((x) => x.imageUrl),
        colors: form.colors.filter((x) => x.colorName),
      };

      await apiRequest(editingId ? `/api/admin/products/${editingId}` : '/api/admin/products', {
        method: editingId ? 'PUT' : 'POST',
        token,
        body: JSON.stringify(payload),
      });

      setForm(initial);
      setEditingId(null);
      await loadData();
    } catch (e) {
      setError((e as Error).message || 'Failed to save product');
    }
  }

  async function deleteProduct(id: number) {
    if (!token) return;
    await apiRequest(`/api/admin/products/${id}`, { method: 'DELETE', token });
    await loadData();
  }

  function updateImage(index: number, value: string) {
    setForm((prev) => {
      const images = [...prev.images];
      images[index] = { imageUrl: value };
      return { ...prev, images };
    });
  }

  function updateColor(index: number, patch: Partial<{ colorName: string; colorCode: string; stock?: number }>) {
    setForm((prev) => {
      const colors = [...prev.colors];
      colors[index] = { ...colors[index], ...patch };
      return { ...prev, colors };
    });
  }

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-semibold">Manage products</h1>

      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="font-medium">{editingId ? 'Edit product' : 'Add product'}</h2>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <input className="rounded border px-3 py-2" placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <input className="rounded border px-3 py-2" placeholder="Slug (optional)" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
          <input className="rounded border px-3 py-2" placeholder="Short description" value={form.shortDescription} onChange={(e) => setForm({ ...form, shortDescription: e.target.value })} />
          <input type="number" className="rounded border px-3 py-2" placeholder="Price cents" value={form.priceCents} onChange={(e) => setForm({ ...form, priceCents: Number(e.target.value) })} />
          <input type="number" className="rounded border px-3 py-2" placeholder="Stock" value={form.stock} onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })} />
          <select className="rounded border px-3 py-2" value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: Number(e.target.value) })}>
            <option value={0}>Select category</option>
            {categories.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
          </select>
          <textarea className="rounded border px-3 py-2 sm:col-span-2" placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />

          <div className="space-y-2 sm:col-span-2">
            <p className="text-sm font-medium">Images</p>
            {form.images.map((img, index) => (
              <div key={`img-${index}`} className="flex gap-2">
                <input
                  className="w-full rounded border px-3 py-2"
                  placeholder="Image URL"
                  value={img.imageUrl}
                  onChange={(e) => updateImage(index, e.target.value)}
                />
                <button
                  type="button"
                  className="rounded border px-3 py-2 text-sm"
                  onClick={() => setForm((prev) => ({ ...prev, images: prev.images.filter((_, i) => i !== index) }))}
                  disabled={form.images.length === 1}
                >
                  Remove
                </button>
              </div>
            ))}
            <button
              type="button"
              className="rounded border px-3 py-1.5 text-sm"
              onClick={() => setForm((prev) => ({ ...prev, images: [...prev.images, { imageUrl: '' }] }))}
            >
              + Add image
            </button>
          </div>

          <div className="space-y-2 sm:col-span-2">
            <p className="text-sm font-medium">Colors</p>
            {form.colors.map((color, index) => (
              <div key={`color-${index}`} className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_180px_140px_auto]">
                <input
                  className="rounded border px-3 py-2"
                  placeholder="Color name"
                  value={color.colorName || ''}
                  onChange={(e) => updateColor(index, { colorName: e.target.value })}
                />
                <input
                  className="rounded border px-3 py-2"
                  placeholder="#000000"
                  value={color.colorCode || ''}
                  onChange={(e) => updateColor(index, { colorCode: e.target.value })}
                />
                <input
                  type="number"
                  className="rounded border px-3 py-2"
                  placeholder="Stock"
                  value={color.stock ?? 0}
                  onChange={(e) => updateColor(index, { stock: Number(e.target.value) })}
                />
                <button
                  type="button"
                  className="rounded border px-3 py-2 text-sm"
                  onClick={() => setForm((prev) => ({ ...prev, colors: prev.colors.filter((_, i) => i !== index) }))}
                  disabled={form.colors.length === 1}
                >
                  Remove
                </button>
              </div>
            ))}
            <button
              type="button"
              className="rounded border px-3 py-1.5 text-sm"
              onClick={() =>
                setForm((prev) => ({
                  ...prev,
                  colors: [...prev.colors, { colorName: '', colorCode: '#000000', stock: 0 }],
                }))
              }
            >
              + Add color
            </button>
          </div>
        </div>
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        <div className="mt-3 flex gap-2">
          <button className="rounded-md bg-slate-900 px-4 py-2 text-white" onClick={saveProduct}>{editingId ? 'Update' : 'Create'} product</button>
          {editingId && <button className="rounded-md border px-4 py-2" onClick={() => { setEditingId(null); setForm(initial); }}>Cancel</button>}
        </div>
      </div>

      <div className="space-y-3">
        {loading && <p className="text-sm text-slate-600">Loading products...</p>}
        {!loading && products.length === 0 && (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white p-5 text-sm text-slate-500">
            No products found.
          </div>
        )}
        {products.map((product) => (
          <div key={product.id} className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="font-medium">{product.name}</p>
            <p className="text-sm text-slate-600">{product.category?.name} - {formatMoney(product.priceCents)}</p>
            <div className="mt-2 flex gap-2">
              <button
                className="rounded-md border px-3 py-1.5 text-sm"
                onClick={() => {
                  setEditingId(product.id);
                  setForm({
                    name: product.name,
                    slug: product.slug,
                    shortDescription: product.shortDescription || '',
                    description: product.description || '',
                    priceCents: product.priceCents,
                    stock: product.stock,
                    categoryId: product.category?.id || 0,
                    images: product.images.length ? product.images.map((img) => ({ imageUrl: img.imageUrl })) : [{ imageUrl: '' }],
                    colors: product.availableColors.length
                      ? product.availableColors.map((c) => ({ colorName: c.colorName, colorCode: c.colorCode, stock: c.stock }))
                      : [{ colorName: '', colorCode: '#000000', stock: 0 }],
                  });
                }}
              >
                Edit
              </button>
              {user?.role === 'ADMIN' && (
                <button className="rounded-md border px-3 py-1.5 text-sm" onClick={() => deleteProduct(product.id)}>Delete</button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
