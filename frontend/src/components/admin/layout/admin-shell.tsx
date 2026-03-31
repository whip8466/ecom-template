'use client';

import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import { buildLoginRedirectHref } from '@/lib/auth-redirect';
import { apiRequest } from '@/lib/api';
import type { ContactSettings } from '@/lib/contact-settings';
import { useEffect, useState } from 'react';
import type { AdminBrand } from './admin-brand-mark';
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
  const [brand, setBrand] = useState<AdminBrand | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setClientReady(true), 0);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    let cancelled = false;
    apiRequest<{ data: ContactSettings }>('/api/contact-settings')
      .then((res) => {
        if (cancelled || !res.data) return;
        setBrand({
          name: res.data.brandName?.trim() || 'Store',
          logoUrl: res.data.brandLogoUrl?.trim() ? res.data.brandLogoUrl : null,
        });
      })
      .catch(() => {
        if (!cancelled) {
          setBrand({ name: 'Store', logoUrl: null });
        }
      });
    return () => {
      cancelled = true;
    };
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
      <div className="flex min-h-screen items-center justify-center bg-[#f9fafb]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#246bfd] border-t-transparent" />
      </div>
    );
  }
  if (!user || !isAdminRole(user.role)) {
    return null;
  }

  const mainClasses = mainClassName ?? 'flex-1 overflow-auto p-6';

  return (
    <div className="flex min-h-screen bg-[#f9fafb] text-[#31374a]">
      <AdminSidebar brand={brand} />
      <div className="flex min-w-0 flex-1 flex-col">
        <AdminTopBar user={user} brand={brand} />
        <main className={`admin-app-main ${mainClasses}`}>{children}</main>
      </div>
    </div>
  );
}
