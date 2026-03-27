const Fastify = require('fastify');
const cors = require('@fastify/cors');
const sensible = require('@fastify/sensible');
const authPlugin = require('./plugins/auth');
const authRoutes = require('./modules/auth/routes');
const catalogRoutes = require('./modules/catalog/routes');
const addressesRoutes = require('./modules/addresses/routes');
const ordersRoutes = require('./modules/orders/routes');
const usersRoutes = require('./modules/users/routes');
const wishlistRoutes = require('./modules/wishlist/routes');
const { env } = require('./config/env');

async function buildApp(prisma) {
  const fastify = Fastify({ logger: true });
  const allowedOrigins = new Set([
    env.FRONTEND_ORIGIN,
    'http://localhost:3000',
    'http://127.0.0.1:3000',
  ]);

  fastify.decorate('prisma', prisma);

  await fastify.register(sensible);
  await fastify.register(cors, {
    origin(origin, callback) {
      // Allow non-browser clients (curl/postman) with no Origin header.
      if (!origin) {
        callback(null, true);
        return;
      }
      callback(null, allowedOrigins.has(origin));
    },
    credentials: true,
    methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });
  await fastify.register(authPlugin);

  fastify.setErrorHandler((error, request, reply) => {
    if (error?.name === 'ZodError') {
      return reply.code(400).send({ message: 'Validation failed', errors: error.issues });
    }

    request.log.error(error);
    return reply.code(error.statusCode || 500).send({ message: error.message || 'Internal server error' });
  });

  fastify.get('/health', async () => ({ status: 'ok' }));

  await fastify.register(async (api) => {
    await api.register(authRoutes, { prefix: '/auth' });
    await api.register(catalogRoutes);
    await api.register(addressesRoutes);
    await api.register(ordersRoutes);
    await api.register(usersRoutes);
    await api.register(wishlistRoutes);
  }, { prefix: '/api' });

  return fastify;
}

module.exports = { buildApp };
