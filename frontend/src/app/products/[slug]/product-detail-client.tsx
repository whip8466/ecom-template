'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { buildLoginRedirectHref } from '@/lib/auth-redirect';
import type { Product } from '@/lib/types';
import { effectivePriceCents, effectiveVariantUnitPriceCents, formatMoney } from '@/lib/format';
import { resolveSwatchColor } from '@/lib/swatch-color';
import { effectiveAvailableStockForLine } from '@/lib/inventory';
import {
  availableValuesForOptionType,
  buildVariantOptionGroups,
  formatVariantLabel,
  isLikelyColorOptionType,
  isLikelySizeOptionType,
  pickInitialVariant,
  resolveVariantSelection,
  selectionFromVariant,
  variantMatchesSelection,
} from '@/lib/variant-selection';
import { useAuthStore } from '@/store/auth-store';
import { useCartStore } from '@/store/cart-store';
import { useWishlistStore } from '@/store/wishlist-store';

type Props = {
  product: Product;
  relatedProducts: Product[];
  slug: string;
};

function buildAdditionalRows(product: Product): { label: string; value: string }[] {
  const rows: { label: string; value: string }[] = [];
  if (product.vendor?.name) {
    rows.push({ label: 'Vendor', value: product.vendor.name });
  }
  if (product.collection?.name) {
    rows.push({ label: 'Collection', value: product.collection.name });
  }
  if (product.tags && product.tags.length > 0) {
    rows.push({ label: 'Tags', value: product.tags.map((t) => t.name).join(', ') });
  }
  if (product.fulfillmentType) {
    rows.push({ label: 'Fulfillment', value: product.fulfillmentType });
  }
  return rows;
}

