const { z } = require('zod');
const { PaymentStatus, UserRole } = require('../../constants/enums');

function isStaff(authUser: { role: string }) {
  return authUser.role === UserRole.ADMIN || authUser.role === UserRole.MANAGER;
}

function displayName(user: {
  name: string | null;
  firstName: string;
  lastName: string;
  email: string;
}): string {
  const n = (user.name ?? '').trim();
  if (n) return n;
  const combined = `${user.firstName} ${user.lastName}`.trim();
  if (combined) return combined;
  return user.email;
}

function buildSearchWhere(q: string | undefined) {
  if (!q?.trim()) return {};
  const s = q.trim();
  return {
    OR: [
      { email: { contains: s, mode: 'insensitive' } },
      { name: { contains: s, mode: 'insensitive' } },
      { firstName: { contains: s, mode: 'insensitive' } },
      { lastName: { contains: s, mode: 'insensitive' } },
    ],
  };
}

async function usersRoutes(fastify: any) {
  fastify.get('/admin/customers', { preHandler: [fastify.authenticate] }, async (request: any, reply: any) => {
    if (!isStaff(request.authUser)) {
      return reply.code(403).send({ message: 'Forbidden' });
    }

    const query = z
      .object({
        page: z.coerce.number().int().positive().default(1),
        limit: z.coerce.number().int().positive().max(100).default(10),
        view: z
          .enum(['all', 'new', 'abandoned', 'locals', 'email_subscribers', 'top_reviews'])
          .default('all'),
        q: z.string().optional(),
        country: z.string().optional(),
        vip: z.enum(['all', '1']).optional(),
      })
      .parse(request.query || {});

    const prisma = fastify.prisma;
    const baseRole = { role: UserRole.CUSTOMER };
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const search = buildSearchWhere(query.q);

    const groups = await prisma.order.groupBy({
      by: ['userId'],
      _count: { _all: true },
    });
    const vipUserIds = groups.filter((g: { _count: { _all: number } }) => g._count._all >= 5).map((g: { userId: number }) => g.userId);

    function buildListWhere(view: string) {
      const s = { ...baseRole, ...search };
      let w: Record<string, unknown> = { ...s };

      if (query.country?.trim()) {
        w = {
          AND: [
            w,
            {
              addresses: {
                some: { country: { contains: query.country.trim(), mode: 'insensitive' } },
              },
            },
          ],
        };
      }

      if (query.vip === '1') {
        w = {
          AND: [w, { id: { in: vipUserIds.length ? vipUserIds : [-1] } }],
        };
      }

      function withAnd(extra: Record<string, unknown>) {
        if ('AND' in w && Array.isArray((w as { AND: unknown[] }).AND)) {
          return { AND: [...(w as { AND: unknown[] }).AND, extra] };
        }
        return { AND: [w, extra] };
      }

      switch (view) {
        case 'new':
          return { ...w, createdAt: { gte: sevenDaysAgo } };
        case 'abandoned':
          return { ...w, orders: { some: { paymentStatus: PaymentStatus.PENDING } } };
        case 'locals':
          return withAnd({ addresses: { some: { id: { gt: 0 } } } });
        case 'email_subscribers':
          return { ...w, isActive: true };
        case 'top_reviews':
          return withAnd({ id: { in: [] } });
        default:
          return w;
      }
    }

    const listWhere = buildListWhere(query.view);

    const [all, newCount, abandoned, locals, emailSubscribers, total, rows] = await Promise.all([
      prisma.user.count({ where: { ...baseRole, ...search } }),
      prisma.user.count({ where: { ...baseRole, ...search, createdAt: { gte: sevenDaysAgo } } }),
      prisma.user.count({
        where: {
          ...baseRole,
          ...search,
          orders: { some: { paymentStatus: PaymentStatus.PENDING } },
        },
      }),
      prisma.user.count({
        where: {
          ...baseRole,
          ...search,
          addresses: { some: { id: { gt: 0 } } },
        },
      }),
      prisma.user.count({ where: { ...baseRole, ...search, isActive: true } }),
      prisma.user.count({ where: listWhere }),
      prisma.user.findMany({
        where: listWhere,
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        orderBy: { updatedAt: 'desc' },
        include: {
          addresses: { orderBy: { isDefault: 'desc' }, take: 1 },
          orders: {
            select: {
              totalAmountCents: true,
              paymentStatus: true,
              createdAt: true,
            },
          },
          _count: { select: { orders: true } },
        },
      }),
    ]);

    const data = rows.map((u: any) => {
      const paid = u.orders.filter((o: any) => o.paymentStatus === PaymentStatus.PAID);
      const totalSpentCents = paid.reduce((sum: number, o: any) => sum + o.totalAmountCents, 0);
      const orderDates = u.orders.map((o: any) => new Date(o.createdAt).getTime());
      const lastOrderAt =
        orderDates.length > 0 ? new Date(Math.max(...orderDates)).toISOString() : null;
      const addr = u.addresses[0];
      const city = addr?.city ?? '—';

      return {
        id: u.id,
        name: displayName(u),
        email: u.email,
        orderCount: u._count.orders,
        totalSpentCents,
        city,
        lastSeenAt: u.updatedAt.toISOString(),
        lastOrderAt,
        createdAt: u.createdAt.toISOString(),
      };
    });

    const counts = {
      all,
      new: newCount,
      abandoned,
      locals,
      email_subscribers: emailSubscribers,
      top_reviews: 0,
    };

    return {
      data,
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit) || 1,
      },
      counts,
    };
  });
}

module.exports = usersRoutes;
