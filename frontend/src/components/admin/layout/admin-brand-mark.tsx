'use client';

import Link from 'next/link';
import { apiAssetUrl } from '@/lib/api-asset-url';

export type AdminBrand = {
  name: string;
  logoUrl: string | null;
};

type Props = {
  /** `null` = still loading contact settings */
  brand: AdminBrand | null;
  /** Narrow layout for the top bar */
  compact?: boolean;
};

/**
 * Brand logo (optional) + name from contact settings (provided by `AdminShell`).
 */
export function AdminBrandMark({ brand, compact }: Props) {
  if (brand === null) {
    return (
      <div
        className={`animate-pulse rounded bg-[#e3e6ed] ${compact ? 'h-7 w-28' : 'h-9 w-36'}`}
        aria-hidden
      />
    );
  }

  const { name: brandName, logoUrl } = brand;

  const imgClass = compact
    ? 'h-7 w-auto max-w-[72px] shrink-0 object-contain object-left'
    : 'h-9 w-auto max-w-[120px] shrink-0 object-contain object-left';
  const textClass = compact
    ? 'truncate text-sm font-semibold tracking-tight text-[#31374a]'
    : 'truncate text-[1.125rem] font-semibold tracking-tight text-[#31374a]';

  return (
    <Link
      href="/admin"
      className="flex min-w-0 flex-1 items-center gap-2.5"
      title={`${brandName} — Dashboard`}
    >
      {logoUrl ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element -- CMS URL from API */}
          <img src={apiAssetUrl(logoUrl)} alt="" className={imgClass} aria-hidden />
        </>
      ) : null}
      <span className={textClass}>{brandName}</span>
    </Link>
  );
}
