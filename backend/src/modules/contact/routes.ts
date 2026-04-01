import { randomUUID } from 'crypto';
import { mkdir, unlink, writeFile } from 'fs/promises';
import path from 'path';
import type { ContactSettings } from '@prisma/client';
import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { UserRole } from '../../constants/enums';

const BRAND_MIME_TO_EXT: Record<string, string> = {
  'image/png': '.png',
  'image/jpeg': '.jpg',
  'image/webp': '.webp',
  'image/gif': '.gif',
  'image/svg+xml': '.svg',
};

async function unlinkStoredBrandLogo(brandLogoUrl: string | null | undefined) {
  if (!brandLogoUrl || !brandLogoUrl.startsWith('/uploads/brand/')) return;
  const abs = path.join(process.cwd(), brandLogoUrl.replace(/^\//, ''));
  try {
    await unlink(abs);
  } catch {
    /* ignore missing file */
  }
}

function isStaff(authUser: { role: string } | undefined): boolean {
  if (!authUser) return false;
  return authUser.role === UserRole.ADMIN || authUser.role === UserRole.MANAGER;
}

function mapSettings(row: ContactSettings | null) {
  if (!row) return null;
  return {
    headline: row.headline,
    brandName: row.brandName,
    brandLogoUrl: row.brandLogoUrl ?? null,
    showBrandLogo: row.showBrandLogo,
    showBrandName: row.showBrandName,
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
    themeJson: row.themeJson ?? null,
    updatedAt: row.updatedAt.toISOString(),
  };
}

/** Hex or future CSS color; keep flexible so admins are not blocked while typing. */
const colorTokenSchema = z.string().min(1).max(32);

const cssTokenSchema = z.string().max(32);

const themeJsonSchema = z
  .object({
    buttonPrimaryBg: colorTokenSchema.optional(),
    buttonPrimaryHover: colorTokenSchema.optional(),
    buttonSecondaryBg: colorTokenSchema.optional(),
    buttonSecondaryBorder: colorTokenSchema.optional(),
    buttonSecondaryText: colorTokenSchema.optional(),
    buttonInfoBg: colorTokenSchema.optional(),
    buttonInfoHover: colorTokenSchema.optional(),
    buttonRadius: cssTokenSchema.optional(),
    inputRadius: cssTokenSchema.optional(),
    inputBorder: colorTokenSchema.optional(),
    inputBackground: colorTokenSchema.optional(),
    inputText: colorTokenSchema.optional(),
    inputPlaceholder: colorTokenSchema.optional(),
    inputFocusRing: colorTokenSchema.optional(),
    textareaMinHeight: cssTokenSchema.optional(),
    selectBackground: colorTokenSchema.optional(),
    labelText: colorTokenSchema.optional(),
    checkboxAccent: colorTokenSchema.optional(),
  })
  .strict();

const themeSettingsPatchSchema = z.object({
  themeJson: themeJsonSchema,
});

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
  brandLogoUrl: z.union([z.string().max(500), z.null()]).optional(),
  showBrandLogo: z.boolean().optional(),
  showBrandName: z.boolean().optional(),
});

