const { EntitySchema } = require('@mikro-orm/core');
const { OrderStatus, PaymentStatus, UserRole } = require('../constants/enums');

const User = new EntitySchema({
  name: 'User',
  tableName: 'users',
  properties: {
    id: { type: 'number', primary: true, autoincrement: true },
    firstName: { type: 'string', length: 120 },
    lastName: { type: 'string', length: 120 },
    name: { type: 'string', nullable: true },
    email: { type: 'string', unique: true },
    phone: { type: 'string', nullable: true },
    passwordHash: { type: 'string' },
    role: { type: 'string', items: Object.values(UserRole), default: UserRole.CUSTOMER },
    isActive: { type: 'boolean', default: true },
    addresses: { kind: '1:m', entity: 'Address', mappedBy: 'user' },
    orders: { kind: '1:m', entity: 'Order', mappedBy: 'user' },
    createdAt: { type: 'datetime', defaultRaw: 'now()' },
    updatedAt: { type: 'datetime', defaultRaw: 'now()', onUpdate: () => new Date() },
  },
});

const Address = new EntitySchema({
  name: 'Address',
  tableName: 'addresses',
  properties: {
    id: { type: 'number', primary: true, autoincrement: true },
    user: { kind: 'm:1', entity: 'User' },
    fullName: { type: 'string' },
    phone: { type: 'string' },
    addressLine1: { type: 'string' },
    addressLine2: { type: 'string', nullable: true },
    city: { type: 'string' },
    state: { type: 'string' },
    postalCode: { type: 'string' },
    country: { type: 'string' },
    isDefault: { type: 'boolean', default: false },
    createdAt: { type: 'datetime', defaultRaw: 'now()' },
    updatedAt: { type: 'datetime', defaultRaw: 'now()', onUpdate: () => new Date() },
  },
});

const Category = new EntitySchema({
  name: 'Category',
  tableName: 'categories',
  properties: {
    id: { type: 'number', primary: true, autoincrement: true },
    name: { type: 'string', unique: true },
    slug: { type: 'string', unique: true },
    products: { kind: '1:m', entity: 'Product', mappedBy: 'category' },
    createdAt: { type: 'datetime', defaultRaw: 'now()' },
    updatedAt: { type: 'datetime', defaultRaw: 'now()', onUpdate: () => new Date() },
  },
});

const Product = new EntitySchema({
  name: 'Product',
  tableName: 'products',
  properties: {
    id: { type: 'number', primary: true, autoincrement: true },
    name: { type: 'string' },
    slug: { type: 'string', unique: true },
    shortDescription: { type: 'string', nullable: true },
    description: { type: 'text', nullable: true },
    priceCents: { type: 'number' },
    stock: { type: 'number', default: 0 },
    category: { kind: 'm:1', entity: 'Category' },
    images: { kind: '1:m', entity: 'ProductImage', mappedBy: 'product', orphanRemoval: true },
    availableColors: { kind: '1:m', entity: 'ProductColor', mappedBy: 'product', orphanRemoval: true },
    createdAt: { type: 'datetime', defaultRaw: 'now()' },
    updatedAt: { type: 'datetime', defaultRaw: 'now()', onUpdate: () => new Date() },
  },
});

const ProductImage = new EntitySchema({
  name: 'ProductImage',
  tableName: 'product_images',
  properties: {
    id: { type: 'number', primary: true, autoincrement: true },
    product: { kind: 'm:1', entity: 'Product' },
    imageUrl: { type: 'string' },
  },
});

const ProductColor = new EntitySchema({
  name: 'ProductColor',
  tableName: 'product_colors',
  properties: {
    id: { type: 'number', primary: true, autoincrement: true },
    product: { kind: 'm:1', entity: 'Product' },
    colorName: { type: 'string' },
    colorCode: { type: 'string' },
    stock: { type: 'number', nullable: true },
  },
});

const Order = new EntitySchema({
  name: 'Order',
  tableName: 'orders',
  properties: {
    id: { type: 'number', primary: true, autoincrement: true },
    user: { kind: 'm:1', entity: 'User' },
    address: { kind: 'm:1', entity: 'Address' },
    totalAmountCents: { type: 'number' },
    status: { type: 'string', items: Object.values(OrderStatus), default: OrderStatus.PENDING },
    paymentStatus: { type: 'string', items: Object.values(PaymentStatus), default: PaymentStatus.PENDING },
    items: { kind: '1:m', entity: 'OrderItem', mappedBy: 'order', orphanRemoval: true },
    createdAt: { type: 'datetime', defaultRaw: 'now()' },
    updatedAt: { type: 'datetime', defaultRaw: 'now()', onUpdate: () => new Date() },
  },
});

const OrderItem = new EntitySchema({
  name: 'OrderItem',
  tableName: 'order_items',
  properties: {
    id: { type: 'number', primary: true, autoincrement: true },
    order: { kind: 'm:1', entity: 'Order' },
    product: { kind: 'm:1', entity: 'Product' },
    productNameSnapshot: { type: 'string' },
    productPriceSnapshotCents: { type: 'number' },
    colorName: { type: 'string', nullable: true },
    quantity: { type: 'number' },
    subtotalCents: { type: 'number' },
  },
});

module.exports = {
  User,
  Address,
  Category,
  Product,
  ProductImage,
  ProductColor,
  Order,
  OrderItem,
};
