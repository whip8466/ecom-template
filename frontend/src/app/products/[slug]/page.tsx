import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getProductBySlug, getProductReviews, getRelatedProductsForProduct } from '@/lib/catalog-server';
import { ProductDetailClient } from './product-detail-client';

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) {
    return { title: 'Product' };
  }
  const description =
    product.shortDescription?.trim() || product.description?.trim() || product.name;
  return {
    title: product.name,
    description: description.slice(0, 160),
  };
}

export default async function ProductDetailsPage({ params }: Props) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) {
    notFound();
  }
  const [relatedProducts, reviewSummary] = await Promise.all([
    getRelatedProductsForProduct(product),
    getProductReviews(product.id),
  ]);
  return (
    <ProductDetailClient
      product={product}
      relatedProducts={relatedProducts}
      slug={slug}
      reviewSummary={reviewSummary}
    />
  );
}
