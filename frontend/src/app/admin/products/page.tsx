'use client';

import Link from 'next/link';
import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '@/store/auth-store';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000';

type Category = { id: number; name: string; slug: string };
type ProductImage = { id: number; imageUrl: string };
type Product = {
  id: number;
  name: string;
  slug: string;
  shortDescription: string | null;
  priceCents: number;
  stock: number;
  createdAt?: string;
  category: Category | null;
  images: ProductImage[];
};

type TabId = 'all' | 'published' | 'drafts' | 'discount';

const TABS: { id: TabId; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'published', label: 'Published' },
  { id: 'drafts', label: 'Drafts' },
  { id: 'discount', label: 'On discount' },
];

function formatPrice(cents: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(cents / 100);
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(d);
}

export default function AdminProductsPage() {
  const token = useAuthStore((s) => s.token);
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [categorySlug, setCategorySlug] = useState('');
  const [vendorSlug, setVendorSlug] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [vendors, setVendors] = useState<{ id: number; name: string; slug: string }[]>([]);
  const [activeTab, setActiveTab] = useState<TabId>('all');
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  const totalPages = Math.max(1, Math.ceil(total / limit));
  const startItem = total === 0 ? 0 : (page - 1) * limit + 1;
  const endItem = Math.min(page * limit, total);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', String(limit));
      if (search) params.set('q', search);
      if (categorySlug) params.set('category', categorySlug);
      const res = await fetch(`${API_BASE}/api/products?${params.toString()}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error((json as { message?: string }).message || 'Failed to load products');
      const data = json as { data: Product[]; pagination: { total: number } };
      setProducts(Array.isArray(data.data) ? data.data : []);
      setTotal(data.pagination?.total ?? 0);
    } catch (e) {
      setProducts([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, categorySlug, token]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    if (!token) return;
    fetch(`${API_BASE}/api/categories`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d: { data?: Category[] }) => setCategories(Array.isArray(d.data) ? d.data : []))
      .catch(() => {});
    fetch(`${API_BASE}/api/vendors`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d: { data?: { id: number; name: string; slug: string }[] }) => setVendors(Array.isArray(d.data) ? d.data : []))
      .catch(() => {});
  }, [token]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput.trim());
    setPage(1);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === products.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(products.map((p) => p.id)));
    }
  };

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="min-h-full">
      {/* Breadcrumbs */}
      <nav className="text-sm text-[#8ea0bf]">
        <Link href="/admin" className="hover:text-[#246bfd]">Admin</Link>
        <span className="mx-2">/</span>
        <span className="text-[#1c2740]">Products</span>
      </nav>

      <h1 className="mt-2 text-2xl font-bold text-[#1c2740]">Products</h1>

      {/* Tabs */}
      <div className="mt-6 flex gap-6 border-b border-[#e5ebf5]">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`pb-3 text-sm font-medium transition ${
              activeTab === tab.id
                ? 'border-b-2 border-[#246bfd] text-[#246bfd]'
                : 'text-[#64748b] hover:text-[#1c2740]'
            }`}
          >
            {tab.id === 'all' ? `${tab.label} (${total})` : tab.label}
          </button>
        ))}
      </div>

      {/* Filters + Add product */}
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <form onSubmit={handleSearchSubmit} className="flex flex-1 min-w-[200px] max-w-sm">
          <input
            type="text"
            placeholder="Search products"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="h-10 w-full rounded-sm border border-[#e5ebf5] bg-white px-4 py-2 text-sm text-[#1c2740] placeholder:text-[#94a3b8] focus:border-[#246bfd] focus:outline-none"
          />
        </form>
        <select
          value={categorySlug}
          onChange={(e) => { setCategorySlug(e.target.value); setPage(1); }}
          className="h-10 rounded-sm border border-[#e5ebf5] bg-white px-4 py-2 text-sm text-[#1c2740] focus:border-[#246bfd] focus:outline-none"
        >
          <option value="">Category</option>
          {categories.map((c) => (
            <option key={c.id} value={c.slug}>{c.name}</option>
          ))}
        </select>
        <select
          value={vendorSlug}
          onChange={(e) => { setVendorSlug(e.target.value); setPage(1); }}
          className="h-10 rounded-sm border border-[#e5ebf5] bg-white px-4 py-2 text-sm text-[#1c2740] focus:border-[#246bfd] focus:outline-none"
        >
          <option value="">Vendor</option>
          {vendors.map((v) => (
            <option key={v.id} value={v.slug}>{v.name}</option>
          ))}
        </select>
        <button
          type="button"
          className="h-10 rounded-sm border border-[#e5ebf5] bg-white px-4 py-2 text-sm font-medium text-[#475569] hover:bg-[#f8fafc]"
        >
          More filters
        </button>
        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            className="flex h-10 items-center gap-2 rounded-sm border border-[#e5ebf5] bg-white px-4 py-2 text-sm font-medium text-[#475569] hover:bg-[#f8fafc]"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Export
          </button>
          <Link
            href="/admin/products/new"
            className="flex h-10 items-center gap-2 rounded-sm bg-[#246bfd] px-4 py-2 text-sm font-medium text-white hover:bg-[#1e5ae0]"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add product
          </Link>
        </div>
      </div>

      {/* Table */}
      <div className="mt-6 overflow-hidden rounded-sm border border-[#e5ebf5] bg-white">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#246bfd] border-t-transparent" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead>
                <tr className="border-b border-[#e5ebf5] bg-[#f8fafc] text-[#64748b]">
                  <th className="w-10 p-4">
                    <input
                      type="checkbox"
                      checked={products.length > 0 && selectedIds.size === products.length}
                      onChange={toggleSelectAll}
                      className="h-4 w-4 rounded-sm border-[#e5ebf5] text-[#246bfd] focus:ring-[#246bfd]"
                    />
                  </th>
                  <th className="p-4 font-medium">Image</th>
                  <th className="p-4 font-medium">Product name</th>
                  <th className="p-4 font-medium">Price</th>
                  <th className="p-4 font-medium">Category</th>
                  <th className="p-4 font-medium">Tags</th>
                  <th className="p-4 font-medium">Vendor</th>
                  <th className="p-4 font-medium">Published on</th>
                  <th className="w-24 p-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-[#64748b]">
                      No products found.
                    </td>
                  </tr>
                ) : (
                  products.map((product) => (
                    <tr key={product.id} className="border-b border-[#e5ebf5] hover:bg-[#f9fbff]">
                      <td className="p-4">
                        <input
                          type="checkbox"
                          checked={selectedIds.has(product.id)}
                          onChange={() => toggleSelect(product.id)}
                          className="h-4 w-4 rounded-sm border-[#e5ebf5] text-[#246bfd] focus:ring-[#246bfd]"
                        />
                      </td>
                      <td className="p-4">
                        <div className="h-12 w-12 overflow-hidden rounded-sm border border-[#e5ebf5] bg-[#f1f5f9]">
                          {product.images?.[0] ? (
                            <img
                              src={product.images[0].imageUrl}
                              alt=""
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-[#94a3b8]">
                              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14" />
                              </svg>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <Link
                          href={`/admin/products/${product.slug}`}
                          className="font-medium text-[#246bfd] hover:underline"
                        >
                          {product.name}
                        </Link>
                        {product.shortDescription && (
                          <p className="mt-0.5 line-clamp-2 text-xs text-[#64748b]">
                            {product.shortDescription}
                          </p>
                        )}
                      </td>
                      <td className="p-4 font-medium text-[#1c2740]">
                        {formatPrice(product.priceCents)}
                      </td>
                      <td className="p-4 text-[#475569]">
                        {product.category?.name ?? '—'}
                      </td>
                      <td className="p-4">
                        <span className="text-[#64748b]">—</span>
                      </td>
                      <td className="p-4">
                        <span className="text-[#64748b]">—</span>
                      </td>
                      <td className="p-4 text-[#64748b]">
                        {product.createdAt ? formatDate(product.createdAt) : '—'}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            className="rounded-sm p-2 text-[#64748b] hover:bg-[#f1f5f9] hover:text-[#1c2740]"
                            aria-label="Favorite"
                          >
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                            </svg>
                          </button>
                          <button
                            type="button"
                            className="rounded-sm p-2 text-[#64748b] hover:bg-[#f1f5f9] hover:text-[#1c2740]"
                            aria-label="More"
                          >
                            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
        <p className="text-sm text-[#64748b]">
          {startItem} to {endItem} items of {total}
          <Link href="#" className="ml-2 text-[#246bfd] hover:underline">View all</Link>
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="rounded-sm border border-[#e5ebf5] bg-white p-2 text-[#475569] hover:bg-[#f8fafc] disabled:opacity-50 disabled:hover:bg-white"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            const p = totalPages <= 5 ? i + 1 : Math.max(1, Math.min(page - 2, totalPages - 4)) + i;
            return (
              <button
                key={p}
                type="button"
                onClick={() => setPage(p)}
                className={`h-9 min-w-9 rounded-sm px-2 text-sm font-medium ${
                  page === p ? 'bg-[#246bfd] text-white' : 'border border-[#e5ebf5] bg-white text-[#475569] hover:bg-[#f8fafc]'
                }`}
              >
                {p}
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="rounded-sm border border-[#e5ebf5] bg-white p-2 text-[#475569] hover:bg-[#f8fafc] disabled:opacity-50 disabled:hover:bg-white"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      <footer className="mt-12 flex items-center justify-between border-t border-[#e4eaf5] pt-4 text-sm text-[#8ea0bf]">
        <span>Thank you for creating with Phoenix Tailwind | 2026 © ThemeWagon</span>
        <span>v1.0.0</span>
      </footer>
    </div>
  );
}
