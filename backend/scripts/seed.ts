const slugify = require('slugify');
const { initORM } = require('../src/db/orm');
const { hashPassword } = require('../src/utils/password');
const { UserRole, OrderStatus, PaymentStatus } = require('../src/constants/enums');

async function seed() {
  const prisma = await initORM();

  await prisma.promoBanner.deleteMany();
  await prisma.newsletterSubscription.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.productVariantOptionValue.deleteMany();
  await prisma.productVariant.deleteMany();
  await prisma.productColor.deleteMany();
  await prisma.productImage.deleteMany();
  await prisma.product.deleteMany();
  await prisma.productOptionValue.deleteMany();
  await prisma.productOptionType.deleteMany();
  await prisma.category.deleteMany();
  await prisma.tag.deleteMany();
  await prisma.collection.deleteMany();
  await prisma.vendor.deleteMany();
  await prisma.address.deleteMany();
  await prisma.user.deleteMany();

  const customer = await prisma.user.create({
    data: {
      firstName: 'Customer',
      lastName: 'User',
      name: 'Customer User',
      email: 'customer@example.com',
      phone: '9999999997',
      passwordHash: await hashPassword('password123'),
      role: UserRole.CUSTOMER,
    },
  });

  await prisma.user.create({
    data: {
      firstName: 'Admin',
      lastName: 'User',
      name: 'Admin User',
      email: 'admin@example.com',
      phone: null,
      passwordHash: await hashPassword('password123'),
      role: UserRole.ADMIN,
    },
  });

  await prisma.user.create({
    data: {
      firstName: 'Manager',
      lastName: 'User',
      name: 'Manager User',
      email: 'manager@example.com',
      phone: null,
      passwordHash: await hashPassword('password123'),
      role: UserRole.MANAGER,
    },
  });

  const categoryNames = ['Fashion', 'Electronics', 'Home Decor'];
  const categories = [];
  for (const name of categoryNames) {
    const category = await prisma.category.create({
      data: { name, slug: slugify(name, { lower: true, strict: true }) },
    });
    categories.push(category);
  }

  const vendorNames = ['Nike', 'Samsung', 'IKEA', 'Generic Brands'];
  const vendors = [];
  for (const name of vendorNames) {
    const vendor = await prisma.vendor.create({
      data: { name, slug: slugify(name, { lower: true, strict: true }) },
    });
    vendors.push(vendor);
  }

  const collectionNames = ['New Arrivals', 'Best Sellers', 'Summer 2025', 'Winter Collection'];
  const collections = [];
  for (const name of collectionNames) {
    const collection = await prisma.collection.create({
      data: { name, slug: slugify(name, { lower: true, strict: true }) },
    });
    collections.push(collection);
  }

  const tagNames = ['Sale', 'Eco-Friendly', 'Limited Edition', 'Unisex', 'Premium', 'Trending', 'Featured'];
  const tags = [];
  for (const name of tagNames) {
    const tag = await prisma.tag.create({
      data: { name, slug: slugify(name, { lower: true, strict: true }) },
    });
    tags.push(tag);
  }

  const sizeType = await prisma.productOptionType.create({
    data: {
      name: 'Size',
      slug: 'size',
      values: {
        create: [
          { value: 's', label: 'S', sortOrder: 0 },
          { value: 'm', label: 'M', sortOrder: 1 },
          { value: 'l', label: 'L', sortOrder: 2 },
          { value: 'xl', label: 'XL', sortOrder: 3 },
        ],
      },
    },
    include: { values: true },
  });

  const colorType = await prisma.productOptionType.create({
    data: {
      name: 'Color',
      slug: 'color',
      values: {
        create: [
          { value: 'black', label: 'Black', sortOrder: 0 },
          { value: 'white', label: 'White', sortOrder: 1 },
          { value: 'blue', label: 'Blue', sortOrder: 2 },
          { value: 'red', label: 'Red', sortOrder: 3 },
          { value: 'grey', label: 'Grey', sortOrder: 4 },
        ],
      },
    },
    include: { values: true },
  });

  const products = [
    {
      name: 'Urban Sneaker',
      shortDescription: 'Comfortable everyday sneaker',
      description: 'Breathable and lightweight sneaker for daily wear.',
      priceCents: 7900,
      stock: 100,
      category: categories[0],
      images: ['https://images.unsplash.com/photo-1542291026-7eec264c27ff'],
      colors: [
        { colorName: 'Black', colorCode: '#111111', stock: 40 },
        { colorName: 'White', colorCode: '#f8fafc', stock: 60 },
      ],
    },
    {
      name: 'Smart Watch Pro',
      shortDescription: 'Fitness and notifications on wrist',
      description: 'Track activity and stay connected with long battery life.',
      priceCents: 14900,
      stock: 60,
      category: categories[1],
      images: ['https://images.unsplash.com/photo-1523275335684-37898b6baf30'],
      colors: [
        { colorName: 'Silver', colorCode: '#cbd5e1', stock: 30 },
        { colorName: 'Blue', colorCode: '#1d4ed8', stock: 30 },
      ],
    },
    {
      name: 'Minimal Lamp',
      shortDescription: 'Warm light for modern interiors',
      description: 'Minimal desk lamp with soft warm illumination.',
      priceCents: 5900,
      stock: 45,
      category: categories[2],
      images: ['https://images.unsplash.com/photo-1507473885765-e6ed057f782c'],
      colors: [{ colorName: 'Sand', colorCode: '#d6d3d1', stock: 20 }],
    },
  ];

  const createdProducts = [];
  for (const input of products) {
    const product = await prisma.product.create({
      data: {
        name: input.name,
        shortDescription: input.shortDescription,
        description: input.description,
        priceCents: input.priceCents,
        stock: input.stock,
        slug: slugify(input.name, { lower: true, strict: true }),
        categoryId: input.category.id,
        status: 'PUBLISHED',
      },
    });
    createdProducts.push(product);

    for (const imageUrl of input.images) {
      await prisma.productImage.create({
        data: { productId: product.id, imageUrl },
      });
    }

    for (const color of input.colors) {
      await prisma.productColor.create({
        data: {
          productId: product.id,
          colorName: color.colorName,
          colorCode: color.colorCode,
          stock: color.stock,
        },
      });
    }
  }

  const featuredTag = tags.find((t) => t.slug === 'featured');
  if (featuredTag) {
    await prisma.productTag.createMany({
      data: [
        { productId: createdProducts[0].id, tagId: featuredTag.id },
        { productId: createdProducts[1].id, tagId: featuredTag.id },
      ],
    });
  }

  const sizeValues = sizeType.values;
  const colorValues = colorType.values;
  const sneaker = createdProducts[0];
  for (let si = 0; si < sizeValues.length; si++) {
    for (let ci = 0; ci < 2; ci++) {
      const sizeVal = sizeValues[si];
      const colorVal = colorValues[ci];
      const variant = await prisma.productVariant.create({
        data: {
          productId: sneaker.id,
          sku: `SNEAK-${sizeVal.value}-${colorVal.value}-${si * 5 + ci + 1}`,
          stock: 10 + si + ci,
          optionValues: {
            create: [
              { optionValueId: sizeVal.id },
              { optionValueId: colorVal.id },
            ],
          },
        },
      });
    }
  }

  const address = await prisma.address.create({
    data: {
      userId: customer.id,
      fullName: 'Customer User',
      phone: '9999999997',
      addressLine1: '221B Baker Street',
      city: 'London',
      state: 'London',
      postalCode: 'NW16XE',
      country: 'UK',
      isDefault: true,
    },
  });

  const order = await prisma.order.create({
    data: {
      userId: customer.id,
      addressId: address.id,
      totalAmountCents: 22800,
      status: OrderStatus.CONFIRMED,
      paymentStatus: PaymentStatus.PAID,
    },
  });

  await prisma.orderItem.create({
    data: {
      orderId: order.id,
      productId: createdProducts[0].id,
      productNameSnapshot: createdProducts[0].name,
      productPriceSnapshotCents: createdProducts[0].priceCents,
      colorName: 'Black',
      quantity: 1,
      subtotalCents: createdProducts[0].priceCents,
    },
  });

  await prisma.orderItem.create({
    data: {
      orderId: order.id,
      productId: createdProducts[2].id,
      productNameSnapshot: createdProducts[2].name,
      productPriceSnapshotCents: createdProducts[2].priceCents,
      colorName: 'Sand',
      quantity: 1,
      subtotalCents: createdProducts[2].priceCents,
    },
  });

  await prisma.promoBanner.createMany({
    data: [
      {
        sortOrder: 0,
        eyebrowLabel: 'Weekend Sale',
        title: 'Smartphone BLU G91 Pro 2022',
        subtitle: 'Sale 20% off all store',
        imageUrl:
          'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=640&q=80',
        imageAlt: 'Smartphones',
        ctaLabel: 'Shop Now',
        ctaHref: '/shop',
        styleVariant: 'neutral',
        isActive: true,
      },
      {
        sortOrder: 1,
        eyebrowLabel: 'Holiday Offer',
        title: 'HyperX Cloud II Wireless',
        subtitle: 'Sale 35% off',
        imageUrl:
          'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=640&q=80',
        imageAlt: 'Wireless gaming headset',
        ctaLabel: 'Shop Now',
        ctaHref: '/shop',
        styleVariant: 'accent',
        isActive: true,
      },
    ],
  });

  await prisma.$disconnect();
  console.log('Seed completed.');
}

seed().catch((error) => {
  console.error(error);
  process.exit(1);
});
