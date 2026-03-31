import type { SitePage } from '@prisma/client';
import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { UserRole } from '../../constants/enums';

const ALLOWED_SLUGS = ['privacy-policy', 'terms-of-service'] as const;

function isStaff(authUser: { role: string } | undefined): boolean {
  if (!authUser) return false;
  return authUser.role === UserRole.ADMIN || authUser.role === UserRole.MANAGER;
}

function mapPage(row: SitePage | null) {
  if (!row) return null;
  return {
    slug: row.slug,
    title: row.title,
    body: row.body,
    updatedAt: row.updatedAt.toISOString(),
  };
}

const putSchema = z.object({
  title: z.string().min(1).max(500),
  body: z.string().max(200000).default(''),
});

async function sitePagesRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.get('/site-pages/:slug', async (request, reply) => {
    const prisma = fastify.prisma;
    if (!prisma.sitePage) {
      return reply.code(503).send({ message: 'Database client is out of date. Run prisma generate and restart the API.' });
    }
    const slug = String((request.params as { slug?: string }).slug || '');
    if (!(ALLOWED_SLUGS as readonly string[]).includes(slug)) {
      return reply.code(404).send({ message: 'Not found' });
    }
    const row = await prisma.sitePage.findUnique({ where: { slug } });
    if (!row) {
      return reply.code(404).send({ message: 'Not found' });
    }
    return { data: mapPage(row) };
  });

  fastify.get('/admin/site-pages', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    if (!isStaff(request.authUser)) {
      return reply.code(403).send({ message: 'Forbidden' });
    }
    const prisma = fastify.prisma;
    if (!prisma.sitePage) {
      return reply.code(503).send({ message: 'Database client is out of date.' });
    }
    const rows = await prisma.sitePage.findMany({
      where: { slug: { in: [...ALLOWED_SLUGS] } },
      orderBy: { slug: 'asc' },
    });
    return { data: rows.map((r) => mapPage(r)) };
  });

  fastify.get('/admin/site-pages/:slug', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    if (!isStaff(request.authUser)) {
      return reply.code(403).send({ message: 'Forbidden' });
    }
    const prisma = fastify.prisma;
    if (!prisma.sitePage) {
      return reply.code(503).send({ message: 'Database client is out of date.' });
    }
    const slug = String((request.params as { slug?: string }).slug || '');
    if (!(ALLOWED_SLUGS as readonly string[]).includes(slug)) {
      return reply.code(404).send({ message: 'Not found' });
    }
    const row = await prisma.sitePage.findUnique({ where: { slug } });
    if (!row) {
      return reply.code(404).send({ message: 'Not found' });
    }
    return { data: mapPage(row) };
  });

  fastify.put('/admin/site-pages/:slug', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    if (!isStaff(request.authUser)) {
      return reply.code(403).send({ message: 'Forbidden' });
    }
    const prisma = fastify.prisma;
    if (!prisma.sitePage) {
      return reply.code(503).send({ message: 'Database client is out of date.' });
    }
    const slug = String((request.params as { slug?: string }).slug || '');
    if (!(ALLOWED_SLUGS as readonly string[]).includes(slug)) {
      return reply.code(404).send({ message: 'Not found' });
    }
    let body: z.infer<typeof putSchema>;
    try {
      body = putSchema.parse(request.body);
    } catch {
      return reply.code(400).send({ message: 'Invalid title or body.' });
    }
    const row = await prisma.sitePage.update({
      where: { slug },
      data: {
        title: body.title.trim(),
        body: body.body,
      },
    });
    return { data: mapPage(row) };
  });
}

export = sitePagesRoutes;
