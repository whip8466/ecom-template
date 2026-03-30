'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/auth-store';
import { messageFromApiErrorPayload } from '@/lib/api-error';
import { apiRequest } from '@/lib/api';
import { handleInvalidTokenIfNeeded } from '@/lib/invalidate-session';
import { BlogBodyEditor } from '@/components/blog/BlogBodyEditor';
import { AdminPageShell } from '@/components/admin-shell';
import { isBodyEmpty, normalizeBodyForEditor, plainTextFromHtml } from '@/lib/blog-body-html';

type Category = { id: number; name: string; slug: string; depth?: number };
type Vendor = { id: number; name: string; slug: string };
type Collection = { id: number; name: string; slug: string };
type Tag = { id: number; name: string; slug: string };

type InventoryTabId = 'Pricing' | 'Restock' | 'Shipping' | 'Advanced';
const INVENTORY_TABS: { id: InventoryTabId; label: string; icon: string }[] = [
  { id: 'Pricing', label: 'Pricing', icon: 'M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z' },
  { id: 'Restock', label: 'Restock', icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4' },
  { id: 'Shipping', label: 'Shipping', icon: 'M8 17h8M8 17a2 2 0 104 0M8 17a2 2 0 114 0m5-13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v8a2 2 0 002 2h2m4 0h2a2 2 0 002-2v-4m0-4l-4-4m0 0L8 12v4' },
  { id: 'Advanced', label: 'Advanced', icon: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm6-5V7a2 2 0 11-4 0v5h4z' },
];

type VariantOptionValue = { id: number; value: string; label: string };
type VariantOptionType = { id: number; name: string; slug: string; values: VariantOptionValue[] };

type ApiProductDetail = {
  id: number;
  name: string;
  status: string;
  priceCents: number;
  salePriceCents: number | null;
  stock: number;
  stockInTransit?: number;
  lastRestockedAt?: string | null;
  totalStockLifetime?: number;
  shortDescription?: string | null;
  description?: string | null;
  fulfillmentType?: string | null;
  externalProductIdType?: string | null;
  externalProductId?: string | null;
  category: { id: number } | null;
  images: { imageUrl: string }[];
  vendor: { id: number } | null;
  collection: { id: number } | null;
  tags: { id: number }[];
  variants: {
    optionValues: { value: string; optionTypeId?: number }[];
  }[];
};

/** Non-negative integers only (strips letters/symbols; empty allowed while editing). */
function sanitizeQuantityDigits(raw: string): string {
  const d = raw.replace(/\D/g, '');
  if (d === '') return '';
  return String(parseInt(d, 10));
}

function formatLastRestockedLabel(iso: string | null | undefined): string {
  if (!iso) return '—';
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '—';
    return d.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
  } catch {
    return '—';
  }
}

/** Client-side validation for publish — keep rules aligned with backend create product schema. */
function validateProductPublish(input: {
  token: string | null;
  title: string;
  categoryId: string;
  regularPrice: string;
  salePrice: string;
  imageUrls: string[];
}): { ok: true; priceCents: number; salePriceCents: number | null } | { ok: false; message: string } {
  if (!input.token?.trim()) {
    return { ok: false, message: 'You must be signed in to publish a product.' };
  }
  const name = input.title.trim();
  if (!name) {
    return { ok: false, message: 'Product title is required.' };
  }
  if (!input.categoryId) {
    return { ok: false, message: 'Please select a category.' };
  }
  if (input.regularPrice.trim() === '') {
    return { ok: false, message: 'Regular price is required.' };
  }
  const regular = parseFloat(input.regularPrice);
  if (Number.isNaN(regular) || regular < 0) {
    return { ok: false, message: 'Regular price must be a valid non-negative number.' };
  }
  const priceCents = Math.round(regular * 100);
  if (priceCents < 1) {
    return { ok: false, message: 'Regular price must be at least $0.01.' };
  }
  let salePriceCents: number | null = null;
  if (input.salePrice.trim() !== '') {
    const sale = parseFloat(input.salePrice);
    if (Number.isNaN(sale) || sale < 0) {
      return { ok: false, message: 'Sale price must be a valid non-negative number.' };
    }
    salePriceCents = Math.round(sale * 100);
    if (salePriceCents > priceCents) {
      return { ok: false, message: 'Sale price cannot be greater than regular price.' };
    }
  }
  const urls = input.imageUrls.filter(Boolean);
  if (urls.length === 0) {
    return { ok: false, message: 'Add at least one product image URL.' };
  }
  for (const url of urls) {
    let valid = false;
    try {
      const u = new URL(url);
      valid = u.protocol === 'http:' || u.protocol === 'https:';
    } catch {
      valid = false;
    }
    if (!valid) {
      return { ok: false, message: `Invalid image URL: ${url.slice(0, 80)}${url.length > 80 ? '…' : ''}` };
    }
  }
  return { ok: true, priceCents, salePriceCents };
}

function validateProductDraft(input: {
  token: string | null;
  title: string;
}): { ok: true } | { ok: false; message: string } {
  if (!input.token?.trim()) {
    return { ok: false, message: 'You must be signed in to save a draft.' };
  }
  if (!input.title.trim()) {
    return { ok: false, message: 'Product title is required.' };
  }
  return { ok: true };
}

function parsePriceToCents(s: string, allowEmptyAsZero: boolean): number {
  if (allowEmptyAsZero && (!s || s.trim() === '')) return 0;
  const n = parseFloat(s || '0');
  if (Number.isNaN(n) || n < 0) return 0;
  return Math.round(n * 100);
}

type ProductEditorProps = {
  /** Set when URL is `/admin/product/edit/[productId]`; null for create */
  editProductId: string | null;
};

export function ProductEditor({ editProductId }: ProductEditorProps) {
  const router = useRouter();
  const editIdParam =
    editProductId && /^\d+$/.test(editProductId) ? editProductId : null;
  const token = useAuthStore((s) => s.token);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [categoriesError, setCategoriesError] = useState('');
  const [inventoryTab, setInventoryTab] = useState<InventoryTabId>('Pricing');

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [newImageUrl, setNewImageUrl] = useState('');
  const [regularPrice, setRegularPrice] = useState('');
  const [salePrice, setSalePrice] = useState('');
  const [stock, setStock] = useState('');
  /** Units to add in the Restock tab (separate from current stock on hand). */
  const [restockAdd, setRestockAdd] = useState('');
  const [isRestocking, setIsRestocking] = useState(false);
  const [restockSuccess, setRestockSuccess] = useState('');
  const [restockFormError, setRestockFormError] = useState('');
  const [stockInTransit, setStockInTransit] = useState('');
  const [totalStockLifetime, setTotalStockLifetime] = useState('');
  const [lastRestockedAt, setLastRestockedAt] = useState<string | null>(null);
  const [shippingType, setShippingType] = useState<'seller' | 'phoenix'>('phoenix');
  const [productIdType, setProductIdType] = useState('ISBN');
  const [productId, setProductId] = useState('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [vendorsLoading, setVendorsLoading] = useState(true);
  const [vendorsError, setVendorsError] = useState('');
  const [vendorId, setVendorId] = useState<string>('');
  const [collections, setCollections] = useState<Collection[]>([]);
  const [collectionsLoading, setCollectionsLoading] = useState(true);
  const [collectionsError, setCollectionsError] = useState('');
  const [collectionId, setCollectionId] = useState<string>('');
  const [tags, setTags] = useState<Tag[]>([]);
  const [tagsLoading, setTagsLoading] = useState(true);
  const [tagsError, setTagsError] = useState('');
  const [tagIds, setTagIds] = useState<string[]>([]);
  const [tagsDropdownOpen, setTagsDropdownOpen] = useState(false);
  const [variantOptionTypes, setVariantOptionTypes] = useState<VariantOptionType[]>([]);
  const [variantOptionTypesLoading, setVariantOptionTypesLoading] = useState(true);
  const [variantOptionTypesError, setVariantOptionTypesError] = useState('');
  const [variants, setVariants] = useState<{ optionTypeId: number; values: string[] }[]>([]);
  const [variantValueDropdownOpen, setVariantValueDropdownOpen] = useState<number | null>(null);
  const [savedProductId, setSavedProductId] = useState<number | null>(null);
  const [draftLoaded, setDraftLoaded] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [addCategoryError, setAddCategoryError] = useState('');
  const [addCategoryLoading, setAddCategoryLoading] = useState(false);
  const [showAddVendorModal, setShowAddVendorModal] = useState(false);
  const [newVendorName, setNewVendorName] = useState('');
  const [addVendorError, setAddVendorError] = useState('');
  const [addVendorLoading, setAddVendorLoading] = useState(false);
  const [showAddCollectionModal, setShowAddCollectionModal] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState('');
  const [addCollectionError, setAddCollectionError] = useState('');
  const [addCollectionLoading, setAddCollectionLoading] = useState(false);
  const [showAddTagModal, setShowAddTagModal] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [addTagError, setAddTagError] = useState('');
  const [addTagLoading, setAddTagLoading] = useState(false);

  // Load categories from database (GET /api/categories)
  useEffect(() => {
    const base = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000';
    setCategoriesLoading(true);
    setCategoriesError('');
    fetch(`${base}/api/categories`)
      .then((r) => {
        if (!r.ok) throw new Error('Failed to load categories');
        return r.json();
      })
      .then((data: { data?: Category[] }) => {
        setCategories(Array.isArray(data.data) ? data.data : []);
      })
      .catch((e) => setCategoriesError((e as Error).message || 'Failed to load categories'))
      .finally(() => setCategoriesLoading(false));
  }, []);

  // Load vendors from database (GET /api/vendors)
  useEffect(() => {
    const base = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000';
    setVendorsLoading(true);
    setVendorsError('');
    fetch(`${base}/api/vendors`)
      .then((r) => {
        if (!r.ok) throw new Error('Failed to load vendors');
        return r.json();
      })
      .then((data: { data?: Vendor[] }) => {
        setVendors(Array.isArray(data.data) ? data.data : []);
      })
      .catch((e) => setVendorsError((e as Error).message || 'Failed to load vendors'))
      .finally(() => setVendorsLoading(false));
  }, []);

  // Load collections from database (GET /api/collections)
  useEffect(() => {
    const base = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000';
    setCollectionsLoading(true);
    setCollectionsError('');
    fetch(`${base}/api/collections`)
      .then(async (r) => {
        const data = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error((data as { message?: string }).message || `Failed to load collections (${r.status})`);
        return data as { data?: Collection[] };
      })
      .then((data) => {
        setCollections(Array.isArray(data.data) ? data.data : []);
      })
      .catch((e) => setCollectionsError((e as Error).message || 'Failed to load collections'))
      .finally(() => setCollectionsLoading(false));
  }, []);

  // Load tags from database (GET /api/tags)
  useEffect(() => {
    const base = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000';
    setTagsLoading(true);
    setTagsError('');
    fetch(`${base}/api/tags`)
      .then(async (r) => {
        const data = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error((data as { message?: string }).message || `Failed to load tags (${r.status})`);
        return data as { data?: Tag[] };
      })
      .then((data) => {
        setTags(Array.isArray(data.data) ? data.data : []);
      })
      .catch((e) => setTagsError((e as Error).message || 'Failed to load tags'))
      .finally(() => setTagsLoading(false));
  }, []);

  // Load variant option types and values from database (GET /api/product-option-types)
  useEffect(() => {
    setVariantOptionTypesLoading(true);
    setVariantOptionTypesError('');
    apiRequest<{ data?: VariantOptionType[] }>('/api/product-option-types')
      .then((data) => {
        const types = Array.isArray(data.data) ? data.data : [];
        setVariantOptionTypes(types);
        if (types.length > 0 && !editIdParam) {
          setVariants((prev) => (prev.length === 0 ? [{ optionTypeId: types[0].id, values: [] }] : prev));
        }
      })
      .catch((e) => {
        setVariantOptionTypesError((e as Error).message || 'Failed to load option types');
        setVariantOptionTypes([]);
      })
      .finally(() => setVariantOptionTypesLoading(false));
  }, [editIdParam]);

  // Load existing product when editing (`/admin/product/edit/[productId]`)
  useEffect(() => {
    const id = editIdParam;
    if (!id || !token) {
      setDraftLoaded(true);
      return;
    }
    const numId = Number(id);
    if (!Number.isInteger(numId) || numId < 1) {
      setDraftLoaded(true);
      return;
    }
    setDraftLoaded(false);
    setError('');
    apiRequest<{ data: ApiProductDetail }>(`/api/products/id/${numId}`, { token })
      .then((res) => {
        const p = res.data;
        setSavedProductId(p.id);
        setTitle(p.name);
        setDescription(normalizeBodyForEditor((p.description ?? p.shortDescription) || ''));
        setImageUrls((p.images || []).map((i) => i.imageUrl));
        setRegularPrice((p.priceCents / 100).toFixed(2));
        setSalePrice(p.salePriceCents != null ? (p.salePriceCents / 100).toFixed(2) : '');
        setStock(String(p.stock ?? 0));
        setStockInTransit(String(p.stockInTransit ?? 0));
        setTotalStockLifetime(String(p.totalStockLifetime ?? p.stock ?? 0));
        setLastRestockedAt(p.lastRestockedAt ?? null);
        setShippingType((p.fulfillmentType as 'seller' | 'phoenix') || 'phoenix');
        setProductIdType(p.externalProductIdType || 'ISBN');
        setProductId(p.externalProductId || '');
        setCategoryId(p.category ? String(p.category.id) : '');
        setVendorId(p.vendor ? String(p.vendor.id) : '');
        setCollectionId(p.collection ? String(p.collection.id) : '');
        setTagIds((p.tags || []).map((t) => String(t.id)));
        const typeToValues = new Map<number, Set<string>>();
        for (const pv of p.variants || []) {
          for (const ov of pv.optionValues || []) {
            const tid = ov.optionTypeId;
            if (tid == null) continue;
            if (!typeToValues.has(tid)) typeToValues.set(tid, new Set());
            typeToValues.get(tid)!.add(ov.value);
          }
        }
        const rows = [...typeToValues.entries()].map(([optionTypeId, set]) => ({
          optionTypeId,
          values: [...set],
        }));
        setVariants(rows.length > 0 ? rows : []);
      })
      .catch((e) => setError((e as Error).message || 'Failed to load product'))
      .finally(() => setDraftLoaded(true));
  }, [editIdParam, token]);

  // After loading a draft, ensure one variant row when option types are ready and variants still empty
  useEffect(() => {
    if (!draftLoaded || !editIdParam) return;
    setVariants((prev) => {
      if (prev.length > 0) return prev;
      const first = variantOptionTypes[0]?.id;
      return first != null ? [{ optionTypeId: first, values: [] }] : prev;
    });
  }, [draftLoaded, editIdParam, variantOptionTypes]);

  const addImageUrl = () => {
    const url = newImageUrl.trim();
    if (url) {
      setImageUrls((prev) => [...prev, url]);
      setNewImageUrl('');
    }
  };

  const removeImageUrl = (index: number) => {
    setImageUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const addVariant = () => {
    const firstTypeId = variantOptionTypes[0]?.id;
    if (firstTypeId != null) setVariants((prev) => [...prev, { optionTypeId: firstTypeId, values: [] }]);
  };
  const removeVariant = (index: number) => {
    setVariants((prev) => prev.filter((_, i) => i !== index));
    setVariantValueDropdownOpen(null);
  };
  const updateVariantOption = (index: number, optionTypeId: number) => {
    setVariants((prev) => prev.map((x, j) => (j === index ? { optionTypeId, values: [] } : x)));
    setVariantValueDropdownOpen(null);
  };
  const toggleVariantValue = (index: number, value: string) => {
    setVariants((prev) =>
      prev.map((x, j) =>
        j === index
          ? x.values.includes(value)
            ? { ...x, values: x.values.filter((v) => v !== value) }
            : { ...x, values: [...x.values, value] }
          : x
      )
    );
  };
  const getVariantOptionValues = (optionTypeId: number): VariantOptionValue[] =>
    variantOptionTypes.find((t) => t.id === optionTypeId)?.values ?? [];

  const openAddCategoryModal = () => {
    setNewCategoryName('');
    setAddCategoryError('');
    setShowAddCategoryModal(true);
  };
  const closeAddCategoryModal = () => {
    setShowAddCategoryModal(false);
    setNewCategoryName('');
    setAddCategoryError('');
  };
  // Add new category to database (POST /api/categories), then add to dropdown and select it
  const handleAddCategory = async () => {
    const name = newCategoryName.trim();
    if (!name) {
      setAddCategoryError('Category name is required');
      return;
    }
    setAddCategoryError('');
    setAddCategoryLoading(true);
    try {
      const base = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000';
      const res = await fetch(`${base}/api/categories`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ name }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        await handleInvalidTokenIfNeeded(res.status, data);
        throw new Error((data as { message?: string }).message || 'Failed to create category');
      }
      const category = data.data as Category;
      setCategories((prev) => [...prev, category].sort((a, b) => a.name.localeCompare(b.name)));
      setCategoryId(String(category.id));
      setCategoriesError('');
      closeAddCategoryModal();
    } catch (e) {
      setAddCategoryError((e as Error).message || 'Failed to create category');
    } finally {
      setAddCategoryLoading(false);
    }
  };

  const openAddVendorModal = () => {
    setNewVendorName('');
    setAddVendorError('');
    setShowAddVendorModal(true);
  };
  const closeAddVendorModal = () => {
    setShowAddVendorModal(false);
    setNewVendorName('');
    setAddVendorError('');
  };
  // Add new vendor to database (POST /api/vendors), then add to dropdown and select it
  const handleAddVendor = async () => {
    const name = newVendorName.trim();
    if (!name) {
      setAddVendorError('Vendor name is required');
      return;
    }
    setAddVendorError('');
    setAddVendorLoading(true);
    try {
      const base = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000';
      const res = await fetch(`${base}/api/vendors`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ name }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        await handleInvalidTokenIfNeeded(res.status, data);
        throw new Error((data as { message?: string }).message || 'Failed to create vendor');
      }
      const vendor = data.data as Vendor;
      setVendors((prev) => [...prev, vendor].sort((a, b) => a.name.localeCompare(b.name)));
      setVendorId(String(vendor.id));
      setVendorsError('');
      closeAddVendorModal();
    } catch (e) {
      setAddVendorError((e as Error).message || 'Failed to create vendor');
    } finally {
      setAddVendorLoading(false);
    }
  };

  const openAddCollectionModal = () => {
    setNewCollectionName('');
    setAddCollectionError('');
    setShowAddCollectionModal(true);
  };
  const closeAddCollectionModal = () => {
    setShowAddCollectionModal(false);
    setNewCollectionName('');
    setAddCollectionError('');
  };
  const handleAddCollection = async () => {
    const name = newCollectionName.trim();
    if (!name) {
      setAddCollectionError('Collection name is required');
      return;
    }
    setAddCollectionError('');
    setAddCollectionLoading(true);
    try {
      const base = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000';
      const res = await fetch(`${base}/api/collections`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ name }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        await handleInvalidTokenIfNeeded(res.status, data);
        throw new Error((data as { message?: string }).message || 'Failed to create collection');
      }
      const collection = data.data as Collection;
      setCollections((prev) => [...prev, collection].sort((a, b) => a.name.localeCompare(b.name)));
      setCollectionId(String(collection.id));
      setCollectionsError('');
      closeAddCollectionModal();
    } catch (e) {
      setAddCollectionError((e as Error).message || 'Failed to create collection');
    } finally {
      setAddCollectionLoading(false);
    }
  };

  const openAddTagModal = () => {
    setNewTagName('');
    setAddTagError('');
    setShowAddTagModal(true);
  };
  const closeAddTagModal = () => {
    setShowAddTagModal(false);
    setNewTagName('');
    setAddTagError('');
  };
  const handleAddTag = async () => {
    const name = newTagName.trim();
    if (!name) {
      setAddTagError('Tag name is required');
      return;
    }
    setAddTagError('');
    setAddTagLoading(true);
    try {
      const base = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000';
      const res = await fetch(`${base}/api/tags`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ name }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        await handleInvalidTokenIfNeeded(res.status, data);
        throw new Error((data as { message?: string }).message || 'Failed to create tag');
      }
      const tag = data.data as Tag;
      setTags((prev) => [...prev, tag].sort((a, b) => a.name.localeCompare(b.name)));
      setTagIds((prev) => (prev.includes(String(tag.id)) ? prev : [...prev, String(tag.id)]));
      setTagsError('');
      closeAddTagModal();
    } catch (e) {
      setAddTagError((e as Error).message || 'Failed to create tag');
    } finally {
      setAddTagLoading(false);
    }
  };

  const parseApiError = messageFromApiErrorPayload;

  const handleRestockConfirm = async () => {
    setRestockSuccess('');
    setRestockFormError('');
    const add = parseInt(restockAdd || '0', 10) || 0;
    if (add < 1) {
      setRestockFormError('Enter a quantity of at least 1.');
      return;
    }
    const prev = parseInt(stock || '0', 10) || 0;
    const pid = savedProductId ?? (editIdParam ? Number(editIdParam) : null);
    if (!pid || !Number.isInteger(pid)) {
      setStock(String(prev + add));
      const prevLife = parseInt(totalStockLifetime || '0', 10) || 0;
      setTotalStockLifetime(String(prevLife + add));
      setLastRestockedAt(new Date().toISOString());
      setRestockAdd('');
      setRestockSuccess(`Stock will be ${prev + add}. Save draft or publish to persist to the server.`);
      return;
    }
    if (!token?.trim()) {
      setRestockFormError('You must be signed in to update stock.');
      return;
    }
    setIsRestocking(true);
    try {
      const base = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000';
      const res = await fetch(`${base}/api/products/${pid}/stock`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ restockQuantity: Number(add) }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        await handleInvalidTokenIfNeeded(res.status, data);
        throw new Error(parseApiError(data));
      }
      const payload = (data as { data?: ApiProductDetail }).data;
      if (payload) {
        if (typeof payload.stock === 'number') setStock(String(payload.stock));
        if (typeof payload.totalStockLifetime === 'number')
          setTotalStockLifetime(String(payload.totalStockLifetime));
        if (payload.lastRestockedAt != null) setLastRestockedAt(payload.lastRestockedAt);
      }
      setRestockAdd('');
      setRestockSuccess(`Stock updated to ${payload?.stock ?? prev + add}.`);
    } catch (e) {
      setRestockFormError((e as Error).message || 'Failed to update stock');
    } finally {
      setIsRestocking(false);
    }
  };

  const handleRestockRefresh = async () => {
    setRestockSuccess('');
    setRestockFormError('');
    const pid = savedProductId ?? (editIdParam ? Number(editIdParam) : null);
    if (!pid || !Number.isInteger(pid)) {
      setRestockFormError('Save the product first to refresh inventory from the server.');
      return;
    }
    if (!token?.trim()) {
      setRestockFormError('You must be signed in to refresh.');
      return;
    }
    setIsRestocking(true);
    try {
      const res = await apiRequest<{ data: ApiProductDetail }>(`/api/products/id/${pid}`, { token });
      setStock(String(res.data.stock ?? 0));
      setStockInTransit(String(res.data.stockInTransit ?? 0));
      setTotalStockLifetime(String(res.data.totalStockLifetime ?? 0));
      setLastRestockedAt(res.data.lastRestockedAt ?? null);
      setRestockSuccess('Inventory refreshed from server.');
    } catch (e) {
      setRestockFormError((e as Error).message || 'Failed to refresh');
    } finally {
      setIsRestocking(false);
    }
  };

  const buildDraftPayload = () => {
    const stockNum = parseInt(stock || '0', 10) || 0;
    const restockNum = 0;
    let salePriceCents: number | null = null;
    if (salePrice.trim() !== '') {
      const s = parseFloat(salePrice);
      if (!Number.isNaN(s) && s >= 0) salePriceCents = Math.round(s * 100);
    }
    const validImageUrls = imageUrls.filter(Boolean).filter((url) => {
      try {
        const u = new URL(url);
        return u.protocol === 'http:' || u.protocol === 'https:';
      } catch {
        return false;
      }
    });
    return {
      status: 'draft' as const,
      name: title.trim(),
      shortDescription: (() => {
        const plain = plainTextFromHtml(description);
        return plain ? plain.slice(0, 255) : undefined;
      })(),
      description: !isBodyEmpty(description) ? description.trim() : undefined,
      priceCents: parsePriceToCents(regularPrice, true),
      salePriceCents,
      stock: stockNum,
      restockQuantity: restockNum,
      fulfillmentType: shippingType,
      externalProductIdType: productIdType || null,
      externalProductId: productId.trim() || null,
      categoryId: categoryId ? Number(categoryId) : null,
      vendorId: vendorId ? Number(vendorId) : null,
      collectionId: collectionId ? Number(collectionId) : null,
      tagIds: tagIds.map((id) => Number(id)),
      imageUrls: validImageUrls,
      variants: variants.map((v) => ({ optionTypeId: v.optionTypeId, values: v.values })),
    };
  };

  const buildPublishPayload = (priceCents: number, salePriceCents: number | null) => {
    const stockNum = parseInt(stock || '0', 10) || 0;
    const restockNum = 0;
    return {
      status: 'published' as const,
      name: title.trim(),
      shortDescription: (() => {
        const plain = plainTextFromHtml(description);
        return plain ? plain.slice(0, 255) : undefined;
      })(),
      description: !isBodyEmpty(description) ? description.trim() : undefined,
      priceCents,
      salePriceCents,
      stock: stockNum,
      restockQuantity: restockNum,
      fulfillmentType: shippingType,
      externalProductIdType: productIdType || null,
      externalProductId: productId.trim() || null,
      categoryId: Number(categoryId),
      vendorId: vendorId ? Number(vendorId) : null,
      collectionId: collectionId ? Number(collectionId) : null,
      tagIds: tagIds.map((id) => Number(id)),
      imageUrls: imageUrls.filter(Boolean),
      variants: variants.map((v) => ({ optionTypeId: v.optionTypeId, values: v.values })),
    };
  };

  const handleDiscard = () => {
    if (confirm('Discard changes?')) {
      setTitle('');
      setDescription(normalizeBodyForEditor(''));
      setImageUrls([]);
      setRegularPrice('');
      setSalePrice('');
      setStock('');
      setRestockAdd('');
      setRestockSuccess('');
      setRestockFormError('');
      setStockInTransit('');
      setTotalStockLifetime('');
      setLastRestockedAt(null);
      setShippingType('phoenix');
      setProductIdType('ISBN');
      setProductId('');
      setCategoryId('');
      setVendorId('');
      setCollectionId('');
      setTagIds([]);
      setSavedProductId(null);
      const firstTypeId = variantOptionTypes[0]?.id;
      setVariants(firstTypeId != null ? [{ optionTypeId: firstTypeId, values: [] }] : []);
      router.replace('/admin/product/new');
    }
  };

  const handleSaveDraft = async () => {
    setError('');
    const check = validateProductDraft({ token, title });
    if (!check.ok) {
      setError(check.message);
      return;
    }
    setIsSavingDraft(true);
    try {
      const base = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000';
      const payload = buildDraftPayload();
      const id = savedProductId ?? (editIdParam ? Number(editIdParam) : null);
      const url = id && Number.isInteger(id) ? `${base}/api/products/${id}` : `${base}/api/products`;
      const method = id && Number.isInteger(id) ? 'PATCH' : 'POST';
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        await handleInvalidTokenIfNeeded(res.status, data);
        throw new Error(parseApiError(data));
      }
      const created = data as { data?: ApiProductDetail };
      const d = created.data;
      if (d) {
        if (typeof d.stock === 'number') setStock(String(d.stock));
        if (typeof d.stockInTransit === 'number') setStockInTransit(String(d.stockInTransit));
        if (typeof d.totalStockLifetime === 'number') setTotalStockLifetime(String(d.totalStockLifetime));
        if (d.lastRestockedAt !== undefined) setLastRestockedAt(d.lastRestockedAt ?? null);
        if (d.id != null) {
          setSavedProductId(d.id);
          if (!editIdParam) router.replace(`/admin/product/edit/${d.id}`);
        }
      }
    } catch (e) {
      setError((e as Error).message || 'Failed to save draft');
    } finally {
      setIsSavingDraft(false);
    }
  };

  const handlePublish = async () => {
    setError('');
    const validated = validateProductPublish({
      token,
      title,
      categoryId,
      regularPrice,
      salePrice,
      imageUrls,
    });
    if (!validated.ok) {
      setError(validated.message);
      return;
    }
    const { priceCents, salePriceCents } = validated;
    const payload = buildPublishPayload(priceCents, salePriceCents);
    setIsSubmitting(true);
    try {
      const base = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000';
      const id = savedProductId ?? (editIdParam ? Number(editIdParam) : null);
      const url = id && Number.isInteger(id) ? `${base}/api/products/${id}` : `${base}/api/products`;
      const method = id && Number.isInteger(id) ? 'PATCH' : 'POST';
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        await handleInvalidTokenIfNeeded(res.status, data);
        throw new Error(parseApiError(data));
      }
      router.push('/admin/product/list');
    } catch (e) {
      setError((e as Error).message || 'Failed to publish product');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AdminPageShell
      breadcrumbs={[
        { label: 'Admin', href: '/admin' },
        { label: 'Add product' },
      ]}
      title={editIdParam ? 'Edit product' : 'Add a product'}
      description="Orders placed across your store."
      actions={
        <>
          <button
            type="button"
            onClick={handleDiscard}
            className="rounded-admin border border-[#e5ebf5] bg-white px-4 py-2 text-sm font-medium text-[#4f607f] hover:bg-[#f4f7fc]"
          >
            Discard
          </button>
          <button
            type="button"
            onClick={handleSaveDraft}
            disabled={!draftLoaded || isSavingDraft || isSubmitting}
            className="rounded-admin border border-[#246bfd] bg-white px-4 py-2 text-sm font-medium text-[#246bfd] hover:bg-[#eef4ff] disabled:opacity-60"
          >
            {isSavingDraft ? 'Saving…' : 'Save draft'}
          </button>
          <button
            type="button"
            onClick={handlePublish}
            disabled={!draftLoaded || isSubmitting || isSavingDraft}
            className="rounded-admin bg-[#246bfd] px-4 py-2 text-sm font-medium text-white hover:bg-[#1e5ae0] disabled:opacity-60"
          >
            {isSubmitting ? 'Publishing…' : 'Publish product'}
          </button>
        </>
      }
    >
        {error && (
          <div className="mb-4 rounded-admin border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left column - 2/3 */}
          <div className="space-y-6 lg:col-span-2">
            <div>
              <label className="block text-sm font-medium text-[#1c2740]">Product Title</label>
              <input
                type="text"
                placeholder="Write title here..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="mt-2 w-full rounded-admin border border-[#e5ebf5] bg-[#f9fbff] px-4 py-2.5 text-[#1c2740] placeholder:text-[#8ea0bf] focus:border-[#246bfd] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#1c2740]">Product Description</label>
              <p className="mt-1 text-xs text-[#64748b]">Rich text (TipTap). Shown on the product page as HTML.</p>
              <div className="mt-2">
                {editIdParam && !draftLoaded ? (
                  <div className="rounded-admin border border-[#e5ebf5] bg-[#f9fbff] px-4 py-8 text-sm text-[#64748b]">
                    Loading product…
                  </div>
                ) : (
                  <BlogBodyEditor
                    key={editIdParam ?? 'new'}
                    initialBody={description}
                    onChange={setDescription}
                    disabled={isSavingDraft || isSubmitting}
                    showRichBlocks={false}
                  />
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#1c2740]">Display images</label>
              <div className="mt-2 flex flex-col gap-3">
                <div className="flex flex-col items-center justify-center rounded-admin-card border-2 border-dashed border-[#e5ebf5] bg-[#f9fbff] py-10 text-center">
                  <svg className="h-12 w-12 text-[#8ea0bf]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="mt-2 text-sm text-[#4f607f]">Drag your photo here or</p>
                  <label className="mt-1 cursor-pointer text-sm font-medium text-[#246bfd] hover:underline">
                    Browse from device
                    <input type="file" accept="image/*" className="sr-only" multiple />
                  </label>
                </div>
                <div className="flex flex-wrap gap-2">
                  <input
                    type="url"
                    placeholder="Or paste image URL"
                    value={newImageUrl}
                    onChange={(e) => setNewImageUrl(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addImageUrl())}
                    className="flex-1 min-w-[200px] rounded-admin border border-[#e5ebf5] bg-white px-3 py-2 text-sm placeholder:text-[#8ea0bf] focus:border-[#246bfd] focus:outline-none"
                  />
                  <button type="button" onClick={addImageUrl} className="rounded-admin bg-[#246bfd] px-4 py-2 text-sm font-medium text-white hover:bg-[#1e5ae0]">
                    Add image URL
                  </button>
                </div>
                {imageUrls.length > 0 && (
                  <ul className="flex flex-wrap gap-2">
                    {imageUrls.map((url, i) => (
                      <li key={i} className="relative flex items-center gap-2 rounded-admin border border-[#e5ebf5] bg-white px-2 py-1 text-xs">
                        <span className="max-w-[180px] truncate text-[#4f607f]">{url}</span>
                        <button type="button" onClick={() => removeImageUrl(i)} className="text-red-500 hover:underline">Remove</button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            <div className="flex overflow-hidden border border-[#e5ebf5] bg-white">
              {/* Left: Inventory nav - light gray background */}
              <div className="w-52 shrink-0 border-r border-[#e5ebf5] bg-[#f8fafc]">
                <h3 className="border-b border-[#e5ebf5] bg-[#f8fafc] px-4 py-3 text-sm font-bold text-[#1c2740]">Inventory</h3>
                <nav>
                  {INVENTORY_TABS.map((tab) => {
                    const active = inventoryTab === tab.id;
                    return (
                      <div key={tab.id} className="border-b border-[#e5ebf5] last:border-b-0">
                        <button
                          type="button"
                          onClick={() => setInventoryTab(tab.id)}
                          className={`relative flex w-full items-center gap-3 px-4 py-3 text-left text-sm transition ${
                            active
                              ? 'border-l-2 border-l-[#246bfd] bg-white font-semibold text-[#1c2740] shadow-[inset_0_0_0_1px_rgba(36,107,253,0.08)]'
                              : 'border-l-2 border-l-transparent font-medium text-[#475569] hover:bg-[#f1f5f9]'
                          }`}
                        >
                          <svg className={`h-5 w-5 shrink-0 ${active ? 'text-[#246bfd]' : 'text-[#64748b]'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} />
                          </svg>
                          {tab.label}
                          {active && (
                            <span className="absolute right-0 top-1/2 h-0 w-0 -translate-y-1/2 border-y-2.5 border-r-2.5 border-y-transparent border-r-[#246bfd]" aria-hidden />
                          )}
                        </button>
                      </div>
                    );
                  })}
                </nav>
              </div>
              {/* Right: content pane */}
              <div className="min-w-0 flex-1 bg-white p-5">
                {inventoryTab === 'Pricing' && (
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-[#1c2740]">Regular price</label>
                      <input
                        type="text"
                        placeholder="$$$"
                        value={regularPrice}
                        onChange={(e) => setRegularPrice(e.target.value)}
                        className="mt-1.5 w-full rounded-admin border border-[#e5ebf5] bg-white px-4 py-2.5 text-[#1c2740] placeholder:text-[#9ca3af] focus:border-[#246bfd] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#1c2740]">Sale price</label>
                      <input
                        type="text"
                        placeholder="$$$"
                        value={salePrice}
                        onChange={(e) => setSalePrice(e.target.value)}
                        className="mt-1.5 w-full rounded-admin border border-[#e5ebf5] bg-white px-4 py-2.5 text-[#1c2740] placeholder:text-[#9ca3af] focus:border-[#246bfd] focus:outline-none"
                      />
                    </div>
                  </div>
                )}
                {inventoryTab === 'Restock' && (
                  <div className="space-y-5">
                    <h4 className="text-sm font-bold text-[#1c2740]">Add to Stock</h4>
                    <div className="flex flex-wrap items-end gap-3">
                      <div className="w-40">
                        <label className="sr-only">Quantity</label>
                        <input
                          type="text"
                          inputMode="numeric"
                          autoComplete="off"
                          placeholder="Quantity"
                          value={restockAdd}
                          onChange={(e) => setRestockAdd(sanitizeQuantityDigits(e.target.value))}
                          disabled={isRestocking}
                          className="w-full rounded-admin border border-[#e5ebf5] bg-white px-4 py-2.5 text-[#1c2740] placeholder:text-[#9ca3af] focus:border-[#246bfd] focus:outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none disabled:opacity-60"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={handleRestockConfirm}
                        disabled={isRestocking || !draftLoaded}
                        className="flex items-center gap-2 rounded-admin bg-[#246bfd] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#1e5ae0] disabled:opacity-60"
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        {isRestocking ? 'Updating…' : 'Confirm'}
                      </button>
                    </div>
                    {(restockFormError || restockSuccess) && (
                      <p
                        className={
                          restockFormError ? 'text-sm text-red-600' : 'text-sm text-green-700'
                        }
                      >
                        {restockFormError || restockSuccess}
                      </p>
                    )}
                    <div className="rounded-admin border border-[#e5ebf5] bg-[#f8fafc] p-3">
                      <label className="block text-xs font-medium text-[#64748b]">
                        {editIdParam ? 'Stock on hand' : 'Initial stock (for new product)'}
                      </label>
                      <input
                        type="text"
                        inputMode="numeric"
                        autoComplete="off"
                        value={stock}
                        onChange={(e) => setStock(sanitizeQuantityDigits(e.target.value))}
                        className="mt-1 w-32 rounded-admin border border-[#e5ebf5] bg-white px-3 py-2 text-sm text-[#1c2740] focus:border-[#246bfd] focus:outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                      />
                    </div>
                    <div className="space-y-2 border-t border-[#e5ebf5] pt-4 text-sm text-[#475569]">
                      <p className="flex flex-wrap items-center gap-2">
                        Product in stock now:{' '}
                        <span className="font-medium text-[#1c2740]">
                          {(parseInt(stock || '0', 10) || 0).toLocaleString()}
                        </span>
                        <button
                          type="button"
                          onClick={handleRestockRefresh}
                          disabled={isRestocking || !draftLoaded}
                          className="text-[#64748b] hover:text-[#246bfd] disabled:opacity-50"
                          aria-label="Refresh"
                          title="Refresh from server"
                        >
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                            />
                          </svg>
                        </button>
                      </p>
                      <p>
                        Product in transit:{' '}
                        <span className="font-medium text-[#1c2740]">
                          {(parseInt(stockInTransit || '0', 10) || 0).toLocaleString()}
                        </span>
                      </p>
                      <p>
                        Last time restocked:{' '}
                        <span className="font-medium text-[#1c2740]">
                          {formatLastRestockedLabel(lastRestockedAt)}
                        </span>
                      </p>
                      <p>
                        Total stock over lifetime:{' '}
                        <span className="font-medium text-[#1c2740]">
                          {(parseInt(totalStockLifetime || '0', 10) || 0).toLocaleString()}
                        </span>
                      </p>
                      <p className="text-xs text-[#94a3b8]">
                        Confirm restock (saved products) updates stock, lifetime total, and last restocked on the
                        server. Refresh reloads these values.
                      </p>
                    </div>
                  </div>
                )}
                {inventoryTab === 'Shipping' && (
                  <div className="space-y-5">
                    <h4 className="text-sm font-bold text-[#1c2740]">Shipping Type</h4>
                    <div className="space-y-4">
                      <label className="flex cursor-pointer items-start gap-3">
                        <input
                          type="radio"
                          name="shippingType"
                          checked={shippingType === 'seller'}
                          onChange={() => setShippingType('seller')}
                          className="mt-1 h-4 w-4 border-[#e5ebf5] text-[#246bfd] focus:ring-[#246bfd]"
                        />
                        <div>
                          <span className="text-sm font-medium text-[#1c2740]">Fulfilled by Seller</span>
                          <p className="mt-1 text-sm text-[#64748b]">You&apos;ll be responsible for product delivery. Any damage or delay during shipping may cost you a Damage fee.</p>
                        </div>
                      </label>
                      <label className="flex cursor-pointer items-start gap-3">
                        <input
                          type="radio"
                          name="shippingType"
                          checked={shippingType === 'phoenix'}
                          onChange={() => setShippingType('phoenix')}
                          className="mt-1 h-4 w-4 border-[#e5ebf5] text-[#246bfd] focus:ring-[#246bfd]"
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-[#1c2740]">Fulfilled by Phoenix</span>
                            <span className="rounded-admin border border-[#ea580c] bg-[#fff7ed] px-2 py-0.5 text-xs font-medium text-[#c2410c]">RECOMMENDED</span>
                          </div>
                          <p className="mt-1 text-sm text-[#64748b]">Your product, Our responsibility. For a measly fee, we will handle the delivery process for you.</p>
                        </div>
                      </label>
                    </div>
                    <p className="pt-2 text-sm text-[#64748b]">
                      See our <a href="#" className="text-[#246bfd] hover:underline">Delivery terms and conditions</a> for details.
                    </p>
                  </div>
                )}
                {inventoryTab === 'Advanced' && (
                  <div className="space-y-5">
                    <h4 className="text-sm font-bold text-[#1c2740]">Advanced</h4>
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-[#1c2740]">Product ID Type</label>
                        <select
                          value={productIdType}
                          onChange={(e) => setProductIdType(e.target.value)}
                          className="mt-1.5 w-full rounded-admin border border-[#e5ebf5] bg-white px-4 py-2.5 text-[#1c2740] focus:border-[#246bfd] focus:outline-none"
                        >
                          <option value="ISBN">ISBN</option>
                          <option value="UPC">UPC</option>
                          <option value="EAN">EAN</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-[#1c2740]">Product ID</label>
                        <input
                          type="text"
                          placeholder="ISBN Number"
                          value={productId}
                          onChange={(e) => setProductId(e.target.value)}
                          className="mt-1.5 w-full rounded-admin border border-[#e5ebf5] bg-white px-4 py-2.5 text-[#1c2740] placeholder:text-[#9ca3af] focus:border-[#246bfd] focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right column - 1/3 */}
          <div className="space-y-6">
            <div className="rounded-admin-card border border-[#e5ebf5] bg-white p-5 shadow-sm">
              <h3 className="text-sm font-bold text-[#1c2740]">Organize</h3>
              <div className="mt-4 space-y-4">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-[#1c2740]">Category</span>
                    <button type="button" onClick={openAddCategoryModal} className="text-sm text-[#246bfd] hover:underline">Add new category</button>
                  </div>
                  {categoriesError && (
                    <p className="mt-1.5 text-sm text-red-600">{categoriesError}</p>
                  )}
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    disabled={categoriesLoading}
                    className="mt-1.5 w-full rounded-admin border border-[#e5ebf5] bg-[#f8fafc] px-4 py-2.5 text-sm text-[#1c2740] focus:border-[#246bfd] focus:outline-none disabled:opacity-60"
                  >
                    <option value="">
                      {categoriesLoading ? 'Loading categories...' : 'Select category'}
                    </option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {'\u2014 '.repeat(c.depth ?? 0)}
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-[#1c2740]">Vendor</span>
                    <button type="button" onClick={openAddVendorModal} className="text-sm text-[#246bfd] hover:underline">Add new vendor</button>
                  </div>
                  {vendorsError && (
                    <p className="mt-1.5 text-sm text-red-600">{vendorsError}</p>
                  )}
                  <select
                    value={vendorId}
                    onChange={(e) => setVendorId(e.target.value)}
                    disabled={vendorsLoading}
                    className="mt-1.5 w-full rounded-admin border border-[#e5ebf5] bg-[#f8fafc] px-4 py-2.5 text-sm text-[#1c2740] focus:border-[#246bfd] focus:outline-none disabled:opacity-60"
                  >
                    <option value="">
                      {vendorsLoading ? 'Loading vendors...' : 'Select vendor'}
                    </option>
                    {vendors.map((v) => (
                      <option key={v.id} value={v.id}>{v.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-[#1c2740]">Collection</span>
                    <button type="button" onClick={openAddCollectionModal} className="text-sm text-[#246bfd] hover:underline">Add new collection</button>
                  </div>
                  {collectionsError && (
                    <p className="mt-1.5 text-sm text-red-600">{collectionsError}</p>
                  )}
                  <select
                    value={collectionId}
                    onChange={(e) => setCollectionId(e.target.value)}
                    disabled={collectionsLoading}
                    className="mt-1.5 w-full rounded-admin border border-[#e5ebf5] bg-[#f8fafc] px-4 py-2.5 text-sm text-[#1c2740] focus:border-[#246bfd] focus:outline-none disabled:opacity-60"
                  >
                    <option value="">
                      {collectionsLoading ? 'Loading collections...' : 'Select collection'}
                    </option>
                    {collections.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div className="relative">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-[#1c2740]">Tags</span>
                    <button type="button" onClick={openAddTagModal} className="text-sm text-[#246bfd] hover:underline">Add new tag</button>
                  </div>
                  {tagsError && (
                    <p className="mt-1.5 text-sm text-red-600">{tagsError}</p>
                  )}
                  {tagsLoading ? (
                    <p className="mt-1.5 text-sm text-[#64748b]">Loading tags...</p>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => setTagsDropdownOpen((open) => !open)}
                        className="mt-1.5 flex w-full items-center justify-between rounded-admin border border-[#e5ebf5] bg-[#f8fafc] px-4 py-2.5 text-left text-sm text-[#1c2740] focus:border-[#246bfd] focus:outline-none"
                      >
                        <span className={tagIds.length === 0 ? 'text-[#94a3b8]' : ''}>
                          {tagIds.length === 0
                            ? 'Select tags...'
                            : tagIds.length === 1
                              ? tags.find((t) => String(t.id) === tagIds[0])?.name ?? '1 tag'
                              : `${tagIds.length} tags selected`}
                        </span>
                        <svg className={`h-4 w-4 text-[#64748b] transition-transform ${tagsDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      {tagsDropdownOpen && (
                        <>
                          <div className="absolute left-0 right-0 top-full z-10 mt-0.5 max-h-48 overflow-y-auto rounded-admin border border-[#e5ebf5] bg-white py-1 shadow-lg">
                            {tags.length === 0 ? (
                              <p className="px-4 py-2 text-sm text-[#64748b]">No tags yet. Add one above.</p>
                            ) : (
                              tags.map((t) => (
                                <label
                                  key={t.id}
                                  className="flex cursor-pointer items-center gap-2 px-4 py-2 text-sm text-[#1c2740] hover:bg-[#f8fafc]"
                                >
                                  <input
                                    type="checkbox"
                                    checked={tagIds.includes(String(t.id))}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        setTagIds((prev) => [...prev, String(t.id)]);
                                      } else {
                                        setTagIds((prev) => prev.filter((id) => id !== String(t.id)));
                                      }
                                    }}
                                    className="h-4 w-4 rounded-admin border-[#e5ebf5] text-[#246bfd] focus:ring-[#246bfd]"
                                  />
                                  <span>{t.name}</span>
                                </label>
                              ))
                            )}
                          </div>
                          <div
                            className="fixed inset-0 z-9"
                            aria-hidden
                            onClick={() => setTagsDropdownOpen(false)}
                          />
                        </>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="rounded-admin-card border border-[#e5ebf5] bg-white p-5">
              <h3 className="text-sm font-bold text-[#1c2740]">Variants</h3>
              <div className="mt-4">
                {variantOptionTypesLoading ? (
                  <p className="text-sm text-[#64748b]">Loading variant options...</p>
                ) : variantOptionTypesError ? (
                  <p className="text-sm text-red-600">{variantOptionTypesError}</p>
                ) : variantOptionTypes.length === 0 ? (
                  <p className="text-sm text-[#64748b]">No option types in database. Add option types (e.g. Size, Color) to enable variants.</p>
                ) : (
                  <>
                    {variants.map((v, i) => (
                      <div key={i}>
                        {i > 0 && (
                          <div className="mb-4 border-b border-dashed border-[#e5ebf5]" />
                        )}
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-[#1c2740]">Option {i + 1}</span>
                            <button
                              type="button"
                              onClick={() => removeVariant(i)}
                              className="text-sm font-medium text-[#246bfd] hover:underline"
                            >
                              Remove
                            </button>
                          </div>
                          <div>
                            <label className="sr-only">Option name</label>
                            <select
                              value={v.optionTypeId}
                              onChange={(e) => updateVariantOption(i, Number(e.target.value))}
                              className="w-full rounded-admin border border-[#e5ebf5] bg-white px-4 py-2.5 text-sm text-[#1c2740] focus:border-[#246bfd] focus:outline-none"
                            >
                              {variantOptionTypes.map((t) => (
                                <option key={t.id} value={t.id}>{t.name}</option>
                              ))}
                            </select>
                          </div>
                          <div className="relative">
                            <label className="sr-only">Option values</label>
                            <button
                              type="button"
                              onClick={() => setVariantValueDropdownOpen((open) => (open === i ? null : i))}
                              className="flex w-full items-center justify-between rounded-admin border border-[#e5ebf5] bg-white px-4 py-2.5 text-left text-sm text-[#1c2740] focus:border-[#246bfd] focus:outline-none"
                            >
                              <span className={v.values.length === 0 ? 'text-[#94a3b8]' : ''}>
                                {v.values.length === 0
                                  ? 'Select values...'
                                  : getVariantOptionValues(v.optionTypeId)
                                      .filter((opt) => v.values.includes(opt.value))
                                      .map((opt) => opt.label)
                                      .join(', ')}
                              </span>
                              <svg className={`h-4 w-4 shrink-0 text-[#64748b] transition-transform ${variantValueDropdownOpen === i ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            </button>
                            {variantValueDropdownOpen === i && (
                              <>
                                <div className="absolute left-0 right-0 top-full z-10 mt-0.5 max-h-48 overflow-y-auto rounded-admin border border-[#e5ebf5] bg-white py-1 shadow-lg">
                                  {getVariantOptionValues(v.optionTypeId).map((opt) => (
                                    <label
                                      key={opt.id}
                                      className="flex cursor-pointer items-center gap-2 px-4 py-2 text-sm text-[#1c2740] hover:bg-[#f8fafc]"
                                    >
                                      <input
                                        type="checkbox"
                                        checked={v.values.includes(opt.value)}
                                        onChange={() => toggleVariantValue(i, opt.value)}
                                        className="h-4 w-4 rounded-admin border-[#e5ebf5] text-[#246bfd] focus:ring-[#246bfd]"
                                      />
                                      <span>{opt.label}</span>
                                    </label>
                                  ))}
                                </div>
                                <div
                                  className="fixed inset-0 z-9"
                                  aria-hidden
                                  onClick={() => setVariantValueDropdownOpen(null)}
                                />
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={addVariant}
                      disabled={variantOptionTypes.length === 0}
                      className="mt-4 w-full rounded-admin border border-[#bfdbfe] bg-[#eff6ff] py-2.5 text-sm font-medium text-[#246bfd] hover:bg-[#dbeafe] disabled:opacity-50"
                    >
                      Add another option
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Add category modal */}
        {showAddCategoryModal && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-category-title"
            onClick={closeAddCategoryModal}
          >
            <div className="w-full max-w-md rounded-admin-card border border-[#e5ebf5] bg-white p-5 shadow-lg" onClick={(e) => e.stopPropagation()}>
              <h2 id="add-category-title" className="text-lg font-bold text-[#1c2740]">Add new category</h2>
              <p className="mt-1 text-sm text-[#64748b]">Enter a name for the new category. The slug will be generated automatically.</p>
              <div className="mt-4">
                <label htmlFor="new-category-name" className="block text-sm font-medium text-[#1c2740]">Category name</label>
                <input
                  id="new-category-name"
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="e.g. Electronics"
                  className="mt-1.5 w-full rounded-admin border border-[#e5ebf5] bg-[#f8fafc] px-4 py-2.5 text-[#1c2740] placeholder:text-[#94a3b8] focus:border-[#246bfd] focus:outline-none"
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddCategory())}
                />
              </div>
              {addCategoryError && (
                <p className="mt-2 text-sm text-red-600">{addCategoryError}</p>
              )}
              <div className="mt-6 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={closeAddCategoryModal}
                  className="rounded-admin border border-[#e5ebf5] bg-white px-4 py-2 text-sm font-medium text-[#475569] hover:bg-[#f8fafc]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleAddCategory}
                  disabled={addCategoryLoading}
                  className="rounded-admin bg-[#246bfd] px-4 py-2 text-sm font-medium text-white hover:bg-[#1e5ae0] disabled:opacity-60"
                >
                  {addCategoryLoading ? 'Saving…' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Add vendor modal */}
        {showAddVendorModal && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-vendor-title"
            onClick={closeAddVendorModal}
          >
            <div className="w-full max-w-md rounded-admin-card border border-[#e5ebf5] bg-white p-5 shadow-lg" onClick={(e) => e.stopPropagation()}>
              <h2 id="add-vendor-title" className="text-lg font-bold text-[#1c2740]">Add new vendor</h2>
              <p className="mt-1 text-sm text-[#64748b]">Enter a name for the new vendor. The slug will be generated automatically.</p>
              <div className="mt-4">
                <label htmlFor="new-vendor-name" className="block text-sm font-medium text-[#1c2740]">Vendor name</label>
                <input
                  id="new-vendor-name"
                  type="text"
                  value={newVendorName}
                  onChange={(e) => setNewVendorName(e.target.value)}
                  placeholder="e.g. Acme Corp"
                  className="mt-1.5 w-full rounded-admin border border-[#e5ebf5] bg-[#f8fafc] px-4 py-2.5 text-[#1c2740] placeholder:text-[#94a3b8] focus:border-[#246bfd] focus:outline-none"
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddVendor())}
                />
              </div>
              {addVendorError && (
                <p className="mt-2 text-sm text-red-600">{addVendorError}</p>
              )}
              <div className="mt-6 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={closeAddVendorModal}
                  className="rounded-admin border border-[#e5ebf5] bg-white px-4 py-2 text-sm font-medium text-[#475569] hover:bg-[#f8fafc]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleAddVendor}
                  disabled={addVendorLoading}
                  className="rounded-admin bg-[#246bfd] px-4 py-2 text-sm font-medium text-white hover:bg-[#1e5ae0] disabled:opacity-60"
                >
                  {addVendorLoading ? 'Saving…' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Add collection modal */}
        {showAddCollectionModal && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-collection-title"
            onClick={closeAddCollectionModal}
          >
            <div className="w-full max-w-md rounded-admin-card border border-[#e5ebf5] bg-white p-5 shadow-lg" onClick={(e) => e.stopPropagation()}>
              <h2 id="add-collection-title" className="text-lg font-bold text-[#1c2740]">Add new collection</h2>
              <p className="mt-1 text-sm text-[#64748b]">Enter a name for the new collection. The slug will be generated automatically.</p>
              <div className="mt-4">
                <label htmlFor="new-collection-name" className="block text-sm font-medium text-[#1c2740]">Collection name</label>
                <input
                  id="new-collection-name"
                  type="text"
                  value={newCollectionName}
                  onChange={(e) => setNewCollectionName(e.target.value)}
                  placeholder="e.g. Summer 2026"
                  className="mt-1.5 w-full rounded-admin border border-[#e5ebf5] bg-[#f8fafc] px-4 py-2.5 text-[#1c2740] placeholder:text-[#94a3b8] focus:border-[#246bfd] focus:outline-none"
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddCollection())}
                />
              </div>
              {addCollectionError && (
                <p className="mt-2 text-sm text-red-600">{addCollectionError}</p>
              )}
              <div className="mt-6 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={closeAddCollectionModal}
                  className="rounded-admin border border-[#e5ebf5] bg-white px-4 py-2 text-sm font-medium text-[#475569] hover:bg-[#f8fafc]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleAddCollection}
                  disabled={addCollectionLoading}
                  className="rounded-admin bg-[#246bfd] px-4 py-2 text-sm font-medium text-white hover:bg-[#1e5ae0] disabled:opacity-60"
                >
                  {addCollectionLoading ? 'Saving…' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Add tag modal */}
        {showAddTagModal && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-tag-title"
            onClick={closeAddTagModal}
          >
            <div className="w-full max-w-md rounded-admin-card border border-[#e5ebf5] bg-white p-5 shadow-lg" onClick={(e) => e.stopPropagation()}>
              <h2 id="add-tag-title" className="text-lg font-bold text-[#1c2740]">Add new tag</h2>
              <p className="mt-1 text-sm text-[#64748b]">Enter a name for the new tag. The slug will be generated automatically.</p>
              <div className="mt-4">
                <label htmlFor="new-tag-name" className="block text-sm font-medium text-[#1c2740]">Tag name</label>
                <input
                  id="new-tag-name"
                  type="text"
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  placeholder="e.g. Bestseller"
                  className="mt-1.5 w-full rounded-admin border border-[#e5ebf5] bg-[#f8fafc] px-4 py-2.5 text-[#1c2740] placeholder:text-[#94a3b8] focus:border-[#246bfd] focus:outline-none"
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                />
              </div>
              {addTagError && (
                <p className="mt-2 text-sm text-red-600">{addTagError}</p>
              )}
              <div className="mt-6 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={closeAddTagModal}
                  className="rounded-admin border border-[#e5ebf5] bg-white px-4 py-2 text-sm font-medium text-[#475569] hover:bg-[#f8fafc]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleAddTag}
                  disabled={addTagLoading}
                  className="rounded-admin bg-[#246bfd] px-4 py-2 text-sm font-medium text-white hover:bg-[#1e5ae0] disabled:opacity-60"
                >
                  {addTagLoading ? 'Saving…' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        )}

        <footer className="mt-12 border-t border-[#e4eaf5] py-4 text-center text-sm text-[#8ea0bf]">
          Thank you for creating with Phoenix Tailwind | 2026 © ThemeWagon
          <span className="ml-4 text-right">v1.0.0</span>
        </footer>
    </AdminPageShell>
  );
}

