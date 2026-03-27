const { z } = require('zod');
const { UserRole } = require('../../constants/enums');

function isStaff(authUser) {
  if (!authUser) return false;
  return authUser.role === UserRole.ADMIN || authUser.role === UserRole.MANAGER;
}

const SOURCE_MAX = 2048;

function normalizeSource(raw) {
  if (raw == null || typeof raw !== 'string') return 'footer';
  const t = raw.trim().slice(0, SOURCE_MAX);
  return t || 'footer';
}

const subscribeBodySchema = z.object({
  email: z.string().email().max(320),
  source: z.string().max(SOURCE_MAX).optional(),
});

async function newsletterRoutes(fastify) {
  fastify.post('/newsletter', async (request, reply) => {
    let body;
    try {
      body = subscribeBodySchema.parse(request.body);
    } catch {
      return reply.code(400).send({ message: 'Please enter a valid email address.' });
    }

    const email = body.email.trim().toLowerCase();
    if (!email) {
      return reply.code(400).send({ message: 'Email is required.' });
    }

    const prisma = fastify.prisma;
    if (!prisma.newsletterSubscription) {
      return reply.code(503).send({
        message:
          'Prisma client does not include newsletter models. From the backend folder run: npm run db:migrate:deploy (or npm run db:generate). Then stop the API (Ctrl+C) and start again — hot reload does not reload @prisma/client.',
      });
    }

    const source = normalizeSource(body.source);

    try {
      await prisma.newsletterSubscription.create({
        data: { email, source },
      });
      return { ok: true, message: 'You are subscribed.' };
    } catch (err) {
      if (err && err.code === 'P2002') {
        return { ok: true, message: 'You are already subscribed.' };
      }
      request.log.error(err);
      return reply.code(500).send({ message: 'Could not save subscription.' });
    }
  });

  fastify.get(
    '/admin/newsletter-subscriptions',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      if (!isStaff(request.authUser)) {
        return reply.code(403).send({ message: 'Forbidden' });
      }

      const prisma = fastify.prisma;
      if (!prisma.newsletterSubscription) {
        return reply.code(503).send({
          message:
            'Prisma client does not include newsletter models. From the backend folder run: npm run db:migrate:deploy (or npm run db:generate). Then stop the API (Ctrl+C) and start again — hot reload does not reload @prisma/client.',
        });
      }

      const query = z
        .object({
          page: z.coerce.number().int().positive().default(1),
          limit: z.coerce.number().int().positive().max(100).default(50),
        })
        .parse(request.query || {});

      const skip = (query.page - 1) * query.limit;

      const [rows, total] = await Promise.all([
        prisma.newsletterSubscription.findMany({
          orderBy: { createdAt: 'desc' },
          skip,
          take: query.limit,
        }),
        prisma.newsletterSubscription.count(),
      ]);

      return {
        data: rows.map((r) => ({
          id: r.id,
          email: r.email,
          source: r.source,
          createdAt: r.createdAt.toISOString(),
        })),
        pagination: {
          page: query.page,
          limit: query.limit,
          total,
          totalPages: Math.ceil(total / query.limit) || 1,
        },
      };
    },
  );
}

module.exports = newsletterRoutes;
