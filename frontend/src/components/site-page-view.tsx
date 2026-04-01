import type { SitePageDto } from '@/lib/site-pages';

type Props = {
  page: SitePageDto | null;
  fallbackTitle: string;
};

export function SitePageView({ page, fallbackTitle }: Props) {
  if (!page) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6 lg:px-8">
        <p className="text-sm text-[#64748b]">This page is not available right now.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="font-[family-name:var(--font-playfair)] text-3xl font-semibold tracking-tight text-[var(--navy)]">
        {page.title || fallbackTitle}
      </h1>
      <div
        className="site-page-body mt-8 space-y-4 text-[15px] leading-relaxed text-[#475569] [&_a]:text-[var(--sf-btn-primary-bg)] [&_a]:underline [&_h2]:mt-8 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-[var(--navy)] [&_h3]:mt-6 [&_h3]:text-lg [&_h3]:font-semibold [&_li]:my-1 [&_ol]:my-4 [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:my-3 [&_ul]:my-4 [&_ul]:list-disc [&_ul]:pl-6"
        dangerouslySetInnerHTML={{ __html: page.body }}
      />
    </div>
  );
}
