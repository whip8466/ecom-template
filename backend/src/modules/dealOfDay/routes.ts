import type { Prisma } from '@prisma/client';
import type { FastifyInstance, FastifyReply } from 'fastify';
import { z } from 'zod';
import type { DealOfDayDealJson } from '@shared/deal-of-day';
import { UserRole } from '../../constants/enums';

const PRODUCT_STATUS = { PUBLISHED: 'PUBLISHED' } as const;

function formatInrFromCents(cents: number): string {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(cents / 100);
}

/** Same storefront shape as GET /api/products list (see catalog/routes mapProduct). */
function mapProduct(product: Record<string, unknown>) {
  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    status: product.status ?? PRODUCT_STATUS.PUBLISHED,
    shortDescription: product.shortDescription,
    description: product.description,
    priceCents: product.priceCents,
    salePriceCents: product.salePriceCents ?? null,
    stock: product.stock,
    stockInTransit: product.stockInTransit ?? 0,
    lastRestockedAt: product.lastRestockedAt ? (product.lastRestockedAt as Date).toISOString() : null,
    totalStockLifetime: product.totalStockLifetime ?? 0,
    fulfillmentType: product.fulfillmentType ?? null,
    externalProductIdType: product.externalProductIdType ?? null,
    externalProductId: product.externalProductId ?? null,
    createdAt: product.createdAt,
    publishedAt: product.publishedAt ?? null,
    category: product.category
      ? {
          id: (product.category as { id: number }).id,
          name: (product.category as { name: string }).name,
          slug: (product.category as { slug: string }).slug,
        }
      : null,
    vendor: product.vendor
      ? {
          id: (product.vendor as { id: number }).id,
          name: (product.vendor as { name: string }).name,
          slug: (product.vendor as { slug: string }).slug,
        }
      : null,
    collection: product.collection
      ? {
          id: (product.collection as { id: number }).id,
          name: (product.collection as { name: string }).name,
          slug: (product.collection as { slug: string }).slug,
        }
      : null,
    tags: ((product.productTags as { tag?: { id: number; name: string; slug: string } }[]) || [])
      .map((pt) => (pt.tag ? { id: pt.tag.id, name: pt.tag.name, slug: pt.tag.slug } : null))
      .filter(Boolean),
    images: ((product.images as { id: number; imageUrl: string }[]) || []).map((img) => ({
      id: img.id,
      imageUrl: img.imageUrl,
    })),
    availableColors: ((product.availableColors as { id: number; colorName: string; colorCode: string; stock: number }[]) || []).map(
      (c) => ({
        id: c.id,
        colorName: c.colorName,
        colorCode: c.colorCode,
        stock: c.stock,
      }),
    ),
    variants: ((product.variants as Record<string, unknown>[]) || []).map((v) => ({
      id: v.id,
      sku: v.sku,
      priceCents: v.priceCents,
      stock: v.stock,
      optionValues: ((v.optionValues as { optionValue?: Record<string, unknown> }[]) || []).map((pvo) =>
        pvo.optionValue
          ? {
              id: pvo.optionValue.id,
              value: pvo.optionValue.value,
              label: pvo.optionValue.label,
              optionTypeId: pvo.optionValue.optionTypeId,
              optionType: pvo.optionValue.optionType
                ? {
                    id: (pvo.optionValue.optionType as { id: number }).id,
                    name: (pvo.optionValue.optionType as { name: string }).name,
                    slug: (pvo.optionValue.optionType as { slug: string }).slug,
                  }
                : null,
            }
          : null,
      ).filter(Boolean),
    })),
  };
}

function mapDealAdminRow(row: {
  sortOrder: number;
  productId: number;
  dealPriceCents: number;
  durationMinutes: number;
  activatedAt: Date | null;
  endsAt: Date | null;
  product: Record<string, unknown> | null;
}) {
  return {
    sortOrder: row.sortOrder,
    productId: row.productId,
    dealPriceCents: row.dealPriceCents,
    durationMinutes: row.durationMinutes,
    activatedAt: row.activatedAt ? row.activatedAt.toISOString() : null,
    endsAt: row.endsAt ? row.endsAt.toISOString() : null,
    product: row.product ? mapProduct(row.product) : null,
  };
}

