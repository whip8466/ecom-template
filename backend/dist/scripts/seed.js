"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const slugify = require('slugify');
const { initORM } = require('../src/db/orm');
const { hashPassword } = require('../src/utils/password');
const { UserRole, OrderStatus, PaymentStatus } = require('../src/constants/enums');
async function seed() {
    const orm = await initORM();
    const em = orm.em.fork();
    await em.nativeDelete('OrderItem', {});
    await em.nativeDelete('Order', {});
    await em.nativeDelete('ProductColor', {});
    await em.nativeDelete('ProductImage', {});
    await em.nativeDelete('Product', {});
    await em.nativeDelete('Category', {});
    await em.nativeDelete('Address', {});
    await em.nativeDelete('User', {});
    const admin = em.create('User', {
        firstName: 'Admin',
        lastName: 'User',
        name: 'Admin User',
        email: 'admin@example.com',
        phone: '9999999999',
        passwordHash: await hashPassword('password123'),
        role: UserRole.ADMIN,
    });
    const manager = em.create('User', {
        firstName: 'Manager',
        lastName: 'User',
        name: 'Manager User',
        email: 'manager@example.com',
        phone: '9999999998',
        passwordHash: await hashPassword('password123'),
        role: UserRole.MANAGER,
    });
    const customer = em.create('User', {
        firstName: 'Customer',
        lastName: 'User',
        name: 'Customer User',
        email: 'customer@example.com',
        phone: '9999999997',
        passwordHash: await hashPassword('password123'),
        role: UserRole.CUSTOMER,
    });
    const categoryNames = ['Fashion', 'Electronics', 'Home Decor'];
    const categories = categoryNames.map((name) => em.create('Category', { name, slug: slugify(name, { lower: true, strict: true }) }));
    await em.persistAndFlush([admin, manager, customer, ...categories]);
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
        const { images, colors, ...productInput } = input;
        const product = em.create('Product', {
            ...productInput,
            slug: slugify(input.name, { lower: true, strict: true }),
            category: input.category,
        });
        createdProducts.push(product);
        for (const imageUrl of images) {
            em.create('ProductImage', { product, imageUrl });
        }
        for (const color of colors) {
            em.create('ProductColor', { product, ...color });
        }
    }
    const address = em.create('Address', {
        user: customer,
        fullName: 'Customer User',
        phone: '9999999997',
        addressLine1: '221B Baker Street',
        city: 'London',
        state: 'London',
        postalCode: 'NW16XE',
        country: 'UK',
        isDefault: true,
    });
    await em.persistAndFlush([...createdProducts, address]);
    const order = em.create('Order', {
        user: customer,
        address,
        totalAmountCents: 22800,
        status: OrderStatus.CONFIRMED,
        paymentStatus: PaymentStatus.PAID,
    });
    const itemA = em.create('OrderItem', {
        order,
        product: createdProducts[0],
        productNameSnapshot: createdProducts[0].name,
        productPriceSnapshotCents: createdProducts[0].priceCents,
        colorName: 'Black',
        quantity: 1,
        subtotalCents: createdProducts[0].priceCents,
    });
    const itemB = em.create('OrderItem', {
        order,
        product: createdProducts[2],
        productNameSnapshot: createdProducts[2].name,
        productPriceSnapshotCents: createdProducts[2].priceCents,
        colorName: 'Sand',
        quantity: 1,
        subtotalCents: createdProducts[2].priceCents,
    });
    await em.persistAndFlush([order, itemA, itemB]);
    await orm.close(true);
    console.log('Seed completed.');
}
seed().catch((error) => {
    console.error(error);
    process.exit(1);
});
