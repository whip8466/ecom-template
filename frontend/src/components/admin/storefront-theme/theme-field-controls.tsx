'use client';

export function ThemeColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-[#64748b]">{label}</span>
      <div className="mt-1 flex items-center gap-2">
        <input
          type="color"
          value={value.length === 7 ? value : '#0989ff'}
          onChange={(e) => onChange(e.target.value)}
          className="h-9 w-12 cursor-pointer rounded border border-[#e3e6ed] bg-white p-0.5"
          aria-label={label}
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="min-w-0 flex-1 rounded-admin border border-[#e3e6ed] px-2 py-1.5 font-mono text-sm text-[#31374a]"
          spellCheck={false}
        />
      </div>
    </label>
  );
}

export function ThemeTextField({
  label,
  hint,
  value,
  onChange,
}: {
  label: string;
  hint?: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-[#64748b]">{label}</span>
      {hint ? <span className="ml-1 text-[11px] text-[#94a3b8]">({hint})</span> : null}
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-admin border border-[#e3e6ed] px-2 py-1.5 text-sm text-[#31374a]"
      />
    </label>
  );
}