export function ProductDetailClient({ product, relatedProducts, slug }: Props) {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const { items: cartItems, addToCart } = useCartStore();
  const { items: wishlistItems, toggleWishlist } = useWishlistStore();

  const variants = useMemo(() => product.variants ?? [], [product.variants]);
  const hasVariants = variants.length > 0;
  const optionGroups = useMemo(() => buildVariantOptionGroups(variants), [variants]);
  const optionTypeIds = useMemo(() => optionGroups.map((g) => g.optionTypeId), [optionGroups]);

  const [selectedByTypeId, setSelectedByTypeId] = useState<Record<number, number>>(() => {
    const v = pickInitialVariant(variants);
    return v ? selectionFromVariant(v) : {};
  });

  /** Values per dimension that exist on variants matching the *other* selected options. */
  const filteredOptionGroups = useMemo(() => {
    if (!variants.length || !optionGroups.length) return [];
    return optionGroups.map((g) => {
      const filtered = availableValuesForOptionType(
        variants,
        optionTypeIds,
        g.optionTypeId,
        selectedByTypeId,
      );
      const selId = selectedByTypeId[g.optionTypeId];
      if (selId != null && !filtered.some((v) => v.id === selId)) {
        const keep = g.values.find((v) => v.id === selId);
        if (keep) {
          const merged = [...filtered, keep].sort((a, b) => a.label.localeCompare(b.label));
          return { ...g, values: merged };
        }
      }
      return { ...g, values: filtered };
    });
  }, [variants, optionGroups, optionTypeIds, selectedByTypeId]);

  const matchedVariant = useMemo(() => {
    if (!variants.length) return null;
    return variants.find((v) => variantMatchesSelection(v, selectedByTypeId)) ?? pickInitialVariant(variants);
  }, [variants, selectedByTypeId]);

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [selectedColor, setSelectedColor] = useState(
    product.availableColors?.[0]?.colorName || '',
  );
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<'description' | 'additional' | 'reviews'>('description');
  const [message, setMessage] = useState('');

  const displayUnitPrice = effectiveVariantUnitPriceCents(product, matchedVariant);
  const strikePrice =
    displayUnitPrice < product.priceCents ? product.priceCents : undefined;

  const galleryImages = product.images?.length
    ? product.images
    : [
        {
          id: 0,
          imageUrl:
            'https://images.unsplash.com/photo-1545127398-14699f92334b?w=900&q=80',
        },
      ];
  const mainImage = galleryImages[Math.min(activeImageIndex, galleryImages.length - 1)];
  const colorOptions = product.availableColors?.length ? product.availableColors : [];

  const effectiveAvailableStock = useMemo(
    () => effectiveAvailableStockForLine(product, matchedVariant),
    [product, matchedVariant],
  );

  const shouldShowOutOfStock = effectiveAvailableStock <= 0;

  useEffect(() => {
    setQuantity((q) => {
      const cap = Math.max(0, effectiveAvailableStock);
      if (cap < 1) return q;
      return Math.min(q, cap);
    });
  }, [effectiveAvailableStock]);

  function handleOptionSelect(optionTypeId: number, optionValueId: number) {
    if (!variants.length) return;
    const { selected } = resolveVariantSelection(variants, selectedByTypeId, optionTypeId, optionValueId);
    setSelectedByTypeId(selected);
  }
  const isCurrentProductInWishlist = wishlistItems.some((item) => item.productId === product.id);

  const handleWishlistToggle = (item: Product) => {
    if (!user) {
      router.push(buildLoginRedirectHref(`/products/${slug}`));
      return;
    }
    toggleWishlist({
      productId: item.id,
      slug: item.slug,
      name: item.name,
      priceCents: effectivePriceCents(item),
      imageUrl: item.images?.[0]?.imageUrl,
    });
  };

  const handleMainWishlistClick = () => {
    if (!user) {
      router.push(buildLoginRedirectHref(`/products/${slug}`));
      return;
    }
    const wasIn = isCurrentProductInWishlist;
    setMessage(wasIn ? 'Removed from wishlist' : 'Added to wishlist');
    void toggleWishlist({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      priceCents: displayUnitPrice,
      imageUrl: mainImage.imageUrl,
    });
  };

  const descriptionText =
    product.description?.trim() ||
    product.shortDescription?.trim() ||
    'No description has been added for this product yet.';

  const additionalRows = buildAdditionalRows(product);

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-wrap items-center gap-2 text-xs text-[#7b8aa3]">
        <Link href="/" className="hover:text-[#0989ff]">
          Home
        </Link>
        <span>/</span>
        <Link href="/shop" className="hover:text-[#0989ff]">
          Shop
        </Link>
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
            {product.category?.name || 'Shop'}
          </p>
          <h1 className="mt-1 text-3xl font-semibold text-[#0f1f40]">{product.name}</h1>
          <div className="mt-2 flex items-center gap-3 text-sm">
            <span className="text-[#f5a623]">★★★★★</span>
            <span className="text-[#7b8aa3]">(Reviews coming soon)</span>
          </div>
          <div className="mt-3 flex flex-wrap items-baseline gap-2">
            <p className="text-3xl font-semibold text-[#0f1f40]">{formatMoney(displayUnitPrice)}</p>
            {strikePrice != null && (
              <p className="text-lg text-[#94a3b8] line-through">{formatMoney(strikePrice)}</p>
            )}
          </div>
          <p className="mt-3 text-sm leading-relaxed text-[#667085]">
            {product.shortDescription || descriptionText}
          </p>

          {hasVariants && filteredOptionGroups.length > 0 && (
            <div className="mt-4 space-y-4">
              {filteredOptionGroups.map((group) => {
                const typeMeta = { name: group.name, slug: group.slug };
                const asColor = isLikelyColorOptionType(typeMeta);
                const asSize = isLikelySizeOptionType(typeMeta);
                const label = group.name;
                return (
                  <div key={group.optionTypeId}>
                    <p className="text-sm font-medium text-[#0f1f40]">{label}</p>
                    <div className={`mt-2 flex flex-wrap gap-2 ${asSize ? 'gap-2' : 'items-center gap-2'}`}>
                      {group.values.map((val) => {
                        const selected = selectedByTypeId[group.optionTypeId] === val.id;
                        if (asColor) {
                          const swatch = resolveSwatchColor(val.label, val.value);
                          return (
                            <button
                              key={val.id}
                              type="button"
                              title={val.label}
                              onClick={() => handleOptionSelect(group.optionTypeId, val.id)}
                              className={`h-8 w-8 rounded-full border-2 ${
                                selected ? 'border-[#0f1f40]' : 'border-white ring-1 ring-[#d6e2f1]'
                              }`}
                              style={{ backgroundColor: swatch }}
                            />
                          );
                        }
                        return (
                          <button
                            key={val.id}
                            type="button"
                            onClick={() => handleOptionSelect(group.optionTypeId, val.id)}
                            className={`min-w-[44px] rounded border px-3 py-1.5 text-sm ${
                              selected
                                ? 'border-[#0f1f40] bg-[#0f1f40] text-white'
                                : 'border-[#d6e2f1] bg-white text-[#0f1f40] hover:border-[#0989ff]'
                            } ${asSize ? 'font-medium' : ''}`}
                          >
                            {val.label || val.value}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {!hasVariants && colorOptions.length > 0 && (
            <div className="mt-4">
              <p className="text-sm font-medium text-[#0f1f40]">Color</p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
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
                      style={{
                        backgroundColor: resolveSwatchColor(color.colorName, color.colorCode || color.colorName),
                      }}
                    />
                  );
                })}
              </div>
            </div>
          )}

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
                disabled={quantity >= effectiveAvailableStock}
                onClick={() =>
                  setQuantity((q) => Math.min(effectiveAvailableStock, Math.max(1, q + 1)))
                }
                className="h-full w-9 text-[#0f1f40] disabled:cursor-not-allowed disabled:opacity-40"
              >
                +
              </button>
            </div>

            <button
              disabled={shouldShowOutOfStock || effectiveAvailableStock < 1}
              className="h-10 rounded bg-[#0f1f40] px-6 text-sm font-semibold text-white hover:bg-[#102b57] disabled:cursor-not-allowed disabled:opacity-50"
              onClick={() => {
                if (shouldShowOutOfStock || effectiveAvailableStock < 1) return;
                const variantLabel = matchedVariant
                  ? formatVariantLabel(matchedVariant.optionValues || [])
                  : undefined;
                addToCart({
                  productId: product.id,
                  slug: product.slug,
                  name: product.name,
                  priceCents: displayUnitPrice,
                  imageUrl: mainImage.imageUrl,
                  colorName: variantLabel || selectedColor || colorOptions[0]?.colorName,
                  variantId: matchedVariant?.id,
                  variantLabel,
                  quantity: Math.min(quantity, effectiveAvailableStock),
                  availableStock: effectiveAvailableStock,
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

          <div className="mt-4 flex flex-wrap items-center gap-4">
            <button
              type="button"
              onClick={handleMainWishlistClick}
              aria-label={isCurrentProductInWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
              aria-pressed={isCurrentProductInWishlist}
              className={`inline-flex h-11 w-11 items-center justify-center rounded-full border transition ${
                isCurrentProductInWishlist
                  ? 'border-[#0989ff] bg-[#0989ff]/10 text-[#0989ff]'
                  : 'border-[#e6edf6] bg-white text-[#0f1f40] hover:border-[#0989ff] hover:text-[#0989ff]'
              }`}
            >
              {isCurrentProductInWishlist ? (
                <svg className="h-6 w-6" viewBox="0 0 24 24" aria-hidden>
                  <path
                    fill="currentColor"
                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                  />
                </svg>
              ) : (
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.8}
                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                  />
                </svg>
              )}
            </button>
          </div>
          {message && <p className="mt-3 text-sm text-emerald-600">{message}</p>}
          {shouldShowOutOfStock && (
            <p className="mt-3 text-sm font-medium text-[#ef4444]">Out of stock</p>
          )}
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
            Reviews
          </button>
        </div>

        {activeTab === 'description' && (
          <p className="mt-5 text-sm leading-relaxed text-[#475467] whitespace-pre-wrap">
            {descriptionText}
          </p>
        )}

        {activeTab === 'additional' && (
          <div className="mt-5 overflow-hidden rounded-md border border-[#e8eef7]">
            <table className="w-full text-sm">
              <tbody>
                {additionalRows.map((row, idx) => (
                  <tr
                    key={`${row.label}-${idx}`}
                    className={idx < additionalRows.length - 1 ? 'border-b border-[#edf2f8]' : ''}
                  >
                    <th className="w-1/3 bg-[#f8fbff] px-4 py-3 text-left font-medium text-[#344054]">
                      {row.label}
                    </th>
                    <td className="px-4 py-3 text-[#475467]">{row.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'reviews' && (
          <p className="mt-5 text-sm text-[#7b8aa3]">No reviews yet. Be the first to review this product.</p>
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
            relatedProducts.map((item) => {
              const itemPrice = effectivePriceCents(item);
              const relVariants = item.variants ?? [];
              const relVariant = pickInitialVariant(relVariants);
              const relAvailable = effectiveAvailableStockForLine(item, relVariant);
              return (
                <article key={item.id} className="group relative rounded-md border border-[#e4ebf5] bg-white p-3">
                  <div className="relative overflow-hidden rounded bg-[#f4f8ff]">
                    <Link href={`/products/${item.slug}`} className="block">
                      <div
                        className="aspect-square bg-cover bg-center transition duration-300 group-hover:scale-105"
                        style={{ backgroundImage: `url(${item.images?.[0]?.imageUrl || ''})` }}
                      />
                    </Link>
                    <div className="absolute bottom-2 right-2 z-20 flex translate-x-2 flex-col overflow-hidden rounded border border-[#e6edf6] bg-white opacity-0 shadow-md transition-all duration-200 group-hover:translate-x-0 group-hover:opacity-100">
                      <button
                        type="button"
                        title={
                          cartItems.some((cartItem) => cartItem.productId === item.id)
                            ? 'View Cart'
                            : 'Add To Cart'
                        }
                        onClick={() => {
                          const inCart = cartItems.some((cartItem) => cartItem.productId === item.id);
                          if (inCart) {
                            router.push('/cart');
                            return;
                          }
                          if (relAvailable < 1) return;
                          addToCart({
                            productId: item.id,
                            slug: item.slug,
                            name: item.name,
                            priceCents: itemPrice,
                            imageUrl: item.images?.[0]?.imageUrl,
                            colorName: item.availableColors?.[0]?.colorName,
                            variantId: relVariant?.id,
                            variantLabel: relVariant
                              ? formatVariantLabel(relVariant.optionValues || [])
                              : undefined,
                            quantity: 1,
                            availableStock: relAvailable,
                          });
                        }}
                        className={`group/item relative grid h-11 w-11 place-items-center border-b border-[#edf2f8] transition ${
                          cartItems.some((cartItem) => cartItem.productId === item.id)
                            ? 'bg-[#0989ff] text-white'
                            : 'text-[#0f1f40] hover:bg-[#0989ff] hover:text-white'
                        }`}
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.8}
                            d="M3 3h2l.4 2m0 0L7 13h10l1.6-8H5.4zM9 19a1 1 0 100 2 1 1 0 000-2zm8 0a1 1 0 100 2 1 1 0 000-2z"
                          />
                        </svg>
                        <span className="pointer-events-none absolute -left-[86px] top-1/2 hidden -translate-y-1/2 whitespace-nowrap rounded bg-[#0f1f40] px-2 py-1 text-[10px] text-white group-hover/item:block">
                          {cartItems.some((cartItem) => cartItem.productId === item.id)
                            ? 'View Cart'
                            : 'Add To Cart'}
                        </span>
                      </button>
                      <button
                        type="button"
                        title="Quick View"
                        onClick={() => router.push(`/products/${item.slug}`)}
                        className="group/item relative grid h-11 w-11 place-items-center border-b border-[#edf2f8] text-[#0f1f40] transition hover:bg-[#0989ff] hover:text-white"
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.8}
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.8}
                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                          />
                        </svg>
                        <span className="pointer-events-none absolute -left-[76px] top-1/2 hidden -translate-y-1/2 whitespace-nowrap rounded bg-[#0f1f40] px-2 py-1 text-[10px] text-white group-hover/item:block">
                          Quick View
                        </span>
                      </button>
                      <button
                        type="button"
                        title="Add to Wishlist"
                        onClick={() => handleWishlistToggle(item)}
                        className={`group/item relative grid h-11 w-11 place-items-center transition ${
                          wishlistItems.some((wishlistItem) => wishlistItem.productId === item.id)
                            ? 'bg-[#0989ff] text-white'
                            : 'text-[#0f1f40] hover:bg-[#0989ff] hover:text-white'
                        }`}
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.8}
                            d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                          />
                        </svg>
                        <span className="pointer-events-none absolute -left-[104px] top-1/2 hidden -translate-y-1/2 whitespace-nowrap rounded bg-[#0f1f40] px-2 py-1 text-[10px] text-white group-hover/item:block">
                          Add to Wishlist
                        </span>
                      </button>
                    </div>
                  </div>
                  <p className="mt-3 text-[11px] uppercase tracking-wide text-[#7b8aa3]">
                    {item.category?.name}
                  </p>
                  <h3 className="mt-1 text-sm font-semibold text-[#0f1f40]">
                    <Link href={`/products/${item.slug}`} className="hover:text-[#0989ff]">
                      {item.name}
                    </Link>
                  </h3>
                  <p className="mt-1 text-sm font-semibold text-[#0f1f40]">{formatMoney(itemPrice)}</p>
                </article>
              );
            })
          )}
        </div>
      </section>
    </div>
  );
}
