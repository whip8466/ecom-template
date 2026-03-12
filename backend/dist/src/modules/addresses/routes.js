"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
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
        const items = await fastify.orm.em.fork().find('Address', { user: request.authUser.userId }, { orderBy: [{ isDefault: 'DESC' }, { createdAt: 'DESC' }] });
        return { data: items };
    });
    fastify.post('/user/addresses', { preHandler: [fastify.authenticate] }, async (request, reply) => {
        const input = addressSchema.parse(request.body);
        const em = fastify.orm.em.fork();
        const user = await em.findOne('User', { id: request.authUser.userId });
        if (!user)
            return reply.code(404).send({ message: 'User not found' });
        if (input.isDefault) {
            await em.nativeUpdate('Address', { user: request.authUser.userId }, { isDefault: false });
        }
        const address = em.create('Address', { ...input, user, isDefault: Boolean(input.isDefault) });
        await em.persistAndFlush(address);
        return reply.code(201).send({ data: address });
    });
    fastify.put('/user/addresses/:id', { preHandler: [fastify.authenticate] }, async (request, reply) => {
        const input = addressSchema.parse(request.body);
        const id = Number(request.params.id);
        const em = fastify.orm.em.fork();
        const address = await em.findOne('Address', { id, user: request.authUser.userId });
        if (!address)
            return reply.code(404).send({ message: 'Address not found' });
        if (input.isDefault) {
            await em.nativeUpdate('Address', { user: request.authUser.userId }, { isDefault: false });
        }
        Object.assign(address, { ...input, isDefault: Boolean(input.isDefault) });
        await em.persistAndFlush(address);
        return { data: address };
    });
    fastify.delete('/user/addresses/:id', { preHandler: [fastify.authenticate] }, async (request, reply) => {
        const id = Number(request.params.id);
        const em = fastify.orm.em.fork();
        const address = await em.findOne('Address', { id, user: request.authUser.userId });
        if (!address)
            return reply.code(404).send({ message: 'Address not found' });
        await em.removeAndFlush(address);
        return { success: true };
    });
    fastify.patch('/user/addresses/:id/default', { preHandler: [fastify.authenticate] }, async (request, reply) => {
        const id = Number(request.params.id);
        const em = fastify.orm.em.fork();
        const address = await em.findOne('Address', { id, user: request.authUser.userId });
        if (!address)
            return reply.code(404).send({ message: 'Address not found' });
        await em.nativeUpdate('Address', { user: request.authUser.userId }, { isDefault: false });
        address.isDefault = true;
        await em.persistAndFlush(address);
        return { data: address };
    });
}
module.exports = addressesRoutes;
