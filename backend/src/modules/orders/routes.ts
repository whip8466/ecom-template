const { z } = require('zod');
const { UserRole, OrderStatus, PaymentStatus } = require('../../constants/enums');

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

const updateStatusSchema = z.object({
  status: z.enum(Object.values(OrderStatus)),
  paymentStatus: z.enum(Object.values(PaymentStatus)).optional(),
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
      productId: item.product?.id,
      productNameSnapshot: item.productNameSnapshot,
      productPriceSnapshotCents: item.productPriceSnapshotCents,
      colorName: item.colorName,
      quantity: item.quantity,
      subtotalCents: item.subtotalCents,
    })),
  };
}

function relationItems(relation) {
  if (!relation) return [];
  if (Array.isArray(relation)) return relation;
  if (typeof relation.getItems === 'function') return relation.getItems();
  if (typeof relation.toArray === 'function') return relation.toArray();
  return [];
}

async function resolveAddress(em, authUser, input) {
  if (input.addressId) {
    return em.findOne('Address', { id: input.addressId, user: authUser.userId });
  }

  if (input.newAddress) {
    const user = await em.findOne('User', { id: authUser.userId });
    if (input.newAddress.isDefault) {
      await em.nativeUpdate('Address', { user: authUser.userId }, { isDefault: false });
    }
    const created = em.create('Address', {
      ...input.newAddress,
      user,
      isDefault: Boolean(input.newAddress.isDefault),
    });
    await em.persist(created);
    return created;
  }

  return em.findOne('Address', { user: authUser.userId, isDefault: true });
}

async function ordersRoutes(fastify) {
  fastify.post('/orders', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const input = checkoutSchema.parse(request.body);
    const em = fastify.orm.em.fork();

    const address = await resolveAddress(em, request.authUser, input);
    if (!address) {
      return reply.code(400).send({ message: 'Address is required' });
    }

    const user = await em.findOne('User', { id: request.authUser.userId });
    const order = em.create('Order', {
      user,
      address,
      totalAmountCents: 0,
      status: OrderStatus.PENDING,
      paymentStatus: PaymentStatus.PENDING,
    });

    let total = 0;

    for (const inputItem of input.items) {
      const product = await em.findOne('Product', { id: inputItem.productId }, { populate: ['availableColors'] });
      if (!product) {
        return reply.code(404).send({ message: `Product ${inputItem.productId} not found` });
      }

      if (product.stock < inputItem.quantity) {
        return reply.code(400).send({ message: `Insufficient stock for ${product.name}` });
      }

      if (inputItem.colorName) {
        const colorExists = relationItems(product.availableColors).some(
          (c) => c.colorName === inputItem.colorName
        );
        if (!colorExists) {
          return reply.code(400).send({ message: `Color not available for ${product.name}` });
        }
      }

      const subtotal = product.priceCents * inputItem.quantity;
      total += subtotal;
      product.stock -= inputItem.quantity;

      em.create('OrderItem', {
        order,
        product,
        productNameSnapshot: product.name,
        productPriceSnapshotCents: product.priceCents,
        colorName: inputItem.colorName,
        quantity: inputItem.quantity,
        subtotalCents: subtotal,
      });
    }

    order.totalAmountCents = total;
    await em.persistAndFlush(order);

    const fullOrder = await em.findOne(
      'Order',
      { id: order.id },
      { populate: ['address', 'items.product', 'user'] }
    );

    return reply.code(201).send({ data: toOrderDto(fullOrder) });
  });

  fastify.get('/user/orders', { preHandler: [fastify.authenticate] }, async (request) => {
    const orders = await fastify.orm.em.fork().find(
      'Order',
      { user: request.authUser.userId },
      { populate: ['address', 'items.product'], orderBy: { createdAt: 'DESC' } }
    );

    return { data: orders.map(toOrderDto) };
  });

  fastify.get('/user/orders/:id', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const id = Number(request.params.id);
    const order = await fastify.orm.em.fork().findOne(
      'Order',
      { id, user: request.authUser.userId },
      { populate: ['address', 'items.product', 'user'] }
    );

    if (!order) return reply.code(404).send({ message: 'Order not found' });
    return { data: toOrderDto(order) };
  });

  fastify.get(
    '/admin/orders',
    { preHandler: [fastify.requireAnyRole([UserRole.ADMIN, UserRole.MANAGER])] },
    async () => {
      const orders = await fastify.orm.em.fork().find(
        'Order',
        {},
        { populate: ['address', 'items.product', 'user'], orderBy: { createdAt: 'DESC' } }
      );

      return { data: orders.map(toOrderDto) };
    }
  );

  fastify.get(
    '/admin/orders/:id',
    { preHandler: [fastify.requireAnyRole([UserRole.ADMIN, UserRole.MANAGER])] },
    async (request, reply) => {
      const id = Number(request.params.id);
      const order = await fastify.orm.em.fork().findOne(
        'Order',
        { id },
        { populate: ['address', 'items.product', 'user'] }
      );

      if (!order) return reply.code(404).send({ message: 'Order not found' });
      return { data: toOrderDto(order) };
    }
  );

  fastify.patch(
    '/admin/orders/:id/status',
    { preHandler: [fastify.requireAnyRole([UserRole.ADMIN, UserRole.MANAGER])] },
    async (request, reply) => {
      const input = updateStatusSchema.parse(request.body);
      const id = Number(request.params.id);
      const em = fastify.orm.em.fork();
      const order = await em.findOne('Order', { id });
      if (!order) return reply.code(404).send({ message: 'Order not found' });

      order.status = input.status;
      if (input.paymentStatus) order.paymentStatus = input.paymentStatus;
      await em.persistAndFlush(order);

      return { data: order };
    }
  );
}

module.exports = ordersRoutes;
