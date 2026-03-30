/** Indian Rupee — all storefront and admin money display uses these. */
export const MONEY_LOCALE = 'en-IN';
export const MONEY_CURRENCY = 'INR';

export function formatMoney(cents: number) {
  return new Intl.NumberFormat(MONEY_LOCALE, {
    style: 'currency',
    currency: MONEY_CURRENCY,
  }).format(cents / 100);
}

/** Whole rupees (no fractional paisa in the formatted string). */
export function formatMoneyWhole(cents: number) {
  return new Intl.NumberFormat(MONEY_LOCALE, {
    style: 'currency',
    currency: MONEY_CURRENCY,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

export type ProductWithOptionalDeal = {
  priceCents: number;
  salePriceCents?: number | null;
  activeDeal?: { dealPriceCents: number; endsAt: string } | null;
};

/** List / sale price only (no flash deal). */
export function effectiveListPriceCents(product: { priceCents: number; salePriceCents?: number | null }): number {
  const sale = product.salePriceCents;
  if (sale != null && sale >= 0 && sale < product.priceCents) {
    return sale;
  }
  return product.priceCents;
}

/** Storefront line price: active flash deal wins, then sale, then list. */
export function effectivePriceCents(product: ProductWithOptionalDeal): number {
  const deal = product.activeDeal;
  if (deal && new Date(deal.endsAt).getTime() > Date.now() && deal.dealPriceCents > 0) {
    return deal.dealPriceCents;
  }
  return effectiveListPriceCents(product);
}

/** Unit price for a line item: active deal overrides variant and list/sale. */
export function effectiveVariantUnitPriceCents(
  product: ProductWithOptionalDeal,
  variant: { priceCents: number | null } | null | undefined
): number {
  const deal = product.activeDeal;
  if (deal && new Date(deal.endsAt).getTime() > Date.now() && deal.dealPriceCents > 0) {
    return deal.dealPriceCents;
  }
  if (variant && variant.priceCents != null) {
    return variant.priceCents;
  }
  return effectiveListPriceCents(product);
}
