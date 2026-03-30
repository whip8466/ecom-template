'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { AdminPageShell } from '@/components/admin-shell';
import { BlogPostForm } from '@/app/admin/blog/_components/blog-post-form';
import { apiRequest } from '@/lib/api';
import type { BlogPost } from '@/lib/blog';
import { useAuthStore } from '@/store/auth-store';

export default function AdminBlogEditPage() {
  const router = useRouter();
  const params = useParams();
  const idParam = params?.id;
  const id = typeof idParam === 'string' ? Number(idParam) : NaN;
  const token = useAuthStore((s) => s.token);
  const [mounted, setMounted] = useState(false);
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const load = useCallback(() => {
    if (!token || !Number.isInteger(id) || id < 1) return Promise.resolve();
    setLoading(true);
    setError(null);
    return apiRequest<{ data: BlogPost }>(`/api/admin/blog-posts/${id}`, { token })
      .then((res) => {
        setPost(res.data);
      })
      .catch((e) => {
        setError((e as Error).message);
        setPost(null);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [token, id]);

  useEffect(() => {
    if (!mounted || !token) return;
    void load();
  }, [mounted, token, load]);

  return (
    <AdminPageShell
      breadcrumbs={[
        { label: 'Home', href: '/admin' },
        { label: 'Blog', href: '/admin/blog' },
        { label: 'Edit post' },
      ]}
      title="Edit blog post"
      description={
        <>
          Update content and publishing.{' '}
          <Link href="/admin/blog" className="font-semibold text-[#3874ff] hover:underline">
            Back to list
          </Link>
        </>
      }
    >
      {!mounted ? (
        <p className="text-sm text-[#64748b]">Loading…</p>
      ) : !token ? (
        <p className="text-sm text-[#64748b]">Sign in as admin to edit posts.</p>
      ) : !Number.isInteger(id) || id < 1 ? (
        <p className="text-sm text-red-600">Invalid post id.</p>
      ) : loading ? (
        <p className="text-sm text-[#60759b]">Loading post…</p>
      ) : error ? (
        <p className="text-sm text-red-600">{error}</p>
      ) : post ? (
        <BlogPostForm
          key={post.updatedAt}
          mode="edit"
          token={token}
          initial={post}
          onSuccess={() => {
            router.push('/admin/blog');
          }}
        />
      ) : (
        <p className="text-sm text-[#60759b]">Post not found.</p>
      )}
    </AdminPageShell>
  );
}
