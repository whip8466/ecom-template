'use client';

import type { User } from '@/lib/types';

type Props = {
  user: User;
};

export function AdminTopBar({ user }: Props) {
  return (
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
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
            />
          </svg>
          <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-red-500" />
        </button>
        <button type="button" className="rounded-lg p-2 text-[#60759b] hover:bg-[#f4f7fc] hover:text-[#1f2f4a]">
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
            />
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
  );
}
