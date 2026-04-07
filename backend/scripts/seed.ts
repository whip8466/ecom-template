const slugify = require('slugify');
const { initORM } = require('../src/db/orm');
const { hashPassword } = require('../src/utils/password');
const { UserRole, OrderStatus, PaymentStatus } = require('../src/constants/enums');

/** Ensures default tenant brand + storefront/contact row (required for ADMIN/MANAGER brandId). */
async function ensureDefaultBrandAndContactSettings(prisma) {
  const brand = await prisma.brand.upsert({
    where: { slug: 'dhidi' },
    create: { name: 'Dhidi', slug: 'dhidi', isBlocked: false },
    update: {},
  });

  await prisma.contactSettings.upsert({
    where: { brandId: brand.id },
    create: {
      brandId: brand.id,
      headline: 'Keep In Touch with Us',
      brandName: 'Dhidi',
      footerTagline:
        'Curated fashion, beauty, and home decor for modern living. Quality you can trust, style that lasts.',
      primaryEmail: 'contact@dhidi.com',
      supportEmail: 'support@dhidi.com',
      phone: '+1 (402) 763 282 46',
      addressLine: '84 Sleepy Hollow St, Jamaica, New York 1432',
      mapEmbedUrl:
        'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d193595.15830869428!2d-74.11976397304903!3d40.69766374874431!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x89c24fa5d33f083b%3A0xc80b8f06e177fe62!2sNew%20York%2C%20NY%2C%20USA!5e0!3m2!1sen!2sus!4v1710000000000!5m2!1sen!2sus',
      facebookUrl: 'https://facebook.com',
      instagramUrl: null,
      pinterestUrl: null,
      twitterUrl: 'https://twitter.com',
      youtubeUrl: null,
      showBrandLogo: true,
      showBrandName: true,
    },
    update: {},
  });

  return brand;
}

