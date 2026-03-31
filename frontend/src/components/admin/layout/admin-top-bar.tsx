'use client';

import type { User } from '@/lib/types';
import { AdminBrandMark, type AdminBrand } from './admin-brand-mark';

type Props = {
  user: User;
  brand: AdminBrand | null;
};

export function AdminTopBar({ user, brand }: Props) {
  return (
    <header className="admin-app-topbar relative flex h-16 shrink-0 items-center border-b border-[#e3e6ed] bg-white px-4 lg:px-6">
      <div className="relative z-10 mr-2 min-w-0 max-w-[100px] shrink-0 sm:mr-3 sm:max-w-[200px] lg:max-w-[240px]">
        <AdminBrandMark brand={brand} compact />
      </div>
      <div className="pointer-events-none absolute inset-x-0 flex justify-center px-4">
        <div className="pointer-events-auto relative w-full max-w-xl">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9aa3b8]">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </span>
          <input
            type="search"
            placeholder="Search..."
            className="h-10 w-full rounded-admin border border-[#e3e6ed] bg-[#f5f7fa] py-2 pl-10 pr-4 text-sm text-[#31374a] outline-none placeholder:text-[#9aa3b8] focus:border-[#85a9ff] focus:bg-white focus:ring-1 focus:ring-[#85a9ff]"
          />
        </div>
      </div>

      <div className="ml-auto flex items-center gap-1 sm:gap-2">
        <button
          type="button"
          className="hidden rounded-admin p-2 text-[#6e7891] hover:bg-[#f5f7fa] hover:text-[#31374a] sm:inline-flex"
          aria-label="Language"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.75}
              d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </button>
        <button
          type="button"
          className="hidden rounded-admin p-2 text-[#6e7891] hover:bg-[#f5f7fa] hover:text-[#31374a] sm:inline-flex"
          aria-label="Theme"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.75}
              d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
            />
          </svg>
        </button>
        <button type="button" className="relative rounded-admin p-2 text-[#6e7891] hover:bg-[#f5f7fa] hover:text-[#31374a]">
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.75}
              d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
            />
          </svg>
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-[#fa6238]" />
        </button>
        <button type="button" className="hidden rounded-admin p-2 text-[#6e7891] hover:bg-[#f5f7fa] hover:text-[#31374a] md:inline-flex" aria-label="Apps">
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.75}
              d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
            />
          </svg>
        </button>
        <div className="relative ml-1">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#3874ff] text-sm font-semibold text-white shadow-sm">
            {user.name?.charAt(0) || user.email?.charAt(0) || 'U'}
          </div>
          <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-white bg-[#25c16f]" />
        </div>
      </div>
    </header>
  );
}
