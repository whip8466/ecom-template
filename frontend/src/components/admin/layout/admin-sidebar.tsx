'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { useAuthStore } from '@/store/auth-store';
import { ADMIN_SIDEBAR_MENU, type AdminSidebarGroupChild } from './constants';
import { AdminNavIcon } from './nav-icon';

function linkActive(pathname: string, href: string, isAddProduct: boolean): boolean {
  if (isAddProduct) {
    return pathname === '/admin/product/new' || /^\/admin\/product\/edit\/\d+$/.test(pathname);
  }
  return pathname === href || (href !== '/admin' && pathname.startsWith(href));
}

function childActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function groupChildActive(pathname: string, child: AdminSidebarGroupChild): boolean {
  if (child.matchPathname) return child.matchPathname(pathname);
  return childActive(pathname, child.href);
}

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const logout = useAuthStore((s) => s.logout);

  function handleLogout() {
    logout();
    router.replace('/login');
  }

  /** Manual expand for groups with no active child; cleared when pathname changes. */
  const [manualOpen, setManualOpen] = useState<Record<string, boolean>>({});
  const [pathForManual, setPathForManual] = useState(pathname);
  if (pathname !== pathForManual) {
    setPathForManual(pathname);
    setManualOpen({});
  }

  return (
    <aside className="admin-app-sidebar flex min-h-screen w-[260px] shrink-0 flex-col border-r border-[#e3e6ed] bg-white">
      <div className="flex h-16 shrink-0 items-center gap-2.5 border-b border-[#e3e6ed] px-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-admin bg-[#fff5f0]">
          <svg className="h-5 w-5 text-[#fa6238]" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
            <path d="M12 2c1.2 3.2 3.8 5.2 6.5 6.2-.4 1.8-1.2 3.4-2.4 4.7 1.1.3 2.3.5 3.5.4-.9 2.1-2.6 3.7-4.8 4.5.5 1.4.4 2.9-.2 4.2-2.1-.8-3.8-2.4-4.8-4.5-1 .3-2 .4-3 .3 1.5-1.8 2.4-4.1 2.4-6.6 0-3.5-1.2-6.7-3.2-9.2z" />
          </svg>
        </div>
        <span className="text-[1.125rem] font-semibold lowercase tracking-tight text-[#31374a]">dhidi</span>
      </div>
      <nav className="min-h-0 flex-1 overflow-y-auto py-3">
        <ul className="space-y-0.5 px-2">
          {ADMIN_SIDEBAR_MENU.map((item) => {
            if (item.kind === 'link') {
              const isAddProduct = item.href === '/admin/product/new';
              const active = linkActive(pathname, item.href, isAddProduct);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`flex items-center gap-3 rounded-admin px-3 py-2 text-sm font-medium transition ${
                      active ? 'bg-[#edf5ff] text-[#3874ff]' : 'text-[#6e7891] hover:bg-[#f5f7fa] hover:text-[#31374a]'
                    }`}
                  >
                    <AdminNavIcon d={item.icon} />
                    {item.label}
                  </Link>
                </li>
              );
            }

            const anyGroupChildActive = item.children.some((c) => groupChildActive(pathname, c));
            const isOpen = anyGroupChildActive ? true : (manualOpen[item.label] ?? false);
            const sectionId = `admin-nav-group-${item.label.replace(/\s+/g, '-').toLowerCase()}`;
            return (
              <li key={item.label} className="pt-1">
                <button
                  type="button"
                  id={`${sectionId}-toggle`}
                  aria-expanded={isOpen}
                  aria-controls={sectionId}
                  onClick={() => {
                    if (anyGroupChildActive) return;
                    setManualOpen((m) => ({
                      ...m,
                      [item.label]: !(m[item.label] ?? false),
                    }));
                  }}
                  className={`flex w-full items-center justify-between gap-2 rounded-admin px-3 py-1.5 text-left text-[11px] font-semibold uppercase tracking-wide transition hover:bg-[#f5f7fa] ${
                    anyGroupChildActive ? 'text-[#3874ff]' : 'text-[#9aa3b8]'
                  }`}
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <AdminNavIcon d={item.icon} />
                    {item.label}
                  </span>
                  <svg
                    className={`h-4 w-4 shrink-0 text-[#9aa3b8] transition-transform duration-200 ${
                      isOpen ? 'rotate-0' : '-rotate-90'
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                <ul
                  id={sectionId}
                  role="list"
                  hidden={!isOpen}
                  aria-labelledby={`${sectionId}-toggle`}
                  className="ml-2 mt-0.5 space-y-0.5 border-l border-[#e3e6ed] pl-2"
                >
                  {item.children.map((child) => {
                    const active = groupChildActive(pathname, child);
                    return (
                      <li key={child.href}>
                        <Link
                          href={child.href}
                          className={`flex items-center rounded-admin py-2 pl-2 pr-3 text-sm font-medium transition ${
                            active ? 'bg-[#edf5ff] text-[#3874ff]' : 'text-[#6e7891] hover:bg-[#f5f7fa] hover:text-[#31374a]'
                          }`}
                        >
                          {child.label}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </li>
            );
          })}
        </ul>
      </nav>
      <div className="sticky bottom-0 z-10 shrink-0 border-t border-[#e3e6ed] bg-white px-2 pb-4 pt-3">
        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center justify-center gap-2 rounded-admin border border-[#e3e6ed] px-3 py-2.5 text-sm font-medium text-[#6e7891] transition hover:border-[#d0d5e0] hover:bg-[#f5f7fa] hover:text-[#31374a]"
        >
          <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
            />
          </svg>
          Log out
        </button>
      </div>
    </aside>
  );
}
