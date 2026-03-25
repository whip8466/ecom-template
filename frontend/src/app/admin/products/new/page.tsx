'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function LegacyNewRedirectInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const id = searchParams.get('id');
    if (id && /^\d+$/.test(id)) {
      router.replace(`/admin/product/edit/${id}`);
    } else {
      router.replace('/admin/product/new');
    }
  }, [router, searchParams]);

  return (
    <div className="flex min-h-[40vh] items-center justify-center text-sm text-[#64748b]">
      Redirecting…
    </div>
  );
}

/** Old `/admin/products/new` URLs (optionally `?id=`) */
export default function LegacyNewProductRedirect() {
  return (
    <Suspense fallback={null}>
      <LegacyNewRedirectInner />
    </Suspense>
  );
}
