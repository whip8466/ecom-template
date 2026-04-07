'use client';

import { type CSSProperties } from 'react';
import {
  themeTokensToCssProperties,
  type StorefrontThemeTokens,
} from '@/lib/storefront-theme';
import { ThemeColorField, ThemeTextField } from './theme-field-controls';

type Props = {
  t: StorefrontThemeTokens;
  patch: (p: Partial<StorefrontThemeTokens>) => void;
};

export function ThemeLayoutSection({ t, patch }: Props) {
  const previewStyle = themeTokensToCssProperties(t);

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_min(280px,38%)] lg:items-start xl:grid-cols-[minmax(0,1fr)_380px]">
      <div className="min-w-0 space-y-8">
        <div className="rounded-admin border border-[#e3e6ed] bg-white p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-[#1c2740]">Surfaces</h2>
          <p className="mt-1 text-xs text-[#94a3b8]">
            Page canvas, card surfaces (product tiles, headers), and muted section bands alternate across the storefront.
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <ThemeColorField label="Page background" value={t.layoutPageBackground} onChange={(v) => patch({ layoutPageBackground: v })} />
            <ThemeColorField label="Card / section surface" value={t.layoutCardBackground} onChange={(v) => patch({ layoutCardBackground: v })} />
            <ThemeColorField
              label="Muted section background"
              value={t.layoutSectionMutedBackground}
              onChange={(v) => patch({ layoutSectionMutedBackground: v })}
            />
            <ThemeColorField label="Border" value={t.layoutBorder} onChange={(v) => patch({ layoutBorder: v })} />
          </div>
        </div>

        <div className="rounded-admin border border-[#e3e6ed] bg-white p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-[#1c2740]">Radius & shadows</h2>
          <p className="mt-1 text-xs text-[#94a3b8]">
            Radii apply where components use <code className="font-mono text-[11px]">var(--radius)</code> or{' '}
            <code className="font-mono text-[11px]">var(--radius-lg)</code>. Shadows use standard CSS{' '}
            <code className="font-mono text-[11px]">box-shadow</code> syntax.
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <ThemeTextField label="Default radius" hint="e.g. 0.75rem" value={t.layoutRadius} onChange={(v) => patch({ layoutRadius: v })} />
            <ThemeTextField label="Large radius" hint="e.g. 1rem" value={t.layoutRadiusLarge} onChange={(v) => patch({ layoutRadiusLarge: v })} />
            <div className="sm:col-span-2">
              <ThemeTextField label="Shadow small" value={t.layoutShadowSm} onChange={(v) => patch({ layoutShadowSm: v })} />
            </div>
            <div className="sm:col-span-2">
              <ThemeTextField label="Shadow medium" value={t.layoutShadow} onChange={(v) => patch({ layoutShadow: v })} />
            </div>
            <div className="sm:col-span-2">
              <ThemeTextField label="Shadow large" value={t.layoutShadowLg} onChange={(v) => patch({ layoutShadowLg: v })} />
            </div>
          </div>
        </div>
      </div>

      <aside className="lg:sticky lg:top-4 lg:self-start">
        <div className="rounded-admin border border-[#e3e6ed] bg-[#f8fafc] p-6">
          <h2 className="text-sm font-semibold text-[#1c2740]">Live preview</h2>
          <p className="mt-1 text-xs text-[#94a3b8]">Section strip and card sample.</p>
          <div
            className="mt-4 overflow-hidden rounded-admin border border-[#e5ecf6]"
            style={{ ...previewStyle, background: 'var(--background)' } as CSSProperties}
          >
            <div className="border-b px-4 py-6" style={{ background: 'var(--cream)', borderColor: 'var(--border)' }}>
              <p className="text-xs font-medium text-[#64748b]">Muted section</p>
            </div>
            <div className="p-4">
              <div
                className="border p-4"
                style={
                  {
                    borderRadius: 'var(--radius-lg)',
                    background: 'var(--card-bg)',
                    borderColor: 'var(--border)',
                    borderWidth: 1,
                    borderStyle: 'solid',
                    boxShadow: 'var(--shadow)',
                  } as CSSProperties
                }
              >
                <p className="text-sm font-medium text-[#1c2740]">Card</p>
                <p className="mt-1 text-xs text-[#64748b]">Border, radius, and shadow follow your tokens.</p>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}
