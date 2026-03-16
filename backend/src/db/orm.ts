const { PrismaClient } = require('@prisma/client');

let prismaInstance;

async function initORM() {
  if (!prismaInstance) {
    prismaInstance = new PrismaClient();
    await prismaInstance.$connect();
  }
  return prismaInstance;
}

module.exports = { initORM };
