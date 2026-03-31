const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000';

/** Resolve a path from the API (e.g. `/uploads/...`) or pass through absolute URLs. */
export function apiAssetUrl(pathOrUrl: string | null | undefined): string {
  if (pathOrUrl == null) return '';
  const p = String(pathOrUrl).trim();
  if (!p) return '';
  if (p.startsWith('http://') || p.startsWith('https://')) return p;
  const base = API_BASE_URL.replace(/\/$/, '');
  return `${base}${p.startsWith('/') ? '' : '/'}${p}`;
}
