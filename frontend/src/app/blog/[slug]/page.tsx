import { Suspense } from 'react';
import { BlogPostClient } from '@/app/blog/[slug]/blog-post-client';

export default function BlogPostPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-3xl px-4 py-10 text-sm text-[#64748b]">Loading…</div>}>
      <BlogPostClient />
    </Suspense>
  );
}
