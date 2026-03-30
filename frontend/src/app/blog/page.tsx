import { Suspense } from 'react';
import { BlogListClient } from '@/app/blog/blog-list-client';

export default function BlogPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-3xl px-4 py-10 text-sm text-[#64748b]">Loading…</div>}>
      <BlogListClient />
    </Suspense>
  );
}
