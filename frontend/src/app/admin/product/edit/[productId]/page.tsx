'use client';

import { useParams } from 'next/navigation';
import { ProductEditor } from '../../_components/product-editor';

export default function EditProductPage() {
  const params = useParams();
  const raw = params?.productId;
  const editProductId = typeof raw === 'string' ? raw : null;

  return <ProductEditor editProductId={editProductId} />;
}
