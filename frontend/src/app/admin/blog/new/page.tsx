'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { AdminPageShell } from '@/components/admin-shell';
import { BlogPostForm } from '@/app/admin/blog/_components/blog-post-form';
import { useAuthStore } from '@/store/auth-store';

export default function AdminBlogNewPage() {
  const token = useAuthStore((s) => s.token);
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <AdminPageShell
      breadcrumbs={[
        { label: 'Home', href: '/admin' },
        { label: 'Blog', href: '/admin/blog' },
        { label: 'New post' },
      ]}
      title="New blog post"
      description="Write the article and choose whether to publish it immediately."
    >
      {!mounted ? (
        <p className="text-sm text-[#64748b]">Loading…</p>
      ) : !token ? (
        <p className="text-sm text-[#64748b]">Sign in as admin to create posts.</p>
      ) : (
        <BlogPostForm
          mode="create"
          token={token}
          onSuccess={() => {
            router.push('/admin/blog');
          }}
        />
      )}
    </AdminPageShell>
  );
}
