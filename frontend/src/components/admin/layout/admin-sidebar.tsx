'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ADMIN_SIDEBAR_MENU } from './constants';
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

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="admin-app-sidebar flex w-[260px] shrink-0 flex-col border-r border-[#e3e6ed] bg-white">
      <div className="flex h-16 items-center gap-2.5 border-b border-[#e3e6ed] px-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-admin bg-[#fff5f0]">
          <svg className="h-5 w-5 text-[#fa6238]" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
            <path d="M12 2c1.2 3.2 3.8 5.2 6.5 6.2-.4 1.8-1.2 3.4-2.4 4.7 1.1.3 2.3.5 3.5.4-.9 2.1-2.6 3.7-4.8 4.5.5 1.4.4 2.9-.2 4.2-2.1-.8-3.8-2.4-4.8-4.5-1 .3-2 .4-3 .3 1.5-1.8 2.4-4.1 2.4-6.6 0-3.5-1.2-6.7-3.2-9.2z" />
          </svg>
        </div>
        <span className="text-[1.125rem] font-semibold lowercase tracking-tight text-[#31374a]">phoenix</span>
      </div>
      <nav className="flex-1 overflow-y-auto py-3">
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

            const groupChildActive = item.children.some((c) => childActive(pathname, c.href));
            return (
              <li key={item.label} className="pt-1">
                <div
                  className={`flex items-center gap-2 rounded-admin px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide ${
                    groupChildActive ? 'text-[#3874ff]' : 'text-[#9aa3b8]'
                  }`}
                >
                  <AdminNavIcon d={item.icon} />
                  {item.label}
                </div>
                <ul className="ml-2 mt-0.5 space-y-0.5 border-l border-[#e3e6ed] pl-2">
                  {item.children.map((child) => {
                    const active = childActive(pathname, child.href);
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
    </aside>
  );
}
