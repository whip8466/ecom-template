import type { SocialFeedPlatform, SocialFeedPost, SocialFeedSettings } from '@prisma/client';
import type { FastifyInstance, FastifyReply } from 'fastify';
import { z } from 'zod';
import { isStaffFromAuth } from '../../utils/staff';

function isStaff(authUser: { role: string } | undefined): boolean {
  if (!authUser) return false;
  return isStaffFromAuth(authUser);
}

function clientReady(reply: FastifyReply, fastify: FastifyInstance) {
  if (!fastify.prisma.socialFeedSettings || !fastify.prisma.socialFeedPost) {
    return reply.code(503).send({
      message:
        'Database client is out of date. In the backend folder run: npx prisma generate — then restart the API server.',
    });
  }
  return null;
}

const CONTENT_TYPES = ['VIDEO', 'REEL', 'POST', 'TIPS', 'CUSTOMER_STORY'] as const;
const PLATFORMS = ['YOUTUBE', 'INSTAGRAM', 'FACEBOOK'] as const;

function defaultCta(platform: SocialFeedPlatform): string {
  switch (platform) {
    case 'YOUTUBE':
      return 'Watch on YouTube';
    case 'INSTAGRAM':
      return 'View on Instagram';
    case 'FACEBOOK':
      return 'View on Facebook';
    default:
      return 'Read more';
  }
}

function mapSettings(row: SocialFeedSettings) {
  return {
    heroTitle: row.heroTitle,
    heroSubtitle: row.heroSubtitle,
    ctaSectionTitle: row.ctaSectionTitle,
    ctaShopUrl: row.ctaShopUrl,
    ctaFollowUrl: row.ctaFollowUrl,
    ctaCommunityUrl: row.ctaCommunityUrl,
    updatedAt: row.updatedAt.toISOString(),
  };
}

async function fetchSettings(fastify: FastifyInstance) {
  return fastify.prisma.socialFeedSettings.findUnique({ where: { id: 1 } });
}

function mapPost(p: SocialFeedPost) {
  const cta = p.ctaLabel?.trim() || defaultCta(p.platform);
  return {
    id: p.id,
    contentType: p.contentType,
    platform: p.platform,
    title: p.title,
    description: p.description,
    thumbnailUrl: p.thumbnailUrl,
    externalUrl: p.externalUrl,
    ctaLabel: cta,
    sortOrder: p.sortOrder,
    isFeatured: p.isFeatured,
    isPublished: p.isPublished,
    publishedAt: p.publishedAt?.toISOString() ?? null,
    updatedAt: p.updatedAt.toISOString(),
  };
}

/** Admin responses include DB override so the form can stay empty when using platform default. */
function mapPostAdmin(p: SocialFeedPost) {
  return {
    ...mapPost(p),
    ctaLabelOverride: p.ctaLabel,
  };
}

const settingsPutSchema = z.object({
  heroTitle: z.string().min(1).max(200),
  heroSubtitle: z.string().min(1).max(8000),
  ctaSectionTitle: z.string().max(200).optional().nullable(),
  ctaShopUrl: z.string().max(500).optional().nullable(),
  ctaFollowUrl: z.string().max(500).optional().nullable(),
  ctaCommunityUrl: z.string().max(500).optional().nullable(),
});

const postBodySchema = z.object({
  contentType: z.enum(CONTENT_TYPES),
  platform: z.enum(PLATFORMS),
  title: z.string().min(1).max(300),
  description: z.string().min(1).max(8000),
  thumbnailUrl: z.string().max(2000).optional().nullable(),
  externalUrl: z.string().min(1).max(2000),
  ctaLabel: z.string().max(120).optional().nullable(),
  sortOrder: z.number().int().min(0).max(9999).optional().default(0),
  isFeatured: z.boolean().optional().default(false),
  isPublished: z.boolean().optional().default(true),
  publishedAt: z.string().datetime().optional().nullable(),
});

const postPatchSchema = postBodySchema.partial();

