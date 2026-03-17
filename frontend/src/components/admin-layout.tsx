'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import type { UserRole } from '@/lib/types';

const isAdminRole = (role: UserRole) => role === 'ADMIN' || role === 'MANAGER';

const navSections = [
  {
    title: 'APPS',
    items: [
      { href: '/', label: 'Home', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
      { href: '/admin', label: 'Ecommerce', icon: 'M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z' },
      { href: '#', label: 'CRM', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' },
      { href: '#', label: 'Project management', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
      { href: '#', label: 'Travel agency', icon: 'M12 19l9 2-9-18-9 18 9-2zm0 0v-8' },
    ],
  },
  {
    title: 'MANAGEMENT',
    items: [
      { href: '#', label: 'Stock', icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4' },
      { href: '#', label: 'Chat', badge: 2, icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z' },
      { href: '#', label: 'Email', badge: 4, icon: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' },
      { href: '#', label: 'Events', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
      { href: '#', label: 'Kanban', icon: 'M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z' },
      { href: '#', label: 'Card learn', icon: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z' },
      { href: '#', label: 'File manager', icon: 'M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z' },
      { href: '#', label: 'Calendar', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
    ],
  },
  {
    title: 'OTHERS',
    items: [
      { href: '#', label: 'Alerts', icon: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9' },
      { href: '#', label: 'Starter', icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
      { href: '#', label: 'Landing', icon: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z' },
      { href: '#', label: 'Pricing', icon: 'M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z' },
      { href: '#', label: 'Notifications', icon: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9' },
      { href: '#', label: 'Members', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
    ],
  },
];

function NavIcon({ d }: { d: string }) {
  return (
    <svg className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={d} />
    </svg>
  );
}

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();

  if (!user || !isAdminRole(user.role)) {
    if (typeof window !== 'undefined') {
      router.replace(`/login?redirect=${encodeURIComponent(pathname || '/admin')}`);
    }
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100">
        <p className="text-gray-600">Redirecting to login...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 z-40 flex h-screen w-64 flex-col border-r border-gray-200 bg-white">
        <div className="flex h-14 items-center gap-2 border-b border-gray-200 px-4">
          <span className="text-xl font-semibold text-[#3874ff]">phoenix</span>
        </div>
        <div className="border-b border-gray-200 px-3 py-2">
          <input
            type="search"
            placeholder="Search..."
            className="w-full rounded border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none placeholder:text-gray-400 focus:border-[#3874ff]"
          />
        </div>
        <nav className="flex-1 overflow-y-auto py-3">
          {navSections.map((section) => (
            <div key={section.title} className="mb-4">
              <div className="px-4 py-1 text-xs font-semibold uppercase tracking-wider text-gray-400">
                {section.title}
              </div>
              <ul className="space-y-0.5">
                {section.items.map((item) => {
                  const active = item.href === '/admin' ? pathname?.startsWith('/admin') : pathname === item.href;
                  return (
                    <li key={item.label}>
                      <Link
                        href={item.href}
                        className={`flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                          active ? 'bg-[#3874ff] text-white' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                        }`}
                      >
                        <NavIcon d={item.icon} />
                        <span className="flex-1">{item.label}</span>
                        {item.badge != null && (
                          <span className={`rounded px-1.5 py-0.5 text-xs ${active ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-600'}`}>({item.badge})</span>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
          <div className="px-4 py-1 text-xs font-semibold uppercase tracking-wider text-gray-400">ADMIN</div>
        </nav>
        <div className="border-t border-gray-200 p-2">
          <button
            type="button"
            className="flex w-full items-center gap-3 rounded px-3 py-2 text-sm text-gray-600 hover:bg-gray-50"
            aria-label="Collapse"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
            </svg>
            <span>Collapsed view</span>
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="ml-64 flex flex-1 flex-col">
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-gray-200 bg-white px-6">
          <div className="flex flex-1 items-center gap-4">
            <div className="flex max-w-md flex-1 items-center rounded border border-gray-200 bg-gray-50 px-3 py-2">
              <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input type="search" placeholder="Search..." className="ml-2 flex-1 bg-transparent text-sm outline-none placeholder:text-gray-400" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" className="rounded p-2 text-gray-500 hover:bg-gray-100" aria-label="Notifications">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </button>
            <button type="button" className="rounded p-2 text-gray-500 hover:bg-gray-100" aria-label="Settings">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => { logout(); router.push('/'); }}
              className="ml-2 flex h-8 w-8 items-center justify-center rounded-full bg-[#3874ff] text-sm font-medium text-white hover:opacity-90"
              title="Logout"
            >
              {user?.name?.charAt(0) || 'A'}
            </button>
          </div>
        </header>

        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
