const { z } = require('zod');
const { OrderStatus, PaymentStatus, UserRole } = require('../../constants/enums');

const adminGuard = (fastify) => [fastify.authenticate, fastify.requireAnyRole([UserRole.ADMIN, UserRole.MANAGER])];

const checkoutSchema = z.object({
  addressId: z.number().int().positive().optional(),
  newAddress: z
    .object({
      fullName: z.string().min(2),
      phone: z.string().min(6),
      addressLine1: z.string().min(3),
      addressLine2: z.string().optional(),
      city: z.string().min(2),
      state: z.string().min(2),
      postalCode: z.string().min(3),
      country: z.string().min(2),
      isDefault: z.boolean().optional(),
    })
    .optional(),
  items: z
    .array(
      z.object({
        productId: z.number().int().positive(),
        quantity: z.number().int().positive(),
        colorName: z.string().optional(),
      })
    )
    .min(1),
});

function toOrderDto(order) {
  return {
    id: order.id,
    totalAmountCents: order.totalAmountCents,
    status: order.status,
    paymentStatus: order.paymentStatus,
    createdAt: order.createdAt,
    user: order.user
      ? {
          id: order.user.id,
          name: order.user.name,
          email: order.user.email,
        }
      : null,
    address: order.address,
    items: (order.items || []).map((item) => ({
      id: item.id,
      productId: item.productId,
      productNameSnapshot: item.productNameSnapshot,
      productPriceSnapshotCents: item.productPriceSnapshotCents,
      colorName: item.colorName,
      quantity: item.quantity,
      subtotalCents: item.subtotalCents,
    })),
  };
}

function createHttpError(statusCode, message) {
  const error = new Error(message) as Error & { statusCode: number };
  error.statusCode = statusCode;
  return error;
}

async function resolveAddress(tx, authUser, input) {
  if (input.addressId) {
    return tx.address.findFirst({ where: { id: input.addressId, userId: authUser.userId } });
  }

  if (input.newAddress) {
    const user = await tx.user.findUnique({ where: { id: authUser.userId } });
    if (!user) return null;
    if (input.newAddress.isDefault) {
      await tx.address.updateMany({ where: { userId: authUser.userId }, data: { isDefault: false } });
    }
    const created = await tx.address.create({
      data: {
      ...input.newAddress,
      userId: user.id,
      isDefault: Boolean(input.newAddress.isDefault),
      },
    });
    return created;
  }

  return tx.address.findFirst({ where: { userId: authUser.userId, isDefault: true } });
}

