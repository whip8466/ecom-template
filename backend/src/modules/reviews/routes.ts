const { z } = require('zod');
const { PaymentStatus, OrderStatus, UserRole } = require('../../constants/enums');

const PRODUCT_PUBLISHED = 'PUBLISHED';

function formatAuthorLabel(user) {
  const fn = (user.firstName || '').trim();
  const ln = (user.lastName || '').trim();
  if (!fn && !ln) return 'Customer';
  if (!ln) return fn;
  return `${fn} ${ln.charAt(0)}.`;
}

async function reviewsRoutes(fastify) {
  fastify.get('/products/:productId/reviews', async (request, reply) => {
    const productId = Number(request.params.productId);
    if (!Number.isInteger(productId) || productId < 1) {
      return reply.code(400).send({ message: 'Invalid product id' });
    }

    const product = await fastify.prisma.product.findFirst({
      where: { id: productId, status: PRODUCT_PUBLISHED },
      select: { id: true },
    });
    if (!product) {
      return reply.code(404).send({ message: 'Product not found' });
    }

    const rows = await fastify.prisma.productReview.findMany({
      where: { productId },
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { firstName: true, lastName: true } },
      },
    });

    const list = rows.map((r) => ({
      id: r.id,
      rating: r.rating,
      body: r.body,
      createdAt: r.createdAt.toISOString(),
      authorLabel: formatAuthorLabel(r.user),
    }));

    const count = list.length;
    const averageRating =
      count === 0 ? null : Math.round((list.reduce((s, x) => s + x.rating, 0) / count) * 10) / 10;

    return { data: { reviews: list, averageRating, count } };
  });

  fastify.get(
    '/products/:productId/review-eligibility',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const userId = request.authUser.userId;
      const productId = Number(request.params.productId);
      if (!Number.isInteger(productId) || productId < 1) {
        return reply.code(400).send({ message: 'Invalid product id' });
      }

      const items = await fastify.prisma.orderItem.findMany({
        where: {
          productId,
          order: {
            userId,
            paymentStatus: PaymentStatus.PAID,
            status: { not: OrderStatus.CANCELLED },
          },
          review: null,
        },
        select: {
          id: true,
          orderId: true,
          order: { select: { createdAt: true } },
        },
        orderBy: { id: 'desc' },
      });

      return {
        data: {
          eligibleOrderItems: items.map((it) => ({
            orderItemId: it.id,
            orderId: it.orderId,
            purchasedAt: it.order.createdAt.toISOString(),
          })),
        },
      };
    }
  );

  fastify.post('/reviews', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const userId = request.authUser.userId;
    const body = z
      .object({
        orderItemId: z.number().int().positive(),
        productId: z.number().int().positive(),
        rating: z.number().int().min(1).max(5),
        body: z.string().trim().min(1).max(5000),
      })
      .parse(request.body);

    const item = await fastify.prisma.orderItem.findFirst({
      where: { id: body.orderItemId },
      include: {
        order: true,
        review: true,
      },
    });

    if (!item) {
      return reply.code(404).send({ message: 'Order line not found' });
    }
    if (item.order.userId !== userId) {
      return reply.code(403).send({ message: 'Not your order' });
    }
    if (item.productId !== body.productId) {
      return reply.code(400).send({ message: 'Product does not match this order line' });
    }
    if (item.order.paymentStatus !== PaymentStatus.PAID) {
      return reply.code(400).send({ message: 'You can only review after your purchase is paid' });
    }
    if (item.order.status === OrderStatus.CANCELLED) {
      return reply.code(400).send({ message: 'Cannot review a cancelled order' });
    }
    if (item.review) {
      return reply.code(409).send({ message: 'You already submitted a review for this purchase' });
    }

    const product = await fastify.prisma.product.findFirst({
      where: { id: body.productId, status: PRODUCT_PUBLISHED },
    });
    if (!product) {
      return reply.code(404).send({ message: 'Product not found' });
    }

    const created = await fastify.prisma.productReview.create({
      data: {
        orderItemId: item.id,
        userId,
        productId: item.productId,
        rating: body.rating,
        body: body.body,
      },
      include: {
        user: { select: { firstName: true, lastName: true } },
      },
    });

    return reply.code(201).send({
      data: {
        id: created.id,
        rating: created.rating,
        body: created.body,
        createdAt: created.createdAt.toISOString(),
        authorLabel: formatAuthorLabel(created.user),
      },
    });
  });

  fastify.get('/admin/product-reviews', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    if (request.authUser.role !== UserRole.ADMIN && request.authUser.role !== UserRole.MANAGER) {
      return reply.code(403).send({ message: 'Forbidden' });
    }

    const query = z
      .object({
        page: z.coerce.number().int().min(1).default(1),
        limit: z.coerce.number().int().min(1).max(100).default(20),
        q: z.string().optional(),
      })
      .parse(request.query);

    const q = query.q?.trim();
    const where = q
      ? {
          product: {
            name: { contains: q, mode: 'insensitive' },
          },
        }
      : {};

    const [total, rows] = await Promise.all([
      fastify.prisma.productReview.count({ where }),
      fastify.prisma.productReview.findMany({
        where,
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        orderBy: { createdAt: 'desc' },
        include: {
          product: { select: { id: true, name: true, slug: true } },
          user: { select: { id: true, email: true, firstName: true, lastName: true } },
          orderItem: { select: { orderId: true } },
        },
      }),
    ]);

    return {
      data: rows.map((r) => ({
        id: r.id,
        rating: r.rating,
        body: r.body,
        createdAt: r.createdAt.toISOString(),
        product: r.product,
        orderId: r.orderItem.orderId,
        customer: {
          id: r.user.id,
          email: r.user.email,
          displayName: formatAuthorLabel(r.user),
        },
      })),
      total,
      page: query.page,
      limit: query.limit,
    };
  });
}

module.exports = reviewsRoutes;
