const fp = require('fastify-plugin');
const { verifyAccessToken } = require('../utils/jwt');

module.exports = fp(async function authPlugin(fastify) {
  fastify.decorate('authenticate', async function authenticate(request, reply) {
    const authHeader = request.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if (!token) {
      return reply.code(401).send({ message: 'Unauthorized' });
    }

    try {
      const payload = await verifyAccessToken(token);
      request.authUser = {
        userId: Number(payload.userId),
        role: payload.role,
        email: payload.email,
      };
    } catch (error) {
      return reply.code(401).send({ message: 'Invalid token' });
    }
  });

  fastify.decorate('requireAuth', function requireAuth() {
    return async function authGuard(request, reply) {
      await fastify.authenticate(request, reply);
    };
  });

});
