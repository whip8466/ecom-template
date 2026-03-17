const { z } = require('zod');
const slugify = require('slugify');
const { UserRole } = require('../../constants/enums');

const adminGuard = (fastify) => [fastify.authenticate, fastify.requireAnyRole([UserRole.ADMIN, UserRole.MANAGER])];

function mapProduct(product) {
  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    shortDescription: product.shortDescription,
    description: product.description,
    priceCents: product.priceCents,
    stock: product.stock,
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

  // --- Admin: categories CRUD ---
  const categoryCreateSchema = z.object({ name: z.string().min(1), slug: z.string().min(1).optional() });
  const categoryUpdateSchema = z.object({ name: z.string().min(1).optional(), slug: z.string().min(1).optional() });

  fastify.get('/admin/categories', { preHandler: adminGuard(fastify) }, async () => {
    const categories = await fastify.prisma.category.findMany({ orderBy: { name: 'asc' } });
    return { data: categories };
  });

  fastify.post('/admin/categories', { preHandler: adminGuard(fastify) }, async (request, reply) => {
    const body = categoryCreateSchema.parse(request.body);
    const slug = body.slug || slugify(body.name, { lower: true, strict: true });
    const category = await fastify.prisma.category.create({
      data: { name: body.name, slug },
    });
    return reply.code(201).send({ data: category });
  });

  fastify.put('/admin/categories/:id', { preHandler: adminGuard(fastify) }, async (request, reply) => {
    const id = z.coerce.number().int().positive().parse(request.params.id);
    const body = categoryUpdateSchema.parse(request.body);
    const update: { name?: string; slug?: string } = {};
    if (body.name != null) update.name = body.name;
    if (body.slug != null) update.slug = body.slug;
    const category = await fastify.prisma.category.update({ where: { id }, data: update });
    return { data: category };
  });

  fastify.delete('/admin/categories/:id', { preHandler: adminGuard(fastify) }, async (request, reply) => {
    const id = z.coerce.number().int().positive().parse(request.params.id);
    await fastify.prisma.category.delete({ where: { id } });
    return reply.code(204).send();
  });

  // --- Admin: products CRUD ---
  const productCreateSchema = z.object({
    name: z.string().min(1),
    slug: z.string().min(1).optional(),
    shortDescription: z.string().optional(),
    description: z.string().optional(),
    priceCents: z.number().int().nonnegative(),
    stock: z.number().int().nonnegative().default(0),
    categoryId: z.number().int().positive(),
    imageUrls: z.array(z.string().url()).optional(),
    colors: z.array(z.object({ colorName: z.string(), colorCode: z.string(), stock: z.number().int().nonnegative().optional() })).optional(),
  });
  const productUpdateSchema = productCreateSchema.partial();

  fastify.post('/admin/products', { preHandler: adminGuard(fastify) }, async (request, reply) => {
    const body = productCreateSchema.parse(request.body);
    const slug = body.slug || slugify(body.name, { lower: true, strict: true });
    const product = await fastify.prisma.$transaction(async (tx) => {
      const p = await tx.product.create({
        data: {
          name: body.name,
          slug,
          shortDescription: body.shortDescription ?? null,
          description: body.description ?? null,
          priceCents: body.priceCents,
          stock: body.stock,
          categoryId: body.categoryId,
        },
      });
      if (body.imageUrls?.length) {
        await tx.productImage.createMany({
          data: body.imageUrls.map((imageUrl) => ({ productId: p.id, imageUrl })),
        });
      }
      if (body.colors?.length) {
        await tx.productColor.createMany({
          data: body.colors.map((c) => ({
            productId: p.id,
            colorName: c.colorName,
            colorCode: c.colorCode,
            stock: c.stock ?? null,
          })),
        });
      }
      return tx.product.findUnique({
        where: { id: p.id },
        include: { category: true, images: true, availableColors: true },
      });
    });
    return reply.code(201).send({ data: mapProduct(product) });
  });

  fastify.put('/admin/products/:id', { preHandler: adminGuard(fastify) }, async (request, reply) => {
    const id = z.coerce.number().int().positive().parse(request.params.id);
    const body = productUpdateSchema.parse(request.body);
    const slug = body.slug ?? (body.name ? slugify(body.name, { lower: true, strict: true }) : undefined);
    const update: {
      name?: string;
      slug?: string;
      shortDescription?: string | null;
      description?: string | null;
      priceCents?: number;
      stock?: number;
      categoryId?: number;
    } = {};
    if (body.name != null) update.name = body.name;
    if (slug != null) update.slug = slug;
    if (body.shortDescription !== undefined) update.shortDescription = body.shortDescription;
    if (body.description !== undefined) update.description = body.description;
    if (body.priceCents != null) update.priceCents = body.priceCents;
    if (body.stock != null) update.stock = body.stock;
    if (body.categoryId != null) update.categoryId = body.categoryId;
    const product = await fastify.prisma.product.update({
      where: { id },
      data: update,
      include: { category: true, images: true, availableColors: true },
    });
    return { data: mapProduct(product) };
  });

  fastify.delete('/admin/products/:id', { preHandler: adminGuard(fastify) }, async (request, reply) => {
    const id = z.coerce.number().int().positive().parse(request.params.id);
    await fastify.prisma.product.delete({ where: { id } });
    return reply.code(204).send();
  });
}

module.exports = catalogRoutes;
