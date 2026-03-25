export function formatMoney(cents: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(cents / 100);
}

/** Price used at checkout when a sale price is set and lower than list price. */
export function effectivePriceCents(product: {
  priceCents: number;
  salePriceCents?: number | null;
}): number {
  const sale = product.salePriceCents;
  if (sale != null && sale >= 0 && sale < product.priceCents) {
    return sale;
  }
  return product.priceCents;
}

/** Unit price for a line item: variant override, else product (including sale). */
export function effectiveVariantUnitPriceCents(
  product: { priceCents: number; salePriceCents?: number | null },
  variant: { priceCents: number | null } | null | undefined
): number {
  if (variant && variant.priceCents != null) {
    return variant.priceCents;
  }
  return effectivePriceCents(product);
}
