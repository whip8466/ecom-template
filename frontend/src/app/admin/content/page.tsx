import Link from 'next/link';
import { AdminPageShell } from '@/components/admin-shell';
import { SITE_PAGE_LABELS, SITE_PAGE_SLUGS } from '@/lib/site-pages';

export default function AdminContentIndexPage() {
  return (
    <AdminPageShell
      breadcrumbs={[
        { label: 'Admin', href: '/admin' },
        { label: 'Site pages' },
      ]}
      title="Site pages"
    >
      <p className="mt-2 text-sm text-[#64748b]">
        Edit storefront content for Privacy Policy and Terms of Service. HTML is supported in the body.
      </p>
      <ul className="mt-8 space-y-3">
        {SITE_PAGE_SLUGS.map((slug) => (
          <li key={slug}>
            <Link
              href={`/admin/content/${slug}`}
              className="flex items-center justify-between rounded-admin-card border border-[#e5ebf5] bg-white px-4 py-3 text-sm font-medium text-[#246bfd] shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition hover:bg-[#f8fafc]"
            >
              <span>{SITE_PAGE_LABELS[slug]}</span>
              <span className="text-[#94a3b8]" aria-hidden>
                →
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </AdminPageShell>
  );
}
