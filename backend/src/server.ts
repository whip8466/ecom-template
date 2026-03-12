const { env } = require('./config/env');
const { initORM } = require('./db/orm');
const { buildApp } = require('./app');

async function start() {
  const orm = await initORM();
  const app = await buildApp(orm);

  try {
    await app.listen({ port: env.PORT, host: '0.0.0.0' });
  } catch (error) {
    app.log.error(error);
    process.exit(1);
  }
}

start();
