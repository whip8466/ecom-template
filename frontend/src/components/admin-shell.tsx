'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import { buildLoginRedirectHref } from '@/lib/auth-redirect';
import { useEffect, useState } from 'react';

const SIDEBAR_MENU = [
  { href: '/admin', label: 'Dashboard', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
  { href: '/admin/products', label: 'Products', icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4' },
  { href: '/admin/products/new', label: 'Add product', icon: 'M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z' },
];

function NavIcon({ d }: { d: string }) {
  return (
    <svg className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={d} />
    </svg>
  );
}

function isAdminRole(role: string | undefined): boolean {
  return role === 'ADMIN' || role === 'MANAGER';
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, _hasHydrated } = useAuthStore();
  const [clientReady, setClientReady] = useState(false);

  // Wait for client mount so persisted auth has a chance to rehydrate; fallback if onRehydrateStorage never runs
  useEffect(() => {
    const t = setTimeout(() => setClientReady(true), 0);
    return () => clearTimeout(t);
  }, []);

  const isReady = _hasHydrated || clientReady;

  useEffect(() => {
    if (!isReady) return;
    if (!user) {
      router.replace(buildLoginRedirectHref('/admin'));
      return;
    }
    if (!isAdminRole(user.role)) {
      router.replace('/');
    }
  }, [user, isReady, router]);

  if (!isReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f2f5fb]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#246bfd] border-t-transparent" />
      </div>
    );
  }
  if (!user || !isAdminRole(user.role)) {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-[#f2f5fb] text-[#1c2740]">
      {/* Left sidebar */}
      <aside className="flex w-[260px] shrink-0 flex-col border-r border-[#e4eaf5] bg-white">
        <div className="flex h-14 items-center gap-2 border-b border-[#e4eaf5] px-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#246bfd]">
            <svg className="h-4 w-4 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
            </svg>
          </div>
          <span className="text-lg font-semibold text-[#246bfd]">phoenix</span>
        </div>
        <nav className="flex-1 overflow-y-auto py-3">
          <ul className="space-y-0.5 px-2">
            {SIDEBAR_MENU.map((item) => {
              const active = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href));
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
                      active ? 'bg-[#eef4ff] text-[#246bfd]' : 'text-[#4f607f] hover:bg-[#f4f7fc] hover:text-[#1f2f4a]'
                    }`}
                  >
                    <NavIcon d={item.icon} />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </aside>

      {/* Main area */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top header */}
        <header className="flex h-14 shrink-0 items-center justify-between gap-4 border-b border-[#e4eaf5] bg-white px-6">
          <div className="flex min-w-0 flex-1 items-center gap-4">
            <div className="relative w-full max-w-md">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8ea0bf]">Q</span>
              <input
                type="search"
                placeholder="Search..."
                className="h-10 w-full rounded-lg border border-[#e5ebf5] bg-[#f9fbff] py-2 pl-8 pr-4 text-sm text-[#24324b] outline-none placeholder:text-[#8ea0bf] focus:border-[#91b4ff]"
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button type="button" className="relative rounded-lg p-2 text-[#60759b] hover:bg-[#f4f7fc] hover:text-[#1f2f4a]">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-red-500" />
            </button>
            <button type="button" className="rounded-lg p-2 text-[#60759b] hover:bg-[#f4f7fc] hover:text-[#1f2f4a]">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </button>
            <div className="relative">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#246bfd] text-sm font-semibold text-white">
                {user.name?.charAt(0) || user.email?.charAt(0) || 'U'}
              </div>
              <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-white bg-emerald-500" />
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  );
}
