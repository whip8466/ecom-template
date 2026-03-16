const { env } = require('./config/env');
const { initORM } = require('./db/orm');
const { buildApp } = require('./app');

async function start() {
  const prisma = await initORM();
  const app = await buildApp(prisma);

  try {
    await app.listen({ port: env.PORT, host: '0.0.0.0' });
  } catch (error) {
    app.log.error(error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

start();
