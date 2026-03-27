const { z } = require('zod');

const PRODUCT_STATUS = { PUBLISHED: 'PUBLISHED' };

function linePriceCents(product) {
  const hasSale =
    product.salePriceCents != null && product.salePriceCents < product.priceCents;
  return hasSale ? product.salePriceCents : product.priceCents;
}

function mapWishlistRow(row) {
  const p = row.product;
  const imageUrl = p.images?.[0]?.imageUrl;
  return {
    productId: p.id,
    slug: p.slug,
    name: p.name,
    priceCents: linePriceCents(p),
    imageUrl,
  };
}

async function wishlistRoutes(fastify) {
  fastify.get('/user/wishlist', { preHandler: [fastify.authenticate] }, async (request) => {
    const rows = await fastify.prisma.wishlistItem.findMany({
      where: { userId: request.authUser.userId },
      orderBy: { createdAt: 'desc' },
      include: {
        product: {
          include: {
            images: { orderBy: { id: 'asc' }, take: 1 },
          },
        },
      },
    });
    return { data: rows.map(mapWishlistRow) };
  });

  fastify.post('/user/wishlist', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const body = z.object({ productId: z.number().int().positive() }).parse(request.body);
    const prisma = fastify.prisma;
    const userId = request.authUser.userId;

    const product = await prisma.product.findFirst({
      where: { id: body.productId, status: PRODUCT_STATUS.PUBLISHED },
    });

    if (!product) {
      return reply.code(404).send({ message: 'Product not found' });
    }

    await prisma.wishlistItem.upsert({
      where: {
        userId_productId: { userId, productId: body.productId },
      },
      create: { userId, productId: body.productId },
      update: {},
    });

    const row = await prisma.wishlistItem.findUnique({
      where: { userId_productId: { userId, productId: body.productId } },
      include: {
        product: {
          include: {
            images: { orderBy: { id: 'asc' }, take: 1 },
          },
        },
      },
    });

    return reply.code(201).send({ data: mapWishlistRow(row) });
  });

  fastify.delete('/user/wishlist/:productId', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const productId = Number(request.params.productId);
    if (!Number.isFinite(productId) || productId < 1) {
      return reply.code(400).send({ message: 'Invalid product id' });
    }

    await fastify.prisma.wishlistItem.deleteMany({
      where: { userId: request.authUser.userId, productId },
    });

    return { success: true };
  });
}

module.exports = wishlistRoutes;
