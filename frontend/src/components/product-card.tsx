import Link from 'next/link';
import type { Product } from '@/lib/types';
import { formatMoney } from '@/lib/format';

export function ProductCard({ product }: { product: Product }) {
  return (
    <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="h-40 rounded-lg bg-slate-100" />
      <p className="mt-3 text-xs text-slate-500">{product.category?.name}</p>
      <h3 className="mt-1 text-base font-semibold">{product.name}</h3>
      <p className="mt-1 text-sm text-slate-600 line-clamp-2">{product.shortDescription || 'No description'}</p>
      <p className="mt-2 font-semibold">{formatMoney(product.priceCents)}</p>
      <Link
        href={`/products/${product.slug}`}
        className="mt-3 inline-flex rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white"
      >
        View details
      </Link>
    </article>
  );
}
