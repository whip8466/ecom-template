const { z } = require('zod');
const { UserRole } = require('../../constants/enums');

function isStaff(authUser) {
  return authUser.role === UserRole.ADMIN || authUser.role === UserRole.MANAGER;
}

function bannerRepo(fastify) {
  return fastify.prisma.homeBannerSlide;
}

function clientReady(reply, fastify) {
  if (!bannerRepo(fastify)) {
    return reply.code(503).send({
      message:
        'Database client is out of date. In the backend folder run: npx prisma generate — then restart the API server.',
    });
  }
  return null;
}

function mapSlide(row) {
  return {
    id: row.id,
    sortOrder: row.sortOrder,
    priceLine: row.priceLine,
    title: row.title,
    offerPrefix: row.offerPrefix,
    offerHighlight: row.offerHighlight,
    offerSuffix: row.offerSuffix,
    imageUrl: row.imageUrl,
    imageAlt: row.imageAlt,
    ctaHref: row.ctaHref,
    isActive: row.isActive,
  };
}

const slideInputSchema = z.object({
  sortOrder: z.number().int().min(0).max(999).default(0),
  priceLine: z.string().min(1).max(500),
  title: z.string().min(1).max(500),
  offerPrefix: z.string().max(500).optional().default(''),
  offerHighlight: z.string().min(1).max(200),
  offerSuffix: z.string().max(500).optional().default(''),
  imageUrl: z.string().min(1).max(2000),
  imageAlt: z.string().max(500).optional().default(''),
  ctaHref: z.string().min(1).max(500).default('/shop'),
  isActive: z.boolean().optional().default(true),
});

async function homeBannerRoutes(fastify) {
  fastify.get('/home-banner', async (request, reply) => {
    if (clientReady(reply, fastify)) return;
    const rows = await bannerRepo(fastify).findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });
    return { data: rows.map(mapSlide) };
  });

  fastify.get('/admin/home-banner', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    if (!isStaff(request.authUser)) {
      return reply.code(403).send({ message: 'Forbidden' });
    }
    if (clientReady(reply, fastify)) return;
    const rows = await bannerRepo(fastify).findMany({
      orderBy: { sortOrder: 'asc' },
    });
    return { data: rows.map(mapSlide) };
  });

  fastify.put('/admin/home-banner', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    if (!isStaff(request.authUser)) {
      return reply.code(403).send({ message: 'Forbidden' });
    }

    if (clientReady(reply, fastify)) return;

    const body = z
      .object({
        slides: z.array(slideInputSchema).max(20),
      })
      .parse(request.body);

    const prisma = fastify.prisma;
    await prisma.$transaction(async (tx) => {
      await tx.homeBannerSlide.deleteMany({});
      if (body.slides.length > 0) {
        await tx.homeBannerSlide.createMany({
          data: body.slides.map((s, i) => ({
            sortOrder: s.sortOrder ?? i,
            priceLine: s.priceLine,
            title: s.title,
            offerPrefix: s.offerPrefix ?? '',
            offerHighlight: s.offerHighlight,
            offerSuffix: s.offerSuffix ?? '',
            imageUrl: s.imageUrl,
            imageAlt: s.imageAlt ?? '',
            ctaHref: s.ctaHref ?? '/shop',
            isActive: s.isActive ?? true,
          })),
        });
      }
    });

    const rows = await prisma.homeBannerSlide.findMany({
      orderBy: { sortOrder: 'asc' },
    });
    return { data: rows.map(mapSlide) };
  });
}

module.exports = homeBannerRoutes;
