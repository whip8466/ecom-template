'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { apiRequest } from '@/lib/api';
import type { Product } from '@/lib/types';
import { formatMoney } from '@/lib/format';
import { useCartStore } from '@/store/cart-store';
import { MOCK_PRODUCTS } from '@/lib/mock-products';

type ProductsResponse = {
  data: Product[];
};

export default function ProductDetailsPage() {
  const params = useParams<{ slug: string }>();
  const router = useRouter();
  const slug = params.slug;
  const addToCart = useCartStore((state) => state.addToCart);

  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [selectedColor, setSelectedColor] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<'description' | 'additional' | 'reviews'>('additional');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    let cancelled = false;
    async function loadProduct() {
      try {
        setLoading(true);
        setMessage('');
        const response = await apiRequest<{ data: Product }>(`/api/products/${slug}`);
        if (cancelled) return;
        setProduct(response.data);
        setSelectedColor(response.data.availableColors?.[0]?.colorName || '');
        setActiveImageIndex(0);

        const relatedResponse = await apiRequest<ProductsResponse>('/api/products?limit=40');
        if (cancelled) return;
        const nextRelated = relatedResponse.data
          .filter((item) => item.slug !== response.data.slug)
          .filter((item) =>
            response.data.category?.id
              ? item.category?.id === response.data.category.id
              : true,
          )
          .slice(0, 4);
        setRelatedProducts(nextRelated);
      } catch {
        if (cancelled) return;
        const fallback = MOCK_PRODUCTS.find((item) => item.slug === slug);
        if (fallback) {
          setProduct(fallback);
          setSelectedColor(fallback.availableColors?.[0]?.colorName || '');
          setActiveImageIndex(0);
          setRelatedProducts(
            MOCK_PRODUCTS.filter((item) => item.slug !== fallback.slug).slice(0, 4),
          );
          setMessage('');
        } else {
          setProduct(null);
          setRelatedProducts([]);
          setMessage('Product not found.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadProduct();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (loading) {
    return (
      <div className="rounded-md border border-[#e5ecf6] bg-white p-8 text-center text-sm text-[#67748a]">
        Loading product details...
      </div>
    );
  }

  if (!product) {
    return (
      <div className="rounded-md border border-[#f3d0d0] bg-white p-8 text-center text-sm text-[#b42318]">
        {message || 'Product not found.'}
      </div>
    );
  }

  const galleryImages = product.images?.length
    ? product.images
    : [{ id: 0, imageUrl: 'https://images.unsplash.com/photo-1545127398-14699f92334b?w=900&q=80' }];
  const mainImage = galleryImages[Math.min(activeImageIndex, galleryImages.length - 1)];
  const colorOptions = product.availableColors?.length
    ? product.availableColors
    : [
        { id: 1, colorName: 'Black', colorCode: '#111827' },
        { id: 2, colorName: 'Pink', colorCode: '#f9a8d4' },
        { id: 3, colorName: 'Blue', colorCode: '#7dd3fc' },
      ];

  const shouldShowOutOfStock = product.stock <= 0;

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-wrap items-center gap-2 text-xs text-[#7b8aa3]">
        <Link href="/" className="hover:text-[#0989ff]">Home</Link>
        <span>/</span>
        <Link href="/shop" className="hover:text-[#0989ff]">Shop</Link>
        <span>/</span>
        <span className="text-[#475467]">{product.name}</span>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[90px_minmax(0,460px)_minmax(0,1fr)]">
        <div className="order-2 flex gap-3 lg:order-1 lg:flex-col">
          {galleryImages.map((image, index) => (
            <button
              key={image.id}
              type="button"
              onClick={() => setActiveImageIndex(index)}
              className={`overflow-hidden rounded border ${
                index === activeImageIndex ? 'border-[#0989ff]' : 'border-[#dbe5f3]'
              }`}
            >
              <div
                className="h-16 w-16 bg-cover bg-center sm:h-20 sm:w-20"
                style={{ backgroundImage: `url(${image.imageUrl})` }}
              />
            </button>
          ))}
        </div>

        <div className="order-1 rounded-md bg-white lg:order-2">
          <div
            className="aspect-square rounded-md border border-[#e4ebf5] bg-[#f4f8ff] bg-cover bg-center"
            style={{ backgroundImage: `url(${mainImage.imageUrl})` }}
          />
        </div>

        <div className="order-3">
          <p className="text-xs uppercase tracking-wide text-[#7b8aa3]">
            {product.category?.name || 'Headphone'}
          </p>
          <h1 className="mt-1 text-3xl font-semibold text-[#0f1f40]">{product.name}</h1>
          <div className="mt-2 flex items-center gap-3 text-sm">
            <span className="text-[#f5a623]">★★★★★</span>
            <span className="text-[#7b8aa3]">(3 Reviews)</span>
          </div>
          <p className="mt-3 text-3xl font-semibold text-[#0f1f40]">{formatMoney(product.priceCents)}</p>
          <p className="mt-3 text-sm leading-relaxed text-[#667085]">
            {product.description ||
              product.shortDescription ||
              'Lightweight premium headphones with rich bass, soft ear cushions, and crisp audio for daily listening.'}
          </p>

          <div className="mt-4">
            <p className="text-sm font-medium text-[#0f1f40]">Color</p>
            <div className="mt-2 flex items-center gap-2">
              {colorOptions.map((color) => {
                const isSelected = selectedColor === color.colorName;
                return (
                  <button
                    key={color.id}
                    type="button"
                    title={color.colorName}
                    onClick={() => setSelectedColor(color.colorName)}
                    className={`h-6 w-6 rounded-full border-2 ${
                      isSelected ? 'border-[#0f1f40]' : 'border-white ring-1 ring-[#d6e2f1]'
                    }`}
                    style={{ backgroundColor: color.colorCode || '#d1d5db' }}
                  />
                );
              })}
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <div className="flex h-10 items-center rounded border border-[#d7e4f6]">
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="h-full w-9 text-[#0f1f40]"
              >
                -
              </button>
              <span className="w-10 text-center text-sm font-semibold text-[#0f1f40]">{quantity}</span>
              <button
                type="button"
                onClick={() => setQuantity((q) => q + 1)}
                className="h-full w-9 text-[#0f1f40]"
              >
                +
              </button>
            </div>

            <button
              className="h-10 rounded bg-[#0f1f40] px-6 text-sm font-semibold text-white hover:bg-[#102b57]"
              onClick={() => {
                addToCart({
                  productId: product.id,
                  slug: product.slug,
                  name: product.name,
                  priceCents: product.priceCents,
                  imageUrl: mainImage.imageUrl,
                  colorName: selectedColor || colorOptions[0]?.colorName,
                  quantity,
                });
                setMessage('Added to cart');
              }}
            >
              Add To Cart
            </button>
          </div>

          <div className="mt-3">
            <button
              type="button"
              onClick={() => router.push('/checkout')}
              className="h-10 w-full max-w-[320px] rounded bg-[#0989ff] px-6 text-sm font-semibold text-white hover:bg-[#0476df]"
            >
              Buy Now
            </button>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-[#475467]">
            <button type="button" className="hover:text-[#0989ff]">Compare</button>
            <button type="button" className="hover:text-[#0989ff]">Add Wishlist</button>
            <button type="button" className="hover:text-[#0989ff]">Ask a Question</button>
          </div>

          {shouldShowOutOfStock && (
            <p className="mt-3 text-sm font-medium text-[#ef4444]">Out of stock</p>
          )}
          {message && <p className="mt-3 text-sm text-emerald-600">{message}</p>}
        </div>
      </div>

      <section className="mt-12 rounded-md border border-[#e4ebf5] bg-white p-6">
        <div className="flex flex-wrap items-center justify-center gap-8 border-b border-[#ebf0f7] pb-3 text-sm">
          <button
            type="button"
            onClick={() => setActiveTab('description')}
            className={activeTab === 'description' ? 'font-semibold text-[#0f1f40]' : 'text-[#7b8aa3]'}
          >
            Description
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('additional')}
            className={activeTab === 'additional' ? 'font-semibold text-[#0f1f40]' : 'text-[#7b8aa3]'}
          >
            Additional Information
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('reviews')}
            className={activeTab === 'reviews' ? 'font-semibold text-[#0f1f40]' : 'text-[#7b8aa3]'}
          >
            Reviews (3)
          </button>
        </div>

        {activeTab === 'description' && (
          <p className="mt-5 text-sm leading-relaxed text-[#475467]">
            {product.description ||
              'Premium audio product designed for comfort and long listening sessions, with clean highs and deep bass.'}
          </p>
        )}

        {activeTab === 'additional' && (
          <div className="mt-5 overflow-hidden rounded-md border border-[#e8eef7]">
            <table className="w-full text-sm">
              <tbody>
                <tr className="border-b border-[#edf2f8]">
                  <th className="w-1/3 bg-[#f8fbff] px-4 py-3 text-left font-medium text-[#344054]">Standing screen display size</th>
                  <td className="px-4 py-3 text-[#475467]">35 inches</td>
                </tr>
                <tr className="border-b border-[#edf2f8]">
                  <th className="bg-[#f8fbff] px-4 py-3 text-left font-medium text-[#344054]">Max Screen Resolution</th>
                  <td className="px-4 py-3 text-[#475467]">1920 x 1080 Pixels</td>
                </tr>
                <tr className="border-b border-[#edf2f8]">
                  <th className="bg-[#f8fbff] px-4 py-3 text-left font-medium text-[#344054]">Processor</th>
                  <td className="px-4 py-3 text-[#475467]">2.3GHz Core i7</td>
                </tr>
                <tr>
                  <th className="bg-[#f8fbff] px-4 py-3 text-left font-medium text-[#344054]">Wireless Type</th>
                  <td className="px-4 py-3 text-[#475467]">802.11 b/g/n, Bluetooth</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'reviews' && (
          <div className="mt-5 space-y-3 text-sm text-[#475467]">
            <p>Great comfort and sound quality. Highly recommended.</p>
            <p>Battery life is excellent and build feels premium.</p>
            <p>Good value for money with clear audio on calls.</p>
          </div>
        )}
      </section>

      <section className="mt-14">
        <p className="text-center text-xs font-semibold uppercase tracking-[0.16em] text-[#0989ff]">
          Next Day Products
        </p>
        <h2 className="mt-1 text-center text-3xl font-semibold text-[#0f1f40]">Related Products</h2>
        <div className="mt-8 grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
          {relatedProducts.length === 0 ? (
            <p className="col-span-full text-center text-sm text-[#7b8aa3]">No related products found.</p>
          ) : (
            relatedProducts.map((item) => (
              <article key={item.id} className="group rounded-md border border-[#e4ebf5] bg-white p-3">
                <Link href={`/products/${item.slug}`} className="block overflow-hidden rounded bg-[#f4f8ff]">
                  <div
                    className="aspect-square bg-cover bg-center transition duration-300 group-hover:scale-105"
                    style={{ backgroundImage: `url(${item.images?.[0]?.imageUrl || ''})` }}
                  />
                </Link>
                <p className="mt-3 text-[11px] uppercase tracking-wide text-[#7b8aa3]">{item.category?.name}</p>
                <h3 className="mt-1 text-sm font-semibold text-[#0f1f40]">
                  <Link href={`/products/${item.slug}`} className="hover:text-[#0989ff]">{item.name}</Link>
                </h3>
                <p className="mt-1 text-sm font-semibold text-[#0f1f40]">{formatMoney(item.priceCents)}</p>
              </article>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
