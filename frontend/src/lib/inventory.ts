import type { Product, ProductVariant } from '@/lib/types';

/**
 * Matches product detail / admin restock semantics: variant rows may be 0 while `product.stock`
 * holds the sellable total; if any variant has stock > 0, use the selected variant only.
 */
export function effectiveAvailableStockForLine(
  product: Pick<Product, 'stock'> & { variants?: Pick<ProductVariant, 'stock' | 'id'>[] },
  matchedVariant: Pick<ProductVariant, 'stock'> | null | undefined,
): number {
  const variants = product.variants ?? [];
  if (variants.length === 0) return Math.max(0, product.stock ?? 0);
  const anyVariantHasStock = variants.some((v) => (v.stock ?? 0) > 0);
  if (anyVariantHasStock) return Math.max(0, matchedVariant?.stock ?? 0);
  return Math.max(0, product.stock ?? 0);
}
