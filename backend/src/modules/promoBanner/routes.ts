const { z } = require('zod');
const { UserRole } = require('../../constants/enums');

function isStaff(authUser) {
  if (!authUser) return false;
  return authUser.role === UserRole.ADMIN || authUser.role === UserRole.MANAGER;
}

function repo(fastify) {
  return fastify.prisma.promoBanner;
}

function clientReady(reply, fastify) {
  if (!repo(fastify)) {
    return reply.code(503).send({
      message:
        'Database client is out of date. In the backend folder run: npx prisma generate — then restart the API server.',
    });
  }
  return null;
}

function mapRow(row) {
  return {
    id: row.id,
    sortOrder: row.sortOrder,
    eyebrowLabel: row.eyebrowLabel,
    title: row.title,
    subtitle: row.subtitle ?? null,
    imageUrl: row.imageUrl ?? null,
    imageAlt: row.imageAlt,
    ctaLabel: row.ctaLabel,
    ctaHref: row.ctaHref,
    styleVariant: row.styleVariant,
    isActive: row.isActive,
  };
}

const bannerInputSchema = z.object({
  sortOrder: z.number().int().min(0).max(999).default(0),
  eyebrowLabel: z.string().min(1).max(200),
  title: z.string().min(1).max(500),
  subtitle: z.union([z.string().max(500), z.null()]).optional(),
  imageUrl: z.union([z.string().max(2000), z.null()]).optional(),
  imageAlt: z.string().max(500).optional().default(''),
  ctaLabel: z.string().min(1).max(120).default('Shop Now'),
  ctaHref: z.string().min(1).max(500).default('/shop'),
  styleVariant: z.enum(['neutral', 'accent']).default('neutral'),
  isActive: z.boolean().optional().default(true),
});

async function promoBannerRoutes(fastify) {
  fastify.get('/promo-banners', async (request, reply) => {
    if (clientReady(reply, fastify)) return;
    const rows = await repo(fastify).findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });
    return { data: rows.map(mapRow) };
  });

  fastify.get('/admin/promo-banners', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    if (!isStaff(request.authUser)) {
      return reply.code(403).send({ message: 'Forbidden' });
    }
    if (clientReady(reply, fastify)) return;
    const rows = await repo(fastify).findMany({
      orderBy: { sortOrder: 'asc' },
    });
    return { data: rows.map(mapRow) };
  });

  fastify.put('/admin/promo-banners', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    if (!isStaff(request.authUser)) {
      return reply.code(403).send({ message: 'Forbidden' });
    }

    if (clientReady(reply, fastify)) return;

    const body = z
      .object({
        banners: z.array(bannerInputSchema).max(12),
      })
      .parse(request.body);

    const prisma = fastify.prisma;
    await prisma.$transaction(async (tx) => {
      await tx.promoBanner.deleteMany({});
      if (body.banners.length > 0) {
        await tx.promoBanner.createMany({
          data: body.banners.map((b, i) => ({
            sortOrder: b.sortOrder ?? i,
            eyebrowLabel: b.eyebrowLabel,
            title: b.title,
            subtitle: b.subtitle && String(b.subtitle).trim() ? b.subtitle : null,
            imageUrl: b.imageUrl && String(b.imageUrl).trim() ? b.imageUrl : null,
            imageAlt: b.imageAlt ?? '',
            ctaLabel: b.ctaLabel ?? 'Shop Now',
            ctaHref: b.ctaHref ?? '/shop',
            styleVariant: b.styleVariant ?? 'neutral',
            isActive: b.isActive ?? true,
          })),
        });
      }
    });

    const rows = await prisma.promoBanner.findMany({
      orderBy: { sortOrder: 'asc' },
    });
    return { data: rows.map(mapRow) };
  });
}

module.exports = promoBannerRoutes;
