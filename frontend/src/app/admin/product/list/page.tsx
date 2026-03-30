'use client';

import Link from 'next/link';
import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { AdminPageShell } from '@/components/admin-shell';
import { handleInvalidTokenIfNeeded } from '@/lib/invalidate-session';
import { useAuthStore } from '@/store/auth-store';
import { formatMoneyWhole } from '@/lib/format';

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
  status?: string;
  createdAt?: string;
  publishedAt?: string | null;
  /** Average rating 0–5 when provided by API */
  averageRating?: number | null;
  category: Category | null;
  vendor?: { id: number; name: string; slug: string } | null;
  images: ProductImage[];
};

type TabId = 'all' | 'published' | 'drafts' | 'discount';

const TABS: { id: TabId; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'published', label: 'Published' },
  { id: 'drafts', label: 'Drafts' },
  { id: 'discount', label: 'On discount' },
];

function formatPublishedOn(dateStr: string): string {
  const d = new Date(dateStr);
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(d);
}

const STAR_PATH =
  'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z';

function StarIcon({ filled, className }: { filled: boolean; className?: string }) {
  if (filled) {
    return (
      <svg className={`h-4 w-4 shrink-0 ${className ?? ''}`} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
        <path d={STAR_PATH} />
      </svg>
    );
  }
  return (
    <svg
      className={`h-4 w-4 shrink-0 ${className ?? ''}`}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      viewBox="0 0 24 24"
      aria-hidden
    >
      <path d={STAR_PATH} />
    </svg>
  );
}

function RatingCell({ rating }: { rating?: number | null }) {
  const hasScore = rating != null && !Number.isNaN(rating);
  const clamped = hasScore ? Math.max(0, Math.min(5, rating as number)) : 0;
  const filledCount = hasScore ? Math.round(clamped) : 0;

  return (
    <div
      className="flex items-center gap-1.5"
      title={hasScore ? `${clamped.toFixed(1)} out of 5` : 'No rating yet'}
    >
      <span className="inline-flex items-center gap-0.5" aria-label={hasScore ? `${clamped.toFixed(1)} out of 5 stars` : 'No rating'}>
        {[0, 1, 2, 3, 4].map((i) => (
          <StarIcon
            key={i}
            filled={hasScore && i < filledCount}
            className={
              hasScore && i < filledCount ? 'text-amber-400' : 'text-[#cbd5e1]'
            }
          />
        ))}
      </span>
    </div>
  );
}

