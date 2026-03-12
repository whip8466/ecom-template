'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { apiRequest } from '@/lib/api';
import type { Product } from '@/lib/types';
import { formatMoney } from '@/lib/format';
import { useCartStore } from '@/store/cart-store';

export default function ProductDetailsPage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;
  const addToCart = useCartStore((state) => state.addToCart);

  const [product, setProduct] = useState<Product | null>(null);
  const [selectedColor, setSelectedColor] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [message, setMessage] = useState('');

  useEffect(() => {
    async function loadProduct() {
      const response = await apiRequest<{ data: Product }>(`/api/products/${slug}`);
      setProduct(response.data);
      setSelectedColor(response.data.availableColors?.[0]?.colorName || '');
    }
    loadProduct().catch(() => setMessage('Failed to load product'));
  }, [slug]);

  if (!product) {
    return <p className="text-sm text-slate-600">Loading product...</p>;
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="h-72 rounded-lg bg-slate-100" />
        <div className="mt-3 flex gap-2">
          {product.images.map((image) => (
            <div key={image.id} className="h-14 w-14 rounded bg-slate-100" title={image.imageUrl} />
          ))}
        </div>
      </div>
      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <p className="text-sm text-slate-500">{product.category?.name}</p>
        <h1 className="mt-1 text-2xl font-semibold">{product.name}</h1>
        <p className="mt-2 text-slate-700">{product.description || product.shortDescription}</p>
        <p className="mt-3 text-xl font-bold">{formatMoney(product.priceCents)}</p>

        <div className="mt-4">
          <p className="text-sm font-medium">Color</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {product.availableColors.map((color) => (
              <button
                key={color.id}
                className={`rounded-md border px-3 py-1.5 text-sm ${selectedColor === color.colorName ? 'border-slate-900' : 'border-slate-300'}`}
                onClick={() => setSelectedColor(color.colorName)}
              >
                {color.colorName}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4">
          <p className="text-sm font-medium">Quantity</p>
          <input
            type="number"
            min={1}
            value={quantity}
            onChange={(e) => setQuantity(Number(e.target.value))}
            className="mt-1 w-24 rounded-md border border-slate-300 px-3 py-2"
          />
        </div>

        <button
          className="mt-5 rounded-md bg-slate-900 px-4 py-2 text-white"
          onClick={() => {
            addToCart({
              productId: product.id,
              slug: product.slug,
              name: product.name,
              priceCents: product.priceCents,
              imageUrl: product.images[0]?.imageUrl,
              colorName: selectedColor,
              quantity,
            });
            setMessage('Added to cart');
          }}
        >
          Add to cart
        </button>
        {message && <p className="mt-2 text-sm text-emerald-600">{message}</p>}
      </div>
    </div>
  );
}