function mapHistoryAdminRow(row: {
  id: number;
  productId: number;
  dealPriceCents: number;
  durationMinutes: number;
  activatedAt: Date;
  endsAt: Date;
  endedAt: Date;
  product: Record<string, unknown> | null;
}) {
  return {
    id: row.id,
    productId: row.productId,
    dealPriceCents: row.dealPriceCents,
    durationMinutes: row.durationMinutes,
    activatedAt: row.activatedAt.toISOString(),
    endsAt: row.endsAt.toISOString(),
    endedAt: row.endedAt.toISOString(),
    product: row.product ? mapProduct(row.product) : null,
  };
}

function isLiveDeal(row: { activatedAt: Date | null; endsAt: Date | null }, now = new Date()) {
  return row.activatedAt != null && row.endsAt != null && row.endsAt > now;
}

async function archiveExpiredDeals(tx: Prisma.TransactionClient) {
  const now = new Date();
  const expired = await tx.dealOfDayProduct.findMany({
    where: { activatedAt: { not: null }, endsAt: { lte: now } },
  });
  for (const row of expired) {
    await tx.dealOfDayHistory.create({
      data: {
        productId: row.productId,
        dealPriceCents: row.dealPriceCents,
        durationMinutes: row.durationMinutes,
        activatedAt: row.activatedAt!,
        endsAt: row.endsAt!,
        endedAt: row.endsAt!,
      },
    });
    await tx.dealOfDayProduct.delete({ where: { id: row.id } });
  }
}

function isStaff(authUser: { role: string } | undefined) {
  if (!authUser) return false;
  return authUser.role === UserRole.ADMIN || authUser.role === UserRole.MANAGER;
}

function repo(fastify: FastifyInstance) {
  return fastify.prisma.dealOfDayProduct;
}

function clientReady(reply: FastifyReply, fastify: FastifyInstance) {
  if (!repo(fastify)) {
    return reply.code(503).send({
      message:
        'Database client is out of date. In the backend folder run: npx prisma generate — then restart the API server.',
    });
  }
  if (!fastify.prisma.dealOfDayHistory) {
    return reply.code(503).send({
      message:
        'Database client is out of date. In the backend folder run: npx prisma generate — then restart the API server.',
    });
  }
  return null;
}

const productInclude = {
  category: true,
  vendor: true,
  collection: true,
  productTags: { include: { tag: true } },
  images: true,
  availableColors: true,
  variants: {
    select: { id: true, sku: true, priceCents: true, stock: true },
  },
} as const;

const MAX_DEAL_SLOTS = 100;

function effectiveListPriceCents(product: { priceCents: number; salePriceCents: number | null }) {
  const sale = product.salePriceCents;
  if (sale != null && sale >= 0 && sale < product.priceCents) {
    return sale;
  }
  return product.priceCents;
}

const slotSchema = z.object({
  sortOrder: z.number().int().min(1).max(MAX_DEAL_SLOTS),
  productId: z.number().int().positive(),
  dealPriceCents: z.number().int().min(1),
  durationMinutes: z.number().int().min(1).max(10080),
});

