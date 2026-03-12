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

    const em = fastify.orm.em.fork();
    const where = {} as Record<string, unknown>;

    if (query.q) {
      where.name = { $ilike: `%${query.q}%` };
    }

    if (query.category) {
      where.category = { slug: query.category };
    }

    const [products, total] = await em.findAndCount(
      'Product',
      where,
      {
        populate: ['category', 'images', 'availableColors'],
        orderBy: { createdAt: 'DESC' },
        limit: query.limit,
        offset: (query.page - 1) * query.limit,
      }
    );

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
    const em = fastify.orm.em.fork();
    const product = await em.findOne(
      'Product',
      { slug },
      { populate: ['category', 'images', 'availableColors'] }
    );

    if (!product) {
      return reply.code(404).send({ message: 'Product not found' });
    }

    return { data: mapProduct(product) };
  });

  fastify.get('/categories', async () => {
    const categories = await fastify.orm.em.fork().find('Category', {}, { orderBy: { name: 'ASC' } });
    return { data: categories };
  });

  fastify.post(
    '/admin/categories',
    { preHandler: [fastify.requireAnyRole([UserRole.ADMIN, UserRole.MANAGER])] },
    async (request, reply) => {
      const input = categorySchema.parse(request.body);
      const repo = fastify.orm.em.fork().getRepository('Category');

      const category = repo.create({
        name: input.name,
        slug: input.slug || slugify(input.name, { lower: true, strict: true }),
      });
      await repo.getEntityManager().persistAndFlush(category);
      return reply.code(201).send({ data: category });
    }
  );

  fastify.put(
    '/admin/categories/:id',
    { preHandler: [fastify.requireAnyRole([UserRole.ADMIN, UserRole.MANAGER])] },
    async (request, reply) => {
      const input = categorySchema.parse(request.body);
      const id = Number(request.params.id);
      const em = fastify.orm.em.fork();
      const category = await em.findOne('Category', { id });
      if (!category) return reply.code(404).send({ message: 'Category not found' });

      category.name = input.name;
      category.slug = input.slug || slugify(input.name, { lower: true, strict: true });
      await em.persistAndFlush(category);

      return { data: category };
    }
  );

  fastify.delete(
    '/admin/categories/:id',
    { preHandler: [fastify.requireAnyRole([UserRole.ADMIN])] },
    async (request, reply) => {
      const id = Number(request.params.id);
      const em = fastify.orm.em.fork();
      const category = await em.findOne('Category', { id });
      if (!category) return reply.code(404).send({ message: 'Category not found' });
      await em.removeAndFlush(category);
      return { success: true };
    }
  );

  fastify.post(
    '/admin/products',
    { preHandler: [fastify.requireAnyRole([UserRole.ADMIN, UserRole.MANAGER])] },
    async (request, reply) => {
      const input = productSchema.parse(request.body);
      const em = fastify.orm.em.fork();

      const category = await em.findOne('Category', { id: input.categoryId });
      if (!category) return reply.code(404).send({ message: 'Category not found' });

      const product = em.create('Product', {
        name: input.name,
        slug: input.slug || slugify(input.name, { lower: true, strict: true }),
        shortDescription: input.shortDescription,
        description: input.description,
        priceCents: input.priceCents,
        stock: input.stock,
        category,
      });

      for (const img of input.images) {
        em.create('ProductImage', { product, imageUrl: img.imageUrl });
      }

      for (const color of input.colors) {
        em.create('ProductColor', { product, ...color });
      }

      await em.persistAndFlush(product);
      const reloaded = await em.findOne('Product', { id: product.id }, { populate: ['category', 'images', 'availableColors'] });
      return reply.code(201).send({ data: mapProduct(reloaded) });
    }
  );

  fastify.put(
    '/admin/products/:id',
    { preHandler: [fastify.requireAnyRole([UserRole.ADMIN, UserRole.MANAGER])] },
    async (request, reply) => {
      const input = productSchema.parse(request.body);
      const id = Number(request.params.id);
      const em = fastify.orm.em.fork();
      const product = await em.findOne('Product', { id }, { populate: ['images', 'availableColors'] });
      if (!product) return reply.code(404).send({ message: 'Product not found' });

      const category = await em.findOne('Category', { id: input.categoryId });
      if (!category) return reply.code(404).send({ message: 'Category not found' });

      product.name = input.name;
      product.slug = input.slug || slugify(input.name, { lower: true, strict: true });
      product.shortDescription = input.shortDescription;
      product.description = input.description;
      product.priceCents = input.priceCents;
      product.stock = input.stock;
      product.category = category;

      if (product.images?.length) {
        for (const img of product.images) em.remove(img);
      }
      if (product.availableColors?.length) {
        for (const color of product.availableColors) em.remove(color);
      }

      for (const img of input.images) {
        em.create('ProductImage', { product, imageUrl: img.imageUrl });
      }

      for (const color of input.colors) {
        em.create('ProductColor', { product, ...color });
      }

      await em.persistAndFlush(product);
      const reloaded = await em.findOne('Product', { id: product.id }, { populate: ['category', 'images', 'availableColors'] });
      return { data: mapProduct(reloaded) };
    }
  );

  fastify.delete(
    '/admin/products/:id',
    { preHandler: [fastify.requireAnyRole([UserRole.ADMIN])] },
    async (request, reply) => {
      const id = Number(request.params.id);
      const em = fastify.orm.em.fork();
      const product = await em.findOne('Product', { id });
      if (!product) return reply.code(404).send({ message: 'Product not found' });

      await em.removeAndFlush(product);
      return { success: true };
    }
  );
}

module.exports = catalogRoutes;
