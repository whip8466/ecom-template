'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { AdminPageShell } from '@/components/admin-shell';
import { ProductSearchSelect } from '@/components/admin/product-search-select';
import { apiRequest } from '@/lib/api';
import { effectiveListPriceCents, formatMoney } from '@/lib/format';
import type { Product } from '@/lib/types';
import { useAuthStore } from '@/store/auth-store';

type AdminDealItem = {
  sortOrder: number;
  productId: number;
  dealPriceCents: number;
  durationMinutes: number;
  activatedAt: string | null;
  endsAt: string | null;
  product: Product | null;
};

type AdminDealHistoryItem = {
  id: number;
  productId: number;
  dealPriceCents: number;
  durationMinutes: number;
  activatedAt: string;
  endsAt: string;
  endedAt: string;
  product: Product | null;
};

function rowIsLive(row: AdminDealItem | undefined): boolean {
  if (!row?.activatedAt || !row?.endsAt) return false;
  return new Date(row.endsAt) > new Date();
}

type SlotForm = {
  clientKey: string;
  productId: string;
  productName: string;
  /** Catalog list / sale — for “current price” hint below the picker */
  priceCents: number | null;
  salePriceCents: number | null;
  dealPrice: string;
  durationMinutes: string;
};

function newClientKey(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `k-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function newEmptySlot(): SlotForm {
  return {
    clientKey: newClientKey(),
    productId: '',
    productName: '',
    priceCents: null,
    salePriceCents: null,
    dealPrice: '',
    durationMinutes: '60',
  };
}

function applyItemsToForms(items: AdminDealItem[]): SlotForm[] {
  return [...items]
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((it) => ({
      clientKey: newClientKey(),
      productId: String(it.productId),
      productName: it.product?.name ?? '',
      priceCents: it.product?.priceCents ?? null,
      salePriceCents: it.product?.salePriceCents ?? null,
      dealPrice: (it.dealPriceCents / 100).toFixed(2),
      durationMinutes: String(it.durationMinutes),
    }));
}

export default function AdminDealOfDayPage() {
  const token = useAuthStore((s) => s.token);
  const [mounted, setMounted] = useState(false);
  const [forms, setForms] = useState<SlotForm[]>([]);
  const [serverItems, setServerItems] = useState<AdminDealItem[]>([]);
  const [historyItems, setHistoryItems] = useState<AdminDealHistoryItem[]>([]);
  const [fetching, setFetching] = useState(false);
  const [saving, setSaving] = useState(false);
  const [busyProductId, setBusyProductId] = useState<number | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const load = useCallback(() => {
    if (!token) return Promise.resolve();
    setFetching(true);
    setError(null);
    return apiRequest<{ data: { items: AdminDealItem[] } }>('/api/admin/deal-of-day', { token })
      .then((res) => {
        const items = Array.isArray(res.data?.items) ? res.data.items : [];
        setServerItems(items);
        setForms(items.length > 0 ? applyItemsToForms(items) : []);
      })
      .catch((e) => {
        setError((e as Error).message);
      })
      .finally(() => {
        setFetching(false);
      });
  }, [token]);

  useEffect(() => {
    if (!mounted || !token) return;
    void load();
  }, [mounted, token, load]);

  const updateForm = (i: number, patch: Partial<SlotForm>) => {
    setForms((prev) => prev.map((f, j) => (j === i ? { ...f, ...patch } : f)));
  };

  const addSlot = () => {
    setForms((prev) => [...prev, newEmptySlot()]);
  };

  const removeSlot = (i: number) => {
    setForms((prev) => prev.filter((_, j) => j !== i));
  };

  const moveSlot = (from: number, dir: -1 | 1) => {
    setForms((prev) => {
      const to = from + dir;
      if (to < 0 || to >= prev.length) return prev;
      const next = [...prev];
      const t = next[from];
      next[from] = next[to];
      next[to] = t;
      return next;
    });
  };

  const save = async () => {
    if (!token) return;
    const slots: {
      sortOrder: number;
      productId: number;
      dealPriceCents: number;
      durationMinutes: number;
    }[] = [];
    for (let i = 0; i < forms.length; i++) {
      const pid = forms[i].productId.trim();
      if (!pid) continue;
      const n = Number(pid);
      if (!Number.isInteger(n) || n < 1) {
        setError(`Row ${i + 1}: select a valid product.`);
        return;
      }
      const price = Number(forms[i].dealPrice);
      if (!Number.isFinite(price) || price <= 0) {
        setError(`Row ${i + 1}: enter a valid deal price greater than zero.`);
        return;
      }
      const dealPriceCents = Math.round(price * 100);
      if (forms[i].priceCents != null) {
        const actual = effectiveListPriceCents({
          priceCents: forms[i].priceCents!,
          salePriceCents: forms[i].salePriceCents,
        });
        if (dealPriceCents >= actual) {
          setError(
            `Row ${i + 1}: deal price must be lower than the current price (${formatMoney(actual)}).`,
          );
          return;
        }
      }
      const dm = Number(forms[i].durationMinutes);
      if (!Number.isInteger(dm) || dm < 1 || dm > 10080) {
        setError(`Row ${i + 1}: duration must be between 1 and 10080 minutes.`);
        return;
      }
      slots.push({
        sortOrder: slots.length + 1,
        productId: n,
        dealPriceCents,
        durationMinutes: dm,
      });
    }
    const ids = slots.map((s) => s.productId);
    if (new Set(ids).size !== ids.length) {
      setError('Each product can only appear once.');
      return;
    }
    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      await apiRequest('/api/admin/deal-of-day', {
        method: 'PUT',
        body: JSON.stringify({ slots }),
        token,
      });
      setMessage('Deal configuration saved.');
      await load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const activate = async (productId: number) => {
    if (!token) return;
    setBusyProductId(productId);
    setMessage(null);
    setError(null);
    try {
      await apiRequest('/api/admin/deal-of-day/activate', {
        method: 'POST',
        body: JSON.stringify({ productId }),
        token,
      });
      setMessage('Deal is now live for that product.');
      await load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusyProductId(null);
    }
  };

  const deactivate = async (productId: number) => {
    if (!token) return;
    setBusyProductId(productId);
    setMessage(null);
    setError(null);
    try {
      const res = await apiRequest<{ data?: { removed?: boolean } }>(
        '/api/admin/deal-of-day/deactivate',
        {
          method: 'POST',
          body: JSON.stringify({ productId }),
          token,
        },
      );
      const payload = res.data;
      setMessage(payload?.removed ? 'Expired deal archived and slot cleared.' : 'Deal stopped for that product.');
      await load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusyProductId(null);
    }
  };

  const slotStatus = (productId: number | null) => {
    if (productId == null) return 'Not configured';
    const row = serverItems.find((s) => s.productId === productId);
    if (!row) return 'Save this row before activating';
    if (!row.activatedAt || !row.endsAt) return 'Ready — click Activate to start the timer';
    const end = new Date(row.endsAt).getTime();
    if (end <= Date.now()) return 'Expired — will move to history when you open this page or save';
    return `Live until ${new Date(row.endsAt).toLocaleString()} — stop the deal to edit price or product`;
  };

  return (
    <AdminPageShell
      breadcrumbs={[{ label: 'Home', href: '/admin' }, { label: 'Deal of the day' }]}
      title="Deal of the day"
      description="Configure draft deals, then activate to go live. While a deal is live, you cannot change product, price, or duration — stop it first. Expired and stopped deals are kept in history below."
      actions={
        <button
          type="button"
          onClick={() => void save()}
          disabled={!mounted || !token || saving}
          className="rounded-admin bg-[#3874ff] px-4 py-2 text-sm font-medium text-white hover:bg-[#2d5fd6] disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
      }
    >
      {!mounted ? (
        <p className="text-sm text-[#64748b]">Loading…</p>
      ) : !token ? (
        <p className="text-sm text-[#64748b]">Sign in as admin to manage this section.</p>
      ) : (
        <div className="space-y-6">
          <p className="text-sm text-[#60759b]">
            Add rows as needed (up to 100). Search by name to pick a product. Only published products appear on the storefront for live deals. The home page only lists products with an active deal.{' '}
            <Link href="/admin/product/list" className="font-semibold text-[#3874ff] hover:underline">
              Product list
            </Link>
          </p>
          {fetching ? <p className="text-xs text-[#60759b]">Loading…</p> : null}
          {message ? <p className="text-sm text-green-700">{message}</p> : null}
          {error ? <p className="text-sm text-red-600">{error}</p> : null}

          <div className="space-y-4">
            {forms.map((_, i) => {
              const pidNum = forms[i].productId.trim() ? Number(forms[i].productId) : NaN;
              const pidValid = Number.isInteger(pidNum) && pidNum > 0;
              const pidForStatus = pidValid ? pidNum : null;
              const serverRow = pidValid ? serverItems.find((s) => s.productId === pidNum) : undefined;
              const live = rowIsLive(serverRow);
              const canEditFields = !live;
              const fieldLocked = busyProductId != null || saving || !canEditFields;
              const canStopDeal = pidValid && serverRow && serverRow.activatedAt;
              return (
                <div
                  key={forms[i].clientKey}
                  className={`rounded-admin border border-[#e3e6ed] bg-white p-4 shadow-sm ${live ? 'ring-1 ring-[#c2410c]/25' : ''}`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-[#1c2740]">
                      Deal row {i + 1}
                      {live ? (
                        <span className="ml-2 rounded bg-[#fff7ed] px-2 py-0.5 text-xs font-semibold text-[#c2410c]">
                          Live
                        </span>
                      ) : null}
                    </p>
                    <div className="flex flex-wrap gap-1">
                      <button
                        type="button"
                        disabled={i === 0 || busyProductId != null || live}
                        onClick={() => moveSlot(i, -1)}
                        className="rounded-admin border border-[#e3e6ed] px-2 py-1 text-xs text-[#31374a] hover:bg-[#f5f7fa] disabled:opacity-40"
                        title={live ? 'Stop the deal before reordering' : 'Move up'}
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        disabled={i >= forms.length - 1 || busyProductId != null || live}
                        onClick={() => moveSlot(i, 1)}
                        className="rounded-admin border border-[#e3e6ed] px-2 py-1 text-xs text-[#31374a] hover:bg-[#f5f7fa] disabled:opacity-40"
                        title={live ? 'Stop the deal before reordering' : 'Move down'}
                      >
                        ↓
                      </button>
                      <button
                        type="button"
                        disabled={busyProductId != null}
                        onClick={() => removeSlot(i)}
                        className="rounded-admin border border-red-200 px-2 py-1 text-xs text-red-700 hover:bg-red-50 disabled:opacity-40"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                  <p className="mt-1 text-xs text-[#60759b]">{slotStatus(pidForStatus)}</p>
                  <div className="mt-3 space-y-3">
                    <ProductSearchSelect
                      value={forms[i].productId}
                      selectedLabel={forms[i].productName}
                      token={token}
                      disabled={fieldLocked}
                      excludeProductIds={forms
                        .map((f, j) => (j !== i && f.productId.trim() ? Number(f.productId) : NaN))
                        .filter((n) => Number.isInteger(n) && n > 0)}
                      onChange={(productId, productName, pricing) =>
                        updateForm(i, {
                          productId,
                          productName,
                          priceCents: pricing?.priceCents ?? null,
                          salePriceCents: pricing?.salePriceCents ?? null,
                        })
                      }
                    />
                    {forms[i].productId && forms[i].priceCents != null ? (
                      <p className="text-xs leading-relaxed text-[#60759b]">
                        <span className="font-medium text-[#475569]">Current price: </span>
                        <span className="font-semibold text-[#1c2740]">
                          {formatMoney(
                            effectiveListPriceCents({
                              priceCents: forms[i].priceCents!,
                              salePriceCents: forms[i].salePriceCents,
                            }),
                          )}
                        </span>
                        {forms[i].salePriceCents != null &&
                        forms[i].salePriceCents! < forms[i].priceCents! ? (
                          <>
                            {' '}
                            <span className="text-[#94a3b8] line-through">
                              {formatMoney(forms[i].priceCents!)}
                            </span>
                            <span className="ml-1 text-[#64748b]">list</span>
                          </>
                        ) : null}
                      </p>
                    ) : null}
                    <div className="grid gap-3 sm:grid-cols-2">
                      <label className="block text-xs font-medium text-[#60759b]">
                        Deal price (INR)
                        <input
                          type="text"
                          inputMode="decimal"
                          disabled={fieldLocked}
                          className="mt-1 w-full rounded-admin border border-[#e3e6ed] px-3 py-2 text-sm text-[#1c2740] disabled:cursor-not-allowed disabled:bg-[#f8fafc]"
                          value={forms[i].dealPrice}
                          onChange={(e) => updateForm(i, { dealPrice: e.target.value })}
                          placeholder="e.g. 19.99"
                        />
                      </label>
                      <label className="block text-xs font-medium text-[#60759b]">
                        Timer (minutes)
                        <input
                          type="text"
                          inputMode="numeric"
                          disabled={fieldLocked}
                          className="mt-1 w-full rounded-admin border border-[#e3e6ed] px-3 py-2 text-sm text-[#1c2740] disabled:cursor-not-allowed disabled:bg-[#f8fafc]"
                          value={forms[i].durationMinutes}
                          onChange={(e) => updateForm(i, { durationMinutes: e.target.value })}
                          placeholder="60"
                        />
                      </label>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={busyProductId != null || !pidValid || live}
                      onClick={() => void activate(pidNum)}
                      className="rounded-admin bg-[#0f1f40] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#102b57] disabled:opacity-50"
                    >
                      {busyProductId === pidNum ? '…' : 'Activate deal'}
                    </button>
                    <button
                      type="button"
                      disabled={busyProductId != null || !pidValid || !canStopDeal}
                      onClick={() => void deactivate(pidNum)}
                      className="rounded-admin border border-[#e3e6ed] px-3 py-1.5 text-xs font-medium text-[#31374a] hover:bg-[#f5f7fa] disabled:opacity-50"
                    >
                      {busyProductId === pidNum ? '…' : 'Stop deal'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <button
            type="button"
            disabled={busyProductId != null || saving || forms.length >= 100}
            onClick={() => addSlot()}
            className="rounded-admin border border-dashed border-[#c5d0e5] bg-[#f9fafb] px-4 py-3 text-sm font-medium text-[#1c2740] hover:bg-[#f0f4fc] disabled:opacity-50"
          >
            + Add deal row
          </button>
          {forms.length === 0 && !fetching ? (
            <p className="text-sm text-[#60759b]">No rows yet. Add a deal row to get started.</p>
          ) : null}

          {historyItems.length > 0 ? (
            <div className="border-t border-[#e3e6ed] pt-8">
              <h2 className="text-lg font-semibold text-[#1c2740]">Deal history</h2>
              <p className="mt-1 text-sm text-[#60759b]">
                Last {historyItems.length} completed runs (expired, stopped, or removed while live).
              </p>
              <div className="mt-4 overflow-x-auto rounded-admin border border-[#e3e6ed]">
                <table className="min-w-full divide-y divide-[#e3e6ed] text-sm">
                  <thead className="bg-[#f8fafc] text-left text-xs font-semibold uppercase tracking-wide text-[#64748b]">
                    <tr>
                      <th className="px-3 py-2">Product</th>
                      <th className="px-3 py-2">Deal price</th>
                      <th className="px-3 py-2">Duration</th>
                      <th className="px-3 py-2">Activated</th>
                      <th className="px-3 py-2">Scheduled end</th>
                      <th className="px-3 py-2">Ended</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#e3e6ed] text-[#1c2740]">
                    {historyItems.map((h) => (
                      <tr key={h.id}>
                        <td className="px-3 py-2">
                          {h.product?.name ?? `Product #${h.productId}`}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">{formatMoney(h.dealPriceCents)}</td>
                        <td className="px-3 py-2 whitespace-nowrap">{h.durationMinutes} min</td>
                        <td className="px-3 py-2 whitespace-nowrap text-xs text-[#64748b]">
                          {new Date(h.activatedAt).toLocaleString()}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-xs text-[#64748b]">
                          {new Date(h.endsAt).toLocaleString()}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-xs text-[#64748b]">
                          {new Date(h.endedAt).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}
        </div>
      )}
    </AdminPageShell>
  );
}
