import Link from 'next/link';

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1489515217757-5fd1be406fef?w=900&q=80';

function formatBlogDate(iso: string | null | undefined): string {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return '';
  }
}

export function BlogPostCard({
  slug,
  title,
  publishedAt,
  coverImageUrl,
}: {
  slug: string;
  title: string;
  publishedAt: string | null | undefined;
  coverImageUrl: string | null | undefined;
}) {
  const imageUrl = coverImageUrl?.trim() ? coverImageUrl : FALLBACK_IMAGE;
  const dateLabel = formatBlogDate(publishedAt);

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-[var(--radius)] border border-[var(--border)] bg-[var(--card-bg)] shadow-[var(--shadow-sm)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[var(--shadow)]">
      <Link href={`/blog/${slug}`} className="block shrink-0 overflow-hidden">
        <div
          className="aspect-16/10 bg-cover bg-center transition duration-300 group-hover:scale-105"
          style={{ backgroundImage: `url(${imageUrl})` }}
        />
      </Link>
      <div className="flex flex-1 flex-col p-4">
        {dateLabel ? <p className="text-xs text-[#7c8ea6]">{dateLabel}</p> : null}
        <h3 className="mt-2 text-base font-semibold leading-snug text-[#1b2a4e]">
          <Link href={`/blog/${slug}`} className="hover:text-[var(--sf-btn-primary-bg)]">
            {title}
          </Link>
        </h3>
      </div>
    </article>
  );
}
