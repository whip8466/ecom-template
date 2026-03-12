const path = require('path');
const { defineConfig } = require('@mikro-orm/postgresql');
const { env } = require('./src/config/env');
const entities = require('./src/db/entities');

module.exports = defineConfig({
  entities: Object.values(entities),
  clientUrl: env.DATABASE_URL,
  debug: env.NODE_ENV !== 'production',
  migrations: {
    path: path.join(__dirname, 'migrations'),
    pathTs: path.join(__dirname, 'migrations'),
  },
  seeder: {
    path: path.join(__dirname, 'seeders'),
    pathTs: path.join(__dirname, 'seeders'),
  },
});
