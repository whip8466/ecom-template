const { z } = require('zod');

const addressSchema = z.object({
  fullName: z.string().min(2),
  phone: z.string().min(6),
  addressLine1: z.string().min(3),
  addressLine2: z.string().optional(),
  city: z.string().min(2),
  state: z.string().min(2),
  postalCode: z.string().min(3),
  country: z.string().min(2),
  isDefault: z.boolean().optional(),
});

async function addressesRoutes(fastify) {
  fastify.get('/user/addresses', { preHandler: [fastify.authenticate] }, async (request) => {
    const items = await fastify.prisma.address.findMany({
      where: { userId: request.authUser.userId },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });
    return { data: items };
  });

  fastify.post('/user/addresses', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const input = addressSchema.parse(request.body);
    const prisma = fastify.prisma;
    const user = await prisma.user.findUnique({ where: { id: request.authUser.userId } });

    if (!user) return reply.code(404).send({ message: 'User not found' });

    if (input.isDefault) {
      await prisma.address.updateMany({ where: { userId: request.authUser.userId }, data: { isDefault: false } });
    }

    const address = await prisma.address.create({
      data: { ...input, userId: user.id, isDefault: Boolean(input.isDefault) },
    });
    return reply.code(201).send({ data: address });
  });

  fastify.put('/user/addresses/:id', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const input = addressSchema.parse(request.body);
    const id = Number(request.params.id);
    const prisma = fastify.prisma;
    const address = await prisma.address.findFirst({ where: { id, userId: request.authUser.userId } });

    if (!address) return reply.code(404).send({ message: 'Address not found' });

    if (input.isDefault) {
      await prisma.address.updateMany({ where: { userId: request.authUser.userId }, data: { isDefault: false } });
    }

    const updated = await prisma.address.update({
      where: { id },
      data: { ...input, isDefault: Boolean(input.isDefault) },
    });
    return { data: updated };
  });

  fastify.delete('/user/addresses/:id', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const id = Number(request.params.id);
    const prisma = fastify.prisma;
    const address = await prisma.address.findFirst({ where: { id, userId: request.authUser.userId } });

    if (!address) return reply.code(404).send({ message: 'Address not found' });

    await prisma.address.delete({ where: { id } });
    return { success: true };
  });

  fastify.patch('/user/addresses/:id/default', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const id = Number(request.params.id);
    const prisma = fastify.prisma;
    const address = await prisma.address.findFirst({ where: { id, userId: request.authUser.userId } });

    if (!address) return reply.code(404).send({ message: 'Address not found' });

    await prisma.address.updateMany({ where: { userId: request.authUser.userId }, data: { isDefault: false } });
    const updated = await prisma.address.update({ where: { id }, data: { isDefault: true } });

    return { data: updated };
  });
}

module.exports = addressesRoutes;
