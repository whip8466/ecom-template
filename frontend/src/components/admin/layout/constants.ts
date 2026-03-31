export type AdminSidebarLinkItem = {
  kind: 'link';
  href: string;
  label: string;
  icon: string;
};

export type AdminSidebarGroupChild = {
  href: string;
  label: string;
  /** Optional; default is pathname === href || pathname.startsWith(href + '/'). */
  matchPathname?: (pathname: string) => boolean;
};

export type AdminSidebarGroupItem = {
  kind: 'group';
  label: string;
  icon: string;
  children: AdminSidebarGroupChild[];
};

export type AdminSidebarItem = AdminSidebarLinkItem | AdminSidebarGroupItem;

export const ADMIN_SIDEBAR_MENU: AdminSidebarItem[] = [
  {
    kind: 'link',
    href: '/admin',
    label: 'Dashboard',
    icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
  },
  {
    kind: 'link',
    href: '/admin/orders',
    label: 'Orders',
    icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
  },
  {
    kind: 'group',
    label: 'Products',
    icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4',
    children: [
      { href: '/admin/product/list', label: 'List' },
      { href: '/admin/deal-of-day', label: 'Deal of the day' },
      { href: '/admin/product/reviews', label: 'Reviews' },
    ],
  },
  {
    kind: 'group',
    label: 'Catalog',
    icon: 'M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z',
    children: [
      { href: '/admin/catalog/categories', label: 'Categories' },
      { href: '/admin/catalog/vendors', label: 'Vendors' },
      { href: '/admin/catalog/tags', label: 'Tags' },
    ],
  },
  {
    kind: 'link',
    href: '/admin/customers',
    label: 'Customers',
    icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z',
  },
  {
    kind: 'link',
    href: '/admin/newsletter-subscriptions',
    label: 'Newsletter',
    icon: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
  },
  {
    kind: 'group',
    label: 'Banners',
    icon: 'M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z',
    children: [
      { href: '/admin/promo-banners', label: 'Promo banners' },
      { href: '/admin/banner', label: 'Home banner' },
    ],
  },
  {
    kind: 'group',
    label: 'Blog',
    icon: 'M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z',
    children: [
      {
        href: '/admin/blog',
        label: 'Posts',
        matchPathname: (p) =>
          p === '/admin/blog' ||
          p === '/admin/blog/new' ||
          /^\/admin\/blog\/\d+\/edit/.test(p),
      },
      {
        href: '/admin/blog/categories',
        label: 'Categories',
      },
    ],
  },
  {
    kind: 'link',
    href: '/admin/contact',
    label: 'Contact Us',
    icon: 'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z',
  },
  {
    kind: 'group',
    label: 'Content',
    icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
    children: [
      {
        href: '/admin/content',
        label: 'Site pages',
        matchPathname: (p) => p === '/admin/content' || p.startsWith('/admin/content/'),
      },
    ],
  },
];
