const { z } = require('zod');
const { verifyAccessToken } = require('../../utils/jwt');
const { UserRole } = require('../../constants/enums');

const PRODUCT_STATUS = { DRAFT: 'DRAFT', PUBLISHED: 'PUBLISHED' };

function mapProduct(product) {
  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    status: product.status ?? PRODUCT_STATUS.PUBLISHED,
    shortDescription: product.shortDescription,
    description: product.description,
    priceCents: product.priceCents,
    salePriceCents: product.salePriceCents ?? null,
    stock: product.stock,
    stockInTransit: product.stockInTransit ?? 0,
    lastRestockedAt: product.lastRestockedAt ? product.lastRestockedAt.toISOString() : null,
    totalStockLifetime: product.totalStockLifetime ?? 0,
    fulfillmentType: product.fulfillmentType ?? null,
    externalProductIdType: product.externalProductIdType ?? null,
    externalProductId: product.externalProductId ?? null,
    createdAt: product.createdAt,
    publishedAt: product.publishedAt ?? null,
    category: product.category
      ? { id: product.category.id, name: product.category.name, slug: product.category.slug }
      : null,
    vendor: product.vendor ? { id: product.vendor.id, name: product.vendor.name, slug: product.vendor.slug } : null,
    collection: product.collection ? { id: product.collection.id, name: product.collection.name, slug: product.collection.slug } : null,
    tags: (product.productTags || []).map((pt) => (pt.tag ? { id: pt.tag.id, name: pt.tag.name, slug: pt.tag.slug } : null)).filter(Boolean),
    images: (product.images || []).map((img) => ({ id: img.id, imageUrl: img.imageUrl })),
    availableColors: (product.availableColors || []).map((c) => ({
      id: c.id,
      colorName: c.colorName,
      colorCode: c.colorCode,
      stock: c.stock,
    })),
    variants: (product.variants || []).map((v) => ({
      id: v.id,
      sku: v.sku,
      priceCents: v.priceCents,
      stock: v.stock,
      optionValues: (v.optionValues || []).map((pvo) =>
        pvo.optionValue
          ? {
              id: pvo.optionValue.id,
              value: pvo.optionValue.value,
              label: pvo.optionValue.label,
              optionTypeId: pvo.optionValue.optionTypeId,
              optionType: pvo.optionValue.optionType
                ? {
                    id: pvo.optionValue.optionType.id,
                    name: pvo.optionValue.optionType.name,
                    slug: pvo.optionValue.optionType.slug,
                  }
                : null,
            }
          : null
      ).filter(Boolean),
    })),
  };
}

async function optionalAuthUser(request) {
  const authHeader = request.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) return null;
  try {
    const payload = await verifyAccessToken(token);
    return { userId: Number(payload.userId), role: String(payload.role) };
  } catch {
    return null;
  }
}