const brandPatchSchema = z.object({
  brandName: z.string().min(1).max(120),
  footerTagline: z.string().min(1).max(5000),
  showBrandLogo: z.boolean(),
  showBrandName: z.boolean(),
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
          brandLogoUrl: body.brandLogoUrl ?? null,
          showBrandLogo: body.showBrandLogo ?? true,
          showBrandName: body.showBrandName ?? true,
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
          ...(body.brandLogoUrl !== undefined ? { brandLogoUrl: body.brandLogoUrl } : {}),
          ...(body.showBrandLogo !== undefined ? { showBrandLogo: body.showBrandLogo } : {}),
          ...(body.showBrandName !== undefined ? { showBrandName: body.showBrandName } : {}),
        },
      });
      return { data: mapSettings(row) };
    },
  );

  fastify.patch(
    '/admin/brand-settings',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      if (!isStaff(request.authUser)) {
        return reply.code(403).send({ message: 'Forbidden' });
      }
      const prisma = fastify.prisma;
      if (!prisma.contactSettings) {
        return reply.code(503).send({ message: 'Database client is out of date.' });
      }
      let body: z.infer<typeof brandPatchSchema>;
      try {
        body = brandPatchSchema.parse(request.body);
      } catch {
        return reply.code(400).send({ message: 'Invalid brand settings payload.' });
      }
      const existing = await prisma.contactSettings.findUnique({ where: { id: 1 } });
      if (!existing) {
        return reply.code(404).send({ message: 'Contact settings not found' });
      }
      const row = await prisma.contactSettings.update({
        where: { id: 1 },
        data: {
          brandName: body.brandName.trim(),
          footerTagline: body.footerTagline,
          showBrandLogo: body.showBrandLogo,
          showBrandName: body.showBrandName,
        },
      });
      return { data: mapSettings(row) };
    },
  );

  fastify.patch(
    '/admin/theme-settings',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      if (!isStaff(request.authUser)) {
        return reply.code(403).send({ message: 'Forbidden' });
      }
      const prisma = fastify.prisma;
      if (!prisma.contactSettings) {
        return reply.code(503).send({ message: 'Database client is out of date.' });
      }
      let body: z.infer<typeof themeSettingsPatchSchema>;
      try {
        body = themeSettingsPatchSchema.parse(request.body);
      } catch {
        return reply.code(400).send({ message: 'Invalid theme settings payload.' });
      }
      const existing = await prisma.contactSettings.findUnique({ where: { id: 1 } });
      if (!existing) {
        return reply.code(404).send({ message: 'Contact settings not found' });
      }
      const row = await prisma.contactSettings.update({
        where: { id: 1 },
        data: { themeJson: body.themeJson },
      });
      return { data: mapSettings(row) };
    },
  );

  fastify.post(
    '/admin/brand-logo',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      if (!isStaff(request.authUser)) {
        return reply.code(403).send({ message: 'Forbidden' });
      }
      const prisma = fastify.prisma;
      if (!prisma.contactSettings) {
        return reply.code(503).send({ message: 'Database client is out of date.' });
      }
      const existing = await prisma.contactSettings.findUnique({ where: { id: 1 } });
      if (!existing) {
        return reply.code(404).send({ message: 'Contact settings not found' });
      }
      const req = request as unknown as {
        file: () => Promise<{ mimetype: string; toBuffer: () => Promise<Buffer> } | undefined>;
      };
      const data = await req.file();
      if (!data) {
        return reply.code(400).send({ message: 'No file uploaded' });
      }
      const mime = data.mimetype;
      const ext = BRAND_MIME_TO_EXT[mime];
      if (!ext) {
        return reply
          .code(400)
          .send({ message: 'Unsupported image type. Use PNG, JPEG, WebP, GIF, or SVG.' });
      }
      const buffer = await data.toBuffer();
      const filename = `${randomUUID()}${ext}`;
      const brandDir = path.join(process.cwd(), 'uploads', 'brand');
      await mkdir(brandDir, { recursive: true });
      const absPath = path.join(brandDir, filename);
      await writeFile(absPath, buffer);
      const publicPath = `/uploads/brand/${filename}`;

      await unlinkStoredBrandLogo(existing.brandLogoUrl);

      const row = await prisma.contactSettings.update({
        where: { id: 1 },
        data: { brandLogoUrl: publicPath },
      });
      return { data: mapSettings(row) };
    },
  );

  fastify.delete(
    '/admin/brand-logo',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      if (!isStaff(request.authUser)) {
        return reply.code(403).send({ message: 'Forbidden' });
      }
      const prisma = fastify.prisma;
      if (!prisma.contactSettings) {
        return reply.code(503).send({ message: 'Database client is out of date.' });
      }
      const existing = await prisma.contactSettings.findUnique({ where: { id: 1 } });
      if (!existing) {
        return reply.code(404).send({ message: 'Contact settings not found' });
      }
      await unlinkStoredBrandLogo(existing.brandLogoUrl);
      const row = await prisma.contactSettings.update({
        where: { id: 1 },
        data: { brandLogoUrl: null },
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
