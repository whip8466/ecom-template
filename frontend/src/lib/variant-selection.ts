import type { ProductVariant, ProductVariantOptionValue } from '@/lib/types';

export type VariantOptionGroup = {
  optionTypeId: number;
  name: string;
  slug: string;
  values: { id: number; label: string; value: string }[];
};

export function isLikelyColorOptionType(type: { name: string; slug: string }): boolean {
  return /color|colour/i.test(type.name) || /color|colour/i.test(type.slug);
}

export function isLikelySizeOptionType(type: { name: string; slug: string }): boolean {
  return /size/i.test(type.name) || /size/i.test(type.slug);
}

export function buildVariantOptionGroups(variants: ProductVariant[]): VariantOptionGroup[] {
  const byType = new Map<
    number,
    { optionTypeId: number; name: string; slug: string; values: Map<number, { id: number; label: string; value: string }> }
  >();

  for (const v of variants) {
    for (const ov of v.optionValues || []) {
      const tid = ov.optionTypeId;
      const t = ov.optionType;
      if (!byType.has(tid)) {
        byType.set(tid, {
          optionTypeId: tid,
          name: t?.name ?? 'Option',
          slug: t?.slug ?? '',
          values: new Map(),
        });
      }
      const g = byType.get(tid)!;
      if (t?.name) g.name = t.name;
      if (t?.slug) g.slug = t.slug;
      g.values.set(ov.id, { id: ov.id, label: ov.label, value: ov.value });
    }
  }

  return Array.from(byType.values())
    .map((g) => ({
      optionTypeId: g.optionTypeId,
      name: g.name,
      slug: g.slug,
      values: [...g.values.values()].sort((a, b) => a.label.localeCompare(b.label)),
    }))
    .sort((a, b) => a.optionTypeId - b.optionTypeId);
}

/**
 * Variants that match `selected` on every option type except `forOptionTypeId`.
 */
function variantsMatchingOtherSelections(
  variants: ProductVariant[],
  allOptionTypeIds: number[],
  forOptionTypeId: number,
  selected: Record<number, number>
): ProductVariant[] {
  const otherTypeIds = allOptionTypeIds.filter((id) => id !== forOptionTypeId);
  return variants.filter((v) =>
    otherTypeIds.every((tid) => {
      const want = selected[tid];
      if (want == null) return false;
      return (v.optionValues || []).some((ov) => ov.optionTypeId === tid && ov.id === want);
    }),
  );
}

/**
 * Option values for `forOptionTypeId` that appear on at least one matching variant.
 * Prefer in-stock variants when building the list; if that yields nothing, include out-of-stock variants.
 */
export function availableValuesForOptionType(
  variants: ProductVariant[],
  allOptionTypeIds: number[],
  forOptionTypeId: number,
  selected: Record<number, number>
): { id: number; label: string; value: string }[] {
  let candidates = variantsMatchingOtherSelections(
    variants,
    allOptionTypeIds,
    forOptionTypeId,
    selected,
  );
  const inStock = candidates.filter((v) => v.stock > 0);
  if (inStock.length) {
    candidates = inStock;
  }

  const valueMap = new Map<number, { id: number; label: string; value: string }>();
  for (const v of candidates) {
    for (const ov of v.optionValues || []) {
      if (ov.optionTypeId === forOptionTypeId) {
        valueMap.set(ov.id, { id: ov.id, label: ov.label, value: ov.value });
      }
    }
  }
  return [...valueMap.values()].sort((a, b) => a.label.localeCompare(b.label));
}

export function selectionFromVariant(v: ProductVariant): Record<number, number> {
  const out: Record<number, number> = {};
  for (const ov of v.optionValues || []) {
    out[ov.optionTypeId] = ov.id;
  }
  return out;
}

export function variantMatchesSelection(v: ProductVariant, selected: Record<number, number>): boolean {
  const typeIds = Object.keys(selected).map(Number);
  return typeIds.every((tid) =>
    (v.optionValues || []).some((ov) => ov.optionTypeId === tid && ov.id === selected[tid]),
  );
}

/** Pick initial variant: first with stock, else first. */
export function pickInitialVariant(variants: ProductVariant[]): ProductVariant | null {
  if (!variants.length) return null;
  const withStock = variants.find((v) => v.stock > 0);
  return withStock ?? variants[0];
}

export function resolveVariantSelection(
  variants: ProductVariant[],
  selected: Record<number, number>,
  changedTypeId: number,
  changedValueId: number
): { variant: ProductVariant; selected: Record<number, number> } {
  const next = { ...selected, [changedTypeId]: changedValueId };
  const exact = variants.filter((v) => variantMatchesSelection(v, next));
  if (exact.length === 1) {
    return { variant: exact[0], selected: selectionFromVariant(exact[0]) };
  }
  if (exact.length > 1) {
    const pick = exact[0];
    return { variant: pick, selected: selectionFromVariant(pick) };
  }

  const withValue = variants.filter((v) =>
    (v.optionValues || []).some((ov) => ov.optionTypeId === changedTypeId && ov.id === changedValueId),
  );
  if (withValue.length) {
    const pick = withValue[0];
    return { variant: pick, selected: selectionFromVariant(pick) };
  }

  const fallback = pickInitialVariant(variants);
  if (!fallback) {
    return { variant: variants[0], selected: selectionFromVariant(variants[0]) };
  }
  return { variant: fallback, selected: selectionFromVariant(fallback) };
}

export function formatVariantLabel(optionValues: ProductVariantOptionValue[]): string {
  return (optionValues || [])
    .map((ov) => ov.label || ov.value)
    .filter(Boolean)
    .join(' · ');
}
