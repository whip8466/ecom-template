const { z } = require('zod');
const { PaymentStatus, OrderStatus, UserRole } = require('../../constants/enums');

const PRODUCT_PUBLISHED = 'PUBLISHED';
const REVIEW_PENDING = 'PENDING';
const REVIEW_APPROVED = 'APPROVED';

function formatAuthorLabel(user) {
  const fn = (user.firstName || '').trim();
  const ln = (user.lastName || '').trim();
  if (!fn && !ln) return 'Customer';
  if (!ln) return fn;
  return `${fn} ${ln.charAt(0)}.`;
}

function formatFullName(user) {
  const fn = (user.firstName || '').trim();
  const ln = (user.lastName || '').trim();
  if (fn && ln) return `${fn} ${ln}`;
  if (fn) return fn;
  if (ln) return ln;
  return 'Customer';
}

function customerInitial(user) {
  const fn = (user.firstName || '').trim();
  if (fn) return fn.charAt(0).toUpperCase();
  const em = (user.email || '').trim();
  if (em) return em.charAt(0).toUpperCase();
  return '?';
}

function isStaff(authUser) {
  return authUser.role === UserRole.ADMIN || authUser.role === UserRole.MANAGER;
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
      where: { productId, status: REVIEW_APPROVED },
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
            status: OrderStatus.DELIVERED,
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
    },
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
    if (item.order.status !== OrderStatus.DELIVERED) {
      return reply.code(400).send({ message: 'You can only review after your order has been delivered' });
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
        status: REVIEW_PENDING,
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
    if (!isStaff(request.authUser)) {
      return reply.code(403).send({ message: 'Forbidden' });
    }

    const query = z
      .object({
        page: z.coerce.number().int().min(1).default(1),
        limit: z.coerce.number().int().min(1).max(100).default(20),
        q: z.string().optional(),
        status: z.enum(['all', 'pending', 'approved']).optional().default('all'),
      })
      .parse(request.query);

    const q = query.q?.trim();
    const statusFilter =
      query.status === 'pending'
        ? { status: REVIEW_PENDING }
        : query.status === 'approved'
          ? { status: REVIEW_APPROVED }
          : {};

    const where = {
      ...statusFilter,
      ...(q
        ? {
            product: {
              name: { contains: q, mode: 'insensitive' },
            },
          }
        : {}),
    };

    const [total, rows] = await Promise.all([
      fastify.prisma.productReview.count({ where }),
      fastify.prisma.productReview.findMany({
        where,
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        orderBy: { createdAt: 'desc' },
        include: {
          product: {
            select: {
              id: true,
              name: true,
              slug: true,
              category: { select: { name: true } },
              images: { take: 1, orderBy: { id: 'asc' }, select: { imageUrl: true } },
            },
          },
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
        status: r.status,
        createdAt: r.createdAt.toISOString(),
        product: {
          id: r.product.id,
          name: r.product.name,
          slug: r.product.slug,
          categoryName: r.product.category?.name ?? null,
          imageUrl: r.product.images[0]?.imageUrl ?? null,
        },
        orderId: r.orderItem.orderId,
        customer: {
          id: r.user.id,
          email: r.user.email,
          displayName: formatFullName(r.user),
          initial: customerInitial(r.user),
        },
      })),
      total,
      page: query.page,
      limit: query.limit,
    };
  });

  const idsBodySchema = z.object({
    ids: z.array(z.number().int().positive()).min(1).max(200),
  });

  fastify.post(
    '/admin/product-reviews/bulk-approve',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      if (!isStaff(request.authUser)) {
        return reply.code(403).send({ message: 'Forbidden' });
      }
      const body = idsBodySchema.parse(request.body);
      const result = await fastify.prisma.productReview.updateMany({
        where: { id: { in: body.ids }, status: REVIEW_PENDING },
        data: { status: REVIEW_APPROVED },
      });
      return { data: { updated: result.count } };
    },
  );

  fastify.post(
    '/admin/product-reviews/bulk-delete',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      if (!isStaff(request.authUser)) {
        return reply.code(403).send({ message: 'Forbidden' });
      }
      const body = idsBodySchema.parse(request.body);
      const result = await fastify.prisma.productReview.deleteMany({
        where: { id: { in: body.ids } },
      });
      return { data: { deleted: result.count } };
    },
  );

  fastify.delete('/admin/product-reviews/:id', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    if (!isStaff(request.authUser)) {
      return reply.code(403).send({ message: 'Forbidden' });
    }
    const params = z.object({ id: z.coerce.number().int().positive() }).parse(request.params);
    const existing = await fastify.prisma.productReview.findUnique({ where: { id: params.id } });
    if (!existing) {
      return reply.code(404).send({ message: 'Review not found' });
    }
    await fastify.prisma.productReview.delete({ where: { id: params.id } });
    return reply.code(204).send();
  });
}

module.exports = reviewsRoutes;
