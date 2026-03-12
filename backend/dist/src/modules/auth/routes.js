"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const { z } = require('zod');
const { UserRole } = require('../../constants/enums');
const { hashPassword, comparePassword } = require('../../utils/password');
const { signAccessToken } = require('../../utils/jwt');
const registerSchema = z.object({
    firstName: z.string().min(2),
    lastName: z.string().min(2),
    email: z.string().email(),
    phone: z.string().optional(),
    password: z.string().min(6),
});
const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
});
function userDto(user) {
    return {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        isActive: user.isActive,
    };
}
async function authRoutes(fastify) {
    fastify.post('/register', async (request, reply) => {
        const input = registerSchema.parse(request.body);
        const userRepo = fastify.orm.em.fork().getRepository('User');
        const existing = await userRepo.findOne({ email: input.email.toLowerCase() });
        if (existing) {
            return reply.code(409).send({ message: 'Email already exists' });
        }
        const user = userRepo.create({
            ...input,
            email: input.email.toLowerCase(),
            passwordHash: await hashPassword(input.password),
            role: UserRole.CUSTOMER,
            name: `${input.firstName} ${input.lastName}`,
        });
        await userRepo.getEntityManager().persistAndFlush(user);
        const token = await signAccessToken({
            userId: user.id,
            role: user.role,
            email: user.email,
        });
        return reply.code(201).send({ token, user: userDto(user) });
    });
    fastify.post('/login', async (request, reply) => {
        const input = loginSchema.parse(request.body);
        const userRepo = fastify.orm.em.fork().getRepository('User');
        const user = await userRepo.findOne({ email: input.email.toLowerCase() });
        if (!user || !user.isActive) {
            return reply.code(401).send({ message: 'Invalid credentials' });
        }
        const isValid = await comparePassword(input.password, user.passwordHash);
        if (!isValid) {
            return reply.code(401).send({ message: 'Invalid credentials' });
        }
        const token = await signAccessToken({
            userId: user.id,
            role: user.role,
            email: user.email,
        });
        return { token, user: userDto(user) };
    });
    fastify.get('/me', { preHandler: [fastify.authenticate] }, async (request, reply) => {
        const userRepo = fastify.orm.em.fork().getRepository('User');
        const user = await userRepo.findOne({ id: request.authUser.userId });
        if (!user) {
            return reply.code(404).send({ message: 'User not found' });
        }
        return { user: userDto(user) };
    });
}
module.exports = authRoutes;
