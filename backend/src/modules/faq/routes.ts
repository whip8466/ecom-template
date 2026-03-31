import type { FastifyInstance, FastifyReply } from 'fastify';
import slugify from 'slugify';
import { z } from 'zod';
import { UserRole } from '../../constants/enums';

const FAQ_ICON_KEYS = ['clock', 'document', 'receipt', 'envelope', 'chat-alert'] as const;
type FaqIconKey = (typeof FAQ_ICON_KEYS)[number];

function isStaff(authUser: { role: string } | undefined) {
  if (!authUser) return false;
  return authUser.role === UserRole.ADMIN || authUser.role === UserRole.MANAGER;
}

function clientReady(reply: FastifyReply, fastify: FastifyInstance) {
  if (!fastify.prisma.faqCategory || !fastify.prisma.faqItem) {
    return reply.code(503).send({
      message:
        'Database client is out of date. In the backend folder run: npx prisma generate — then restart the API server.',
    });
  }
  return null;
}

function slugBaseFromTitle(title: string) {
  const raw = slugify(String(title), { lower: true, strict: true, trim: true });
  return raw.slice(0, 180) || 'faq';
}

async function ensureUniqueCategorySlug(
  fastify: FastifyInstance,
  base: string,
  excludeId?: number,
): Promise<string> {
  const root = base || 'faq';
  let suffix = 0;
  for (;;) {
    const candidate = suffix === 0 ? root : `${root}-${suffix}`;
    const existing = await fastify.prisma.faqCategory.findUnique({ where: { slug: candidate } });
    if (!existing) return candidate;
    if (excludeId != null && existing.id === excludeId) return candidate;
    suffix += 1;
  }
}

const iconKeySchema = z.enum(FAQ_ICON_KEYS);

const createCategorySchema = z.object({
  title: z.string().min(1).max(200),
  slug: z.string().max(180).optional().nullable(),
  iconKey: iconKeySchema.optional().default('document'),
  sortOrder: z.number().int().min(0).max(9999).optional().default(0),
});

const updateCategorySchema = z.object({
  title: z.string().min(1).max(200).optional(),
  slug: z.string().max(180).optional().nullable(),
  iconKey: iconKeySchema.optional(),
  sortOrder: z.number().int().min(0).max(9999).optional(),
});

const createItemSchema = z.object({
  categoryId: z.number().int().positive(),
  question: z.string().min(1).max(500),
  answer: z.string().min(1),
  sortOrder: z.number().int().min(0).max(9999).optional().default(0),
  isActive: z.boolean().optional().default(true),
});

const updateItemSchema = z.object({
  question: z.string().min(1).max(500).optional(),
  answer: z.string().min(1).optional(),
  sortOrder: z.number().int().min(0).max(9999).optional(),
  isActive: z.boolean().optional(),
});

function mapCategoryPublic(c: {
  id: number;
  title: string;
  slug: string;
  iconKey: string;
  sortOrder: number;
  items: { id: number; question: string; answer: string; sortOrder: number }[];
}) {
  return {
    id: c.id,
    title: c.title,
    slug: c.slug,
    iconKey: c.iconKey as FaqIconKey,
    sortOrder: c.sortOrder,
    items: c.items.map((i) => ({
      id: i.id,
      question: i.question,
      answer: i.answer,
      sortOrder: i.sortOrder,
    })),
  };
}