function ActionsMenuIcon() {
  return (
    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
    </svg>
  );
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
  const [listError, setListError] = useState('');
  const [busy, setBusy] = useState<{ id: number; op: 'publish' | 'unpublish' } | null>(null);
  const [actionMenu, setActionMenu] = useState<{ id: number; rect: DOMRect } | null>(null);

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
      if (vendorSlug) params.set('vendor', vendorSlug);
      if (token) {
        if (activeTab === 'discount') {
          params.set('status', 'all');
          params.set('discount', '1');
        } else if (activeTab === 'published') {
          params.set('status', 'published');
        } else if (activeTab === 'drafts') {
          params.set('status', 'draft');
        } else {
          params.set('status', 'all');
        }
      }
      const res = await fetch(`${API_BASE}/api/products?${params.toString()}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        await handleInvalidTokenIfNeeded(res.status, json);
        throw new Error((json as { message?: string }).message || 'Failed to load products');
      }
      const data = json as { data: Product[]; pagination: { total: number } };
      setProducts(Array.isArray(data.data) ? data.data : []);
      setTotal(data.pagination?.total ?? 0);
    } catch (e) {
      setProducts([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, categorySlug, vendorSlug, activeTab, token]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    if (actionMenu == null) return;
    const close = () => setActionMenu(null);
    const t = window.setTimeout(() => {
      document.addEventListener('click', close);
    }, 0);
    return () => {
      window.clearTimeout(t);
      document.removeEventListener('click', close);
    };
  }, [actionMenu]);

  useEffect(() => {
    if (!token) return;
    fetch(`${API_BASE}/api/categories`, { headers: { Authorization: `Bearer ${token}` } })
      .then(async (r) => {
        const d = await r.json().catch(() => ({}));
        if (!r.ok) {
          await handleInvalidTokenIfNeeded(r.status, d);
          return;
        }
        setCategories(Array.isArray((d as { data?: Category[] }).data) ? (d as { data: Category[] }).data : []);
      })
      .catch(() => {});
    fetch(`${API_BASE}/api/vendors`, { headers: { Authorization: `Bearer ${token}` } })
      .then(async (r) => {
        const d = await r.json().catch(() => ({}));
        if (!r.ok) {
          await handleInvalidTokenIfNeeded(r.status, d);
          return;
        }
        setVendors(
          Array.isArray((d as { data?: { id: number; name: string; slug: string }[] }).data)
            ? (d as { data: { id: number; name: string; slug: string }[] }).data
            : []
        );
      })
      .catch(() => {});
  }, [token]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput.trim());
    setPage(1);
  };

  const clearFilters = () => {
    setSearch('');
    setSearchInput('');
    setCategorySlug('');
    setVendorSlug('');
    setActiveTab('all');
    setPage(1);
  };

  const handlePublish = async (id: number) => {
    if (!token) return;
    setListError('');
    setBusy({ id, op: 'publish' });
    try {
      const res = await fetch(`${API_BASE}/api/products/${id}/publish`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        await handleInvalidTokenIfNeeded(res.status, data);
        throw new Error((data as { message?: string }).message || 'Failed to publish');
      }
      await fetchProducts();
      setActionMenu(null);
    } catch (e) {
      setListError((e as Error).message || 'Failed to publish');
    } finally {
      setBusy(null);
    }
  };

  const handleUnpublish = async (id: number) => {
    if (!token) return;
    setListError('');
    setBusy({ id, op: 'unpublish' });
    try {
      const res = await fetch(`${API_BASE}/api/products/${id}/unpublish`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        await handleInvalidTokenIfNeeded(res.status, data);
        throw new Error((data as { message?: string }).message || 'Failed to unpublish');
      }
      await fetchProducts();
      setActionMenu(null);
    } catch (e) {
      setListError((e as Error).message || 'Failed to unpublish');
    } finally {
      setBusy(null);
    }
  };

  const isRowBusy = (id: number, op: 'publish' | 'unpublish') =>
    busy?.id === id && busy?.op === op;

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
    <AdminPageShell
      breadcrumbs={[
        { label: 'Admin', href: '/admin' },
        { label: 'Products' },
      ]}
      title="Products"
    >
      {/* Tabs */}
      <div className="mt-6 flex flex-wrap gap-x-[1.333rem] gap-y-2 border-b border-[#e5ebf5]">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => {
              setActiveTab(tab.id);
              setPage(1);
            }}
            className={`whitespace-nowrap px-1 pb-3 text-sm font-medium transition ${
              activeTab === tab.id
                ? 'border-b-2 border-[#246bfd] text-[#246bfd]'
                : 'border-b-2 border-transparent text-[#64748b] hover:text-[#1c2740]'
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
            className="h-10 w-full rounded-admin border border-[#e5ebf5] bg-white px-4 py-2 text-sm text-[#1c2740] placeholder:text-[#94a3b8] focus:border-[#246bfd] focus:outline-none"
          />
        </form>
        <select
          value={categorySlug}
          onChange={(e) => { setCategorySlug(e.target.value); setPage(1); }}
          className="h-10 min-w-[160px] rounded-admin border border-[#e5ebf5] bg-white px-4 py-2 text-sm text-[#1c2740] focus:border-[#246bfd] focus:outline-none"
          aria-label="Filter by category"
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.slug}>{c.name}</option>
          ))}
        </select>
        <select
          value={vendorSlug}
          onChange={(e) => { setVendorSlug(e.target.value); setPage(1); }}
          className="h-10 min-w-[160px] rounded-admin border border-[#e5ebf5] bg-white px-4 py-2 text-sm text-[#1c2740] focus:border-[#246bfd] focus:outline-none"
          aria-label="Filter by vendor"
        >
          <option value="">All vendors</option>
          {vendors.map((v) => (
            <option key={v.id} value={v.slug}>{v.name}</option>
          ))}
        </select>
        <button
          type="button"
          onClick={clearFilters}
          className="h-10 rounded-admin border border-[#e5ebf5] bg-white px-4 py-2 text-sm font-medium text-[#475569] hover:bg-[#f8fafc]"
        >
          Clear filters
        </button>
        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            className="flex h-10 items-center gap-2 rounded-admin border border-[#e5ebf5] bg-white px-4 py-2 text-sm font-medium text-[#475569] hover:bg-[#f8fafc]"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Export
          </button>
          <Link
            href="/admin/product/new"
            className="flex h-10 items-center gap-2 rounded-admin bg-[#246bfd] px-4 py-2 text-sm font-medium text-white hover:bg-[#1e5ae0]"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add product
          </Link>
        </div>
      </div>

      {listError ? (
        <div className="mt-4 rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          {listError}
        </div>
      ) : null}

      {/* Table */}
      <div className="mt-6 overflow-hidden rounded-admin border border-[#e5ebf5] bg-white">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#246bfd] border-t-transparent" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-left text-sm">
              <thead>
                <tr className="border-b border-[#e5ebf5] bg-[#f8fafc] text-[#64748b]">
                  <th className="w-10 p-4">
                    <input
                      type="checkbox"
                      checked={products.length > 0 && selectedIds.size === products.length}
                      onChange={toggleSelectAll}
                      className="h-4 w-4 rounded-admin border-[#e5ebf5] text-[#246bfd] focus:ring-[#246bfd]"
                    />
                  </th>
                  <th className="p-4 font-medium">Image</th>
                  <th className="p-4 font-medium">Product name</th>
                  <th className="p-4 font-medium">Price</th>
                  <th className="p-4 font-medium">Rating</th>
                  <th className="p-4 font-medium">Category</th>
                  <th className="p-4 font-medium">Tags</th>
                  <th className="p-4 font-medium">Vendor</th>
                  <th className="p-4 font-medium">Published on</th>
                  <th className="min-w-[88px] p-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="p-8 text-center text-[#64748b]">
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
                          className="h-4 w-4 rounded-admin border-[#e5ebf5] text-[#246bfd] focus:ring-[#246bfd]"
                        />
                      </td>
                      <td className="p-4">
                        <div className="h-12 w-12 overflow-hidden rounded-admin border border-[#e5ebf5] bg-[#f1f5f9]">
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
                          href={
                            product.status === 'PUBLISHED' && product.slug
                              ? `/products/${encodeURIComponent(product.slug)}`
                              : `/admin/product/edit/${product.id}`
                          }
                          className="font-medium text-[#246bfd] hover:underline"
                          title={
                            product.status === 'PUBLISHED'
                              ? 'View product page'
                              : 'Edit draft (not on store)'
                          }
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
                        {formatMoneyWhole(product.priceCents)}
                      </td>
                      <td className="p-4">
                        <RatingCell rating={product.averageRating} />
                      </td>
                      <td className="p-4 text-[#475569]">
                        {product.category?.name ?? '—'}
                      </td>
                      <td className="p-4">
                        <span className="text-[#64748b]">—</span>
                      </td>
                      <td className="p-4 text-[#475569]">
                        {product.vendor?.name ?? '—'}
                      </td>
                      <td className="p-4 text-[#64748b]">
                        {product.status === 'PUBLISHED' && product.publishedAt
                          ? formatPublishedOn(product.publishedAt)
                          : '—'}
                      </td>
                      <td className="p-4 text-right">
                        <div className="inline-flex items-center justify-end gap-0.5">
                          <button
                            type="button"
                            aria-label="Product actions"
                            aria-expanded={actionMenu?.id === product.id}
                            aria-haspopup="menu"
                            onClick={(e) => {
                              e.stopPropagation();
                              const rect = (e.currentTarget as HTMLButtonElement).getBoundingClientRect();
                              setActionMenu((prev) =>
                                prev?.id === product.id ? null : { id: product.id, rect }
                              );
                            }}
                            className="inline-flex rounded-admin p-2 text-[#64748b] hover:bg-[#f1f5f9] hover:text-[#1c2740]"
                          >
                            <ActionsMenuIcon />
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
            className="rounded-admin border border-[#e5ebf5] bg-white p-2 text-[#475569] hover:bg-[#f8fafc] disabled:opacity-50 disabled:hover:bg-white"
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
                className={`h-9 min-w-9 rounded-admin px-2 text-sm font-medium ${
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
            className="rounded-admin border border-[#e5ebf5] bg-white p-2 text-[#475569] hover:bg-[#f8fafc] disabled:opacity-50 disabled:hover:bg-white"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      <footer className="mt-12 flex items-center justify-between border-t border-[#e4eaf5] pt-4 text-sm text-[#8ea0bf]">
        <span>Thank you for creating with Dhidi | 2026 © ThemeWagon</span>
        <span>v1.0.0</span>
      </footer>

      {actionMenu &&
        typeof document !== 'undefined' &&
        (() => {
          const menuProduct = products.find((p) => p.id === actionMenu.id);
          if (!menuProduct) return null;
          const left = Math.min(
            Math.max(8, actionMenu.rect.right - 168),
            typeof window !== 'undefined' ? window.innerWidth - 176 : 8
          );
          const top = actionMenu.rect.bottom + 4;
          return createPortal(
            <div
              role="menu"
              className="min-w-[168px] rounded-admin border border-[#e5ebf5] bg-white py-1 text-left shadow-lg"
              style={{
                position: 'fixed',
                top,
                left,
                zIndex: 9999,
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <Link
                role="menuitem"
                href={`/admin/product/edit/${menuProduct.id}`}
                className="block px-3 py-2 text-sm text-[#1c2740] hover:bg-[#f8fafc]"
                onClick={() => setActionMenu(null)}
              >
                Edit
              </Link>
              {menuProduct.status !== 'PUBLISHED' ? (
                <button
                  type="button"
                  role="menuitem"
                  className="w-full px-3 py-2 text-left text-sm text-[#1c2740] hover:bg-[#f8fafc] disabled:opacity-50"
                  disabled={!!busy}
                  onClick={() => handlePublish(menuProduct.id)}
                >
                  {isRowBusy(menuProduct.id, 'publish') ? 'Publishing…' : 'Publish'}
                </button>
              ) : null}
              {menuProduct.status === 'PUBLISHED' ? (
                <button
                  type="button"
                  role="menuitem"
                  className="w-full px-3 py-2 text-left text-sm text-[#1c2740] hover:bg-[#f8fafc] disabled:opacity-50"
                  disabled={!!busy}
                  onClick={() => handleUnpublish(menuProduct.id)}
                >
                  {isRowBusy(menuProduct.id, 'unpublish') ? 'Unpublishing…' : 'Unpublish'}
                </button>
              ) : null}
            </div>,
            document.body
          );
        })()}
    </AdminPageShell>
  );
}
