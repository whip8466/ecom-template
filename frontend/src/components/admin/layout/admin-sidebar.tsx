'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ADMIN_SIDEBAR_MENU } from './constants';
import { AdminNavIcon } from './nav-icon';

export function AdminSidebar() {
  const pathname = usePathname();

  return (
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
          {ADMIN_SIDEBAR_MENU.map((item) => {
            const active = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href));
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
                    active ? 'bg-[#eef4ff] text-[#246bfd]' : 'text-[#4f607f] hover:bg-[#f4f7fc] hover:text-[#1f2f4a]'
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
