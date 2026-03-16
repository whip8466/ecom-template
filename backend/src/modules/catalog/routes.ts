const { z } = require('zod');
const slugify = require('slugify');
const { UserRole } = require('../../constants/enums');

const categorySchema = z.object({
  name: z.string().min(2),
  slug: z.string().min(2).optional(),
});

const productSchema = z.object({
  name: z.string().min(2),
  slug: z.string().min(2).optional(),
  shortDescription: z.string().optional(),
  description: z.string().optional(),
  priceCents: z.number().int().nonnegative(),
  stock: z.number().int().nonnegative(),
  categoryId: z.number().int().positive(),
  images: z.array(z.object({ imageUrl: z.string().url() })).optional().default([]),
  colors: z
    .array(
      z.object({
        colorName: z.string().min(2),
        colorCode: z.string().min(3),
        stock: z.number().int().nonnegative().optional(),
      })
    )
    .optional()
    .default([]),
});

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

  fastify.post(
    '/admin/categories',
    { preHandler: [fastify.requireAnyRole([UserRole.ADMIN, UserRole.MANAGER])] },
    async (request, reply) => {
      const input = categorySchema.parse(request.body);
      const category = await fastify.prisma.category.create({
        data: {
          name: input.name,
          slug: input.slug || slugify(input.name, { lower: true, strict: true }),
        },
      });
      return reply.code(201).send({ data: category });
    }
  );

  fastify.put(
    '/admin/categories/:id',
    { preHandler: [fastify.requireAnyRole([UserRole.ADMIN, UserRole.MANAGER])] },
    async (request, reply) => {
      const input = categorySchema.parse(request.body);
      const id = Number(request.params.id);
      const prisma = fastify.prisma;
      const category = await prisma.category.findUnique({ where: { id } });
      if (!category) return reply.code(404).send({ message: 'Category not found' });

      const updated = await prisma.category.update({
        where: { id },
        data: {
          name: input.name,
          slug: input.slug || slugify(input.name, { lower: true, strict: true }),
        },
      });

      return { data: updated };
    }
  );

  fastify.delete(
    '/admin/categories/:id',
    { preHandler: [fastify.requireAnyRole([UserRole.ADMIN])] },
    async (request, reply) => {
      const id = Number(request.params.id);
      const prisma = fastify.prisma;
      const category = await prisma.category.findUnique({ where: { id } });
      if (!category) return reply.code(404).send({ message: 'Category not found' });
      await prisma.category.delete({ where: { id } });
      return { success: true };
    }
  );

  fastify.post(
    '/admin/products',
    { preHandler: [fastify.requireAnyRole([UserRole.ADMIN, UserRole.MANAGER])] },
    async (request, reply) => {
      const input = productSchema.parse(request.body);
      const prisma = fastify.prisma;

      const category = await prisma.category.findUnique({ where: { id: input.categoryId } });
      if (!category) return reply.code(404).send({ message: 'Category not found' });

      const product = await prisma.product.create({
        data: {
          name: input.name,
          slug: input.slug || slugify(input.name, { lower: true, strict: true }),
          shortDescription: input.shortDescription,
          description: input.description,
          priceCents: input.priceCents,
          stock: input.stock,
          categoryId: category.id,
          images: {
            create: input.images.map((img) => ({ imageUrl: img.imageUrl })),
          },
          availableColors: {
            create: input.colors.map((color) => ({
              colorName: color.colorName,
              colorCode: color.colorCode,
              stock: color.stock,
            })),
          },
        },
      });

      const reloaded = await prisma.product.findUnique({
        where: { id: product.id },
        include: { category: true, images: true, availableColors: true },
      });
      return reply.code(201).send({ data: mapProduct(reloaded) });
    }
  );

  fastify.put(
    '/admin/products/:id',
    { preHandler: [fastify.requireAnyRole([UserRole.ADMIN, UserRole.MANAGER])] },
    async (request, reply) => {
      const input = productSchema.parse(request.body);
      const id = Number(request.params.id);
      const prisma = fastify.prisma;
      const product = await prisma.product.findUnique({ where: { id } });
      if (!product) return reply.code(404).send({ message: 'Product not found' });

      const category = await prisma.category.findUnique({ where: { id: input.categoryId } });
      if (!category) return reply.code(404).send({ message: 'Category not found' });

      await prisma.$transaction([
        prisma.productImage.deleteMany({ where: { productId: id } }),
        prisma.productColor.deleteMany({ where: { productId: id } }),
        prisma.product.update({
          where: { id },
          data: {
            name: input.name,
            slug: input.slug || slugify(input.name, { lower: true, strict: true }),
            shortDescription: input.shortDescription,
            description: input.description,
            priceCents: input.priceCents,
            stock: input.stock,
            categoryId: category.id,
          },
        }),
      ]);

      if (input.images.length) {
        await prisma.productImage.createMany({
          data: input.images.map((img) => ({ productId: id, imageUrl: img.imageUrl })),
        });
      }
      if (input.colors.length) {
        await prisma.productColor.createMany({
          data: input.colors.map((color) => ({
            productId: id,
            colorName: color.colorName,
            colorCode: color.colorCode,
            stock: color.stock,
          })),
        });
      }

      const reloaded = await prisma.product.findUnique({
        where: { id },
        include: { category: true, images: true, availableColors: true },
      });
      return { data: mapProduct(reloaded) };
    }
  );

  fastify.delete(
    '/admin/products/:id',
    { preHandler: [fastify.requireAnyRole([UserRole.ADMIN])] },
    async (request, reply) => {
      const id = Number(request.params.id);
      const prisma = fastify.prisma;
      const product = await prisma.product.findUnique({ where: { id } });
      if (!product) return reply.code(404).send({ message: 'Product not found' });

      await prisma.product.delete({ where: { id } });
      return { success: true };
    }
  );
}

module.exports = catalogRoutes;