async function seed() {
  const prisma = await initORM();

  await prisma.promoBanner.deleteMany();
  await prisma.newsletterSubscription.deleteMany();
  await prisma.contactMessage.deleteMany();
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

  const defaultBrand = await ensureDefaultBrandAndContactSettings(prisma);

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
      firstName: 'Super',
      lastName: 'Admin',
      name: 'Super Admin',
      email: 'superadmin@example.com',
      phone: null,
      passwordHash: await hashPassword('password123'),
      role: UserRole.SUPER_ADMIN,
      brandId: null,
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
      brandId: defaultBrand.id,
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
      brandId: defaultBrand.id,
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

  const defaultSitePages = [
    {
      slug: 'privacy-policy',
      title: 'Privacy Policy',
      body: `<p>Last updated: <strong>March 31, 2026</strong></p>
<p>Welcome to <strong>Dhidi</strong>. Your privacy is important to us, and we are committed to protecting your personal information. This Privacy Policy explains how we collect, use, and safeguard your information when you use our website and services.</p>
<h2>1. Information We Collect</h2>
<h3>a. Personal Information</h3>
<ol>
<li>Name</li>
<li>Email address</li>
<li>Phone number</li>
<li>Account credentials</li>
</ol>
<h3>b. Usage Data</h3>
<ol>
<li>IP address</li>
<li>Browser type and version</li>
<li>Pages visited and time spent</li>
<li>Device information</li>
</ol>
<h3>c. Cookies and Tracking Technologies</h3>
<p>We use cookies and similar technologies to enhance your experience and analyze usage.</p>
<h2>2. How We Use Your Information</h2>
<ol>
<li>Provide and maintain our services</li>
<li>Improve user experience</li>
<li>Communicate updates, offers, or support messages</li>
<li>Monitor and analyze usage</li>
<li>Ensure security and prevent fraud</li>
</ol>
<h2>3. Sharing Your Information</h2>
<p>We do not sell your personal data. However, we may share information with:</p>
<ol>
<li>Service providers (e.g., hosting, analytics)</li>
<li>Legal authorities if required by law</li>
<li>Business transfers (e.g., merger or acquisition)</li>
</ol>
<h2>4. Data Security</h2>
<p>We implement appropriate technical and organizational measures to protect your data. However, no method of transmission over the internet is 100% secure.</p>
<h2>5. Your Rights</h2>
<p>Depending on your location, you may have the right to:</p>
<ol>
<li>Access your personal data</li>
<li>Correct inaccurate information</li>
<li>Request deletion of your data</li>
<li>Withdraw consent</li>
</ol>
<p>To exercise these rights, contact us at: <a href="mailto:contact@dhidi.com">contact@dhidi.com</a></p>
<h2>6. Third-Party Services</h2>
<p>Our service may contain links to third-party websites. We are not responsible for their privacy practices.</p>
<h2>7. Children&apos;s Privacy</h2>
<p>Our services are not intended for individuals under the age of 13 (or applicable age in your region). We do not knowingly collect data from children.</p>
<h2>8. Changes to This Policy</h2>
<p>We may update this Privacy Policy from time to time. Changes will be posted on this page with an updated date.</p>
<h2>9. Contact Us</h2>
<ol>
<li>Email: <a href="mailto:contact@dhidi.com">contact@dhidi.com</a></li>
<li>Address: 84 Sleepy Hollow St, Jamaica, New York 1432</li>
</ol>`,
    },
    {
      slug: 'terms-of-service',
      title: 'Terms of Service',
      body: `<p>Last updated: <strong>March 31, 2026</strong></p>
<p>Welcome to <strong>Dhidi</strong>. These Terms of Service (&ldquo;Terms&rdquo;) govern your access to and use of our website, applications, and services (&ldquo;Services&rdquo;). By using our Services, you agree to these Terms.</p>
<h2>1. Acceptance of Terms</h2>
<p>By using our Services, you confirm that you:</p>
<ol>
<li>Are at least 18 years old (or legal age in your jurisdiction)</li>
<li>Agree to comply with these Terms</li>
<li>Have the legal capacity to enter into a binding agreement</li>
</ol>
<p>If you do not agree, please do not use our Services.</p>
<h2>2. Use of Services</h2>
<p>You agree not to:</p>
<ol>
<li>Violate any applicable laws or regulations</li>
<li>Infringe on intellectual property rights</li>
<li>Attempt unauthorized access to systems or data</li>
<li>Distribute harmful software (e.g., viruses, malware)</li>
<li>Engage in fraudulent or misleading activities</li>
</ol>
<h2>3. User Accounts</h2>
<ol>
<li>Maintain confidentiality of credentials</li>
<li>Be responsible for all account activities</li>
<li>Provide accurate and updated information</li>
</ol>
<h2>4. Intellectual Property</h2>
<p>All content, trademarks, logos, and software are owned by or licensed to <strong>Dhidi</strong>.</p>
<ol>
<li>Do not copy or distribute without permission</li>
<li>Do not reverse engineer or extract source code</li>
</ol>
<h2>5. Payments and Billing (If Applicable)</h2>
<ol>
<li>Prices may change without notice</li>
<li>Payments must be made in full</li>
<li>Refund policies will be communicated</li>
</ol>
<h2>6. Termination</h2>
<p>We may suspend or terminate access if Terms are violated or illegal activity occurs.</p>
<h2>7. Disclaimer of Warranties</h2>
<p>Services are provided &ldquo;as is&rdquo; without warranties of any kind.</p>
<h2>8. Limitation of Liability</h2>
<p>We are not liable for indirect or consequential damages, including loss of data or profits.</p>
<h2>9. Third-Party Services</h2>
<p>We are not responsible for third-party content or services.</p>
<h2>10. Changes to Terms</h2>
<p>We may update Terms from time to time. Continued use means acceptance.</p>
<h2>11. Governing Law</h2>
<p>These Terms are governed by applicable laws of your jurisdiction.</p>
<h2>12. Contact Us</h2>
<ol>
<li>Email: <a href="mailto:contact@dhidi.com">contact@dhidi.com</a></li>
<li>Address: 84 Sleepy Hollow St, Jamaica, New York 1432</li>
</ol>`,
    },
  ];
  for (const p of defaultSitePages) {
    await prisma.sitePage.upsert({
      where: { slug: p.slug },
      create: p,
      update: {},
    });
  }

  await prisma.$disconnect();
  console.log('Seed completed.');
}

seed().catch((error) => {
  console.error(error);
  process.exit(1);
});
