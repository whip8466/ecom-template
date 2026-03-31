import type { ContactSettings } from '@prisma/client';
import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { UserRole } from '../../constants/enums';

function isStaff(authUser: { role: string } | undefined): boolean {
  if (!authUser) return false;
  return authUser.role === UserRole.ADMIN || authUser.role === UserRole.MANAGER;
}

function mapSettings(row: ContactSettings | null) {
  if (!row) return null;
  return {
    headline: row.headline,
    brandName: row.brandName,
    footerTagline: row.footerTagline,
    primaryEmail: row.primaryEmail,
    supportEmail: row.supportEmail,
    phone: row.phone,
    addressLine: row.addressLine,
    mapEmbedUrl: row.mapEmbedUrl,
    facebookUrl: row.facebookUrl,
    instagramUrl: row.instagramUrl,
    pinterestUrl: row.pinterestUrl,
    twitterUrl: row.twitterUrl,
    youtubeUrl: row.youtubeUrl,
    updatedAt: row.updatedAt.toISOString(),
  };
}

const settingsPutSchema = z.object({
  headline: z.string().min(1).max(200),
  brandName: z.string().min(1).max(120),
  footerTagline: z.string().min(1).max(5000),
  primaryEmail: z.string().email().max(320),
  supportEmail: z.string().email().max(320),
  phone: z.string().min(1).max(80),
  addressLine: z.string().min(1).max(500),
  mapEmbedUrl: z.string().max(5000).optional().nullable(),
  facebookUrl: z.string().max(500).optional().nullable(),
  instagramUrl: z.string().max(500).optional().nullable(),
  pinterestUrl: z.string().max(500).optional().nullable(),
  twitterUrl: z.string().max(500).optional().nullable(),
  youtubeUrl: z.string().max(500).optional().nullable(),
});

const contactPostSchema = z.object({
  name: z.string().min(1).max(200),
  email: z.string().email().max(320),
  subject: z.string().min(1).max(500),
  body: z.string().min(1).max(10000),
  saveInfo: z.boolean().optional().default(false),
});

async function contactRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.get('/contact-settings', async (_request, reply) => {
    const prisma = fastify.prisma;
    if (!prisma.contactSettings) {
      return reply.code(503).send({ message: 'Database client is out of date. Run prisma generate and restart the API.' });
    }
    const row = await prisma.contactSettings.findUnique({ where: { id: 1 } });
    if (!row) {
      return reply.code(404).send({ message: 'Contact settings not found' });
    }
    return { data: mapSettings(row) };
  });

  fastify.put(
    '/admin/contact-settings',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      if (!isStaff(request.authUser)) {
        return reply.code(403).send({ message: 'Forbidden' });
      }
      const prisma = fastify.prisma;
      if (!prisma.contactSettings) {
        return reply.code(503).send({ message: 'Database client is out of date.' });
      }
      let body: z.infer<typeof settingsPutSchema>;
      try {
        body = settingsPutSchema.parse(request.body);
      } catch {
        return reply.code(400).send({ message: 'Invalid contact settings payload.' });
      }
      const row = await prisma.contactSettings.upsert({
        where: { id: 1 },
        create: {
          id: 1,
          headline: body.headline,
          brandName: body.brandName.trim(),
          footerTagline: body.footerTagline,
          primaryEmail: body.primaryEmail,
          supportEmail: body.supportEmail,
          phone: body.phone,
          addressLine: body.addressLine,
          mapEmbedUrl: body.mapEmbedUrl ?? null,
          facebookUrl: body.facebookUrl ?? null,
          instagramUrl: body.instagramUrl ?? null,
          pinterestUrl: body.pinterestUrl ?? null,
          twitterUrl: body.twitterUrl ?? null,
          youtubeUrl: body.youtubeUrl ?? null,
        },
        update: {
          headline: body.headline,
          brandName: body.brandName.trim(),
          footerTagline: body.footerTagline,
          primaryEmail: body.primaryEmail,
          supportEmail: body.supportEmail,
          phone: body.phone,
          addressLine: body.addressLine,
          mapEmbedUrl: body.mapEmbedUrl ?? null,
          facebookUrl: body.facebookUrl ?? null,
          instagramUrl: body.instagramUrl ?? null,
          pinterestUrl: body.pinterestUrl ?? null,
          twitterUrl: body.twitterUrl ?? null,
          youtubeUrl: body.youtubeUrl ?? null,
        },
      });
      return { data: mapSettings(row) };
    },
  );

  fastify.post('/contact-messages', async (request, reply) => {
    const prisma = fastify.prisma;
    if (!prisma.contactMessage) {
      return reply.code(503).send({ message: 'Database client is out of date.' });
    }
    let body: z.infer<typeof contactPostSchema>;
    try {
      body = contactPostSchema.parse(request.body);
    } catch {
      return reply.code(400).send({ message: 'Please check your name, email, subject, and message.' });
    }
    await prisma.contactMessage.create({
      data: {
        name: body.name.trim(),
        email: body.email.trim().toLowerCase(),
        subject: body.subject.trim(),
        body: body.body.trim(),
        saveInfo: body.saveInfo === true,
      },
    });
    return { ok: true, message: 'Thanks — we received your message.' };
  });

  fastify.get(
    '/admin/contact-messages',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      if (!isStaff(request.authUser)) {
        return reply.code(403).send({ message: 'Forbidden' });
      }
      const prisma = fastify.prisma;
      if (!prisma.contactMessage) {
        return reply.code(503).send({ message: 'Database client is out of date.' });
      }
      const query = z
        .object({
          page: z.coerce.number().int().positive().default(1),
          limit: z.coerce.number().int().positive().max(100).default(50),
        })
        .parse(request.query || {});
      const skip = (query.page - 1) * query.limit;
      const [rows, total] = await Promise.all([
        prisma.contactMessage.findMany({
          orderBy: { createdAt: 'desc' },
          skip,
          take: query.limit,
        }),
        prisma.contactMessage.count(),
      ]);
      return {
        data: rows.map((r) => ({
          id: r.id,
          name: r.name,
          email: r.email,
          subject: r.subject,
          body: r.body,
          saveInfo: r.saveInfo,
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

export = contactRoutes;