async function socialFeedRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.get('/social-feed', async (_request, reply) => {
    if (clientReady(reply, fastify)) return;
    const settingsRow = await fetchSettings(fastify);
    if (!settingsRow) {
      return reply.code(404).send({ message: 'Social feed not configured' });
    }

    const [posts, featuredRows] = await Promise.all([
      fastify.prisma.socialFeedPost.findMany({
        where: { isPublished: true },
        orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
      }),
      fastify.prisma.socialFeedPost.findMany({
        where: { isPublished: true, isFeatured: true },
        orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
        take: 1,
      }),
    ]);

    const featured = featuredRows[0] ? mapPost(featuredRows[0]) : null;
    const featuredId = featured?.id;
    const gridPosts = featuredId == null ? posts : posts.filter((p) => p.id !== featuredId);

    return {
      data: {
        settings: mapSettings(settingsRow),
        posts: gridPosts.map(mapPost),
        featured,
      },
    };
  });

  fastify.get('/admin/social-feed-settings', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    if (!isStaff(request.authUser)) return reply.code(403).send({ message: 'Forbidden' });
    if (clientReady(reply, fastify)) return;
    const row = await fetchSettings(fastify);
    if (!row) return reply.code(404).send({ message: 'Not found' });
    return { data: mapSettings(row) };
  });

  fastify.put('/admin/social-feed-settings', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    if (!isStaff(request.authUser)) return reply.code(403).send({ message: 'Forbidden' });
    if (clientReady(reply, fastify)) return;
    let body: z.infer<typeof settingsPutSchema>;
    try {
      body = settingsPutSchema.parse(request.body);
    } catch {
      return reply.code(400).send({ message: 'Invalid settings payload' });
    }
    const row = await fastify.prisma.socialFeedSettings.upsert({
      where: { id: 1 },
      create: {
        id: 1,
        heroTitle: body.heroTitle,
        heroSubtitle: body.heroSubtitle,
        ctaSectionTitle: body.ctaSectionTitle ?? null,
        ctaShopUrl: body.ctaShopUrl ?? null,
        ctaFollowUrl: body.ctaFollowUrl ?? null,
        ctaCommunityUrl: body.ctaCommunityUrl ?? null,
      },
      update: {
        heroTitle: body.heroTitle,
        heroSubtitle: body.heroSubtitle,
        ctaSectionTitle: body.ctaSectionTitle ?? null,
        ctaShopUrl: body.ctaShopUrl ?? null,
        ctaFollowUrl: body.ctaFollowUrl ?? null,
        ctaCommunityUrl: body.ctaCommunityUrl ?? null,
      },
    });
    return { data: mapSettings(row) };
  });

  fastify.get('/admin/social-feed-posts', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    if (!isStaff(request.authUser)) return reply.code(403).send({ message: 'Forbidden' });
    if (clientReady(reply, fastify)) return;
    const rows = await fastify.prisma.socialFeedPost.findMany({
      orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
    });
    return { data: rows.map(mapPostAdmin) };
  });

  fastify.post('/admin/social-feed-posts', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    if (!isStaff(request.authUser)) return reply.code(403).send({ message: 'Forbidden' });
    if (clientReady(reply, fastify)) return;
    let body: z.infer<typeof postBodySchema>;
    try {
      body = postBodySchema.parse(request.body);
    } catch {
      return reply.code(400).send({ message: 'Invalid post payload' });
    }
    const publishedAt = body.publishedAt ? new Date(body.publishedAt) : body.isPublished ? new Date() : null;

    const created = await fastify.prisma.$transaction(async (tx) => {
      const row = await tx.socialFeedPost.create({
        data: {
          contentType: body.contentType,
          platform: body.platform,
          title: body.title.trim(),
          description: body.description.trim(),
          thumbnailUrl: body.thumbnailUrl?.trim() || null,
          externalUrl: body.externalUrl.trim(),
          ctaLabel: body.ctaLabel?.trim() || null,
          sortOrder: body.sortOrder ?? 0,
          isFeatured: body.isFeatured ?? false,
          isPublished: body.isPublished ?? true,
          publishedAt,
        },
      });
      if (row.isFeatured) {
        await tx.socialFeedPost.updateMany({
          where: { id: { not: row.id }, isFeatured: true },
          data: { isFeatured: false },
        });
      }
      return row;
    });

    return { data: mapPostAdmin(created) };
  });

  fastify.patch(
    '/admin/social-feed-posts/:id',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      if (!isStaff(request.authUser)) return reply.code(403).send({ message: 'Forbidden' });
      if (clientReady(reply, fastify)) return;
      const id = Number((request.params as { id: string }).id);
      if (!Number.isInteger(id) || id < 1) return reply.code(400).send({ message: 'Invalid id' });

      let body: z.infer<typeof postPatchSchema>;
      try {
        body = postPatchSchema.parse(request.body);
      } catch {
        return reply.code(400).send({ message: 'Invalid post payload' });
      }

      const existing = await fastify.prisma.socialFeedPost.findUnique({ where: { id } });
      if (!existing) return reply.code(404).send({ message: 'Not found' });

      const publishedAt =
        body.publishedAt !== undefined
          ? body.publishedAt
            ? new Date(body.publishedAt)
            : null
          : undefined;

      const updated = await fastify.prisma.$transaction(async (tx) => {
        const row = await tx.socialFeedPost.update({
          where: { id },
          data: {
            ...(body.contentType !== undefined ? { contentType: body.contentType } : {}),
            ...(body.platform !== undefined ? { platform: body.platform } : {}),
            ...(body.title !== undefined ? { title: body.title.trim() } : {}),
            ...(body.description !== undefined ? { description: body.description.trim() } : {}),
            ...(body.thumbnailUrl !== undefined ? { thumbnailUrl: body.thumbnailUrl?.trim() || null } : {}),
            ...(body.externalUrl !== undefined ? { externalUrl: body.externalUrl.trim() } : {}),
            ...(body.ctaLabel !== undefined ? { ctaLabel: body.ctaLabel?.trim() || null } : {}),
            ...(body.sortOrder !== undefined ? { sortOrder: body.sortOrder } : {}),
            ...(body.isFeatured !== undefined ? { isFeatured: body.isFeatured } : {}),
            ...(body.isPublished !== undefined ? { isPublished: body.isPublished } : {}),
            ...(publishedAt !== undefined ? { publishedAt } : {}),
          },
        });
        if (row.isFeatured) {
          await tx.socialFeedPost.updateMany({
            where: { id: { not: id }, isFeatured: true },
            data: { isFeatured: false },
          });
        }
        return row;
      });

      return { data: mapPostAdmin(updated) };
    },
  );

  fastify.delete(
    '/admin/social-feed-posts/:id',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      if (!isStaff(request.authUser)) return reply.code(403).send({ message: 'Forbidden' });
      if (clientReady(reply, fastify)) return;
      const id = Number((request.params as { id: string }).id);
      if (!Number.isInteger(id) || id < 1) return reply.code(400).send({ message: 'Invalid id' });
      try {
        await fastify.prisma.socialFeedPost.delete({ where: { id } });
      } catch {
        return reply.code(404).send({ message: 'Not found' });
      }
      return { ok: true };
    },
  );
}

export = socialFeedRoutes;
