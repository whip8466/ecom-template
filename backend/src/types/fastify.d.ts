import type { PrismaClient } from '@prisma/client';
import 'fastify';

declare module 'fastify' {
  interface FastifyInstance {
    prisma: PrismaClient;
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }

  interface FastifyRequest {
    authUser?: {
      userId: number;
      role: string;
      email: string;
    };
  }
}
