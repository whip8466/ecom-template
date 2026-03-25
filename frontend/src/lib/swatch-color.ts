/**
 * Resolves a CSS color for variant / product color swatches when values are not always hex.
 * Order: explicit hex/rgb/hsl → common name map → stable distinct HSL from label+value.
 */

const NAMED: Record<string, string> = {
  black: '#111827',
  white: '#f3f4f6',
  red: '#dc2626',
  crimson: '#dc143c',
  scarlet: '#ff2400',
  navy: '#1e3a5f',
  blue: '#2563eb',
  'light blue': '#93c5fd',
  'dark blue': '#1e40af',
  sky: '#0ea5e9',
  azure: '#007fff',
  green: '#16a34a',
  'dark green': '#14532d',
  'light green': '#86efac',
  lime: '#84cc16',
  yellow: '#eab308',
  gold: '#d4af37',
  amber: '#f59e0b',
  orange: '#ea580c',
  peach: '#ffccb6',
  pink: '#ec4899',
  rose: '#f43f5e',
  purple: '#9333ea',
  violet: '#7c3aed',
  lavender: '#c4b5fd',
  indigo: '#4f46e5',
  gray: '#6b7280',
  grey: '#6b7280',
  silver: '#9ca3af',
  charcoal: '#374151',
  brown: '#92400e',
  tan: '#d2b48c',
  beige: '#d4c4a8',
  cream: '#fffdd0',
  ivory: '#fffff0',
  khaki: '#c3b091',
  burgundy: '#800020',
  maroon: '#7f1d1d',
  teal: '#0d9488',
  cyan: '#06b6d4',
  turquoise: '#14b8a6',
  coral: '#ff7f50',
  salmon: '#fa8072',
  mint: '#6ee7b7',
  olive: '#6b7c3f',
  chocolate: '#7b3f00',
  copper: '#b87333',
  bronze: '#cd7f32',
  magenta: '#c026d3',
  plum: '#8e4585',
};

function expandShortHex(hex: string): string {
  if (hex.length === 4 && hex[0] === '#') {
    return `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}`;
  }
  return hex;
}

function extractHexOrCss(s: string): string | null {
  const trimmed = s.trim();
  const hexMatch = trimmed.match(/#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})\b/i);
  if (hexMatch) {
    const h = hexMatch[0];
    if (h.length === 4) return expandShortHex(h);
    return h;
  }
  if (/^(rgb|rgba|hsl|hsla)\(/i.test(trimmed)) {
    return trimmed;
  }
  return null;
}

function hashToHsl(label: string, value: string): string {
  const key = `${label}\0${value}`;
  let hash = 2166136261;
  for (let i = 0; i < key.length; i++) {
    hash ^= key.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  const hue = Math.abs(hash) % 360;
  const sat = 48 + (Math.abs(hash >> 8) % 28);
  const light = 38 + (Math.abs(hash >> 16) % 22);
  return `hsl(${hue} ${sat}% ${light}%)`;
}

/**
 * Returns a string suitable for `style={{ backgroundColor: ... }}`.
 */
export function resolveSwatchColor(label: string, value: string): string {
  for (const raw of [value, label, `${label} ${value}`]) {
    const fromExplicit = extractHexOrCss(raw);
    if (fromExplicit) return fromExplicit;
  }

  const normalized = `${label} ${value}`
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (NAMED[normalized]) return NAMED[normalized];

  const words = normalized.split(/\s+/).filter(Boolean);
  for (const w of words) {
    if (NAMED[w]) return NAMED[w];
  }
  for (let i = 0; i < words.length - 1; i++) {
    const two = `${words[i]} ${words[i + 1]}`;
    if (NAMED[two]) return NAMED[two];
  }

  return hashToHsl(label, value);
}
