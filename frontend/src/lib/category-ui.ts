export type StorefrontCategory = {
  id: number;
  name: string;
  slug: string;
  parentId?: number | null;
  iconUrl?: string | null;
  depth?: number;
  productCount?: number;
};

/** Two-letter label for category chips (e.g. "Fashion" → "FA", "Home Decor" → "HD"). */
export function categoryInitials(name: string): string {
  const p = name.trim().split(/\s+/).filter(Boolean);
  if (!p.length) return '?';
  if (p.length === 1) return p[0].slice(0, 2).toUpperCase();
  return `${p[0][0]}${p[p.length - 1][0]}`.toUpperCase();
}