async function faqRoutes(fastify: FastifyInstance) {
  fastify.get('/faqs', async (_request, reply) => {
    if (clientReady(reply, fastify)) return;
    const rows = await fastify.prisma.faqCategory.findMany({
      orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
      include: {
        items: {
          where: { isActive: true },
          orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
          select: { id: true, question: true, answer: true, sortOrder: true },
        },
      },
    });
    const data = rows.filter((c) => c.items.length > 0).map(mapCategoryPublic);
    return { data };
  });

  fastify.get('/admin/faq-categories', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    if (!isStaff(request.authUser)) {
      return reply.code(403).send({ message: 'Forbidden' });
    }
    if (clientReady(reply, fastify)) return;
    const rows = await fastify.prisma.faqCategory.findMany({
      orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
      include: {
        _count: { select: { items: true } },
      },
    });
    return {
      data: rows.map((r) => ({
        id: r.id,
        title: r.title,
        slug: r.slug,
        iconKey: r.iconKey as FaqIconKey,
        sortOrder: r.sortOrder,
        itemCount: r._count.items,
        createdAt: r.createdAt.toISOString(),
        updatedAt: r.updatedAt.toISOString(),
      })),
    };
  });

  fastify.post('/admin/faq-categories', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    if (!isStaff(request.authUser)) {
      return reply.code(403).send({ message: 'Forbidden' });
    }
    if (clientReady(reply, fastify)) return;
    const body = createCategorySchema.parse(request.body);
    const slugInput = body.slug?.trim();
    const base = slugInput
      ? slugify(slugInput, { lower: true, strict: true, trim: true }).slice(0, 180) || 'faq'
      : slugBaseFromTitle(body.title);
    const uniqueSlug = await ensureUniqueCategorySlug(fastify, base);
    const row = await fastify.prisma.faqCategory.create({
      data: {
        title: body.title.trim(),
        slug: uniqueSlug,
        iconKey: body.iconKey ?? 'document',
        sortOrder: body.sortOrder ?? 0,
      },
    });
    return reply.code(201).send({
      data: {
        id: row.id,
        title: row.title,
        slug: row.slug,
        iconKey: row.iconKey,
        sortOrder: row.sortOrder,
        itemCount: 0,
        createdAt: row.createdAt.toISOString(),
        updatedAt: row.updatedAt.toISOString(),
      },
    });
  });

  fastify.put('/admin/faq-categories/:id', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    if (!isStaff(request.authUser)) {
      return reply.code(403).send({ message: 'Forbidden' });
    }
    if (clientReady(reply, fastify)) return;
    const params = z.object({ id: z.coerce.number().int().positive() }).parse(request.params);
    const body = updateCategorySchema.parse(request.body);
    const existing = await fastify.prisma.faqCategory.findUnique({ where: { id: params.id } });
    if (!existing) {
      return reply.code(404).send({ message: 'Category not found' });
    }
    let nextSlug: string | undefined;
    if (body.slug !== undefined && body.slug != null && String(body.slug).trim()) {
      const base = slugify(String(body.slug).trim(), { lower: true, strict: true, trim: true }).slice(0, 180) || 'faq';
      nextSlug = await ensureUniqueCategorySlug(fastify, base, params.id);
    }
    const row = await fastify.prisma.faqCategory.update({
      where: { id: params.id },
      data: {
        ...(body.title !== undefined ? { title: body.title.trim() } : {}),
        ...(nextSlug !== undefined ? { slug: nextSlug } : {}),
        ...(body.iconKey !== undefined ? { iconKey: body.iconKey } : {}),
        ...(body.sortOrder !== undefined ? { sortOrder: body.sortOrder } : {}),
      },
    });
    const count = await fastify.prisma.faqItem.count({ where: { categoryId: row.id } });
    return {
      data: {
        id: row.id,
        title: row.title,
        slug: row.slug,
        iconKey: row.iconKey,
        sortOrder: row.sortOrder,
        itemCount: count,
        createdAt: row.createdAt.toISOString(),
        updatedAt: row.updatedAt.toISOString(),
      },
    };
  });

  fastify.delete('/admin/faq-categories/:id', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    if (!isStaff(request.authUser)) {
      return reply.code(403).send({ message: 'Forbidden' });
    }
    if (clientReady(reply, fastify)) return;
    const params = z.object({ id: z.coerce.number().int().positive() }).parse(request.params);
    try {
      await fastify.prisma.faqCategory.delete({ where: { id: params.id } });
    } catch {
      return reply.code(404).send({ message: 'Category not found' });
    }
    return reply.code(204).send();
  });

  fastify.get('/admin/faq-items', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    if (!isStaff(request.authUser)) {
      return reply.code(403).send({ message: 'Forbidden' });
    }
    if (clientReady(reply, fastify)) return;
    const q = z.object({ categoryId: z.coerce.number().int().positive() }).parse(request.query ?? {});
    const cat = await fastify.prisma.faqCategory.findUnique({ where: { id: q.categoryId } });
    if (!cat) {
      return reply.code(404).send({ message: 'Category not found' });
    }
    const rows = await fastify.prisma.faqItem.findMany({
      where: { categoryId: q.categoryId },
      orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
    });
    return {
      data: rows.map((r) => ({
        id: r.id,
        categoryId: r.categoryId,
        question: r.question,
        answer: r.answer,
        sortOrder: r.sortOrder,
        isActive: r.isActive,
        createdAt: r.createdAt.toISOString(),
        updatedAt: r.updatedAt.toISOString(),
      })),
    };
  });

  fastify.post('/admin/faq-items', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    if (!isStaff(request.authUser)) {
      return reply.code(403).send({ message: 'Forbidden' });
    }
    if (clientReady(reply, fastify)) return;
    const body = createItemSchema.parse(request.body);
    const cat = await fastify.prisma.faqCategory.findUnique({ where: { id: body.categoryId } });
    if (!cat) {
      return reply.code(400).send({ message: 'Unknown category.' });
    }
    const row = await fastify.prisma.faqItem.create({
      data: {
        categoryId: body.categoryId,
        question: body.question.trim(),
        answer: body.answer,
        sortOrder: body.sortOrder ?? 0,
        isActive: body.isActive !== false,
      },
    });
    return reply.code(201).send({
      data: {
        id: row.id,
        categoryId: row.categoryId,
        question: row.question,
        answer: row.answer,
        sortOrder: row.sortOrder,
        isActive: row.isActive,
        createdAt: row.createdAt.toISOString(),
        updatedAt: row.updatedAt.toISOString(),
      },
    });
  });

  fastify.put('/admin/faq-items/:id', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    if (!isStaff(request.authUser)) {
      return reply.code(403).send({ message: 'Forbidden' });
    }
    if (clientReady(reply, fastify)) return;
    const params = z.object({ id: z.coerce.number().int().positive() }).parse(request.params);
    const body = updateItemSchema.parse(request.body);
    const existing = await fastify.prisma.faqItem.findUnique({ where: { id: params.id } });
    if (!existing) {
      return reply.code(404).send({ message: 'FAQ not found' });
    }
    const row = await fastify.prisma.faqItem.update({
      where: { id: params.id },
      data: {
        ...(body.question !== undefined ? { question: body.question.trim() } : {}),
        ...(body.answer !== undefined ? { answer: body.answer } : {}),
        ...(body.sortOrder !== undefined ? { sortOrder: body.sortOrder } : {}),
        ...(body.isActive !== undefined ? { isActive: body.isActive } : {}),
      },
    });
    return {
      data: {
        id: row.id,
        categoryId: row.categoryId,
        question: row.question,
        answer: row.answer,
        sortOrder: row.sortOrder,
        isActive: row.isActive,
        createdAt: row.createdAt.toISOString(),
        updatedAt: row.updatedAt.toISOString(),
      },
    };
  });

  fastify.delete('/admin/faq-items/:id', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    if (!isStaff(request.authUser)) {
      return reply.code(403).send({ message: 'Forbidden' });
    }
    if (clientReady(reply, fastify)) return;
    const params = z.object({ id: z.coerce.number().int().positive() }).parse(request.params);
    const existing = await fastify.prisma.faqItem.findUnique({ where: { id: params.id } });
    if (!existing) {
      return reply.code(404).send({ message: 'FAQ not found' });
    }
    await fastify.prisma.faqItem.delete({ where: { id: params.id } });
    return reply.code(204).send();
  });
}

export = faqRoutes;
