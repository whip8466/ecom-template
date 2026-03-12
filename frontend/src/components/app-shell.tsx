'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import type { User } from '@/lib/types';
import { useAuthStore } from '@/store/auth-store';
import { useCartStore } from '@/store/cart-store';

function StorefrontHeader({
  cartCount,
  user,
  isAdmin,
  pathname,
  logout,
  router,
}: {
  cartCount: number;
  user: User | null;
  isAdmin: boolean;
  pathname: string;
  logout: () => void;
  router: ReturnType<typeof useRouter>;
}) {
  return (
    <>
      <div className="bg-[var(--accent)] text-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-2 text-xs sm:px-6 lg:px-8">
          <span>FREE Express Shipping On Orders $70+</span>
          <span className="hidden sm:block">Setting • Wishlist • Cart</span>
        </div>
      </div>
      <div className="border-b border-[var(--border)] bg-white text-[var(--muted)]">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-2 text-xs sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <span>English</span>
            <span>USD</span>
          </div>
          <span>Hotline: +(402) 763 282 46</span>
        </div>
      </div>

      {/* Sticky main nav */}
      <div className="sticky top-0 z-50 border-b border-[var(--border)] bg-[var(--card-bg)] shadow-[var(--shadow-sm)]">
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="font-display text-xl font-semibold text-[var(--navy)] transition-premium hover:opacity-90"
          >
            Lumina
          </Link>

          <div className="hidden flex-1 justify-center lg:flex">
            <div className="flex w-full max-w-xl items-center overflow-hidden rounded-md border border-[var(--border)] bg-[var(--cream)]">
              <select className="h-10 border-r border-[var(--border)] bg-white px-3 text-xs text-[var(--muted)] outline-none">
                <option>Select Category</option>
                <option>Electronics</option>
                <option>Fashion</option>
                <option>Beauty</option>
              </select>
              <input
                type="search"
                placeholder="Search products..."
                className="h-10 w-full bg-transparent px-3 text-sm outline-none placeholder:text-[var(--muted)]"
                aria-label="Search"
              />
              <button
                type="button"
                className="h-10 bg-[var(--accent)] px-4 text-xs font-medium text-white transition-premium hover:bg-[var(--accent-hover)]"
              >
                Search
              </button>
            </div>
          </div>

          <nav className="flex items-center gap-2 sm:gap-4">
            <span className="hidden text-xs text-[var(--muted)] md:block">Hello, Sign In</span>
            <Link
              href="/cart"
              className="relative flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-[var(--navy)] transition-premium hover:bg-[var(--cream)]"
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
              <Link href="/login" className="rounded-md bg-[var(--accent)] px-3 py-1.5 text-xs font-medium text-white">Login</Link>
            ) : (
              <button type="button" className="rounded-md border border-[var(--border)] px-3 py-1.5 text-xs" onClick={() => { logout(); if (pathname.startsWith('/admin') || pathname.startsWith('/account')) router.push('/'); }}>Logout</button>
            )}
            {isAdmin && (
              <Link
                href="/admin"
                className="rounded-md border border-[var(--accent)] px-2.5 py-1.5 text-xs font-medium text-[var(--accent)] transition-premium hover:bg-[var(--accent)]/10"
              >
                Admin
              </Link>
            )}
          </nav>
        </div>

        {/* Secondary nav strip */}
        <div className="border-t border-[var(--border)] bg-[#0f3b58]">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 px-4 py-2.5 sm:px-6 lg:px-8">
            <button
              type="button"
              className="flex items-center gap-2 rounded-md bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white transition-premium hover:bg-[var(--accent-hover)]"
            >
              All Categories
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <div className="flex items-center gap-6 text-sm text-white/90">
              <Link href="/" className="transition-premium hover:text-white">Home</Link>
              <Link href="/" className="transition-premium hover:text-white">Shop</Link>
              <Link href="/" className="transition-premium hover:text-white">Products</Link>
              <Link href="/" className="transition-premium hover:text-white">Blog</Link>
              <Link href="/" className="transition-premium hover:text-white">Contact</Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function StorefrontFooter() {
  return (
    <footer className="mt-24 border-t border-[var(--border)] bg-[var(--cream)]">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <Link href="/" className="font-display text-2xl font-semibold text-[var(--navy)]">
              Lumina
            </Link>
            <p className="mt-4 max-w-sm text-sm text-[var(--muted)]">
              Curated fashion, beauty, and home decor for modern living. Quality you can trust, style that lasts.
            </p>
            <div className="mt-6 flex gap-4">
              <a href="#" className="text-[var(--muted)] transition-premium hover:text-[var(--accent)]" aria-label="Facebook">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
              </a>
              <a href="#" className="text-[var(--muted)] transition-premium hover:text-[var(--accent)]" aria-label="Instagram">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
              </a>
              <a href="#" className="text-[var(--muted)] transition-premium hover:text-[var(--accent)]" aria-label="Pinterest">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.627 0-12 5.372-12 12 0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738.098.119.112.224.083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.214 0-2.359-.631-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146 1.123.347 2.306.535 3.55.535 6.627 0 12-5.373 12-12 0-6.628-5.373-12-12-12z"/></svg>
              </a>
            </div>
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
              <li><Link href="/" className="transition-premium hover:text-[var(--navy)]">Contact Us</Link></li>
              <li><Link href="/" className="transition-premium hover:text-[var(--navy)]">Shipping Info</Link></li>
              <li><Link href="/" className="transition-premium hover:text-[var(--navy)]">Returns</Link></li>
              <li><Link href="/" className="transition-premium hover:text-[var(--navy)]">FAQ</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-display text-sm font-semibold uppercase tracking-wider text-[var(--navy)]">Company</h4>
            <ul className="mt-4 space-y-3 text-sm text-[var(--muted)]">
              <li><Link href="/" className="transition-premium hover:text-[var(--navy)]">About Us</Link></li>
              <li><Link href="/" className="transition-premium hover:text-[var(--navy)]">Privacy Policy</Link></li>
              <li><Link href="/" className="transition-premium hover:text-[var(--navy)]">Terms of Service</Link></li>
              <li><Link href="/" className="transition-premium hover:text-[var(--navy)]">Careers</Link></li>
            </ul>
          </div>
        </div>
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-[var(--border)] pt-8 sm:flex-row">
          <p className="text-sm text-[var(--muted)]">© {new Date().getFullYear()} Lumina. All rights reserved.</p>
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
  const cartCount = useCartStore((state) => state.items.reduce((acc, item) => acc + item.quantity, 0));

  const isAdmin = user?.role === 'ADMIN' || user?.role === 'MANAGER';
  const isAdminRoute = pathname.startsWith('/admin');

  if (isAdminRoute) {
    return (
      <div className="min-h-screen bg-slate-100 text-slate-900">
        <div className="mx-auto flex min-h-screen w-full max-w-7xl gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <aside className="hidden w-64 rounded-xl border border-slate-200 bg-white p-4 md:block">
            <p className="text-lg font-bold">Admin Panel</p>
            <p className="mt-1 text-xs text-slate-500">Management workspace</p>
            <nav className="mt-4 space-y-1 text-sm">
              <Link className="block rounded-md px-3 py-2 hover:bg-slate-100" href="/admin">
                Dashboard
              </Link>
              <Link className="block rounded-md px-3 py-2 hover:bg-slate-100" href="/admin/products">
                Products
              </Link>
              <Link className="block rounded-md px-3 py-2 hover:bg-slate-100" href="/admin/categories">
                Categories
              </Link>
              <Link className="block rounded-md px-3 py-2 hover:bg-slate-100" href="/admin/orders">
                Orders
              </Link>
            </nav>
          </aside>

          <div className="flex min-w-0 flex-1 flex-col gap-4">
            <header className="rounded-xl border border-slate-200 bg-white px-4 py-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-sm text-slate-500">Admin area</p>
                  <p className="font-semibold">{user?.name || user?.email || 'Signed in user'}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Link className="rounded-md border border-slate-300 px-3 py-1.5 text-sm" href="/">
                    Storefront
                  </Link>
                  <button
                    className="rounded-md border border-slate-300 px-3 py-1.5 text-sm"
                    onClick={() => {
                      logout();
                      router.push('/login');
                    }}
                  >
                    Logout
                  </button>
                </div>
              </div>
            </header>
            <main className="min-w-0">{children}</main>
          </div>
        </div>
      </div>
    );
  }

  const isHome = pathname === '/';

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <header className="border-b border-[var(--border)] bg-[var(--card-bg)]">
        <StorefrontHeader
          cartCount={cartCount}
          user={user}
          isAdmin={isAdmin}
          pathname={pathname}
          logout={logout}
          router={router}
        />
      </header>
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
