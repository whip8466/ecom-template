const slugify = require('slugify');
const { initORM } = require('../src/db/orm');
const { hashPassword } = require('../src/utils/password');
const { UserRole, OrderStatus, PaymentStatus } = require('../src/constants/enums');

async function seed() {
  const prisma = await initORM();

  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.productColor.deleteMany();
  await prisma.productImage.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.address.deleteMany();
  await prisma.user.deleteMany();

  await prisma.user.create({
    data: {
      firstName: 'Admin',
      lastName: 'User',
      name: 'Admin User',
      email: 'admin@example.com',
      phone: '9999999999',
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
      phone: '9999999998',
      passwordHash: await hashPassword('password123'),
      role: UserRole.MANAGER,
    },
  });

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

  const categoryNames = ['Fashion', 'Electronics', 'Home Decor'];
  const categories = [];
  for (const name of categoryNames) {
    const category = await prisma.category.create({
      data: { name, slug: slugify(name, { lower: true, strict: true }) },
    });
    categories.push(category);
  }

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

  await prisma.$disconnect();
  console.log('Seed completed.');
}

seed().catch((error) => {
  console.error(error);
  process.exit(1);
});
