'use client';

import { CatalogEntityManager } from '../_components/catalog-entity-manager';

export default function AdminTagsPage() {
  return (
    <CatalogEntityManager
      breadcrumbs={[
        { label: 'Home', href: '/admin' },
        { label: 'Catalog' },
        { label: 'Tags' },
      ]}
      title="Tags"
      description="Manage product tags for filtering and merchandising. Slug is generated from the name."
      apiPath="/api/tags"
      singular="tag"
    />
  );
}
