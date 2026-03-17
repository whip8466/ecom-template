'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import { buildLoginRedirectHref } from '@/lib/auth-redirect';
import { useEffect, useState } from 'react';

const SIDEBAR_APPS = [
  { href: '/admin', label: 'Home', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
  { href: '/admin/ecommerce', label: 'E-commerce', icon: 'M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z' },
  { href: '/admin/crm', label: 'CRM', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' },
  { href: '/admin/projects', label: 'Project management', icon: 'M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' },
  { href: '/admin/travel', label: 'Travel agency', icon: 'M12 19l9 2-9-18-9 18 9-2zm0 0v-8' },
];

const SIDEBAR_OTHERS = [
  { href: '#', label: 'Book', icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253' },
  { href: '#', label: 'Chat', icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z' },
  { href: '#', label: 'Email', icon: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' },
  { href: '#', label: 'Events', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
  { href: '#', label: 'Kanban', icon: 'M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2' },
  { href: '#', label: 'Cart manager', icon: 'M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z' },
  { href: '#', label: 'Share', icon: 'M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z' },
  { href: '#', label: 'Gallery', icon: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z' },
  { href: '#', label: 'File manager', icon: 'M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z' },
  { href: '#', label: 'Calendar', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
];

const SIDEBAR_PAGES = [
  { href: '#', label: 'Starter', icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
  { href: '#', label: 'Landing', icon: 'M12 19l9 2-9-18-9 18 9-2zm0 0v-8' },
  { href: '#', label: 'Pricing', icon: 'M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z' },
  { href: '#', label: 'Notifications', icon: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9' },
  { href: '#', label: 'Members', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' },
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
        <div className="border-b border-[#e4eaf5] px-3 py-2">
          <input
            type="search"
            placeholder="Search..."
            className="h-9 w-full rounded-lg border border-[#e5ebf5] bg-[#f9fbff] px-3 text-sm text-[#24324b] outline-none placeholder:text-[#8ea0bf] focus:border-[#91b4ff]"
          />
        </div>
        <nav className="flex-1 overflow-y-auto py-3">
          <p className="mb-1 px-4 text-[11px] font-semibold uppercase tracking-wider text-[#8ea0bf]">Apps</p>
          <ul className="space-y-0.5 px-2">
            {SIDEBAR_APPS.map((item) => {
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
          <p className="mb-1 mt-5 px-4 text-[11px] font-semibold uppercase tracking-wider text-[#8ea0bf]">Others</p>
          <ul className="space-y-0.5 px-2">
            {SIDEBAR_OTHERS.slice(0, 6).map((item) => (
              <li key={item.label}>
                <Link href={item.href} className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-[#4f607f] hover:bg-[#f4f7fc] hover:text-[#1f2f4a]">
                  <NavIcon d={item.icon} />
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
          <p className="mb-1 mt-5 px-4 text-[11px] font-semibold uppercase tracking-wider text-[#8ea0bf]">Pages</p>
          <ul className="space-y-0.5 px-2">
            {SIDEBAR_PAGES.map((item) => (
              <li key={item.label}>
                <Link href={item.href} className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-[#4f607f] hover:bg-[#f4f7fc] hover:text-[#1f2f4a]">
                  <NavIcon d={item.icon} />
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="border-t border-[#e4eaf5] p-3">
          <button type="button" className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-[#4f607f] hover:bg-[#f4f7fc]">
            Collapsed View
          </button>
        </div>
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
