'use client';

import { type ComponentType, type ReactNode, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { buildLoginRedirectHref } from '@/lib/auth-redirect';
import { useAuthStore } from '@/store/auth-store';

export function RequireAuthLoading() {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3">
      <div
        className="h-9 w-9 animate-spin rounded-full border-2 border-[#0989ff] border-t-transparent"
        aria-hidden
      />
      <span className="sr-only">Loading session…</span>
    </div>
  );
}

type RequireAuthProps = {
  children: ReactNode;
};

/**
 * Renders children only after persisted auth has rehydrated and a session token exists.
 * Prevents redirecting to login on refresh while Zustand persist is still restoring `token`.
 */
export function RequireAuth({ children }: RequireAuthProps) {
  const router = useRouter();
  const token = useAuthStore((s) => s.token);
  const _hasHydrated = useAuthStore((s) => s._hasHydrated);
  const [clientReady, setClientReady] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setClientReady(true), 0);
    return () => clearTimeout(t);
  }, []);

  const authReady = _hasHydrated || clientReady;

  useEffect(() => {
    if (!authReady) return;
    if (!token) {
      router.replace(buildLoginRedirectHref('/'));
    }
  }, [authReady, token, router]);

  if (!authReady) {
    return <RequireAuthLoading />;
  }

  if (!token) {
    return null;
  }

  return <>{children}</>;
}

/**
 * HOC for client-only pages that require a logged-in session (`token` in auth store).
 */
export function withAuth<P extends object>(Wrapped: ComponentType<P>): ComponentType<P> {
  function AuthWrapped(props: P) {
    return (
      <RequireAuth>
        <Wrapped {...props} />
      </RequireAuth>
    );
  }

  const name = Wrapped.displayName ?? Wrapped.name ?? 'Component';
  AuthWrapped.displayName = `withAuth(${name})`;
  return AuthWrapped;
}
