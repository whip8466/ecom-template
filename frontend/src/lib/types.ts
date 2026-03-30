export type UserRole = "CUSTOMER" | "MANAGER" | "ADMIN";

export type User = {
  id: number;
  firstName: string;
  lastName: string;
  name?: string;
  email: string;
  phone?: string;
  role: UserRole;
  isActive: boolean;
};

export type Category = { id: number; name: string; slug: string };

export type ProductImage = { id: number; imageUrl: string };
export type ProductColor = { id: number; colorName: string; colorCode: string; stock?: number };

export type ProductTag = { id: number; name: string; slug: string };

/** Active Deal of the Day flash offer (from GET /api/products/:slug when configured). */
export type ProductActiveDeal = {
  dealPriceCents: number;
  endsAt: string;
};

export type ProductOptionType = { id: number; name: string; slug: string };

export type ProductVariantOptionValue = {
  id: number;
  value: string;
  label: string;
  optionTypeId: number;
  optionType: ProductOptionType | null;
};

export type ProductVariant = {
  id: number;
  sku: string | null;
  priceCents: number | null;
  stock: number;
  optionValues: ProductVariantOptionValue[];
};

export type Product = {
  id: number;
  name: string;
  slug: string;
  shortDescription?: string;
  description?: string;
  priceCents: number;
  salePriceCents?: number | null;
  stock: number;
  stockInTransit?: number;
  lastRestockedAt?: string | null;
  totalStockLifetime?: number;
  status?: string;
  fulfillmentType?: string | null;
  category: Category | null;
  vendor?: { id: number; name: string; slug: string } | null;
  collection?: { id: number; name: string; slug: string } | null;
  tags?: ProductTag[];
  variants?: ProductVariant[];
  images: ProductImage[];
  availableColors: ProductColor[];
  activeDeal?: ProductActiveDeal | null;
};

export type Address = {
  id: number;
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
};

export type OrderItem = {
  id: number;
  productId?: number;
  productNameSnapshot: string;
  productPriceSnapshotCents: number;
  colorName?: string;
  quantity: number;
  subtotalCents: number;
};

export type Order = {
  id: number;
  totalAmountCents: number;
  status: string;
  paymentStatus: string;
  createdAt: string;
  user?: { id: number; name: string; email: string };
  address: Address;
  items: OrderItem[];
};
