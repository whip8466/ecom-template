'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import type { BlogCategory, BlogPost } from '@/lib/blog';
import { slugFromTitle } from '@/lib/slugify-title';

type Mode = 'create' | 'edit';

export function BlogPostForm({
  mode,
  initial,
  token,
  onSuccess,
}: {
  mode: Mode;
  initial?: BlogPost | null;
  token: string;
  onSuccess: (post: BlogPost) => void;
}) {
  const [title, setTitle] = useState(initial?.title ?? '');
  const [slug, setSlug] = useState(initial?.slug ?? '');
  const [excerpt, setExcerpt] = useState(initial?.excerpt ?? '');
  const [body, setBody] = useState(initial?.body ?? '');
  const [coverImageUrl, setCoverImageUrl] = useState(initial?.coverImageUrl ?? '');
  const [publish, setPublish] = useState(!!initial?.publishedAt);
  const [blogCategoryId, setBlogCategoryId] = useState<number | null>(initial?.category?.id ?? null);
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    import('@/lib/api').then(({ apiRequest }) =>
      apiRequest<{ data: BlogCategory[] }>('/api/admin/blog-categories', { token }),
    )
      .then((res) => {
        if (!cancelled) setCategories(Array.isArray(res.data) ? res.data : []);
      })
      .catch(() => {
        if (!cancelled) setCategories([]);
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  useEffect(() => {
    setBlogCategoryId(initial?.category?.id ?? null);
  }, [initial?.category?.id, initial?.id]);

  const submit = async () => {
    setSaving(true);
    setError(null);
    try {
      const { apiRequest } = await import('@/lib/api');
      const slugTrim = slug.trim();
      const excerptVal = excerpt.trim() ? excerpt.trim() : null;
      const coverVal = coverImageUrl.trim() ? coverImageUrl.trim() : null;

      if (mode === 'create') {
        const res = await apiRequest<{ data: BlogPost }>('/api/admin/blog-posts', {
          method: 'POST',
          token,
          body: JSON.stringify({
            title: title.trim(),
            ...(slugTrim ? { slug: slugTrim } : {}),
            excerpt: excerptVal,
            body: body.trim(),
            coverImageUrl: coverVal,
            publish,
            blogCategoryId,
          }),
        });
        onSuccess(res.data);
        return;
      }

      if (!initial) return;
      const res = await apiRequest<{ data: BlogPost }>(`/api/admin/blog-posts/${initial.id}`, {
        method: 'PUT',
        token,
        body: JSON.stringify({
          title: title.trim(),
          ...(slugTrim ? { slug: slugTrim } : {}),
          excerpt: excerptVal,
          body: body.trim(),
          coverImageUrl: coverVal,
          publish,
          blogCategoryId,
        }),
      });
      onSuccess(res.data);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <label className="block text-xs font-medium text-[#60759b]">
        Title
        <input
          type="text"
          className="mt-1 w-full rounded-admin border border-[#e3e6ed] px-3 py-2 text-sm text-[#1c2740]"
          value={title}
          onChange={(e) => {
            const v = e.target.value;
            setTitle(v);
            setSlug(slugFromTitle(v));
          }}
          placeholder="Post title"
          required
        />
      </label>
      <label className="block text-xs font-medium text-[#60759b]">
        Slug (auto-filled from title; you can edit)
        <input
          type="text"
          className="mt-1 w-full rounded-admin border border-[#e3e6ed] px-3 py-2 text-sm text-[#1c2740]"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          placeholder="my-post-url"
        />
      </label>
      <label className="block text-xs font-medium text-[#60759b]">
        Category
        <select
          className="mt-1 w-full rounded-admin border border-[#e3e6ed] bg-white px-3 py-2 text-sm text-[#1c2740]"
          value={blogCategoryId === null ? '' : String(blogCategoryId)}
          onChange={(e) => {
            const v = e.target.value;
            setBlogCategoryId(v === '' ? null : Number(v));
          }}
        >
          <option value="">No category</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <p className="mt-1 text-[11px] text-[#94a3b8]">
          Manage categories in{' '}
          <Link href="/admin/blog/categories" className="font-medium text-[#3874ff] hover:underline">
            Blog categories
          </Link>
          .
        </p>
      </label>
      <label className="block text-xs font-medium text-[#60759b]">
        Excerpt
        <textarea
          className="mt-1 min-h-[72px] w-full rounded-admin border border-[#e3e6ed] px-3 py-2 text-sm text-[#1c2740]"
          value={excerpt}
          onChange={(e) => setExcerpt(e.target.value)}
          placeholder="Short summary for listings"
        />
      </label>
      <label className="block text-xs font-medium text-[#60759b]">
        Content
        <textarea
          className="mt-1 min-h-[220px] w-full rounded-admin border border-[#e3e6ed] px-3 py-2 text-sm text-[#1c2740]"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Article body (plain text or HTML)"
          required
        />
      </label>
      <label className="block text-xs font-medium text-[#60759b]">
        Cover image URL
        <input
          type="url"
          className="mt-1 w-full rounded-admin border border-[#e3e6ed] px-3 py-2 text-sm text-[#1c2740]"
          value={coverImageUrl}
          onChange={(e) => setCoverImageUrl(e.target.value)}
          placeholder="https://…"
        />
      </label>
      <label className="flex cursor-pointer items-center gap-2 text-sm text-[#1c2740]">
        <input
          type="checkbox"
          className="rounded border-[#e3e6ed]"
          checked={publish}
          onChange={(e) => setPublish(e.target.checked)}
        />
        Published (visible on the public blog API)
      </label>
      <button
        type="button"
        disabled={saving || !title.trim() || !body.trim()}
        onClick={() => void submit()}
        className="rounded-admin bg-[#3874ff] px-4 py-2 text-sm font-medium text-white hover:bg-[#2d5fd6] disabled:opacity-50"
      >
        {saving ? 'Saving…' : mode === 'create' ? 'Create post' : 'Save changes'}
      </button>
    </div>
  );
}
