const { z } = require('zod');
const { OrderStatus, PaymentStatus } = require('../../constants/enums');

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

            if (variant.stock < inputItem.quantity) {
              throw createHttpError(400, `Insufficient stock for selected options on ${product.name}`);
            }

            const unitPrice = effectiveLineUnitCents(product, variant);
            const subtotal = unitPrice * inputItem.quantity;
            total += subtotal;

            await tx.productVariant.update({
              where: { id: variant.id },
              data: { stock: { decrement: inputItem.quantity } },
            });

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

          if (product.stock < inputItem.quantity) {
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
