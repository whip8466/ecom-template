type AdminNavIconProps = {
  d: string;
  /** Defaults to top-level nav size (20px). */
  className?: string;
};

export function AdminNavIcon({ d, className = 'h-5 w-5' }: AdminNavIconProps) {
  return (
    <svg className={`${className} shrink-0`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={d} />
    </svg>
  );
}
