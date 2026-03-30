/**
 * Shared contract for GET /api/deal-of-day — the `deal` object on each row.
 * Backend maps Prisma rows to this shape; frontend `DealOfDayRow.deal` matches it.
 */
export type DealOfDayDealJson = {
  dealPriceCents: number;
  endsAt: string;
};
