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

export function ThemeInputsSection({ t, patch }: Props) {
  const previewStyle = themeTokensToCssProperties(t);

  return (
    <div className="space-y-8">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_min(280px,36%)] lg:items-start xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="rounded-admin border border-[#e3e6ed] bg-white p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-[#1c2740]">Buttons</h2>
          <p className="mt-1 text-xs text-[#94a3b8]">Primary is also synced to site accent links and newsletter CTAs using `--accent`.</p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <ThemeColorField label="Primary background" value={t.buttonPrimaryBg} onChange={(v) => patch({ buttonPrimaryBg: v })} />
            <ThemeColorField label="Primary hover" value={t.buttonPrimaryHover} onChange={(v) => patch({ buttonPrimaryHover: v })} />
            <ThemeColorField label="Secondary background" value={t.buttonSecondaryBg} onChange={(v) => patch({ buttonSecondaryBg: v })} />
            <ThemeColorField label="Secondary border" value={t.buttonSecondaryBorder} onChange={(v) => patch({ buttonSecondaryBorder: v })} />
            <ThemeColorField label="Secondary text" value={t.buttonSecondaryText} onChange={(v) => patch({ buttonSecondaryText: v })} />
            <ThemeColorField label="Info background" value={t.buttonInfoBg} onChange={(v) => patch({ buttonInfoBg: v })} />
            <ThemeColorField label="Info hover" value={t.buttonInfoHover} onChange={(v) => patch({ buttonInfoHover: v })} />
            <ThemeTextField label="Button radius" hint="all button types" value={t.buttonRadius} onChange={(v) => patch({ buttonRadius: v })} />
          </div>
        </div>
        <aside className="lg:sticky lg:top-4 lg:self-start">
          <div className="rounded-admin border border-[#e3e6ed] bg-[#f8fafc] p-6">
            <h2 className="text-sm font-semibold text-[#1c2740]">Live preview</h2>
            <p className="mt-1 text-xs text-[#94a3b8]">Input tokens only; updates as you edit.</p>
            <div
              className="mt-2 flex flex-wrap gap-2 rounded-admin border border-[#e5ecf6] bg-[#f8fafc] p-3"
              style={previewStyle as CSSProperties}
            >
              <button type="button" className="sf-btn-primary text-sm">
                Primary
              </button>
              <button type="button" className="sf-btn-secondary text-sm">
                Secondary
              </button>
              <button type="button" className="sf-btn-info text-sm">
                Info
              </button>
            </div>
          </div>
        </aside>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_min(280px,36%)] lg:items-start xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="min-w-0 rounded-admin border border-[#e3e6ed] bg-white p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-[#1c2740]">Inputs & fields</h2>
          <p className="mt-1 text-xs text-[#94a3b8]">
            Text inputs and textareas use these tokens. Focus ring applies to inputs and selects.
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <ThemeTextField label="Input radius" value={t.inputRadius} onChange={(v) => patch({ inputRadius: v })} />
            <ThemeColorField label="Border" value={t.inputBorder} onChange={(v) => patch({ inputBorder: v })} />
            <ThemeColorField label="Background" value={t.inputBackground} onChange={(v) => patch({ inputBackground: v })} />
            <ThemeColorField label="Text" value={t.inputText} onChange={(v) => patch({ inputText: v })} />
            <ThemeColorField label="Placeholder" value={t.inputPlaceholder} onChange={(v) => patch({ inputPlaceholder: v })} />
            <ThemeColorField label="Focus ring" value={t.inputFocusRing} onChange={(v) => patch({ inputFocusRing: v })} />
            <ThemeTextField label="Textarea min height" hint="e.g. 8rem" value={t.textareaMinHeight} onChange={(v) => patch({ textareaMinHeight: v })} />
            <ThemeColorField label="Label text" value={t.labelText} onChange={(v) => patch({ labelText: v })} />
            <ThemeColorField label="Checkbox accent" value={t.checkboxAccent} onChange={(v) => patch({ checkboxAccent: v })} />
          </div>

          <div className="mt-8 border-t border-[#e8ecf4] pt-6">
            <h3 className="text-sm font-semibold text-[#1c2740]">Dropdown (select)</h3>
            <p className="mt-1 text-xs text-[#94a3b8]">
              <code className="rounded bg-[#f1f5f9] px-1 font-mono text-[11px] text-[#475467]">select</code>{' '}
              elements use these tokens for border, fill, and text. Corner radius matches the Input radius control above.
            </p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <ThemeColorField label="Background" value={t.selectBackground} onChange={(v) => patch({ selectBackground: v })} />
              <ThemeColorField label="Border" value={t.selectBorder} onChange={(v) => patch({ selectBorder: v })} />
              <ThemeColorField label="Text" value={t.selectText} onChange={(v) => patch({ selectText: v })} />
            </div>
            <h4 className="mt-6 text-xs font-semibold uppercase tracking-wide text-[#64748b]">Options list</h4>
            <p className="mt-1 text-xs text-[#94a3b8]">
              Styling for <code className="font-mono text-[11px]">option</code> rows when the menu is open. Some browsers or OS themes may ignore these.
            </p>
            <div className="mt-3 grid gap-4 sm:grid-cols-2">
              <ThemeColorField
                label="Option background"
                value={t.selectOptionBackground}
                onChange={(v) => patch({ selectOptionBackground: v })}
              />
              <ThemeColorField label="Option text" value={t.selectOptionText} onChange={(v) => patch({ selectOptionText: v })} />
            </div>
          </div>
        </div>

        <aside className="lg:sticky lg:top-4 lg:self-start">
          <div className="rounded-admin border border-[#e3e6ed] bg-[#f8fafc] p-6">
            <h2 className="text-sm font-semibold text-[#1c2740]">Live preview</h2>
            <p className="mt-1 text-xs text-[#94a3b8]">Input tokens only; updates as you edit.</p>
            <div
              className="mt-4 space-y-3 rounded-admin border border-[#e5ecf6] bg-white p-4"
              style={previewStyle as CSSProperties}
            >
              <label className="sf-label">Sample label</label>
              <input type="text" className="sf-field h-11 w-full" placeholder="Placeholder" readOnly />
              <select className="sf-field h-11 w-full" aria-label="Sample dropdown" defaultValue="a">
                <option value="a">Option one</option>
                <option value="b">Option two</option>
              </select>
              <textarea className="sf-field w-full" rows={3} readOnly placeholder="Textarea" />
              <label className="flex cursor-pointer items-center gap-2 text-sm text-[#475467]">
                <input type="checkbox" className="sf-checkbox" defaultChecked />
                Checkbox
              </label>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
