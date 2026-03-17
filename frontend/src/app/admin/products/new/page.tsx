'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/auth-store';

type Category = { id: number; name: string; slug: string };
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

export default function AddProductPage() {
  const router = useRouter();
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
  const [restockQuantity, setRestockQuantity] = useState('');
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
  const [variants, setVariants] = useState([{ option: 'Size' }, { option: 'Size' }]);
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

  const addVariant = () => setVariants((prev) => [...prev, { option: 'Size' }]);
  const removeVariant = (index: number) => setVariants((prev) => prev.filter((_, i) => i !== index));

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
      if (!res.ok) throw new Error((data as { message?: string }).message || 'Failed to create category');
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
      if (!res.ok) throw new Error((data as { message?: string }).message || 'Failed to create vendor');
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
      if (!res.ok) throw new Error((data as { message?: string }).message || 'Failed to create collection');
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
      if (!res.ok) throw new Error((data as { message?: string }).message || 'Failed to create tag');
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

  const handleDiscard = () => {
    if (confirm('Discard changes?')) {
      setTitle('');
      setDescription('');
      setImageUrls([]);
      setRegularPrice('');
      setSalePrice('');
      setStock('');
      setCategoryId('');
      setVendorId('');
      setCollectionId('');
      setTagIds([]);
    }
  };

  const handlePublish = async () => {
    setError('');
    const price = Math.round(parseFloat(regularPrice || '0') * 100);
    const stockNum = parseInt(stock || '0', 10) || 0;
    if (!title.trim()) {
      setError('Product title is required');
      return;
    }
    if (!categoryId) {
      setError('Please select a category');
      return;
    }
    if (price < 0) {
      setError('Regular price must be valid');
      return;
    }
    setIsSubmitting(true);
    try {
      const base = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000';
      const res = await fetch(`${base}/api/products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify({
          name: title.trim(),
          shortDescription: description.trim().slice(0, 255) || undefined,
          description: description.trim() || undefined,
          priceCents: price,
          stock: stockNum,
          categoryId: Number(categoryId),
          imageUrls: imageUrls.filter(Boolean),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error((data as { message?: string }).message || 'Failed to create product');
      router.push('/admin');
    } catch (e) {
      setError((e as Error).message || 'Failed to create product');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-full bg-[#f2f5fb]">
      <div className="border-b border-[#e4eaf5] bg-white px-6 py-3">
        <nav className="text-sm text-[#8ea0bf]">
          <Link href="/admin" className="hover:text-[#246bfd]">Dashboard</Link>
          <span className="mx-2">/</span>
          <span className="text-[#1c2740]">Add product</span>
        </nav>
      </div>

      <div className="mx-auto max-w-7xl px-6 py-6">
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#1c2740]">Add a product</h1>
            <p className="mt-1 text-sm text-[#8ea0bf]">Orders placed across your store.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleDiscard}
              className="rounded border border-[#e5ebf5] bg-white px-4 py-2 text-sm font-medium text-[#4f607f] hover:bg-[#f4f7fc]"
            >
              Discard
            </button>
            <button
              type="button"
              className="rounded border border-[#246bfd] bg-white px-4 py-2 text-sm font-medium text-[#246bfd] hover:bg-[#eef4ff]"
            >
              Save draft
            </button>
            <button
              type="button"
              onClick={handlePublish}
              disabled={isSubmitting}
              className="rounded bg-[#246bfd] px-4 py-2 text-sm font-medium text-white hover:bg-[#1e5ae0] disabled:opacity-60"
            >
              {isSubmitting ? 'Publishing…' : 'Publish product'}
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
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
                className="mt-2 w-full rounded border border-[#e5ebf5] bg-[#f9fbff] px-4 py-2.5 text-[#1c2740] placeholder:text-[#8ea0bf] focus:border-[#246bfd] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#1c2740]">Product Description</label>
              <div className="mt-2 flex flex-wrap gap-1 rounded-t border border-b-0 border-[#e5ebf5] bg-[#f9fbff] px-2 py-1">
                <ToolbarButton title="Undo">↶</ToolbarButton>
                <ToolbarButton title="Redo">↷</ToolbarButton>
                <ToolbarButton title="Bold">B</ToolbarButton>
                <ToolbarButton title="Italic">I</ToolbarButton>
                <ToolbarButton title="Underline">U</ToolbarButton>
                <ToolbarButton title="Strikethrough">S</ToolbarButton>
                <span className="border-l border-[#e5ebf5] pl-1" />
                <ToolbarButton title="Align left">≡</ToolbarButton>
                <ToolbarButton title="Align center">≡</ToolbarButton>
                <ToolbarButton title="Align right">≡</ToolbarButton>
                <ToolbarButton title="Justify">≡</ToolbarButton>
                <span className="border-l border-[#e5ebf5] pl-1" />
                <ToolbarButton title="Bullet list">•</ToolbarButton>
                <ToolbarButton title="Numbered list">1.</ToolbarButton>
                <ToolbarButton title="Link">🔗</ToolbarButton>
              </div>
              <textarea
                placeholder="Write a description here..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={6}
                className="w-full rounded-b border border-[#e5ebf5] bg-[#f9fbff] px-4 py-3 text-[#1c2740] placeholder:text-[#8ea0bf] focus:border-[#246bfd] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#1c2740]">Display images</label>
              <div className="mt-2 flex flex-col gap-3">
                <div className="flex flex-col items-center justify-center rounded border-2 border-dashed border-[#e5ebf5] bg-[#f9fbff] py-10 text-center">
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
                    className="flex-1 min-w-[200px] rounded border border-[#e5ebf5] bg-white px-3 py-2 text-sm placeholder:text-[#8ea0bf] focus:border-[#246bfd] focus:outline-none"
                  />
                  <button type="button" onClick={addImageUrl} className="rounded bg-[#246bfd] px-4 py-2 text-sm font-medium text-white hover:bg-[#1e5ae0]">
                    Add image URL
                  </button>
                </div>
                {imageUrls.length > 0 && (
                  <ul className="flex flex-wrap gap-2">
                    {imageUrls.map((url, i) => (
                      <li key={i} className="relative flex items-center gap-2 rounded border border-[#e5ebf5] bg-white px-2 py-1 text-xs">
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
                        className="mt-1.5 w-full rounded-sm border border-[#e5ebf5] bg-white px-4 py-2.5 text-[#1c2740] placeholder:text-[#9ca3af] focus:border-[#246bfd] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#1c2740]">Sale price</label>
                      <input
                        type="text"
                        placeholder="$$$"
                        value={salePrice}
                        onChange={(e) => setSalePrice(e.target.value)}
                        className="mt-1.5 w-full rounded-sm border border-[#e5ebf5] bg-white px-4 py-2.5 text-[#1c2740] placeholder:text-[#9ca3af] focus:border-[#246bfd] focus:outline-none"
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
                          type="number"
                          min={0}
                          placeholder="Quantity"
                          value={restockQuantity}
                          onChange={(e) => setRestockQuantity(e.target.value)}
                          className="w-full rounded-sm border border-[#e5ebf5] bg-white px-4 py-2.5 text-[#1c2740] placeholder:text-[#9ca3af] focus:border-[#246bfd] focus:outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                        />
                      </div>
                      <button type="button" className="flex items-center gap-2 rounded-sm bg-[#246bfd] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#1e5ae0]">
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                        Confirm
                      </button>
                    </div>
                    <div className="rounded-sm border border-[#e5ebf5] bg-[#f8fafc] p-3">
                      <label className="block text-xs font-medium text-[#64748b]">Initial stock (for new product)</label>
                      <input
                        type="number"
                        min={0}
                        value={stock}
                        onChange={(e) => setStock(e.target.value)}
                        className="mt-1 w-32 rounded-sm border border-[#e5ebf5] bg-white px-3 py-2 text-sm text-[#1c2740] focus:border-[#246bfd] focus:outline-none"
                      />
                    </div>
                    <div className="space-y-2 border-t border-[#e5ebf5] pt-4 text-sm text-[#475569]">
                      <p className="flex items-center gap-2">
                        Product in stock now: <span className="font-medium text-[#1c2740]">$1,090</span>
                        <button type="button" className="text-[#64748b] hover:text-[#246bfd]" aria-label="Refresh">
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                        </button>
                      </p>
                      <p>Product in transit: 5,000</p>
                      <p>Last time restocked: 30th June, 2021</p>
                      <p>Total stock over lifetime: 20,000</p>
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
                            <span className="rounded border border-[#ea580c] bg-[#fff7ed] px-2 py-0.5 text-xs font-medium text-[#c2410c]">RECOMMENDED</span>
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
                          className="mt-1.5 w-full rounded-sm border border-[#e5ebf5] bg-white px-4 py-2.5 text-[#1c2740] focus:border-[#246bfd] focus:outline-none"
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
                          className="mt-1.5 w-full rounded-sm border border-[#e5ebf5] bg-white px-4 py-2.5 text-[#1c2740] placeholder:text-[#9ca3af] focus:border-[#246bfd] focus:outline-none"
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
            <div className="rounded-lg border border-[#e5ebf5] bg-white p-5 shadow-sm">
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
                    className="mt-1.5 w-full rounded-sm border border-[#e5ebf5] bg-[#f8fafc] px-4 py-2.5 text-sm text-[#1c2740] focus:border-[#246bfd] focus:outline-none disabled:opacity-60"
                  >
                    <option value="">
                      {categoriesLoading ? 'Loading categories...' : 'Select category'}
                    </option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
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
                    className="mt-1.5 w-full rounded-sm border border-[#e5ebf5] bg-[#f8fafc] px-4 py-2.5 text-sm text-[#1c2740] focus:border-[#246bfd] focus:outline-none disabled:opacity-60"
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
                    className="mt-1.5 w-full rounded-sm border border-[#e5ebf5] bg-[#f8fafc] px-4 py-2.5 text-sm text-[#1c2740] focus:border-[#246bfd] focus:outline-none disabled:opacity-60"
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
                        className="mt-1.5 flex w-full items-center justify-between rounded-sm border border-[#e5ebf5] bg-[#f8fafc] px-4 py-2.5 text-left text-sm text-[#1c2740] focus:border-[#246bfd] focus:outline-none"
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
                          <div className="absolute left-0 right-0 top-full z-10 mt-0.5 max-h-48 overflow-y-auto rounded-sm border border-[#e5ebf5] bg-white py-1 shadow-lg">
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
                                    className="h-4 w-4 rounded border-[#e5ebf5] text-[#246bfd] focus:ring-[#246bfd]"
                                  />
                                  <span>{t.name}</span>
                                </label>
                              ))
                            )}
                          </div>
                          <div
                            className="fixed inset-0 z-[9]"
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

            <div className="rounded border border-[#e5ebf5] bg-white p-5 shadow-sm">
              <label className="block text-sm font-medium text-[#1c2740]">Variants</label>
              <div className="mt-4 space-y-4">
                {variants.map((v, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <select
                      value={v.option}
                      onChange={(e) => setVariants((prev) => prev.map((x, j) => (j === i ? { ...x, option: e.target.value } : x)))}
                      className="flex-1 rounded border border-[#e5ebf5] bg-[#f9fbff] px-4 py-2 text-sm focus:border-[#246bfd] focus:outline-none"
                    >
                      <option>Size</option>
                      <option>Color</option>
                    </select>
                    <button type="button" onClick={() => removeVariant(i)} className="text-sm text-red-500 hover:underline">Remove</button>
                  </div>
                ))}
                <button type="button" onClick={addVariant} className="text-sm font-medium text-[#246bfd] hover:underline">
                  Add another option
                </button>
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
            <div className="w-full max-w-md rounded-lg border border-[#e5ebf5] bg-white p-5 shadow-lg" onClick={(e) => e.stopPropagation()}>
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
                  className="mt-1.5 w-full rounded-sm border border-[#e5ebf5] bg-[#f8fafc] px-4 py-2.5 text-[#1c2740] placeholder:text-[#94a3b8] focus:border-[#246bfd] focus:outline-none"
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
                  className="rounded-sm border border-[#e5ebf5] bg-white px-4 py-2 text-sm font-medium text-[#475569] hover:bg-[#f8fafc]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleAddCategory}
                  disabled={addCategoryLoading}
                  className="rounded-sm bg-[#246bfd] px-4 py-2 text-sm font-medium text-white hover:bg-[#1e5ae0] disabled:opacity-60"
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
            <div className="w-full max-w-md rounded-lg border border-[#e5ebf5] bg-white p-5 shadow-lg" onClick={(e) => e.stopPropagation()}>
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
                  className="mt-1.5 w-full rounded-sm border border-[#e5ebf5] bg-[#f8fafc] px-4 py-2.5 text-[#1c2740] placeholder:text-[#94a3b8] focus:border-[#246bfd] focus:outline-none"
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
                  className="rounded-sm border border-[#e5ebf5] bg-white px-4 py-2 text-sm font-medium text-[#475569] hover:bg-[#f8fafc]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleAddVendor}
                  disabled={addVendorLoading}
                  className="rounded-sm bg-[#246bfd] px-4 py-2 text-sm font-medium text-white hover:bg-[#1e5ae0] disabled:opacity-60"
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
            <div className="w-full max-w-md rounded-lg border border-[#e5ebf5] bg-white p-5 shadow-lg" onClick={(e) => e.stopPropagation()}>
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
                  className="mt-1.5 w-full rounded-sm border border-[#e5ebf5] bg-[#f8fafc] px-4 py-2.5 text-[#1c2740] placeholder:text-[#94a3b8] focus:border-[#246bfd] focus:outline-none"
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
                  className="rounded-sm border border-[#e5ebf5] bg-white px-4 py-2 text-sm font-medium text-[#475569] hover:bg-[#f8fafc]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleAddCollection}
                  disabled={addCollectionLoading}
                  className="rounded-sm bg-[#246bfd] px-4 py-2 text-sm font-medium text-white hover:bg-[#1e5ae0] disabled:opacity-60"
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
            <div className="w-full max-w-md rounded-lg border border-[#e5ebf5] bg-white p-5 shadow-lg" onClick={(e) => e.stopPropagation()}>
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
                  className="mt-1.5 w-full rounded-sm border border-[#e5ebf5] bg-[#f8fafc] px-4 py-2.5 text-[#1c2740] placeholder:text-[#94a3b8] focus:border-[#246bfd] focus:outline-none"
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
                  className="rounded-sm border border-[#e5ebf5] bg-white px-4 py-2 text-sm font-medium text-[#475569] hover:bg-[#f8fafc]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleAddTag}
                  disabled={addTagLoading}
                  className="rounded-sm bg-[#246bfd] px-4 py-2 text-sm font-medium text-white hover:bg-[#1e5ae0] disabled:opacity-60"
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
      </div>
    </div>
  );
}

function ToolbarButton({ children, title }: { children: React.ReactNode; title: string }) {
  return (
    <button type="button" title={title} className="rounded p-1.5 text-[#4f607f] hover:bg-[#e5ebf5] hover:text-[#1c2740]">
      {children}
    </button>
  );
}
