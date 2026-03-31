'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { apiRequest } from '@/lib/api';
import { categoryInitials, type StorefrontCategory } from '@/lib/category-ui';
import type { User } from '@/lib/types';
import { useAuthStore } from '@/store/auth-store';
import { useCartStore } from '@/store/cart-store';
import { useWishlistStore } from '@/store/wishlist-store';
import { NewsletterFooterForm } from '@/components/newsletter-footer-form';
import type { ContactSettings } from '@/lib/contact-settings';

function StorefrontHeader({
  cartCount,
  user,
  pathname,
  logout,
  router,
}: {
  cartCount: number;
  user: User | null;
  pathname: string;
  logout: () => void;
  router: ReturnType<typeof useRouter>;
}) {
  const [activeMenu, setActiveMenu] = useState<'none' | 'categories' | 'shop' | 'blog'>('none');
  const [categories, setCategories] = useState<StorefrontCategory[]>([]);
  const [blogCategories, setBlogCategories] = useState<{ id: number; name: string; slug: string }[]>([]);
  const [activeCategorySlug, setActiveCategorySlug] = useState('');
  /** `null` = search all products; otherwise filter by category slug */
  const [searchCategorySlug, setSearchCategorySlug] = useState<string | null>(null);
  const [isSearchCategoryOpen, setIsSearchCategoryOpen] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [headerScrolled, setHeaderScrolled] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const wishlistCount = useWishlistStore((state) => state.items.length);

  const firstName = user?.name?.split(' ')[0] || 'Account';

  useEffect(() => {
    if (!userMenuOpen) return;
    const onDoc = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [userMenuOpen]);

  useEffect(() => {
    const onScroll = () => setHeaderScrolled(window.scrollY > 4);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    let cancelled = false;
    apiRequest<{ data: StorefrontCategory[] }>('/api/categories')
      .then((res) => {
        if (!cancelled) setCategories(Array.isArray(res.data) ? res.data : []);
      })
      .catch(() => {
        if (!cancelled) setCategories([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    apiRequest<{ data: { id: number; name: string; slug: string }[] }>('/api/blog/categories')
      .then((res) => {
        if (!cancelled) setBlogCategories(Array.isArray(res.data) ? res.data : []);
      })
      .catch(() => {
        if (!cancelled) setBlogCategories([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const rootCategories = useMemo(
    () => categories.filter((c) => c.parentId == null),
    [categories],
  );

  /** Parent category ids that have at least one direct child (for “has submenu” chevron). */
  const categoryIdsWithChildren = useMemo(() => {
    const ids = new Set<number>();
    for (const c of categories) {
      if (c.parentId != null) ids.add(c.parentId);
    }
    return ids;
  }, [categories]);

  useEffect(() => {
    if (searchCategorySlug == null || rootCategories.length === 0) return;
    if (!rootCategories.some((c) => c.slug === searchCategorySlug)) {
      setSearchCategorySlug(null);
    }
  }, [rootCategories, searchCategorySlug]);

  useEffect(() => {
    if (rootCategories.length === 0) return;
    if (!activeCategorySlug || !rootCategories.some((c) => c.slug === activeCategorySlug)) {
      setActiveCategorySlug(rootCategories[0].slug);
    }
  }, [rootCategories, activeCategorySlug]);

  const activeCategoryItem =
    rootCategories.find((c) => c.slug === activeCategorySlug) ?? rootCategories[0] ?? null;
  const subcategoriesForActive = useMemo(() => {
    if (!activeCategoryItem) return [];
    return categories
      .filter((c) => c.parentId === activeCategoryItem.id)
      .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));
  }, [categories, activeCategoryItem]);
  const activeCategoryIndex = Math.max(
    0,
    rootCategories.findIndex((c) => c.slug === activeCategorySlug),
  );
  const searchCategoryLabel =
    searchCategorySlug == null
      ? 'All Categories'
      : categories.find((c) => c.slug === searchCategorySlug)?.name ?? 'All Categories';
  const categoryRowHeight = 74;
  const submenuTop = activeCategoryIndex * categoryRowHeight;
  const handleSearchSubmit = (e: FormEvent) => {
    e.preventDefault();
    const query = searchText.trim();
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    if (searchCategorySlug) params.set('category', searchCategorySlug);
    const queryString = params.toString();
    router.push(queryString ? `/shop?${queryString}` : '/shop');
    setIsSearchCategoryOpen(false);
  };

  return (
    <>
      {/* Sticky storefront header: logo, search, category menu (promo bar above scrolls away) */}
      <header
        className={`sticky top-0 z-50 w-full border-b border-[var(--border)] bg-[var(--card-bg)] transition-shadow duration-200 ${
          headerScrolled ? 'shadow-md' : 'shadow-[var(--shadow-sm)]'
        }`}
      >
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-2.5 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="font-display text-xl font-semibold text-[var(--navy)] transition-premium hover:opacity-90"
          >
            Dhidi
          </Link>

          <div className="hidden flex-1 justify-center lg:flex">
            <form onSubmit={handleSearchSubmit} className="flex w-full max-w-xl items-center rounded-none border border-[#0989ff] bg-white">
              <input
                type="search"
                placeholder="Search for Products..."
                className="h-10 w-full bg-transparent px-4 text-sm outline-none placeholder:text-[#8c9db6]"
                aria-label="Search"
                onFocus={() => setIsSearchCategoryOpen(false)}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
              />
              <div
                className="relative h-10 w-[180px] border-l border-[#d9e4f3]"
                onBlur={(e) => {
                  if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
                    setIsSearchCategoryOpen(false);
                  }
                }}
              >
                <button
                  type="button"
                  onClick={() => setIsSearchCategoryOpen((open) => !open)}
                  className="flex h-full w-full items-center justify-between whitespace-nowrap px-4 text-sm font-semibold text-[#1f2f4e]"
                >
                  {searchCategoryLabel}
                  <svg className="h-4 w-4 text-[#1f2f4e]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {isSearchCategoryOpen && (
                  <div className="absolute left-0 top-full z-70 mt-1 max-h-64 w-full overflow-y-auto rounded-sm border border-[#e6edf6] bg-white shadow-[0_10px_20px_rgba(16,24,40,0.12)]">
                    <button
                      type="button"
                      onClick={() => {
                        setSearchCategorySlug(null);
                        setIsSearchCategoryOpen(false);
                      }}
                      className="block w-full px-4 py-2.5 text-left text-sm font-semibold text-[#111827] transition hover:bg-[#f8fbff] hover:text-[#0989ff]"
                    >
                      All Categories
                    </button>
                    {rootCategories.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => {
                          setSearchCategorySlug(c.slug);
                          setIsSearchCategoryOpen(false);
                        }}
                        className="block w-full px-4 py-2.5 text-left text-sm text-[#344054] transition hover:bg-[#f8fbff] hover:text-[#0989ff]"
                      >
                        {c.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <button
                type="submit"
                className="flex h-10 w-16 items-center justify-center bg-[#0989ff] text-white transition-premium hover:bg-[#0476df]"
                aria-label="Search"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35m1.1-4.4a6.5 6.5 0 11-13 0 6.5 6.5 0 0113 0z" />
                </svg>
              </button>
            </form>
          </div>

          <nav className="flex items-center gap-1.5 sm:gap-2.5">
            {user && (
              <Link
                href="/wishlist"
                className="relative flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-medium text-[var(--navy)] transition-premium hover:bg-[var(--cream)]"
              >
                <span className="sr-only">Wishlist</span>
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                {wishlistCount > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-[var(--accent)] text-[10px] font-semibold text-white">
                    {wishlistCount > 99 ? '99+' : wishlistCount}
                  </span>
                )}
              </Link>
            )}
            <Link
              href="/cart"
              className="relative flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-medium text-[var(--navy)] transition-premium hover:bg-[var(--cream)]"
            >
              <span className="sr-only">Cart</span>
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              {cartCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-[var(--accent)] text-[10px] font-semibold text-white">
                  {cartCount > 99 ? '99+' : cartCount}
                </span>
              )}
            </Link>
            {!user ? (
              <Link href={`/login?redirect=${encodeURIComponent(pathname)}`} className="rounded-md bg-[var(--accent)] px-3 py-1.5 text-xs font-medium text-white">
                Login
              </Link>
            ) : (
              <div className="relative" ref={userMenuRef}>
                <button
                  type="button"
                  onClick={() => setUserMenuOpen((o) => !o)}
                  className="flex max-w-[200px] items-center gap-1 rounded-md border border-transparent px-2 py-1.5 text-left text-xs font-medium text-[var(--navy)] transition-premium hover:bg-[var(--cream)] md:max-w-none md:gap-1.5 md:px-3 md:text-sm"
                  aria-expanded={userMenuOpen}
                  aria-haspopup="menu"
                >
                  <span className="truncate">
                    Hello, {firstName}
                  </span>
                  <svg className="h-4 w-4 shrink-0 text-[var(--muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {userMenuOpen && (
                  <div
                    role="menu"
                    className="absolute right-0 top-full z-[100] mt-1 min-w-[200px] rounded-none border border-[var(--border)] bg-[var(--card-bg)] py-1 shadow-[0_10px_24px_rgba(15,23,42,0.12)]"
                  >
                    <Link
                      href="/account/profile"
                      role="menuitem"
                      className="block px-4 py-2.5 text-sm text-[var(--navy)] hover:bg-[var(--cream)]"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      Profile
                    </Link>
                    <Link
                      href="/account/orders"
                      role="menuitem"
                      className="block px-4 py-2.5 text-sm text-[var(--navy)] hover:bg-[var(--cream)]"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      My orders
                    </Link>
                    <Link
                      href="/account/addresses"
                      role="menuitem"
                      className="block px-4 py-2.5 text-sm text-[var(--navy)] hover:bg-[var(--cream)]"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      Addresses
                    </Link>
                    <button
                      type="button"
                      role="menuitem"
                      className="w-full border-t border-[var(--border)] px-4 py-2.5 text-left text-sm text-[var(--navy)] hover:bg-[var(--cream)]"
                      onClick={() => {
                        setUserMenuOpen(false);
                        logout();
                        if (pathname.startsWith('/account')) router.push('/');
                      }}
                    >
                      Log out
                    </button>
                  </div>
                )}
              </div>
            )}
          </nav>
        </div>

        {/* Secondary nav strip with hover submenus */}
        <div className="relative border-t border-[var(--border)] bg-white" onMouseLeave={() => setActiveMenu('none')}>
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-0 sm:px-6 lg:px-8">
            <button
              type="button"
              onMouseEnter={() => setActiveMenu('categories')}
              className="flex h-12 min-w-[230px] items-center justify-between bg-[#0989ff] px-4 text-sm font-semibold text-white"
            >
              <span className="flex items-center gap-3">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
                All Categories
              </span>
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            <nav className="flex flex-1 items-center gap-7 px-2 text-sm font-semibold text-[#101828]">
              <button type="button" onMouseEnter={() => setActiveMenu('shop')} className="flex items-center gap-1 py-3 text-[#0989ff]">
                Shop
                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {blogCategories.length > 0 ? (
                <div className="relative" onMouseEnter={() => setActiveMenu('blog')}>
                  <button type="button" className="flex items-center gap-1 py-3 hover:text-[#0989ff]">
                    Blog
                    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {activeMenu === 'blog' && (
                    <div className="absolute left-0 top-full z-[80] min-w-[220px] rounded-none border border-[#e6edf6] bg-white p-4 shadow-[0_12px_24px_rgba(16,24,40,0.12)]">
                      <ul className="space-y-3 text-sm text-[#475467]">
                        <li>
                          <Link href="/blog" className="hover:text-[#0989ff]" onClick={() => setActiveMenu('none')}>
                            All posts
                          </Link>
                        </li>
                        {blogCategories.map((c) => (
                          <li key={c.id}>
                            <Link
                              href={`/blog?category=${encodeURIComponent(c.slug)}`}
                              className="hover:text-[#0989ff]"
                              onClick={() => setActiveMenu('none')}
                            >
                              {c.name}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  href="/blog"
                  onMouseEnter={() => setActiveMenu('none')}
                  className="py-3 hover:text-[#0989ff]"
                >
                  Blog
                </Link>
              )}
              <Link
                href="/contact"
                onMouseEnter={() => setActiveMenu('none')}
                className="py-3 hover:text-[#0989ff]"
              >
                Contact Us
              </Link>
            </nav>
          </div>

          {activeMenu === 'categories' && (
            <div className="absolute left-0 right-0 top-full z-[70]">
              <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="relative w-[300px] rounded-b-md bg-white shadow-[0_12px_24px_rgba(16,24,40,0.12)]">
                  {rootCategories.length === 0 ? (
                    <div className="px-4 py-6 text-sm text-[#667085]">
                      {categories.length === 0 ? 'Loading categories…' : 'No top-level categories.'}
                    </div>
                  ) : (
                    rootCategories.map((item) => {
                      const hasChildren = categoryIdsWithChildren.has(item.id);
                      const isActive = activeCategorySlug === item.slug;
                      const rowClass = `flex h-[74px] w-full items-center gap-3 border-b border-[#edf2f7] px-4 text-left transition ${
                        isActive ? 'bg-[#f8fbff] text-[#0989ff]' : 'text-[#344054] hover:bg-[#f8fbff]'
                      }`;
                      const rowInner = (
                        <>
                          <div className="flex h-14 w-14 shrink-0 items-center justify-center">
                            {item.iconUrl ? (
                              <span
                                className="block h-14 w-14 shrink-0 bg-contain bg-center bg-no-repeat"
                                style={{ backgroundImage: `url(${item.iconUrl})` }}
                                role="img"
                                aria-hidden
                              />
                            ) : (
                              <span className="text-center text-[13px] font-semibold leading-tight text-[#344054]">
                                {categoryInitials(item.name)}
                              </span>
                            )}
                          </div>
                          <span className="flex-1 text-sm font-semibold">{item.name}</span>
                          {hasChildren ? (
                            <svg className="h-4 w-4 shrink-0 text-[#98a2b3]" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          ) : null}
                        </>
                      );
                      if (hasChildren) {
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onMouseEnter={() => setActiveCategorySlug(item.slug)}
                            className={rowClass}
                          >
                            {rowInner}
                          </button>
                        );
                      }
                      return (
                        <Link
                          key={item.id}
                          href={`/shop?category=${encodeURIComponent(item.slug)}`}
                          onMouseEnter={() => setActiveCategorySlug(item.slug)}
                          onClick={() => setActiveMenu('none')}
                          className={rowClass}
                        >
                          {rowInner}
                        </Link>
                      );
                    })
                  )}

                  {activeCategoryItem && subcategoriesForActive.length > 0 ? (
                    <div
                      className="absolute left-full min-w-[200px] max-w-sm max-h-[min(320px,70vh)] overflow-y-auto bg-white px-3 py-2 shadow-[0_12px_24px_rgba(16,24,40,0.12)]"
                      style={{ top: `${submenuTop}px` }}
                    >
                      <ul className="space-y-0.5">
                        {subcategoriesForActive.map((sub) => (
                          <li key={sub.id}>
                            <Link
                              href={`/shop?category=${encodeURIComponent(sub.slug)}`}
                              className="block rounded-sm px-1 py-1.5 text-sm font-medium text-[#344054] hover:bg-[#f8fbff] hover:text-[#0989ff]"
                            >
                              {sub.name}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          )}

          {activeMenu === 'shop' && (
            <div className="absolute left-0 right-0 top-full z-[70]">
              <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-5 gap-4 bg-white px-6 py-5 shadow-[0_12px_24px_rgba(16,24,40,0.12)]">
                  <div>
                    <h4 className="mb-3 text-lg font-semibold text-[#101828]">Categories</h4>
                    <ul className="max-h-52 space-y-2 overflow-y-auto text-sm text-[#475467]">
                      {categories.length === 0 ? (
                        <li className="text-[#98a2b3]">Loading…</li>
                      ) : (
                        categories.map((c) => (
                          <li key={c.id}>
                            <Link href={`/shop?category=${encodeURIComponent(c.slug)}`} className="hover:text-[#0989ff]">
                              {'\u2014 '.repeat(c.depth ?? 0)}
                              {c.name}
                            </Link>
                          </li>
                        ))
                      )}
                    </ul>
                  </div>
                  <div>
                    <h4 className="mb-3 text-lg font-semibold text-[#101828]">Features</h4>
                    <ul className="space-y-2 text-sm text-[#475467]">
                      {['Filter Dropdown', 'Filters Offcanvas', 'Filters Sidebar', 'Load More button', '1600px Layout', 'Collections list', 'Hidden search', 'Search Full screen'].map((item) => (
                        <li key={item}><Link href="/" className="hover:text-[#0989ff]">{item}</Link></li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="mb-3 text-lg font-semibold text-[#101828]">Hover Style</h4>
                    <ul className="space-y-2 text-sm text-[#475467]">
                      {['Hover Style 1', 'Hover Style 2', 'Hover Style 3', 'Hover Style 4'].map((item) => (
                        <li key={item}><Link href="/" className="hover:text-[#0989ff]">{item}</Link></li>
                      ))}
                    </ul>
                  </div>
                  <div className="rounded bg-[#f4f6fb] p-3">
                    <div className="mb-3 aspect-[4/3] rounded bg-cover bg-center" style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1678652197831-2d180705cd2c?w=800&q=80)' }} />
                    <Link href="/" className="inline-flex rounded bg-[#0989ff] px-4 py-2 text-xs font-semibold text-white">Phones</Link>
                  </div>
                  <div className="rounded bg-[#f4f6fb] p-3">
                    <div className="mb-3 aspect-[4/3] rounded bg-cover bg-center" style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800&q=80)' }} />
                    <Link href="/" className="inline-flex rounded bg-[#0989ff] px-4 py-2 text-xs font-semibold text-white">Headphones</Link>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </header>
    </>
  );
}

const FOOTER_TAGLINE_FALLBACK =
  'Curated fashion, beauty, and home decor for modern living. Quality you can trust, style that lasts.';

function StorefrontFooter() {
  const [settings, setSettings] = useState<ContactSettings | null>(null);

  useEffect(() => {
    let cancelled = false;
    apiRequest<{ data: ContactSettings }>('/api/contact-settings')
      .then((res) => {
        if (!cancelled) setSettings(res.data ?? null);
      })
      .catch(() => {
        if (!cancelled) setSettings(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const brandName = settings?.brandName?.trim() || 'Dhidi';
  const footerTagline = settings?.footerTagline?.trim() || FOOTER_TAGLINE_FALLBACK;

  return (
    <footer className="mt-24 border-t border-[var(--border)] bg-[var(--cream)]">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <Link href="/" className="font-display text-2xl font-semibold text-[var(--navy)]">
              {brandName}
            </Link>
            <p className="mt-4 max-w-sm whitespace-pre-line text-sm text-[var(--muted)]">{footerTagline}</p>
            <div className="mt-6 flex flex-wrap gap-4">
              {settings?.facebookUrl ? (
                <a
                  href={settings.facebookUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[var(--muted)] transition-premium hover:text-[var(--accent)]"
                  aria-label="Facebook"
                >
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                </a>
              ) : null}
              {settings?.instagramUrl ? (
                <a
                  href={settings.instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[var(--muted)] transition-premium hover:text-[var(--accent)]"
                  aria-label="Instagram"
                >
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                </a>
              ) : null}
              {settings?.pinterestUrl ? (
                <a
                  href={settings.pinterestUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[var(--muted)] transition-premium hover:text-[var(--accent)]"
                  aria-label="Pinterest"
                >
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.627 0-12 5.372-12 12 0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738.098.119.112.224.083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.214 0-2.359-.631-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146 1.123.347 2.306.535 3.55.535 6.627 0 12-5.373 12-12 0-6.628-5.373-12-12-12z"/></svg>
                </a>
              ) : null}
            </div>
            <NewsletterFooterForm />
          </div>
          <div>
            <h4 className="font-display text-sm font-semibold uppercase tracking-wider text-[var(--navy)]">Shop</h4>
            <ul className="mt-4 space-y-3 text-sm text-[var(--muted)]">
              <li><Link href="/" className="transition-premium hover:text-[var(--navy)]">New Arrivals</Link></li>
              <li><Link href="/" className="transition-premium hover:text-[var(--navy)]">Best Sellers</Link></li>
              <li><Link href="/" className="transition-premium hover:text-[var(--navy)]">Collections</Link></li>
              <li><Link href="/" className="transition-premium hover:text-[var(--navy)]">Sale</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-display text-sm font-semibold uppercase tracking-wider text-[var(--navy)]">Support</h4>
            <ul className="mt-4 space-y-3 text-sm text-[var(--muted)]">
              <li><Link href="/contact" className="transition-premium hover:text-[var(--navy)]">Contact Us</Link></li>
              <li><Link href="/faq" className="transition-premium hover:text-[var(--navy)]">FAQ</Link></li>
              <li><Link href="/social-feed" className="transition-premium hover:text-[var(--navy)]">Social feed</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-display text-sm font-semibold uppercase tracking-wider text-[var(--navy)]">Company</h4>
            <ul className="mt-4 space-y-3 text-sm text-[var(--muted)]">
              <li><Link href="/privacy-policy" className="transition-premium hover:text-[var(--navy)]">Privacy Policy</Link></li>
              <li><Link href="/terms-of-service" className="transition-premium hover:text-[var(--navy)]">Terms of Service</Link></li>
            </ul>
          </div>
        </div>
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-[var(--border)] pt-8 sm:flex-row">
          <p className="text-sm text-[var(--muted)]">
            © {new Date().getFullYear()} {brandName}. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <div className="flex gap-6 text-sm text-[var(--muted)]">
              <span>Visa</span>
              <span>Mastercard</span>
              <span>Amex</span>
              <span>PayPal</span>
            </div>
            <a
              href="#"
              onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--border)] text-[var(--muted)] transition-premium hover:bg-[var(--cream)] hover:text-[var(--navy)]"
              aria-label="Scroll to top"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const token = useAuthStore((s) => s.token);
  const hasHydrated = useAuthStore((s) => s._hasHydrated);
  const fetchWishlist = useWishlistStore((s) => s.fetchWishlist);
  const clearWishlist = useWishlistStore((s) => s.clearWishlist);
  const cartCount = useCartStore((state) => state.items.reduce((acc, item) => acc + item.quantity, 0));
  useEffect(() => {
    if (!hasHydrated) return;
    if (token) {
      void fetchWishlist(token);
    } else {
      clearWishlist();
    }
  }, [hasHydrated, token, fetchWishlist, clearWishlist]);

  const isAdminRoute = pathname.startsWith('/admin');
  const isHome = pathname === '/';

  if (isAdminRoute) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <StorefrontHeader
        cartCount={cartCount}
        user={user}
        pathname={pathname}
        logout={logout}
        router={router}
      />
      <main className="min-h-screen">
        {isHome ? children : (
          <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            {children}
          </div>
        )}
      </main>
      <StorefrontFooter />
    </div>
  );
}