async function ordersRoutes(fastify) {
  fastify.post('/orders', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const input = checkoutSchema.parse(request.body);
    const prisma = fastify.prisma;

    try {
      const fullOrder = await prisma.$transaction(async (tx) => {
        const address = await resolveAddress(tx, request.authUser, input);
        if (!address) {
          throw createHttpError(400, 'Address is required');
        }

        const user = await tx.user.findUnique({ where: { id: request.authUser.userId } });
        if (!user) {
          throw createHttpError(404, 'User not found');
        }

        const order = await tx.order.create({
          data: {
            userId: user.id,
            addressId: address.id,
            totalAmountCents: 0,
            status: OrderStatus.PENDING,
            paymentStatus: PaymentStatus.PENDING,
          },
        });

        let total = 0;

        for (const inputItem of input.items) {
          const product = await tx.product.findUnique({
            where: { id: inputItem.productId },
            include: { availableColors: true },
          });

          if (!product) {
            throw createHttpError(404, `Product ${inputItem.productId} not found`);
          }

          if (product.stock < inputItem.quantity) {
            throw createHttpError(400, `Insufficient stock for ${product.name}`);
          }

          if (inputItem.colorName) {
            const colorExists = product.availableColors.some((c) => c.colorName === inputItem.colorName);
            if (!colorExists) {
              throw createHttpError(400, `Color not available for ${product.name}`);
            }
          }

          const subtotal = product.priceCents * inputItem.quantity;
          total += subtotal;

          await tx.product.update({
            where: { id: product.id },
            data: { stock: { decrement: inputItem.quantity } },
          });

          await tx.orderItem.create({
            data: {
              orderId: order.id,
              productId: product.id,
              productNameSnapshot: product.name,
              productPriceSnapshotCents: product.priceCents,
              colorName: inputItem.colorName,
              quantity: inputItem.quantity,
              subtotalCents: subtotal,
            },
          });
        }

        await tx.order.update({
          where: { id: order.id },
          data: { totalAmountCents: total },
        });

        return tx.order.findUnique({
          where: { id: order.id },
          include: { address: true, items: { include: { product: true } }, user: true },
        });
      });

      return reply.code(201).send({ data: toOrderDto(fullOrder) });
    } catch (error) {
      return reply.code(error.statusCode || 500).send({ message: error.message || 'Failed to create order' });
    }
  });

  fastify.get('/user/orders', { preHandler: [fastify.authenticate] }, async (request) => {
    const orders = await fastify.prisma.order.findMany({
      where: { userId: request.authUser.userId },
      include: { address: true, items: { include: { product: true } }, user: true },
      orderBy: { createdAt: 'desc' },
    });

    return { data: orders.map(toOrderDto) };
  });

  fastify.get('/user/orders/:id', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const id = Number(request.params.id);
    const order = await fastify.prisma.order.findFirst({
      where: { id, userId: request.authUser.userId },
      include: { address: true, items: { include: { product: true } }, user: true },
    });

    if (!order) return reply.code(404).send({ message: 'Order not found' });
    return { data: toOrderDto(order) };
  });

  // --- Admin: orders list, get, update ---
  const adminOrderQuerySchema = z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
    status: z.string().optional(),
    paymentStatus: z.string().optional(),
  });
  const adminOrderUpdateSchema = z.object({
    status: z.enum([OrderStatus.PENDING, OrderStatus.CONFIRMED, OrderStatus.PROCESSING, OrderStatus.SHIPPED, OrderStatus.DELIVERED, OrderStatus.CANCELLED]).optional(),
    paymentStatus: z.enum([PaymentStatus.PENDING, PaymentStatus.PAID, PaymentStatus.FAILED]).optional(),
  }).refine((d) => Object.keys(d).length > 0, { message: 'Provide at least one of status or paymentStatus' });

  fastify.get('/admin/orders', { preHandler: adminGuard(fastify) }, async (request) => {
    const query = adminOrderQuerySchema.parse(request.query || {});
    const where: { status?: string; paymentStatus?: string } = {};
    if (query.status) where.status = query.status;
    if (query.paymentStatus) where.paymentStatus = query.paymentStatus;
    const [orders, total] = await Promise.all([
      fastify.prisma.order.findMany({
        where,
        include: { address: true, items: { include: { product: true } }, user: true },
        orderBy: { createdAt: 'desc' },
        take: query.limit,
        skip: (query.page - 1) * query.limit,
      }),
      fastify.prisma.order.count({ where }),
    ]);
    return {
      data: orders.map(toOrderDto),
      pagination: { page: query.page, limit: query.limit, total, totalPages: Math.ceil(total / query.limit) || 1 },
    };
  });

  fastify.get('/admin/orders/:id', { preHandler: adminGuard(fastify) }, async (request, reply) => {
    const id = z.coerce.number().int().positive().parse(request.params.id);
    const order = await fastify.prisma.order.findUnique({
      where: { id },
      include: { address: true, items: { include: { product: true } }, user: true },
    });
    if (!order) return reply.code(404).send({ message: 'Order not found' });
    return { data: toOrderDto(order) };
  });

  fastify.patch('/admin/orders/:id', { preHandler: adminGuard(fastify) }, async (request, reply) => {
    const id = z.coerce.number().int().positive().parse(request.params.id);
    const body = adminOrderUpdateSchema.parse(request.body);
    const order = await fastify.prisma.order.update({
      where: { id },
      data: body,
      include: { address: true, items: { include: { product: true } }, user: true },
    });
    return { data: toOrderDto(order) };
  });
}

module.exports = ordersRoutes;
