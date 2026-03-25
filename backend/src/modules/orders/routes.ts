const { z } = require('zod');
const { OrderStatus, PaymentStatus, UserRole } = require('../../constants/enums');

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
        variantId: z.number().int().positive().optional(),
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
          phone: order.user.phone ?? null,
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
      productSlug: item.product?.slug ?? null,
      productImageUrl: item.product?.images?.[0]?.imageUrl ?? null,
    })),
  };
}

function isStaff(authUser) {
  return authUser.role === UserRole.ADMIN || authUser.role === UserRole.MANAGER;
}

function toAdminOrderListDto(order) {
  const itemCount = order._count?.items ?? (order.items ? order.items.length : 0);
  return {
    id: order.id,
    totalAmountCents: order.totalAmountCents,
    status: order.status,
    paymentStatus: order.paymentStatus,
    createdAt: order.createdAt,
    itemCount,
    user: order.user
      ? {
          id: order.user.id,
          name: order.user.name,
          email: order.user.email,
        }
      : null,
    address: order.address
      ? {
          id: order.address.id,
          city: order.address.city,
          state: order.address.state,
          country: order.address.country,
        }
      : null,
  };
}

async function fetchOrderTabCounts(prisma) {
  const [
    all,
    pendingPayment,
    unfulfilled,
    completed,
    failed,
    cancelled,
    shipped,
  ] = await Promise.all([
    prisma.order.count(),
    prisma.order.count({ where: { paymentStatus: PaymentStatus.PENDING } }),
    prisma.order.count({
      where: { status: { in: [OrderStatus.PENDING, OrderStatus.CONFIRMED, OrderStatus.PROCESSING] } },
    }),
    prisma.order.count({ where: { status: OrderStatus.DELIVERED } }),
    prisma.order.count({ where: { paymentStatus: PaymentStatus.FAILED } }),
    prisma.order.count({ where: { status: OrderStatus.CANCELLED } }),
    prisma.order.count({ where: { status: OrderStatus.SHIPPED } }),
  ]);
  return {
    all,
    pendingPayment,
    unfulfilled,
    completed,
    failed,
    cancelled,
    shipped,
  };
}

function fulfillmentWhere(fulfillmentStatus) {
  switch (fulfillmentStatus) {
    case 'UNFULFILLED':
      return {
        status: { in: [OrderStatus.PENDING, OrderStatus.CONFIRMED, OrderStatus.PROCESSING] },
      };
    case 'SHIPPED':
      return { status: OrderStatus.SHIPPED };
    case 'COMPLETED':
      return { status: OrderStatus.DELIVERED };
    case 'CANCELLED':
      return { status: OrderStatus.CANCELLED };
    default:
      return null;
  }
}

/**
 * @param {string} [paymentStatus] — PENDING | PAID | FAILED
 * @param {string} [fulfillmentStatus] — UNFULFILLED | SHIPPED | COMPLETED | CANCELLED (COMPLETED = delivered)
 */
function buildAdminOrderListWhere(view, q, paymentStatus, fulfillmentStatus) {
  const clauses = [];

  switch (view) {
    case 'pending_payment':
      clauses.push({ paymentStatus: PaymentStatus.PENDING });
      break;
    case 'unfulfilled':
      clauses.push({
        status: { in: [OrderStatus.PENDING, OrderStatus.CONFIRMED, OrderStatus.PROCESSING] },
      });
      break;
    case 'completed':
      clauses.push({ status: OrderStatus.DELIVERED });
      break;
    case 'failed':
      clauses.push({ paymentStatus: PaymentStatus.FAILED });
      break;
    case 'cancelled':
      clauses.push({ status: OrderStatus.CANCELLED });
      break;
    case 'shipped':
      clauses.push({ status: OrderStatus.SHIPPED });
      break;
    default:
      break;
  }

  if (paymentStatus) {
    clauses.push({ paymentStatus });
  }

  if (fulfillmentStatus) {
    const fw = fulfillmentWhere(fulfillmentStatus);
    if (fw) clauses.push(fw);
  }

  const trimmed = typeof q === 'string' ? q.trim() : '';
  if (trimmed) {
    const idNum = Number(trimmed);
    if (Number.isInteger(idNum) && idNum > 0) {
      clauses.push({
        OR: [
          { id: idNum },
          { user: { email: { contains: trimmed, mode: 'insensitive' } } },
          { user: { name: { contains: trimmed, mode: 'insensitive' } } },
        ],
      });
    } else {
      clauses.push({
        OR: [
          { user: { email: { contains: trimmed, mode: 'insensitive' } } },
          { user: { name: { contains: trimmed, mode: 'insensitive' } } },
        ],
      });
    }
  }

  if (clauses.length === 0) return {};
  if (clauses.length === 1) return clauses[0];
  return { AND: clauses };
}

