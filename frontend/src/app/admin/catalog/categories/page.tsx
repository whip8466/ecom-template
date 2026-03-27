'use client';

import { CategoryTreeAdmin } from '../_components/category-tree-admin';

export default function AdminCategoriesPage() {
  return (
    <CategoryTreeAdmin
      breadcrumbs={[
        { label: 'Home', href: '/admin' },
        { label: 'Catalog' },
        { label: 'Categories' },
      ]}
    />
  );
}
