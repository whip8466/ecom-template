import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { UserRole } from '../../constants/enums';
import { isSuperAdmin } from '../../utils/brand-scope';

const { hashPassword } = require('../../utils/password');

const createBrandSchema = z.object({
  name: z.string().min(1).max(200),
  slug: z
    .string()
    .min(1)
    .max(64)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  adminEmail: z.string().email().optional(),
  adminPassword: z.string().min(6).optional(),
  adminFirstName: z.string().min(2).max(120).optional(),
  adminLastName: z.string().min(2).max(120).optional(),
});

const patchBrandSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  slug: z
    .string()
    .min(1)
    .max(64)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .optional(),
  isBlocked: z.boolean().optional(),
});

const colorTokenSchema = z.string().min(1).max(32);
const cssTokenSchema = z.string().max(32);
const shadowTokenSchema = z.string().max(400);

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
    selectBorder: colorTokenSchema.optional(),
    selectText: colorTokenSchema.optional(),
    selectOptionBackground: colorTokenSchema.optional(),
    selectOptionText: colorTokenSchema.optional(),
    labelText: colorTokenSchema.optional(),
    checkboxAccent: colorTokenSchema.optional(),
    layoutPageBackground: colorTokenSchema.optional(),
    layoutCardBackground: colorTokenSchema.optional(),
    layoutSectionMutedBackground: colorTokenSchema.optional(),
    layoutBorder: colorTokenSchema.optional(),
    layoutRadius: cssTokenSchema.optional(),
    layoutRadiusLarge: cssTokenSchema.optional(),
    layoutShadowSm: shadowTokenSchema.optional(),
    layoutShadow: shadowTokenSchema.optional(),
    layoutShadowLg: shadowTokenSchema.optional(),
  })
  .strict();

const themePatchSchema = z.object({
  themeJson: themeJsonSchema,
});

const createAdminSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  firstName: z.string().min(2).max(120),
  lastName: z.string().min(2).max(120),
});

function defaultContactSettings(brandName: string) {
  return {
    headline: 'Keep In Touch with Us',
    brandName,
    footerTagline:
      'Curated fashion, beauty, and home decor for modern living. Quality you can trust, style that lasts.',
    primaryEmail: 'contact@example.com',
    supportEmail: 'support@example.com',
    phone: '+1 000 000 0000',
    addressLine: '84 Sleepy Hollow St, Jamaica, New York 1432',
    mapEmbedUrl: null as string | null,
    facebookUrl: null as string | null,
    instagramUrl: null as string | null,
    pinterestUrl: null as string | null,
    twitterUrl: null as string | null,
    youtubeUrl: null as string | null,
    brandLogoUrl: null as string | null,
    showBrandLogo: true,
    showBrandName: true,
    themeJson: undefined,
  };
}