function createHttpError(statusCode, message) {
  const error = new Error(message) as Error & { statusCode: number };
  error.statusCode = statusCode;
  return error;
}

function effectiveProductPriceCents(product) {
  const sale = product.salePriceCents;
  if (sale != null && sale >= 0 && sale < product.priceCents) {
    return sale;
  }
  return product.priceCents;
}

function effectiveLineUnitCents(product, variant) {
  if (variant) {
    if (variant.priceCents != null) {
      return variant.priceCents;
    }
    return effectiveProductPriceCents(product);
  }
  return effectiveProductPriceCents(product);
}

/** Align with storefront: use variant stock when any variant has stock; else product.stock. */
function effectiveAvailableStock(product, variant) {
  const variants = product.variants || [];
  if (variants.length === 0) return Math.max(0, product.stock ?? 0);
  const anyVariantHasStock = variants.some((v) => (v.stock ?? 0) > 0);
  if (anyVariantHasStock) {
    return Math.max(0, variant ? variant.stock ?? 0 : 0);
  }
  return Math.max(0, product.stock ?? 0);
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
  fastify.get('/admin/orders', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    if (!isStaff(request.authUser)) {
      return reply.code(403).send({ message: 'Forbidden' });
    }

    const query = z
      .object({
        page: z.coerce.number().int().positive().default(1),
        limit: z.coerce.number().int().positive().max(100).default(10),
        view: z
          .enum([
            'all',
            'pending_payment',
            'unfulfilled',
            'completed',
            'failed',
            'cancelled',
            'shipped',
          ])
          .default('all'),
        q: z.string().optional(),
        paymentStatus: z.enum(['PENDING', 'PAID', 'FAILED']).optional(),
        fulfillmentStatus: z
          .enum(['UNFULFILLED', 'SHIPPED', 'COMPLETED', 'CANCELLED'])
          .optional(),
      })
      .parse(request.query || {});

    const prisma = fastify.prisma;
    const where = buildAdminOrderListWhere(
      query.view,
      query.q,
      query.paymentStatus,
      query.fulfillmentStatus
    );

    const [counts, orders, total] = await Promise.all([
      fetchOrderTabCounts(prisma),
      prisma.order.findMany({
        where,
        include: {
          user: { select: { id: true, name: true, email: true } },
          address: {
            select: { id: true, city: true, state: true, country: true },
          },
          _count: { select: { items: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: query.limit,
        skip: (query.page - 1) * query.limit,
      }),
      prisma.order.count({ where }),
    ]);

    return {
      data: orders.map(toAdminOrderListDto),
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit) || 1,
      },
      counts,
    };
  });

  fastify.get('/admin/orders/:id', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    if (!isStaff(request.authUser)) {
      return reply.code(403).send({ message: 'Forbidden' });
    }

    const id = Number(request.params.id);
    if (!Number.isInteger(id) || id < 1) {
      return reply.code(400).send({ message: 'Invalid order id' });
    }

    const order = await fastify.prisma.order.findUnique({
      where: { id },
      include: {
        address: true,
        items: { include: { product: { include: { images: { take: 1 } } } } },
        user: true,
      },
    });

    if (!order) return reply.code(404).send({ message: 'Order not found' });
    return { data: toOrderDto(order) };
  });

  const adminOrderPatchSchema = z
    .object({
      paymentStatus: z.enum([PaymentStatus.PENDING, PaymentStatus.PAID, PaymentStatus.FAILED]).optional(),
      status: z
        .enum([
          OrderStatus.PENDING,
          OrderStatus.CONFIRMED,
          OrderStatus.PROCESSING,
          OrderStatus.SHIPPED,
          OrderStatus.DELIVERED,
          OrderStatus.CANCELLED,
        ])
        .optional(),
    })
    .refine((body) => body.paymentStatus !== undefined || body.status !== undefined, {
      message: 'Provide paymentStatus and/or status',
    });

  fastify.patch('/admin/orders/:id', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    if (!isStaff(request.authUser)) {
      return reply.code(403).send({ message: 'Forbidden' });
    }

    const id = Number(request.params.id);
    if (!Number.isInteger(id) || id < 1) {
      return reply.code(400).send({ message: 'Invalid order id' });
    }

    const body = adminOrderPatchSchema.parse(request.body);
    const prisma = fastify.prisma;

    const existing = await prisma.order.findUnique({ where: { id } });
    if (!existing) return reply.code(404).send({ message: 'Order not found' });

    const order = await prisma.order.update({
      where: { id },
      data: {
        ...(body.paymentStatus !== undefined ? { paymentStatus: body.paymentStatus } : {}),
        ...(body.status !== undefined ? { status: body.status } : {}),
      },
      include: {
        address: true,
        items: { include: { product: { include: { images: { take: 1 } } } } },
        user: true,
      },
    });

    return { data: toOrderDto(order) };
  });

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
            include: {
              availableColors: true,
              variants: { select: { id: true, stock: true } },
            },
          });

          if (!product) {
            throw createHttpError(404, `Product ${inputItem.productId} not found`);
          }

          const variantRows = product.variants || [];
          const anyVariantHasStock = variantRows.some((v) => (v.stock ?? 0) > 0);

          if (inputItem.variantId) {
            const variant = await tx.productVariant.findFirst({
              where: { id: inputItem.variantId, productId: product.id },
              include: {
                optionValues: { include: { optionValue: true } },
              },
            });

            if (!variant) {
              throw createHttpError(400, `Invalid variant for ${product.name}`);
            }

            const available = effectiveAvailableStock(product, variant);
            if (inputItem.quantity > available) {
              throw createHttpError(400, `Insufficient stock for selected options on ${product.name}`);
            }

            const unitPrice = effectiveLineUnitCents(product, variant);
            const subtotal = unitPrice * inputItem.quantity;
            total += subtotal;

            if (anyVariantHasStock) {
              await tx.productVariant.update({
                where: { id: variant.id },
                data: { stock: { decrement: inputItem.quantity } },
              });
            } else {
              await tx.product.update({
                where: { id: product.id },
                data: { stock: { decrement: inputItem.quantity } },
              });
            }

            const optionLabel = (variant.optionValues || [])
              .map((pvo) => (pvo.optionValue ? pvo.optionValue.label || pvo.optionValue.value : null))
              .filter(Boolean)
              .join(' · ');

            await tx.orderItem.create({
              data: {
                orderId: order.id,
                productId: product.id,
                productNameSnapshot: product.name,
                productPriceSnapshotCents: unitPrice,
                colorName: optionLabel || inputItem.colorName || null,
                quantity: inputItem.quantity,
                subtotalCents: subtotal,
              },
            });
            continue;
          }

          if (variantRows.length > 0 && anyVariantHasStock) {
            throw createHttpError(400, `Select product options for ${product.name}`);
          }

          const available = effectiveAvailableStock(product, null);
          if (inputItem.quantity > available) {
            throw createHttpError(400, `Insufficient stock for ${product.name}`);
          }

          if (inputItem.colorName) {
            const colorExists = product.availableColors.some((c) => c.colorName === inputItem.colorName);
            if (!colorExists) {
              throw createHttpError(400, `Color not available for ${product.name}`);
            }
          }

          const unitPrice = effectiveProductPriceCents(product);
          const subtotal = unitPrice * inputItem.quantity;
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
              productPriceSnapshotCents: unitPrice,
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

}

module.exports = ordersRoutes;
