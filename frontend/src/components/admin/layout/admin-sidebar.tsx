'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ADMIN_SIDEBAR_MENU } from './constants';
import { AdminNavIcon } from './nav-icon';

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="admin-app-sidebar flex w-[260px] shrink-0 flex-col border-r border-[#e3e6ed] bg-white">
      <div className="flex h-16 items-center gap-2.5 border-b border-[#e3e6ed] px-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#fff5f0]">
          <svg className="h-5 w-5 text-[#fa6238]" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
            <path d="M12 2c1.2 3.2 3.8 5.2 6.5 6.2-.4 1.8-1.2 3.4-2.4 4.7 1.1.3 2.3.5 3.5.4-.9 2.1-2.6 3.7-4.8 4.5.5 1.4.4 2.9-.2 4.2-2.1-.8-3.8-2.4-4.8-4.5-1 .3-2 .4-3 .3 1.5-1.8 2.4-4.1 2.4-6.6 0-3.5-1.2-6.7-3.2-9.2z" />
          </svg>
        </div>
        <span className="text-[1.125rem] font-semibold lowercase tracking-tight text-[#31374a]">phoenix</span>
      </div>
      <nav className="flex-1 overflow-y-auto py-3">
        <ul className="space-y-0.5 px-2">
          {ADMIN_SIDEBAR_MENU.map((item) => {
            const isAddProduct = item.href === '/admin/product/new';
            const active = isAddProduct
              ? pathname === '/admin/product/new' || /^\/admin\/product\/edit\/\d+$/.test(pathname)
              : pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href));
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
                    active ? 'bg-[#edf5ff] text-[#3874ff]' : 'text-[#6e7891] hover:bg-[#f5f7fa] hover:text-[#31374a]'
                  }`}
                >
                  <AdminNavIcon d={item.icon} />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
