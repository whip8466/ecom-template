'use client';

import { CatalogEntityManager } from '../_components/catalog-entity-manager';

export default function AdminVendorsPage() {
  return (
    <CatalogEntityManager
      breadcrumbs={[
        { label: 'Home', href: '/admin' },
        { label: 'Catalog' },
        { label: 'Vendors' },
      ]}
      title="Vendors"
      description="Manage brands and suppliers. Slug is generated from the name."
      apiPath="/api/vendors"
      singular="vendor"
    />
  );
}
