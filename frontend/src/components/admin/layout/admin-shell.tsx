'use client';

import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import { buildLoginRedirectHref } from '@/lib/auth-redirect';
import { useEffect, useState } from 'react';
import { AdminSidebar } from './admin-sidebar';
import { AdminTopBar } from './admin-top-bar';

function isAdminRole(role: string | undefined): boolean {
  return role === 'ADMIN' || role === 'MANAGER';
}

type AdminShellProps = {
  children: React.ReactNode;
  /** Extra classes on the scrollable `<main>` (default: `flex-1 overflow-auto p-6`) */
  mainClassName?: string;
};

export function AdminShell({ children, mainClassName }: AdminShellProps) {
  const router = useRouter();
  const { user, _hasHydrated } = useAuthStore();
  const [clientReady, setClientReady] = useState(false);

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

  const mainClasses = mainClassName ?? 'flex-1 overflow-auto p-6';

  return (
    <div className="flex min-h-screen bg-[#f2f5fb] text-[#1c2740]">
      <AdminSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <AdminTopBar user={user} />
        <main className={mainClasses}>{children}</main>
      </div>
    </div>
  );
}
