import type { Prisma } from '@prisma/client';
import type { BlogPost } from '@prisma/client';
import type { FastifyInstance, FastifyReply } from 'fastify';
import slugify from 'slugify';
import { z } from 'zod';
import { isStaffFromAuth } from '../../utils/staff';

function isStaff(authUser: { role: string } | undefined) {
  if (!authUser) return false;
  return isStaffFromAuth(authUser);
}

function repo(fastify: FastifyInstance) {
  return fastify.prisma.blogPost;
}

function clientReady(reply: FastifyReply, fastify: FastifyInstance) {
  if (!repo(fastify)) {
    return reply.code(503).send({
      message:
        'Database client is out of date. In the backend folder run: npx prisma generate — then restart the API server.',
    });
  }
  if (!fastify.prisma.blogCategory) {
    return reply.code(503).send({
      message:
        'Database client is out of date. In the backend folder run: npx prisma generate — then restart the API server.',
    });
  }
  return null;
}

type PostWithCategory = BlogPost & {
  blogCategory?: { id: number; name: string; slug: string } | null;
};

function mapCategory(c: { id: number; name: string; slug: string } | null | undefined) {
  if (!c) return null;
  return { id: c.id, name: c.name, slug: c.slug };
}

function mapPost(row: PostWithCategory) {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    excerpt: row.excerpt ?? null,
    body: row.body,
    coverImageUrl: row.coverImageUrl ?? null,
    publishedAt: row.publishedAt ? row.publishedAt.toISOString() : null,
    category: mapCategory(row.blogCategory ?? null),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function mapBlogCategoryRow(row: { id: number; name: string; slug: string; createdAt: Date; updatedAt: Date }) {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function slugBaseFromTitle(title: string) {
  const raw = slugify(String(title), { lower: true, strict: true, trim: true });
  return raw.slice(0, 180) || 'post';
}

async function ensureUniqueSlug(
  fastify: FastifyInstance,
  base: string,
  excludeId?: number,
): Promise<string> {
  const root = base || 'post';
  let suffix = 0;
  for (;;) {
    const candidate = suffix === 0 ? root : `${root}-${suffix}`;
    const existing = await fastify.prisma.blogPost.findUnique({ where: { slug: candidate } });
    if (!existing) return candidate;
    if (excludeId != null && existing.id === excludeId) return candidate;
    suffix += 1;
  }
}

async function ensureUniqueCategorySlug(
  fastify: FastifyInstance,
  base: string,
  excludeId?: number,
): Promise<string> {
  const root = base || 'category';
  let suffix = 0;
  for (;;) {
    const candidate = suffix === 0 ? root : `${root}-${suffix}`;
    const existing = await fastify.prisma.blogCategory.findUnique({ where: { slug: candidate } });
    if (!existing) return candidate;
    if (excludeId != null && existing.id === excludeId) return candidate;
    suffix += 1;
  }
}

const postInclude = { blogCategory: { select: { id: true, name: true, slug: true } } } as const;

const createBodySchema = z.object({
  title: z.string().min(1).max(500),
  slug: z.string().max(200).optional().nullable(),
  excerpt: z.union([z.string().max(1000), z.null()]).optional(),
  body: z.string().min(1),
  coverImageUrl: z.union([z.string().max(2000), z.null()]).optional(),
  publish: z.boolean().optional().default(false),
  blogCategoryId: z.union([z.number().int().positive(), z.null()]).optional(),
});

const updateBodySchema = z.object({
  title: z.string().min(1).max(500).optional(),
  slug: z.string().max(200).optional().nullable(),
  excerpt: z.union([z.string().max(1000), z.null()]).optional(),
  body: z.string().min(1).optional(),
  coverImageUrl: z.union([z.string().max(2000), z.null()]).optional(),
  publish: z.boolean().optional(),
  blogCategoryId: z.union([z.number().int().positive(), z.null()]).optional(),
});

const categoryBodySchema = z.object({
  name: z.string().min(1).max(200),
  slug: z.string().max(200).optional().nullable(),
});

async function blogRoutes(fastify: FastifyInstance) {
  /** Must be registered before `/blog/:slug` so `categories` is not captured as a post slug. */
  fastify.get('/blog/categories', async (_request, reply) => {
    if (clientReady(reply, fastify)) return;
    const rows = await fastify.prisma.blogCategory.findMany({
      where: {
        posts: { some: { publishedAt: { not: null } } },
      },
      orderBy: { name: 'asc' },
      select: { id: true, name: true, slug: true },
    });
    return { data: rows };
  });

  fastify.get('/blog', async (request, reply) => {
    if (clientReady(reply, fastify)) return;
    const q = z.object({ category: z.string().max(200).optional() }).parse(request.query ?? {});
    const where: Prisma.BlogPostWhereInput = {
      publishedAt: { not: null },
    };
    if (q.category?.trim()) {
      where.blogCategory = { slug: q.category.trim() };
    }
    const rows = await fastify.prisma.blogPost.findMany({
      where,
      orderBy: { publishedAt: 'desc' },
      select: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
        coverImageUrl: true,
        publishedAt: true,
        createdAt: true,
        updatedAt: true,
        blogCategory: { select: { id: true, name: true, slug: true } },
      },
    });
    return {
      data: rows.map((r) => ({
        id: r.id,
        title: r.title,
        slug: r.slug,
        excerpt: r.excerpt ?? null,
        coverImageUrl: r.coverImageUrl ?? null,
        publishedAt: r.publishedAt ? r.publishedAt.toISOString() : null,
        createdAt: r.createdAt.toISOString(),
        updatedAt: r.updatedAt.toISOString(),
        category: mapCategory(r.blogCategory ?? null),
      })),
    };
  });

  fastify.get('/blog/:slug', async (request, reply) => {
    if (clientReady(reply, fastify)) return;
    const params = z.object({ slug: z.string().min(1).max(200) }).parse(request.params);
    const row = await fastify.prisma.blogPost.findFirst({
      where: {
        slug: params.slug,
        publishedAt: { not: null },
      },
      include: postInclude,
    });
    if (!row) {
      return reply.code(404).send({ message: 'Post not found' });
    }
    return { data: mapPost(row) };
  });

  fastify.get('/admin/blog-categories', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    if (!isStaff(request.authUser)) {
      return reply.code(403).send({ message: 'Forbidden' });
    }
    if (clientReady(reply, fastify)) return;
    const rows = await fastify.prisma.blogCategory.findMany({
      orderBy: { name: 'asc' },
    });
    return { data: rows.map(mapBlogCategoryRow) };
  });

  fastify.post('/admin/blog-categories', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    if (!isStaff(request.authUser)) {
      return reply.code(403).send({ message: 'Forbidden' });
    }
    if (clientReady(reply, fastify)) return;
    const body = categoryBodySchema.parse(request.body);
    const slugInput = body.slug?.trim();
    const base = slugInput
      ? slugify(slugInput, { lower: true, strict: true, trim: true }).slice(0, 180) || 'category'
      : slugBaseFromTitle(body.name);
    const uniqueSlug = await ensureUniqueCategorySlug(fastify, base);
    const row = await fastify.prisma.blogCategory.create({
      data: {
        name: body.name.trim(),
        slug: uniqueSlug,
      },
    });
    return reply.code(201).send({ data: mapBlogCategoryRow(row) });
  });

  fastify.put('/admin/blog-categories/:id', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    if (!isStaff(request.authUser)) {
      return reply.code(403).send({ message: 'Forbidden' });
    }
    if (clientReady(reply, fastify)) return;
    const params = z.object({ id: z.coerce.number().int().positive() }).parse(request.params);
    const body = categoryBodySchema.parse(request.body);
    const existing = await fastify.prisma.blogCategory.findUnique({ where: { id: params.id } });
    if (!existing) {
      return reply.code(404).send({ message: 'Category not found' });
    }
    let nextSlug: string | undefined;
    if (body.slug !== undefined && body.slug != null && String(body.slug).trim()) {
      const base = slugify(String(body.slug).trim(), { lower: true, strict: true, trim: true }).slice(0, 180) || 'category';
      nextSlug = await ensureUniqueCategorySlug(fastify, base, params.id);
    }
    const row = await fastify.prisma.blogCategory.update({
      where: { id: params.id },
      data: {
        ...(body.name !== undefined ? { name: body.name.trim() } : {}),
        ...(nextSlug !== undefined ? { slug: nextSlug } : {}),
      },
    });
    return { data: mapBlogCategoryRow(row) };
  });

  fastify.delete('/admin/blog-categories/:id', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    if (!isStaff(request.authUser)) {
      return reply.code(403).send({ message: 'Forbidden' });
    }
    if (clientReady(reply, fastify)) return;
    const params = z.object({ id: z.coerce.number().int().positive() }).parse(request.params);
    try {
      await fastify.prisma.blogCategory.delete({ where: { id: params.id } });
    } catch {
      return reply.code(404).send({ message: 'Category not found' });
    }
    return reply.code(204).send();
  });

  fastify.get('/admin/blog-posts', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    if (!isStaff(request.authUser)) {
      return reply.code(403).send({ message: 'Forbidden' });
    }
    if (clientReady(reply, fastify)) return;
    const rows = await fastify.prisma.blogPost.findMany({
      orderBy: { updatedAt: 'desc' },
      include: postInclude,
    });
    return { data: rows.map(mapPost) };
  });

  fastify.get('/admin/blog-posts/:id', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    if (!isStaff(request.authUser)) {
      return reply.code(403).send({ message: 'Forbidden' });
    }
    if (clientReady(reply, fastify)) return;
    const params = z.object({ id: z.coerce.number().int().positive() }).parse(request.params);
    const row = await fastify.prisma.blogPost.findUnique({
      where: { id: params.id },
      include: postInclude,
    });
    if (!row) {
      return reply.code(404).send({ message: 'Post not found' });
    }
    return { data: mapPost(row) };
  });

  fastify.post('/admin/blog-posts', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    if (!isStaff(request.authUser)) {
      return reply.code(403).send({ message: 'Forbidden' });
    }
    if (clientReady(reply, fastify)) return;
    const body = createBodySchema.parse(request.body);
    if (body.blogCategoryId != null) {
      const cat = await fastify.prisma.blogCategory.findUnique({ where: { id: body.blogCategoryId } });
      if (!cat) {
        return reply.code(400).send({ message: 'Unknown blog category.' });
      }
    }
    const slugInput = body.slug?.trim();
    const base = slugInput
      ? slugify(slugInput, { lower: true, strict: true, trim: true }).slice(0, 180) || 'post'
      : slugBaseFromTitle(body.title);
    const uniqueSlug = await ensureUniqueSlug(fastify, base);
    const publishedAt = body.publish ? new Date() : null;
    const excerpt = body.excerpt != null && String(body.excerpt).trim() ? body.excerpt : null;
    const cover = body.coverImageUrl != null && String(body.coverImageUrl).trim() ? body.coverImageUrl : null;

    const row = await fastify.prisma.blogPost.create({
      data: {
        title: body.title.trim(),
        slug: uniqueSlug,
        excerpt,
        body: body.body,
        coverImageUrl: cover,
        publishedAt,
        blogCategoryId: body.blogCategoryId ?? null,
      },
      include: postInclude,
    });
    return reply.code(201).send({ data: mapPost(row) });
  });

  fastify.put('/admin/blog-posts/:id', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    if (!isStaff(request.authUser)) {
      return reply.code(403).send({ message: 'Forbidden' });
    }
    if (clientReady(reply, fastify)) return;
    const params = z.object({ id: z.coerce.number().int().positive() }).parse(request.params);
    const body = updateBodySchema.parse(request.body);

    if (body.blogCategoryId != null) {
      const cat = await fastify.prisma.blogCategory.findUnique({ where: { id: body.blogCategoryId } });
      if (!cat) {
        return reply.code(400).send({ message: 'Unknown blog category.' });
      }
    }

    const existing = await fastify.prisma.blogPost.findUnique({ where: { id: params.id } });
    if (!existing) {
      return reply.code(404).send({ message: 'Post not found' });
    }

    let nextSlug: string | undefined;
    if (body.slug !== undefined && body.slug != null && String(body.slug).trim()) {
      const base = slugify(String(body.slug).trim(), { lower: true, strict: true, trim: true }).slice(0, 180) || 'post';
      nextSlug = await ensureUniqueSlug(fastify, base, params.id);
    }

    let publishedAt: Date | null | undefined;
    if (body.publish === true) {
      publishedAt = existing.publishedAt ?? new Date();
    } else if (body.publish === false) {
      publishedAt = null;
    }

    const excerpt =
      body.excerpt !== undefined
        ? body.excerpt != null && String(body.excerpt).trim()
          ? body.excerpt
          : null
        : undefined;
    const cover =
      body.coverImageUrl !== undefined
        ? body.coverImageUrl != null && String(body.coverImageUrl).trim()
          ? body.coverImageUrl
          : null
        : undefined;

    const row = await fastify.prisma.blogPost.update({
      where: { id: params.id },
      data: {
        ...(body.title !== undefined ? { title: body.title.trim() } : {}),
        ...(nextSlug !== undefined ? { slug: nextSlug } : {}),
        ...(body.body !== undefined ? { body: body.body } : {}),
        ...(excerpt !== undefined ? { excerpt } : {}),
        ...(cover !== undefined ? { coverImageUrl: cover } : {}),
        ...(publishedAt !== undefined ? { publishedAt } : {}),
        ...(body.blogCategoryId !== undefined ? { blogCategoryId: body.blogCategoryId } : {}),
      },
      include: postInclude,
    });
    return { data: mapPost(row) };
  });

  fastify.delete('/admin/blog-posts/:id', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    if (!isStaff(request.authUser)) {
      return reply.code(403).send({ message: 'Forbidden' });
    }
    if (clientReady(reply, fastify)) return;
    const params = z.object({ id: z.coerce.number().int().positive() }).parse(request.params);
    const existing = await fastify.prisma.blogPost.findUnique({ where: { id: params.id } });
    if (!existing) {
      return reply.code(404).send({ message: 'Post not found' });
    }
    if (existing.publishedAt != null) {
      return reply.code(400).send({ message: 'Unpublish the post before deleting it.' });
    }
    await fastify.prisma.blogPost.delete({ where: { id: params.id } });
    return reply.code(204).send();
  });
}

export = blogRoutes;
