'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { apiRequest } from '@/lib/api';
import type { Product } from '@/lib/types';

type ProductSearchSelectProps = {
  value: string;
  onChange: (
    productId: string,
    productName: string,
    pricing?: { priceCents: number; salePriceCents: number | null } | null,
  ) => void;
  token: string;
  disabled?: boolean;
  /** Shown in the closed control (from form state or server load). */
  selectedLabel?: string;
  /** IDs selected in other slots — hidden from results unless current value. */
  excludeProductIds?: number[];
};

export function ProductSearchSelect({
  value,
  onChange,
  token,
  disabled,
  selectedLabel = '',
  excludeProductIds = [],
}: ProductSearchSelectProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const [results, setResults] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);

  const exclude = new Set(excludeProductIds);
  const selectedId = value.trim() ? Number(value) : NaN;
  const selectedName =
    selectedLabel.trim() ||
    results.find((r) => String(r.id) === value.trim())?.name ||
    '';

  const fetchProducts = useCallback(
    (search: string) => {
      if (!token) return;
      setLoading(true);
      const params = new URLSearchParams();
      params.set('limit', '25');
      params.set('page', '1');
      params.set('status', 'published');
      const t = search.trim();
      if (t.length > 0) params.set('q', t);
      apiRequest<{ data: Product[] }>(`/api/products?${params.toString()}`, { token })
        .then((res) => {
          const rows = Array.isArray(res.data) ? res.data : [];
          setResults(rows);
        })
        .catch(() => setResults([]))
        .finally(() => setLoading(false));
    },
    [token],
  );

  useEffect(() => {
    if (!open || !token) return;
    const id = window.setTimeout(() => {
      fetchProducts(q);
    }, 280);
    return () => window.clearTimeout(id);
  }, [open, q, token, fetchProducts]);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQ('');
      }
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  const visibleResults = results.filter(
    (r) => !exclude.has(r.id) || r.id === selectedId,
  );

  const displaySummary =
    value.trim() && selectedName ? `${selectedName} (#${value.trim()})` : '';

  return (
    <div ref={wrapRef} className="relative">
      <label className="block text-xs font-medium text-[#60759b]">Product</label>
      <div className="mt-1 flex gap-2">
        {!open ? (
          <button
            type="button"
            disabled={disabled}
            onClick={() => {
              if (disabled) return;
              setOpen(true);
              setQ('');
              setTimeout(() => inputRef.current?.focus(), 0);
            }}
            className="flex min-h-[38px] w-full flex-1 items-center justify-between rounded-admin border border-[#e3e6ed] bg-white px-3 py-2 text-left text-sm text-[#1c2740] hover:border-[#c5d0e5] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <span className={displaySummary ? 'truncate' : 'text-[#94a3b8]'}>
              {displaySummary || 'Search and select a product…'}
            </span>
            <span className="text-[#60759b]" aria-hidden>
              ▾
            </span>
          </button>
        ) : (
          <input
            ref={inputRef}
            type="search"
            autoComplete="off"
            disabled={disabled}
            placeholder="Type name or SKU…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="w-full rounded-admin border border-[#e3e6ed] px-3 py-2 text-sm text-[#1c2740] outline-none ring-[#3874ff] focus:ring-2"
          />
        )}
        {value.trim() ? (
          <button
            type="button"
            disabled={disabled}
            onClick={() => {
              onChange('', '', null);
              setOpen(false);
              setQ('');
            }}
            className="shrink-0 rounded-admin border border-[#e3e6ed] px-2 py-1 text-xs text-[#64748b] hover:bg-[#f5f7fa] disabled:opacity-50"
          >
            Clear
          </button>
        ) : null}
      </div>

      {open && (
        <div
          className="absolute left-0 right-0 top-full z-20 mt-1 max-h-52 overflow-y-auto rounded-admin border border-[#e3e6ed] bg-white py-1 shadow-lg"
          role="listbox"
        >
          {loading ? (
            <p className="px-3 py-2 text-xs text-[#60759b]">Searching…</p>
          ) : visibleResults.length === 0 ? (
            <p className="px-3 py-2 text-xs text-[#60759b]">
              {q.trim() ? 'No products match.' : 'No products found.'}
            </p>
          ) : (
            visibleResults.map((p) => (
              <button
                key={p.id}
                type="button"
                role="option"
                className="flex w-full flex-col items-start gap-0.5 px-3 py-2 text-left text-sm text-[#1c2740] hover:bg-[#f0f4fc]"
                onClick={() => {
                  onChange(String(p.id), p.name, {
                    priceCents: p.priceCents,
                    salePriceCents: p.salePriceCents ?? null,
                  });
                  setOpen(false);
                  setQ('');
                }}
              >
                <span className="font-medium">{p.name}</span>
                <span className="text-[11px] text-[#60759b]">
                  #{p.id} · {p.status ?? '—'} · {p.category?.name ?? 'Uncategorized'}
                </span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