async function superAdminBrandRoutes(fastify: FastifyInstance): Promise<void> {
  function assertSuperAdmin(
    request: { authUser?: { role: string; userId: number } },
    reply: { code: (n: number) => { send: (b: unknown) => unknown } },
  ): boolean {
    if (!isSuperAdmin(request.authUser)) {
      reply.code(403).send({ message: 'Forbidden' });
      return false;
    }
    return true;
  }

  fastify.get(
    '/brands',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      if (!assertSuperAdmin(request, reply)) return;
      const prisma = fastify.prisma;
      const brands = await prisma.brand.findMany({ orderBy: { id: 'asc' } });
      const out = await Promise.all(
        brands.map(async (b) => {
          const staffCount = await prisma.user.count({
            where: {
              brandId: b.id,
              role: { in: [UserRole.ADMIN, UserRole.MANAGER] },
            },
          });
          return {
            id: b.id,
            name: b.name,
            slug: b.slug,
            isBlocked: b.isBlocked,
            staffCount,
            createdAt: b.createdAt.toISOString(),
            updatedAt: b.updatedAt.toISOString(),
          };
        }),
      );
      return { data: out };
    },
  );

  fastify.post(
    '/brands',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      if (!assertSuperAdmin(request, reply)) return;
      let body: z.infer<typeof createBrandSchema>;
      try {
        body = createBrandSchema.parse(request.body);
      } catch {
        return reply.code(400).send({ message: 'Invalid brand payload' });
      }
      if (body.adminEmail && !body.adminPassword) {
        return reply.code(400).send({ message: 'adminPassword is required when adminEmail is set' });
      }
      if (body.adminEmail && (!body.adminFirstName || !body.adminLastName)) {
        return reply.code(400).send({ message: 'adminFirstName and adminLastName are required when creating an admin' });
      }

      const prisma = fastify.prisma;
      const slug = body.slug.trim().toLowerCase();
      const dup = await prisma.brand.findUnique({ where: { slug } });
      if (dup) {
        return reply.code(409).send({ message: 'Slug already in use' });
      }

      let result: { id: number; name: string; slug: string; isBlocked: boolean; createdAt: Date; updatedAt: Date };
      try {
        result = await prisma.$transaction(async (tx) => {
          const brand = await tx.brand.create({
            data: {
              name: body.name.trim(),
              slug,
              isBlocked: false,
            },
          });
          await tx.contactSettings.create({
            data: {
              ...defaultContactSettings(body.name.trim()),
              brand: { connect: { id: brand.id } },
            },
          });
          if (body.adminEmail && body.adminPassword && body.adminFirstName && body.adminLastName) {
            const email = body.adminEmail.toLowerCase();
            const existingUser = await tx.user.findUnique({ where: { email } });
            if (existingUser) {
              throw new Error('EMAIL_TAKEN');
            }
            await tx.user.create({
              data: {
                email,
                passwordHash: await hashPassword(body.adminPassword),
                firstName: body.adminFirstName.trim(),
                lastName: body.adminLastName.trim(),
                name: `${body.adminFirstName.trim()} ${body.adminLastName.trim()}`,
                role: UserRole.ADMIN,
                brandId: brand.id,
              },
            });
          }
          return brand;
        });
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : '';
        if (msg === 'EMAIL_TAKEN') {
          return reply.code(409).send({ message: 'Email already exists' });
        }
        throw e;
      }
      return reply.code(201).send({
        data: {
          id: result.id,
          name: result.name,
          slug: result.slug,
          isBlocked: result.isBlocked,
          createdAt: result.createdAt.toISOString(),
          updatedAt: result.updatedAt.toISOString(),
        },
      });
    },
  );

  fastify.patch(
    '/brands/:id',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      if (!assertSuperAdmin(request, reply)) return;
      const id = Number((request.params as { id: string }).id);
      if (!Number.isInteger(id) || id < 1) {
        return reply.code(400).send({ message: 'Invalid brand id' });
      }
      let body: z.infer<typeof patchBrandSchema>;
      try {
        body = patchBrandSchema.parse(request.body);
      } catch {
        return reply.code(400).send({ message: 'Invalid payload' });
      }
      const prisma = fastify.prisma;
      const existing = await prisma.brand.findUnique({ where: { id } });
      if (!existing) {
        return reply.code(404).send({ message: 'Brand not found' });
      }
      if (body.slug && body.slug.trim().toLowerCase() !== existing.slug) {
        const clash = await prisma.brand.findUnique({ where: { slug: body.slug.trim().toLowerCase() } });
        if (clash) {
          return reply.code(409).send({ message: 'Slug already in use' });
        }
      }
      const updated = await prisma.brand.update({
        where: { id },
        data: {
          ...(body.name != null ? { name: body.name.trim() } : {}),
          ...(body.slug != null ? { slug: body.slug.trim().toLowerCase() } : {}),
          ...(body.isBlocked != null ? { isBlocked: body.isBlocked } : {}),
        },
      });
      return {
        data: {
          id: updated.id,
          name: updated.name,
          slug: updated.slug,
          isBlocked: updated.isBlocked,
          createdAt: updated.createdAt.toISOString(),
          updatedAt: updated.updatedAt.toISOString(),
        },
      };
    },
  );

  fastify.patch(
    '/brands/:id/theme-settings',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      if (!assertSuperAdmin(request, reply)) return;
      const id = Number((request.params as { id: string }).id);
      if (!Number.isInteger(id) || id < 1) {
        return reply.code(400).send({ message: 'Invalid brand id' });
      }
      let body: z.infer<typeof themePatchSchema>;
      try {
        body = themePatchSchema.parse(request.body);
      } catch {
        return reply.code(400).send({ message: 'Invalid theme settings payload' });
      }
      const prisma = fastify.prisma;
      const row = await prisma.contactSettings.update({
        where: { brandId: id },
        data: { themeJson: body.themeJson },
      });
      return {
        data: {
          brandId: id,
          themeJson: row.themeJson ?? null,
          updatedAt: row.updatedAt.toISOString(),
        },
      };
    },
  );

  fastify.post(
    '/brands/:id/admins',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      if (!assertSuperAdmin(request, reply)) return;
      const id = Number((request.params as { id: string }).id);
      if (!Number.isInteger(id) || id < 1) {
        return reply.code(400).send({ message: 'Invalid brand id' });
      }
      let body: z.infer<typeof createAdminSchema>;
      try {
        body = createAdminSchema.parse(request.body);
      } catch {
        return reply.code(400).send({ message: 'Invalid admin payload' });
      }
      const prisma = fastify.prisma;
      const brand = await prisma.brand.findUnique({ where: { id } });
      if (!brand) {
        return reply.code(404).send({ message: 'Brand not found' });
      }
      const email = body.email.toLowerCase();
      const taken = await prisma.user.findUnique({ where: { email } });
      if (taken) {
        return reply.code(409).send({ message: 'Email already exists' });
      }
      const user = await prisma.user.create({
        data: {
          email,
          passwordHash: await hashPassword(body.password),
          firstName: body.firstName.trim(),
          lastName: body.lastName.trim(),
          name: `${body.firstName.trim()} ${body.lastName.trim()}`,
          role: UserRole.ADMIN,
          brandId: id,
        },
      });
      return reply.code(201).send({
        data: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          brandId: user.brandId,
        },
      });
    },
  );
}

export = superAdminBrandRoutes;
