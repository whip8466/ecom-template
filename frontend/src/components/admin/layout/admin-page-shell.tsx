import Link from 'next/link';

export type AdminBreadcrumbItem = {
  label: string;
  href?: string;
};

type Props = {
  breadcrumbs: AdminBreadcrumbItem[];
  title: string;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
  /** Optional wrapper for page content (e.g. max width) */
  className?: string;
};

export function AdminPageShell({ breadcrumbs, title, description, actions, children, className }: Props) {
  return (
    <div className={className ?? 'mx-auto w-full max-w-7xl'}>
      <nav className="text-sm text-[#60759b]" aria-label="Breadcrumb">
        <ol className="flex flex-wrap items-center gap-1.5">
          {breadcrumbs.map((crumb, i) => (
            <li key={`${crumb.label}-${i}`} className="flex items-center gap-1.5">
              {i > 0 && <span className="text-[#c5d0e5]">/</span>}
              {crumb.href ? (
                <Link href={crumb.href} className="hover:text-[#246bfd]">
                  {crumb.label}
                </Link>
              ) : (
                <span className="font-medium text-[#1c2740]">{crumb.label}</span>
              )}
            </li>
          ))}
        </ol>
      </nav>
      <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight text-[#1c2740]">{title}</h1>
          {description ? <div className="mt-1 text-sm text-[#60759b]">{description}</div> : null}
        </div>
        {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
      </div>
      <div className="mt-6">{children}</div>
    </div>
  );
}
