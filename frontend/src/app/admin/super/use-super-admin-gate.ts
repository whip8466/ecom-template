'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import { buildLoginRedirectHref } from '@/lib/auth-redirect';

/**
 * Waits for persist hydration, refreshes session, then allows render only for SUPER_ADMIN.
 */
export function useSuperAdminGate() {
  const router = useRouter();
  const pathname = usePathname();
  const { token, _hasHydrated, refreshMe } = useAuthStore();
  const [clientReady, setClientReady] = useState(false);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setClientReady(true), 0);
    return () => clearTimeout(t);
  }, []);

  const hydrated = _hasHydrated || clientReady;

  useEffect(() => {
    if (!hydrated) return;
    let cancelled = false;
    const id = setTimeout(() => {
      void (async () => {
        const { token: t } = useAuthStore.getState();
        const redirectTarget = pathname || '/admin/super/brands';
        if (!t) {
          router.replace(buildLoginRedirectHref(redirectTarget));
          return;
        }
        try {
          await refreshMe();
        } catch {
          /* */
        }
        if (cancelled) return;
        const u = useAuthStore.getState().user;
        if (!u) {
          router.replace(buildLoginRedirectHref(redirectTarget));
          return;
        }
        if (u.role !== 'SUPER_ADMIN') {
          router.replace('/admin');
          return;
        }
        setAllowed(true);
      })();
    }, 0);
    return () => {
      cancelled = true;
      clearTimeout(id);
    };
  }, [hydrated, refreshMe, router, pathname]);

  return { ready: hydrated && allowed, token };
}
