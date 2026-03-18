const { z } = require('zod');
const { UserRole } = require('../../constants/enums');

function mapProduct(product) {
  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    shortDescription: product.shortDescription,
    description: product.description,
    priceCents: product.priceCents,
    stock: product.stock,
    createdAt: product.createdAt,
    category: product.category
      ? { id: product.category.id, name: product.category.name, slug: product.category.slug }
      : null,
    images: (product.images || []).map((img) => ({ id: img.id, imageUrl: img.imageUrl })),
    availableColors: (product.availableColors || []).map((c) => ({
      id: c.id,
      colorName: c.colorName,
      colorCode: c.colorCode,
      stock: c.stock,
    })),
  };
}

async function catalogRoutes(fastify) {
  fastify.get('/products', async (request) => {
    const query = z
      .object({
        q: z.string().optional(),
        category: z.string().optional(),
        page: z.coerce.number().int().positive().default(1),
        limit: z.coerce.number().int().positive().max(50).default(12),
      })
      .parse(request.query || {});

    const prisma = fastify.prisma;
    const where = {} as Record<string, any>;

    if (query.q) {
      where.name = { contains: query.q, mode: 'insensitive' };
    }

    if (query.category) {
      where.category = { is: { slug: query.category } };
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: { category: true, images: true, availableColors: true },
        orderBy: { createdAt: 'desc' },
        take: query.limit,
        skip: (query.page - 1) * query.limit,
      }),
      prisma.product.count({ where }),
    ]);

    return {
      data: products.map(mapProduct),
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit) || 1,
      },
    };
  });

  fastify.get('/products/:slug', async (request, reply) => {
    const { slug } = request.params;
    const product = await fastify.prisma.product.findUnique({
      where: { slug },
      include: { category: true, images: true, availableColors: true },
    });

    if (!product) {
      return reply.code(404).send({ message: 'Product not found' });
    }

    return { data: mapProduct(product) };
  });

  fastify.get('/categories', async () => {
    const categories = await fastify.prisma.category.findMany({ orderBy: { name: 'asc' } });
    return { data: categories };
  });

  fastify.post(
    '/categories',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const user = request.authUser;
      if (user.role !== UserRole.ADMIN && user.role !== UserRole.MANAGER) {
        return reply.code(403).send({ message: 'Forbidden' });
      }
      const body = z.object({ name: z.string().min(1).max(120) }).parse(request.body);
      const prisma = fastify.prisma;
      const slug = body.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
      if (!slug) {
        return reply.code(400).send({ message: 'Invalid category name' });
      }
      const existing = await prisma.category.findUnique({ where: { slug } });
      if (existing) {
        return reply.code(409).send({ message: 'Category with this name already exists' });
      }
      const category = await prisma.category.create({
        data: { name: body.name.trim(), slug },
      });
      return reply.code(201).send({ data: category });
    }
  );

  fastify.get('/vendors', async () => {
    const vendors = await fastify.prisma.vendor.findMany({ orderBy: { name: 'asc' } });
    return { data: vendors };
  });

  fastify.post(
    '/vendors',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const user = request.authUser;
      if (user.role !== UserRole.ADMIN && user.role !== UserRole.MANAGER) {
        return reply.code(403).send({ message: 'Forbidden' });
      }
      const body = z.object({ name: z.string().min(1).max(120) }).parse(request.body);
      const prisma = fastify.prisma;
      const slug = body.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
      if (!slug) {
        return reply.code(400).send({ message: 'Invalid vendor name' });
      }
      const existing = await prisma.vendor.findUnique({ where: { slug } });
      if (existing) {
        return reply.code(409).send({ message: 'Vendor with this name already exists' });
      }
      const vendor = await prisma.vendor.create({
        data: { name: body.name.trim(), slug },
      });
      return reply.code(201).send({ data: vendor });
    }
  );

  fastify.get('/collections', async (request, reply) => {
    try {
      const collections = await fastify.prisma.collection.findMany({ orderBy: { name: 'asc' } });
      return { data: collections };
    } catch (err) {
      request.log.error(err);
      const msg = (err && typeof err === 'object' && 'message' in err && err.message) || 'Failed to load collections. Run: npx prisma db push';
      return reply.code(500).send({ message: String(msg) });
    }
  });

  fastify.post(
    '/collections',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const user = request.authUser;
      if (user.role !== UserRole.ADMIN && user.role !== UserRole.MANAGER) {
        return reply.code(403).send({ message: 'Forbidden' });
      }
      const body = z.object({ name: z.string().min(1).max(120) }).parse(request.body);
      const prisma = fastify.prisma;
      const slug = body.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
      if (!slug) {
        return reply.code(400).send({ message: 'Invalid collection name' });
      }
      const existing = await prisma.collection.findUnique({ where: { slug } });
      if (existing) {
        return reply.code(409).send({ message: 'Collection with this name already exists' });
      }
      const collection = await prisma.collection.create({
        data: { name: body.name.trim(), slug },
      });
      return reply.code(201).send({ data: collection });
    }
  );

  fastify.get('/tags', async (request, reply) => {
    try {
      const tags = await fastify.prisma.tag.findMany({ orderBy: { name: 'asc' } });
      return { data: tags };
    } catch (err) {
      request.log.error(err);
      const msg = (err && typeof err === 'object' && 'message' in err && err.message) || 'Failed to load tags. Run: npx prisma db push';
      return reply.code(500).send({ message: String(msg) });
    }
  });

  fastify.post(
    '/tags',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const user = request.authUser;
      if (user.role !== UserRole.ADMIN && user.role !== UserRole.MANAGER) {
        return reply.code(403).send({ message: 'Forbidden' });
      }
      const body = z.object({ name: z.string().min(1).max(120) }).parse(request.body);
      const prisma = fastify.prisma;
      const slug = body.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
      if (!slug) {
        return reply.code(400).send({ message: 'Invalid tag name' });
      }
      const existing = await prisma.tag.findUnique({ where: { slug } });
      if (existing) {
        return reply.code(409).send({ message: 'Tag with this name already exists' });
      }
      const tag = await prisma.tag.create({
        data: { name: body.name.trim(), slug },
      });
      return reply.code(201).send({ data: tag });
    }
  );

  fastify.get('/product-option-types', async (request, reply) => {
    try {
      const types = await fastify.prisma.productOptionType.findMany({
        include: {
          values: { orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }] },
        },
        orderBy: { name: 'asc' },
      });
      const data = types.map((t) => ({
        id: t.id,
        name: t.name,
        slug: t.slug,
        values: (t.values || []).map((v) => ({ id: v.id, value: v.value, label: v.label })),
      }));
      return { data };
    } catch (err) {
      request.log.error(err);
      const msg = (err && typeof err === 'object' && 'message' in err && err.message) || 'Failed to load option types';
      return reply.code(500).send({ message: String(msg) });
    }
  });

  const createProductSchema = z.object({
    name: z.string().min(1),
    shortDescription: z.string().optional(),
    description: z.string().optional(),
    priceCents: z.number().int().nonnegative(),
    stock: z.number().int().nonnegative().default(0),
    categoryId: z.number().int().positive(),
    imageUrls: z.array(z.string().url()).optional().default([]),
  });

  fastify.post(
    '/products',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const user = request.authUser;
      if (user.role !== UserRole.ADMIN && user.role !== UserRole.MANAGER) {
        return reply.code(403).send({ message: 'Forbidden' });
      }

      const body = createProductSchema.parse(request.body);
      const prisma = fastify.prisma;

      const slug = body.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
      if (!slug) {
        return reply.code(400).send({ message: 'Invalid product name' });
      }

      const existing = await prisma.product.findUnique({ where: { slug } });
      if (existing) {
        return reply.code(409).send({ message: 'Product with this name already exists' });
      }

      const category = await prisma.category.findUnique({ where: { id: body.categoryId } });
      if (!category) {
        return reply.code(400).send({ message: 'Category not found' });
      }

      const product = await prisma.product.create({
        data: {
          name: body.name,
          slug,
          shortDescription: body.shortDescription ?? null,
          description: body.description ?? null,
          priceCents: body.priceCents,
          stock: body.stock,
          categoryId: body.categoryId,
        },
        include: { category: true, images: true, availableColors: true },
      });

      for (const imageUrl of body.imageUrls) {
        await prisma.productImage.create({
          data: { productId: product.id, imageUrl },
        });
      }

      const withImages = await prisma.product.findUnique({
        where: { id: product.id },
        include: { category: true, images: true, availableColors: true },
      });
      return reply.code(201).send({ data: mapProduct(withImages) });
    }
  );
}

module.exports = catalogRoutes;