function slugFromProductName(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

async function catalogRoutes(fastify) {
  fastify.get('/shop-meta', async () => {
    const prisma = fastify.prisma;
    const where = { status: PRODUCT_STATUS.PUBLISHED };
    const [agg, totalProducts] = await Promise.all([
      prisma.product.aggregate({
        where,
        _min: { priceCents: true },
        _max: { priceCents: true },
      }),
      prisma.product.count({ where }),
    ]);
    return {
      minPriceCents: agg._min.priceCents ?? 0,
      maxPriceCents: agg._max.priceCents ?? 0,
      totalProducts,
    };
  });

  fastify.get('/products', async (request) => {
    const query = z
      .object({
        q: z.string().optional(),
        category: z.string().optional(),
        vendor: z.string().optional(),
        page: z.coerce.number().int().positive().default(1),
        limit: z.coerce.number().int().positive().max(100).default(12),
        minPrice: z.coerce.number().int().min(0).optional(),
        maxPrice: z.coerce.number().int().min(0).optional(),
        inStock: z.enum(['1', 'true']).optional(),
        sort: z.enum(['default', 'price_asc', 'price_desc']).optional(),
        status: z.enum(['all', 'draft', 'published']).optional(),
        discount: z.enum(['1', 'true']).optional(),
      })
      .parse(request.query || {});

    const prisma = fastify.prisma;
    const where = {} as Record<string, any>;

    const user = await optionalAuthUser(request);
    const isStaff =
      user && (user.role === UserRole.ADMIN || user.role === UserRole.MANAGER);
    if (!isStaff) {
      where.status = PRODUCT_STATUS.PUBLISHED;
    } else if (query.status === 'draft') {
      where.status = PRODUCT_STATUS.DRAFT;
    } else if (query.status === 'published') {
      where.status = PRODUCT_STATUS.PUBLISHED;
    }

    if (query.q) {
      where.name = { contains: query.q, mode: 'insensitive' };
    }

    if (query.category) {
      where.category = { is: { slug: query.category } };
    }

    if (query.vendor) {
      where.vendor = { is: { slug: query.vendor } };
    }

    if (query.discount) {
      where.salePriceCents = { not: null };
    }

    if (query.inStock) {
      where.stock = { gt: 0 };
    }

    if (query.minPrice != null || query.maxPrice != null) {
      where.priceCents = {};
      if (query.minPrice != null) where.priceCents.gte = query.minPrice;
      if (query.maxPrice != null) where.priceCents.lte = query.maxPrice;
    }

    const sort = query.sort ?? 'default';
    const orderBy =
      sort === 'price_asc'
        ? { priceCents: 'asc' }
        : sort === 'price_desc'
          ? { priceCents: 'desc' }
          : { createdAt: 'desc' };

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          category: true,
          vendor: true,
          images: true,
          availableColors: true,
          variants: {
            select: { id: true, sku: true, priceCents: true, stock: true },
          },
        },
        orderBy,
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

  fastify.get(
    '/products/id/:id',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const user = request.authUser;
      if (user.role !== UserRole.ADMIN && user.role !== UserRole.MANAGER) {
        return reply.code(403).send({ message: 'Forbidden' });
      }
      const id = Number(request.params.id);
      if (!Number.isInteger(id) || id < 1) {
        return reply.code(400).send({ message: 'Invalid product id' });
      }
      const product = await fastify.prisma.product.findUnique({
        where: { id },
        include: {
          category: true,
          images: true,
          availableColors: true,
          variants: {
            include: {
              optionValues: { include: { optionValue: { include: { optionType: true } } } },
            },
          },
          vendor: true,
          collection: true,
          productTags: { include: { tag: true } },
        },
      });
      if (!product) {
        return reply.code(404).send({ message: 'Product not found' });
      }
      return { data: mapProduct(product) };
    }
  );

  fastify.get('/products/:slug', async (request, reply) => {
    const { slug } = request.params;
    const product = await fastify.prisma.product.findFirst({
      where: { slug, status: PRODUCT_STATUS.PUBLISHED },
      include: {
        category: true,
        images: true,
        availableColors: true,
        vendor: true,
        collection: true,
        productTags: { include: { tag: true } },
        variants: {
          include: {
            optionValues: { include: { optionValue: { include: { optionType: true } } } },
          },
        },
      },
    });

    if (!product) {
      return reply.code(404).send({ message: 'Product not found' });
    }

    return { data: mapProduct(product) };
  });

  fastify.get('/categories', async () => {
    const prisma = fastify.prisma;
    const categories = await prisma.category.findMany({ orderBy: { name: 'asc' } });
    const grouped = await prisma.product.groupBy({
      by: ['categoryId'],
      where: { status: PRODUCT_STATUS.PUBLISHED, categoryId: { not: null } },
      _count: { _all: true },
    });
    const countByCategoryId = new Map(grouped.map((g) => [g.categoryId, g._count._all]));
    return {
      data: categories.map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        productCount: countByCategoryId.get(c.id) ?? 0,
      })),
    };
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

  const variantOptionSchema = z.object({
    optionTypeId: z.number().int().positive({ message: 'Each variant option must reference a valid option type' }),
    values: z.array(z.string().min(1)).min(0),
  });

  const publishProductSchema = z
    .object({
      name: z.string().trim().min(1, 'Product name is required'),
      shortDescription: z.string().optional(),
      description: z.string().optional(),
      priceCents: z
        .number({ invalid_type_error: 'Regular price must be a number' })
        .int()
        .positive('Regular price must be at least $0.01'),
      salePriceCents: z.number().int().nonnegative().optional().nullable(),
      stock: z.number().int().nonnegative().default(0),
      restockQuantity: z.number().int().nonnegative().optional().default(0),
      stockInTransit: z.number().int().nonnegative().optional(),
      totalStockLifetime: z.number().int().nonnegative().optional(),
      fulfillmentType: z.enum(['seller', 'phoenix']).optional().nullable(),
      externalProductIdType: z.string().max(20).optional().nullable(),
      externalProductId: z.string().max(120).optional().nullable(),
      categoryId: z.number().int().positive('Category is required'),
      vendorId: z.number().int().positive().optional().nullable(),
      collectionId: z.number().int().positive().optional().nullable(),
      tagIds: z.array(z.number().int().positive()).optional().default([]),
      imageUrls: z
        .array(z.string().url('Each image must be a valid URL'))
        .min(1, 'At least one product image is required'),
      variants: z.array(variantOptionSchema).optional().default([]),
      status: z.enum(['draft', 'published']).optional(),
    })
    .superRefine((data, ctx) => {
      if (data.salePriceCents != null && data.salePriceCents > data.priceCents) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Sale price cannot be greater than regular price',
          path: ['salePriceCents'],
        });
      }
    });

  const draftProductSchema = z
    .object({
      name: z.preprocess(
        (val) => (typeof val === 'string' ? val.trim() : ''),
        z.string().min(1, 'Product title is required')
      ),
      shortDescription: z.string().optional(),
      description: z.string().optional(),
      priceCents: z.number().int().nonnegative().default(0),
      salePriceCents: z.number().int().nonnegative().optional().nullable(),
      stock: z.number().int().nonnegative().default(0),
      restockQuantity: z.number().int().nonnegative().optional().default(0),
      stockInTransit: z.number().int().nonnegative().optional(),
      totalStockLifetime: z.number().int().nonnegative().optional(),
      fulfillmentType: z.enum(['seller', 'phoenix']).optional().nullable(),
      externalProductIdType: z.string().max(20).optional().nullable(),
      externalProductId: z.string().max(120).optional().nullable(),
      categoryId: z.number().int().positive().optional().nullable(),
      vendorId: z.number().int().positive().optional().nullable(),
      collectionId: z.number().int().positive().optional().nullable(),
      tagIds: z.array(z.number().int().positive()).optional().default([]),
      imageUrls: z.array(z.string().url('Each image must be a valid URL')).optional().default([]),
      variants: z.array(variantOptionSchema).optional().default([]),
      status: z.literal('draft').optional(),
    })
    .superRefine((data, ctx) => {
      if (data.salePriceCents != null && data.salePriceCents > data.priceCents) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Sale price cannot be greater than regular price',
          path: ['salePriceCents'],
        });
      }
    });

  function cartesian(arrays) {
    if (arrays.length === 0) return [[]];
    const [first, ...rest] = arrays;
    const restProduct = cartesian(rest);
    return first.flatMap((x) => restProduct.map((combo) => [x, ...combo]));
  }

  async function persistProductRelations(prisma, productId, body, slug) {
    for (const imageUrl of body.imageUrls) {
      await prisma.productImage.create({
        data: { productId, imageUrl },
      });
    }
    for (const tagId of body.tagIds) {
      await prisma.productTag.create({
        data: { productId, tagId },
      });
    }
    if (!body.variants || body.variants.length === 0) return;
    const optionValueIdsByTypeAndValue = {};
    for (const v of body.variants) {
      if (v.values.length === 0) continue;
      const optionValues = await prisma.productOptionValue.findMany({
        where: { optionTypeId: v.optionTypeId, value: { in: v.values } },
        select: { id: true, value: true },
      });
      optionValueIdsByTypeAndValue[v.optionTypeId] = Object.fromEntries(optionValues.map((o) => [o.value, o.id]));
    }
    const arraysForCartesian = body.variants
      .filter((v) => v.values.length > 0)
      .map((v) =>
        v.values
          .map((val) => optionValueIdsByTypeAndValue[v.optionTypeId]?.[val])
          .filter((id) => id != null)
      )
      .filter((arr) => arr.length > 0);
    if (arraysForCartesian.length === 0) return;
    const combinations = cartesian(arraysForCartesian);
    for (let i = 0; i < combinations.length; i++) {
      const optionValueIds = combinations[i];
      const sku = `${slug}-${optionValueIds.join('-')}-${i + 1}`;
      const variant = await prisma.productVariant.create({
        data: { productId, sku, stock: 0 },
      });
      for (const optionValueId of optionValueIds) {
        await prisma.productVariantOptionValue.create({
          data: { variantId: variant.id, optionValueId },
        });
      }
    }
  }

  async function replaceProductRelations(prisma, productId, body, slug) {
    await prisma.productImage.deleteMany({ where: { productId } });
    await prisma.productTag.deleteMany({ where: { productId } });
    await prisma.productVariant.deleteMany({ where: { productId } });
    await persistProductRelations(prisma, productId, body, slug);
  }

  async function validateProductRefs(prisma, body, { requireCategory }) {
    if (requireCategory || body.categoryId != null) {
      if (body.categoryId == null) return { ok: false, message: 'Category is required' };
      const category = await prisma.category.findUnique({ where: { id: body.categoryId } });
      if (!category) return { ok: false, message: 'Category not found' };
    }
    if (body.vendorId != null) {
      const vendor = await prisma.vendor.findUnique({ where: { id: body.vendorId } });
      if (!vendor) return { ok: false, message: 'Vendor not found' };
    }
    if (body.collectionId != null) {
      const collection = await prisma.collection.findUnique({ where: { id: body.collectionId } });
      if (!collection) return { ok: false, message: 'Collection not found' };
    }
    if (body.tagIds.length > 0) {
      const tagCount = await prisma.tag.count({ where: { id: { in: body.tagIds } } });
      if (tagCount !== body.tagIds.length) return { ok: false, message: 'One or more tags not found' };
    }
    return { ok: true };
  }

  async function loadProductWithRelations(prisma, id) {
    return prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        images: true,
        availableColors: true,
        variants: {
          include: {
            optionValues: { include: { optionValue: { include: { optionType: true } } } },
          },
        },
        vendor: true,
        collection: true,
        productTags: { include: { tag: true } },
      },
    });
  }

  fastify.post(
    '/products',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const user = request.authUser;
      if (user.role !== UserRole.ADMIN && user.role !== UserRole.MANAGER) {
        return reply.code(403).send({ message: 'Forbidden' });
      }

      const raw = request.body || {};
      const isDraft = raw.status === 'draft';
      const parsed = isDraft ? draftProductSchema.safeParse(raw) : publishProductSchema.safeParse(raw);
      if (!parsed.success) {
        const flat = parsed.error.flatten();
        return reply.code(400).send({
          message: 'Validation failed',
          errors: flat.fieldErrors,
          formErrors: flat.formErrors,
        });
      }
      const body = parsed.data;
      const prisma = fastify.prisma;

      const refs = await validateProductRefs(prisma, body, { requireCategory: !isDraft });
      if (!refs.ok) {
        return reply.code(400).send({ message: refs.message });
      }

      let slug;
      let displayName;
      let productStatus;

      if (isDraft) {
        displayName = body.name;
        slug = `draft-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
        productStatus = PRODUCT_STATUS.DRAFT;
      } else {
        displayName = body.name;
        slug = slugFromProductName(body.name);
        if (!slug) {
          return reply.code(400).send({ message: 'Invalid product name' });
        }
        productStatus = PRODUCT_STATUS.PUBLISHED;
        const existing = await prisma.product.findUnique({ where: { slug } });
        if (existing) {
          return reply.code(409).send({ message: 'Product with this name already exists' });
        }
      }

      const totalStock = body.stock + (body.restockQuantity ?? 0);
      const stockInTransit = body.stockInTransit ?? 0;
      const totalStockLifetime =
        body.totalStockLifetime !== undefined ? body.totalStockLifetime : totalStock;

      const product = await prisma.product.create({
        data: {
          name: displayName,
          slug,
          status: productStatus,
          publishedAt: productStatus === PRODUCT_STATUS.PUBLISHED ? new Date() : null,
          shortDescription: body.shortDescription ?? null,
          description: body.description ?? null,
          priceCents: body.priceCents,
          salePriceCents: body.salePriceCents ?? null,
          stock: totalStock,
          stockInTransit,
          totalStockLifetime,
          lastRestockedAt: null,
          fulfillmentType: body.fulfillmentType ?? null,
          externalProductIdType: body.externalProductIdType?.trim() || null,
          externalProductId: body.externalProductId?.trim() || null,
          categoryId: body.categoryId ?? null,
          vendorId: body.vendorId ?? null,
          collectionId: body.collectionId ?? null,
        },
        include: { category: true, images: true, availableColors: true },
      });

      await persistProductRelations(prisma, product.id, body, slug);

      const withRelations = await loadProductWithRelations(prisma, product.id);
      return reply.code(201).send({ data: mapProduct(withRelations) });
    }
  );

  const restockStockSchema = z.object({
    restockQuantity: z.coerce
      .number({ invalid_type_error: 'Quantity must be a number' })
      .int()
      .positive({ message: 'Quantity must be at least 1' }),
  });

  /** Register before PATCH /products/:id so paths like /products/5/stock are not captured by :id. */
  fastify.patch(
    '/products/:id/stock',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const user = request.authUser;
      if (user.role !== UserRole.ADMIN && user.role !== UserRole.MANAGER) {
        return reply.code(403).send({ message: 'Forbidden' });
      }

      const id = Number(request.params.id);
      if (!Number.isInteger(id) || id < 1) {
        return reply.code(400).send({ message: 'Invalid product id' });
      }

      const parsed = restockStockSchema.safeParse(request.body || {});
      if (!parsed.success) {
        const flat = parsed.error.flatten();
        return reply.code(400).send({
          message: 'Validation failed',
          errors: flat.fieldErrors,
          formErrors: flat.formErrors,
        });
      }
      const { restockQuantity } = parsed.data;

      const prisma = fastify.prisma;
      const existing = await prisma.product.findUnique({ where: { id } });
      if (!existing) {
        return reply.code(404).send({ message: 'Product not found' });
      }

      try {
        await prisma.product.update({
          where: { id },
          data: {
            stock: { increment: restockQuantity },
            totalStockLifetime: { increment: restockQuantity },
            lastRestockedAt: new Date(),
          },
        });
      } catch (err) {
        request.log.warn({ err }, 'restock: full inventory update failed; retrying stock-only');
        await prisma.product.update({
          where: { id },
          data: { stock: { increment: restockQuantity } },
        });
      }

      const withRelations = await loadProductWithRelations(prisma, id);
      return reply.code(200).send({ data: mapProduct(withRelations) });
    }
  );

  fastify.patch(
    '/products/:id',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const user = request.authUser;
      if (user.role !== UserRole.ADMIN && user.role !== UserRole.MANAGER) {
        return reply.code(403).send({ message: 'Forbidden' });
      }

      const id = Number(request.params.id);
      if (!Number.isInteger(id) || id < 1) {
        return reply.code(400).send({ message: 'Invalid product id' });
      }

      const prisma = fastify.prisma;
      const existingProduct = await prisma.product.findUnique({ where: { id } });
      if (!existingProduct) {
        return reply.code(404).send({ message: 'Product not found' });
      }

      const raw = request.body || {};
      const isDraft = raw.status === 'draft';
      const parsed = isDraft ? draftProductSchema.safeParse(raw) : publishProductSchema.safeParse(raw);
      if (!parsed.success) {
        const flat = parsed.error.flatten();
        return reply.code(400).send({
          message: 'Validation failed',
          errors: flat.fieldErrors,
          formErrors: flat.formErrors,
        });
      }
      const body = parsed.data;

      const refs = await validateProductRefs(prisma, body, { requireCategory: !isDraft });
      if (!refs.ok) {
        return reply.code(400).send({ message: refs.message });
      }

      let slug = existingProduct.slug;
      let displayName = body.name;

      if (!isDraft) {
        const newSlug = slugFromProductName(body.name);
        if (!newSlug) {
          return reply.code(400).send({ message: 'Invalid product name' });
        }
        const slugConflict = await prisma.product.findFirst({
          where: { slug: newSlug, NOT: { id } },
        });
        if (slugConflict) {
          return reply.code(409).send({ message: 'Product with this name already exists' });
        }
        slug = newSlug;
      }

      const totalStock = body.stock + (body.restockQuantity ?? 0);
      const nextStatus = isDraft ? PRODUCT_STATUS.DRAFT : PRODUCT_STATUS.PUBLISHED;
      const stockInTransit =
        body.stockInTransit !== undefined ? body.stockInTransit : existingProduct.stockInTransit ?? 0;
      const totalStockLifetime =
        body.totalStockLifetime !== undefined
          ? body.totalStockLifetime
          : existingProduct.totalStockLifetime ?? 0;

      const updateData = {
        name: displayName,
        slug,
        status: nextStatus,
        shortDescription: body.shortDescription ?? null,
        description: body.description ?? null,
        priceCents: body.priceCents,
        salePriceCents: body.salePriceCents ?? null,
        stock: totalStock,
        stockInTransit,
        totalStockLifetime,
        fulfillmentType: body.fulfillmentType ?? null,
        externalProductIdType: body.externalProductIdType?.trim() || null,
        externalProductId: body.externalProductId?.trim() || null,
        categoryId: body.categoryId ?? null,
        vendorId: body.vendorId ?? null,
        collectionId: body.collectionId ?? null,
      };

      const publishedPatch =
        nextStatus === PRODUCT_STATUS.DRAFT
          ? { publishedAt: null }
          : existingProduct.status === PRODUCT_STATUS.DRAFT || existingProduct.publishedAt == null
            ? { publishedAt: new Date() }
            : {};

      await prisma.product.update({
        where: { id },
        data: { ...updateData, ...publishedPatch },
      });

      await replaceProductRelations(prisma, id, body, slug);

      const withRelations = await loadProductWithRelations(prisma, id);
      return reply.code(200).send({ data: mapProduct(withRelations) });
    }
  );

  fastify.post(
    '/products/:id/publish',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const user = request.authUser;
      if (user.role !== UserRole.ADMIN && user.role !== UserRole.MANAGER) {
        return reply.code(403).send({ message: 'Forbidden' });
      }
      const id = Number(request.params.id);
      if (!Number.isInteger(id) || id < 1) {
        return reply.code(400).send({ message: 'Invalid product id' });
      }
      const prisma = fastify.prisma;
      const existing = await loadProductWithRelations(prisma, id);
      if (!existing) {
        return reply.code(404).send({ message: 'Product not found' });
      }
      if (existing.status === PRODUCT_STATUS.PUBLISHED) {
        return reply.code(400).send({ message: 'Product is already published' });
      }
      const name = (existing.name || '').trim();
      if (!name) {
        return reply.code(400).send({ message: 'Product title is required.' });
      }
      if (existing.categoryId == null) {
        return reply.code(400).send({ message: 'Please select a category before publishing.' });
      }
      if (!existing.images || existing.images.length === 0) {
        return reply.code(400).send({ message: 'Add at least one product image before publishing.' });
      }
      if (existing.priceCents < 1) {
        return reply.code(400).send({ message: 'Regular price must be at least $0.01.' });
      }
      if (existing.salePriceCents != null && existing.salePriceCents > existing.priceCents) {
        return reply.code(400).send({ message: 'Sale price cannot be greater than regular price.' });
      }
      const newSlug = slugFromProductName(name);
      if (!newSlug) {
        return reply.code(400).send({ message: 'Invalid product name' });
      }
      const slugConflict = await prisma.product.findFirst({
        where: { slug: newSlug, NOT: { id } },
      });
      if (slugConflict) {
        return reply.code(409).send({
          message: 'A product with this name already exists. Change the title before publishing.',
        });
      }
      await prisma.product.update({
        where: { id },
        data: {
          name,
          slug: newSlug,
          status: PRODUCT_STATUS.PUBLISHED,
          publishedAt: new Date(),
        },
      });
      const withRelations = await loadProductWithRelations(prisma, id);
      return reply.code(200).send({ data: mapProduct(withRelations) });
    }
  );

  fastify.post(
    '/products/:id/unpublish',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const user = request.authUser;
      if (user.role !== UserRole.ADMIN && user.role !== UserRole.MANAGER) {
        return reply.code(403).send({ message: 'Forbidden' });
      }
      const id = Number(request.params.id);
      if (!Number.isInteger(id) || id < 1) {
        return reply.code(400).send({ message: 'Invalid product id' });
      }
      const prisma = fastify.prisma;
      const existing = await prisma.product.findUnique({ where: { id } });
      if (!existing) {
        return reply.code(404).send({ message: 'Product not found' });
      }
      if (existing.status === PRODUCT_STATUS.DRAFT) {
        return reply.code(400).send({ message: 'Product is already a draft' });
      }
      await prisma.product.update({
        where: { id },
        data: {
          status: PRODUCT_STATUS.DRAFT,
          publishedAt: null,
        },
      });
      const withRelations = await loadProductWithRelations(prisma, id);
      return reply.code(200).send({ data: mapProduct(withRelations) });
    }
  );
}

module.exports = catalogRoutes;
