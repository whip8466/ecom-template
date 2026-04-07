'use client';

import Link from 'next/link';
import { createPortal } from 'react-dom';
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { AdminPageShell } from '@/components/admin-shell';
import { useAuthStore } from '@/store/auth-store';
import { apiRequest } from '@/lib/api';
import { useSuperAdminGate } from '../use-super-admin-gate';

type BrandRow = {
  id: number;
  name: string;
  slug: string;
  isBlocked: boolean;
  staffCount: number;
  createdAt: string;
  updatedAt: string;
};

type TabId = 'all' | 'active' | 'blocked';

const TABS: { id: TabId; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'active', label: 'Active' },
  { id: 'blocked', label: 'Blocked' },
];

function formatUpdatedOn(iso: string): string {
  const d = new Date(iso);
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(d);
}

function ActionsMenuIcon() {
  return (
    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
    </svg>
  );
}

export default function SuperAdminBrandsPage() {
  const { ready, token } = useSuperAdminGate();
  const [brands, setBrands] = useState<BrandRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [activeTab, setActiveTab] = useState<TabId>('all');
  const [sortBy, setSortBy] = useState<'name' | 'updated'>('updated');
  const [staffFilter, setStaffFilter] = useState<'all' | 'with'>('all');
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [actionMenu, setActionMenu] = useState<{ id: number; rect: DOMRect } | null>(null);

  const load = useCallback(async () => {
    const t = useAuthStore.getState().token;
    setError(null);
    setLoading(true);
    try {
      if (!t) {
        setError('Session expired. Sign in again.');
        return;
      }
      const res = await apiRequest<{ data: BrandRow[] }>('/api/super-admin/brands', { token: t });
      setBrands(res.data ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load brands');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!ready || !token) return;
    void load();
  }, [ready, token, load]);

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

  const tabCounts = useMemo(() => {
    const all = brands.length;
    const active = brands.filter((b) => !b.isBlocked).length;
    const blocked = brands.filter((b) => b.isBlocked).length;
    return { all, active, blocked };
  }, [brands]);

  const filtered = useMemo(() => {
    let list = [...brands];
    if (activeTab === 'active') list = list.filter((b) => !b.isBlocked);
    if (activeTab === 'blocked') list = list.filter((b) => b.isBlocked);
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (b) => b.name.toLowerCase().includes(q) || b.slug.toLowerCase().includes(q),
      );
    }
    if (staffFilter === 'with') {
      list = list.filter((b) => b.staffCount > 0);
    }
    list.sort((a, b) => {
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
      }
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
    return list;
  }, [brands, activeTab, search, sortBy, staffFilter]);

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const startItem = total === 0 ? 0 : (page - 1) * limit + 1;
  const endItem = Math.min(page * limit, total);
  const pageItems = filtered.slice((page - 1) * limit, page * limit);

  useEffect(() => {
    setPage(1);
  }, [activeTab, search, sortBy, staffFilter]);

  useEffect(() => {
    setPage((p) => Math.min(Math.max(1, p), totalPages));
  }, [totalPages]);

  const handleSearchSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSearch(searchInput.trim());
    setPage(1);
  };

  const clearFilters = () => {
    setSearch('');
    setSearchInput('');
    setActiveTab('all');
    setSortBy('updated');
    setStaffFilter('all');
    setPage(1);
  };

  async function setBrandBlocked(b: BrandRow, isBlocked: boolean) {
    if (!token) return;
    setError(null);
    try {
      await apiRequest(`/api/super-admin/brands/${b.id}`, {
        method: 'PATCH',
        token,
        body: JSON.stringify({ isBlocked }),
      });
      setActionMenu(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update failed');
    }
  }

  const toggleSelectAll = () => {
    if (selectedIds.size === pageItems.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(pageItems.map((b) => b.id)));
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

  if (!ready) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#246bfd] border-t-transparent" />
      </div>
    );
  }

  return (
    <AdminPageShell
      breadcrumbs={[
        { label: 'Admin', href: '/admin' },
        { label: 'Brands' },
      ]}
      title="Brands"
      description="Manage tenant brands, staff, and storefront block status."
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
            {tab.id === 'all'
              ? `${tab.label} (${tabCounts.all})`
              : tab.id === 'active'
                ? `${tab.label} (${tabCounts.active})`
                : `${tab.label} (${tabCounts.blocked})`}
          </button>
        ))}
      </div>

      {/* Toolbar */}
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <form onSubmit={handleSearchSubmit} className="flex min-w-[200px] max-w-sm flex-1">
          <input
            type="text"
            placeholder="Search brands"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="h-10 w-full rounded-admin border border-[#e5ebf5] bg-white px-4 py-2 text-sm text-[#1c2740] placeholder:text-[#94a3b8] focus:border-[#246bfd] focus:outline-none"
          />
        </form>
        <select
          value={sortBy}
          onChange={(e) => {
            setSortBy(e.target.value as 'name' | 'updated');
            setPage(1);
          }}
          className="h-10 min-w-[160px] rounded-admin border border-[#e5ebf5] bg-white px-4 py-2 text-sm text-[#1c2740] focus:border-[#246bfd] focus:outline-none"
          aria-label="Sort brands"
        >
          <option value="updated">Sort by last updated</option>
          <option value="name">Sort by name</option>
        </select>
        <select
          value={staffFilter}
          onChange={(e) => {
            setStaffFilter(e.target.value as 'all' | 'with');
            setPage(1);
          }}
          className="h-10 min-w-[160px] rounded-admin border border-[#e5ebf5] bg-white px-4 py-2 text-sm text-[#1c2740] focus:border-[#246bfd] focus:outline-none"
          aria-label="Filter by staff"
        >
          <option value="all">All brands</option>
          <option value="with">With staff</option>
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
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
            Export
          </button>
          <Link
            href="/admin/super/brands/new"
            className="flex h-10 items-center gap-2 rounded-admin bg-[#246bfd] px-4 py-2 text-sm font-medium text-white hover:bg-[#1e5ae0]"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create brand
          </Link>
        </div>
      </div>

      {error ? (
        <div className="mt-4 rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          {error}
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
                      checked={pageItems.length > 0 && selectedIds.size === pageItems.length}
                      onChange={toggleSelectAll}
                      className="h-4 w-4 rounded-admin border-[#e5ebf5] text-[#246bfd] focus:ring-[#246bfd]"
                    />
                  </th>
                  <th className="p-4 font-medium">Image</th>
                  <th className="p-4 font-medium">Brand name</th>
                  <th className="p-4 font-medium">Staff</th>
                  <th className="p-4 font-medium">Status</th>
                  <th className="p-4 font-medium">Slug</th>
                  <th className="p-4 font-medium">Updated</th>
                  <th className="p-4 font-medium">Notes</th>
                  <th className="min-w-[88px] p-4 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pageItems.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-[#64748b]">
                      No brands found.
                    </td>
                  </tr>
                ) : (
                  pageItems.map((b) => (
                    <tr key={b.id} className="border-b border-[#e5ebf5] hover:bg-[#f9fbff]">
                      <td className="p-4">
                        <input
                          type="checkbox"
                          checked={selectedIds.has(b.id)}
                          onChange={() => toggleSelect(b.id)}
                          className="h-4 w-4 rounded-admin border-[#e5ebf5] text-[#246bfd] focus:ring-[#246bfd]"
                        />
                      </td>
                      <td className="p-4">
                        <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-admin border border-[#e5ebf5] bg-[#f1f5f9] text-sm font-semibold text-[#246bfd]">
                          {b.name.trim().charAt(0).toUpperCase() || '?'}
                        </div>
                      </td>
                      <td className="p-4">
                        <Link
                          href={`/admin/super/brands/${b.id}/edit`}
                          className="font-medium text-[#246bfd] hover:underline"
                        >
                          {b.name}
                        </Link>
                        <p className="mt-0.5 line-clamp-2 text-xs text-[#64748b]">/{b.slug}</p>
                      </td>
                      <td className="p-4 font-medium text-[#1c2740]">{b.staffCount}</td>
                      <td className="p-4 text-[#475569]">
                        {b.isBlocked ? (
                          <span className="inline-flex rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-900">
                            Blocked
                          </span>
                        ) : (
                          <span className="inline-flex rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-800">
                            Active
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-[#475569]">
                        <code className="rounded-admin bg-[#f1f5f9] px-1.5 py-0.5 text-xs">{b.slug}</code>
                      </td>
                      <td className="p-4 text-[#64748b]">{formatUpdatedOn(b.updatedAt)}</td>
                      <td className="p-4">
                        <span className="text-[#64748b]">—</span>
                      </td>
                      <td className="p-4 text-right">
                        <div className="inline-flex items-center justify-end gap-0.5">
                          <button
                            type="button"
                            aria-label="Brand actions"
                            aria-expanded={actionMenu?.id === b.id}
                            aria-haspopup="menu"
                            onClick={(e) => {
                              e.stopPropagation();
                              const rect = (e.currentTarget as HTMLButtonElement).getBoundingClientRect();
                              setActionMenu((prev) => (prev?.id === b.id ? null : { id: b.id, rect }));
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
          <Link href="#" className="ml-2 text-[#246bfd] hover:underline">
            View all
          </Link>
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
                  page === p
                    ? 'bg-[#246bfd] text-white'
                    : 'border border-[#e5ebf5] bg-white text-[#475569] hover:bg-[#f8fafc]'
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
          const menuBrand = pageItems.find((x) => x.id === actionMenu.id) ?? brands.find((x) => x.id === actionMenu.id);
          if (!menuBrand) return null;
          const left = Math.min(
            Math.max(8, actionMenu.rect.right - 168),
            typeof window !== 'undefined' ? window.innerWidth - 176 : 8,
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
                href={`/admin/super/brands/${menuBrand.id}/edit`}
                className="block px-3 py-2 text-sm text-[#1c2740] hover:bg-[#f8fafc]"
                onClick={() => setActionMenu(null)}
              >
                Edit
              </Link>
              {!menuBrand.isBlocked ? (
                <button
                  type="button"
                  role="menuitem"
                  className="w-full px-3 py-2 text-left text-sm text-amber-900 hover:bg-amber-50"
                  onClick={() => void setBrandBlocked(menuBrand, true)}
                >
                  Block
                </button>
              ) : (
                <button
                  type="button"
                  role="menuitem"
                  className="w-full px-3 py-2 text-left text-sm text-[#1c2740] hover:bg-[#f8fafc]"
                  onClick={() => void setBrandBlocked(menuBrand, false)}
                >
                  Unblock
                </button>
              )}
            </div>,
            document.body,
          );
        })()}
    </AdminPageShell>
  );
}