async function dealOfDayRoutes(fastify: FastifyInstance) {
  fastify.get('/deal-of-day', async (_request, reply) => {
    if (clientReady(reply, fastify)) return;
    const prisma = fastify.prisma;
    await prisma.$transaction(async (tx) => {
      await archiveExpiredDeals(tx);
    });
    const rows = await prisma.dealOfDayProduct.findMany({
      where: {
        product: { status: PRODUCT_STATUS.PUBLISHED },
        activatedAt: { not: null },
        endsAt: { gt: new Date() },
      },
      orderBy: { sortOrder: 'asc' },
      include: {
        product: {
          include: productInclude,
        },
      },
    });

    const data: { product: ReturnType<typeof mapProduct>; deal: DealOfDayDealJson }[] = rows.map((row) => ({
      product: mapProduct(row.product as unknown as Record<string, unknown>),
      deal: {
        dealPriceCents: row.dealPriceCents,
        endsAt: row.endsAt!.toISOString(),
      },
    }));

    return { data };
  });

  fastify.get('/admin/deal-of-day', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    if (!isStaff(request.authUser)) {
      return reply.code(403).send({ message: 'Forbidden' });
    }
    if (clientReady(reply, fastify)) return;
    const prisma = fastify.prisma;
    await prisma.$transaction(async (tx) => {
      await archiveExpiredDeals(tx);
    });
    const rows = await prisma.dealOfDayProduct.findMany({
      orderBy: { sortOrder: 'asc' },
      include: {
        product: {
          include: productInclude,
        },
      },
    });
    const history = await prisma.dealOfDayHistory.findMany({
      orderBy: { endedAt: 'desc' },
      take: 100,
      include: {
        product: {
          include: productInclude,
        },
      },
    });
    return {
      data: {
        items: rows.map((r) => mapDealAdminRow({ ...r, product: r.product as unknown as Record<string, unknown> | null })),
        history: history.map((h) =>
          mapHistoryAdminRow({ ...h, product: h.product as unknown as Record<string, unknown> | null }),
        ),
      },
    };
  });

  fastify.put('/admin/deal-of-day', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    if (!isStaff(request.authUser)) {
      return reply.code(403).send({ message: 'Forbidden' });
    }
    if (clientReady(reply, fastify)) return;

    const body = z
      .object({
        slots: z
          .array(slotSchema)
          .max(MAX_DEAL_SLOTS)
          .refine((arr) => new Set(arr.map((s) => s.sortOrder)).size === arr.length, {
            message: 'sortOrder values must be unique',
          })
          .refine((arr) => new Set(arr.map((s) => s.productId)).size === arr.length, {
            message: 'productId values must be unique',
          }),
      })
      .parse(request.body);

    const prisma = fastify.prisma;
    const slots = [...body.slots].sort((a, b) => a.sortOrder - b.sortOrder);

    if (slots.length > 0) {
      const ids = slots.map((s) => s.productId);
      const products = await prisma.product.findMany({
        where: { id: { in: ids } },
        select: { id: true, name: true, priceCents: true, salePriceCents: true },
      });
      const found = new Set(products.map((p) => p.id));
      const missing = ids.filter((id) => !found.has(id));
      if (missing.length > 0) {
        return reply.code(400).send({ message: `Unknown product id(s): ${missing.join(', ')}` });
      }
      const byId = new Map(products.map((p) => [p.id, p]));
      for (const s of slots) {
        const p = byId.get(s.productId)!;
        const actual = effectiveListPriceCents(p);
        if (s.dealPriceCents >= actual) {
          return reply.code(400).send({
            message: `Deal price must be less than the current price for "${p.name}" (#${p.id}). Current price is ${formatInrFromCents(actual)}.`,
          });
        }
      }
    }

    await prisma.$transaction(async (tx) => {
      await archiveExpiredDeals(tx);
    });
    const previous = await prisma.dealOfDayProduct.findMany({ orderBy: { sortOrder: 'asc' } });
    const now = new Date();

    for (const s of slots) {
      const prev = previous.find((p) => p.sortOrder === s.sortOrder);
      if (prev && isLiveDeal(prev, now)) {
        if (
          prev.productId !== s.productId ||
          prev.dealPriceCents !== s.dealPriceCents ||
          prev.durationMinutes !== s.durationMinutes
        ) {
          return reply.code(400).send({
            message:
              'A live deal cannot be edited. Stop the deal first, then change product, deal price, or duration.',
          });
        }
      }
    }

    await prisma.$transaction(async (tx) => {
      const previous2 = await tx.dealOfDayProduct.findMany({ orderBy: { sortOrder: 'asc' } });
      const nextSorts = new Set(slots.map((s) => s.sortOrder));
      for (const prev of previous2) {
        if (!nextSorts.has(prev.sortOrder) && isLiveDeal(prev, now)) {
          await tx.dealOfDayHistory.create({
            data: {
              productId: prev.productId,
              dealPriceCents: prev.dealPriceCents,
              durationMinutes: prev.durationMinutes,
              activatedAt: prev.activatedAt!,
              endsAt: prev.endsAt!,
              endedAt: now,
            },
          });
        }
      }

      await tx.dealOfDayProduct.deleteMany({});
      for (const s of slots) {
        const prev = previous2.find((p) => p.sortOrder === s.sortOrder);
        let activatedAt: Date | null = null;
        let endsAt: Date | null = null;
        if (
          prev &&
          prev.productId === s.productId &&
          prev.dealPriceCents === s.dealPriceCents &&
          prev.durationMinutes === s.durationMinutes
        ) {
          activatedAt = prev.activatedAt;
          endsAt = prev.endsAt;
          if (endsAt && endsAt <= now) {
            activatedAt = null;
            endsAt = null;
          }
        }
        await tx.dealOfDayProduct.create({
          data: {
            sortOrder: s.sortOrder,
            productId: s.productId,
            dealPriceCents: s.dealPriceCents,
            durationMinutes: s.durationMinutes,
            activatedAt,
            endsAt,
          },
        });
      }
    });

    const rows = await prisma.dealOfDayProduct.findMany({
      orderBy: { sortOrder: 'asc' },
      include: {
        product: {
          include: productInclude,
        },
      },
    });
    return {
      data: {
        items: rows.map((r) => mapDealAdminRow({ ...r, product: r.product as unknown as Record<string, unknown> | null })),
      },
    };
  });

  fastify.post('/admin/deal-of-day/activate', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    if (!isStaff(request.authUser)) {
      return reply.code(403).send({ message: 'Forbidden' });
    }
    if (clientReady(reply, fastify)) return;

    const body = z.object({ productId: z.number().int().positive() }).parse(request.body);
    const prisma = fastify.prisma;

    const row = await prisma.dealOfDayProduct.findUnique({
      where: { productId: body.productId },
      include: {
        product: { select: { id: true, name: true, priceCents: true, salePriceCents: true } },
      },
    });
    if (!row) {
      return reply.code(404).send({ message: 'Save configuration first, then activate a deal.' });
    }

    const actual = effectiveListPriceCents(row.product);
    if (row.dealPriceCents >= actual) {
      return reply.code(400).send({
        message: `Deal price must be less than the current price for "${row.product.name}" (#${row.product.id}). Current price is ${formatInrFromCents(actual)}. Update the deal or product price before activating.`,
      });
    }

    const now = new Date();
    if (row.activatedAt && row.endsAt && row.endsAt > now) {
      return reply.code(400).send({ message: 'Deal is already live.' });
    }

    const endsAt = new Date(now.getTime() + row.durationMinutes * 60 * 1000);
    await prisma.dealOfDayProduct.update({
      where: { productId: body.productId },
      data: { activatedAt: now, endsAt },
    });

    const updated = await prisma.dealOfDayProduct.findUnique({
      where: { productId: body.productId },
      include: { product: { include: productInclude } },
    });
    return { data: mapDealAdminRow({ ...updated!, product: updated!.product as unknown as Record<string, unknown> | null }) };
  });

  fastify.post('/admin/deal-of-day/deactivate', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    if (!isStaff(request.authUser)) {
      return reply.code(403).send({ message: 'Forbidden' });
    }
    if (clientReady(reply, fastify)) return;

    const body = z.object({ productId: z.number().int().positive() }).parse(request.body);
    const prisma = fastify.prisma;

    const row = await prisma.dealOfDayProduct.findUnique({
      where: { productId: body.productId },
      include: { product: { include: productInclude } },
    });
    if (!row) {
      return reply.code(404).send({ message: 'Deal slot not found.' });
    }
    if (!row.activatedAt) {
      return reply.code(400).send({ message: 'Deal is not active.' });
    }

    const now = new Date();
    const wasLive = row.endsAt && row.endsAt > now;

    if (wasLive) {
      await prisma.dealOfDayHistory.create({
        data: {
          productId: row.productId,
          dealPriceCents: row.dealPriceCents,
          durationMinutes: row.durationMinutes,
          activatedAt: row.activatedAt,
          endsAt: row.endsAt!,
          endedAt: now,
        },
      });
      await prisma.dealOfDayProduct.update({
        where: { productId: body.productId },
        data: { activatedAt: null, endsAt: null },
      });
    } else {
      await prisma.dealOfDayHistory.create({
        data: {
          productId: row.productId,
          dealPriceCents: row.dealPriceCents,
          durationMinutes: row.durationMinutes,
          activatedAt: row.activatedAt,
          endsAt: row.endsAt!,
          endedAt: row.endsAt!,
        },
      });
      await prisma.dealOfDayProduct.delete({ where: { productId: body.productId } });
      return { data: { removed: true } };
    }

    const updated = await prisma.dealOfDayProduct.findUnique({
      where: { productId: body.productId },
      include: { product: { include: productInclude } },
    });
    return { data: mapDealAdminRow({ ...updated!, product: updated!.product as unknown as Record<string, unknown> | null }) };
  });
}

export = dealOfDayRoutes;
