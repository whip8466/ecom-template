'use client';

import Link from 'next/link';
import { AdminPageShell } from '@/components/admin-shell';
import { useAuthStore } from '@/store/auth-store';

export default function AdminThemeOverviewPage() {
  const role = useAuthStore((s) => s.user?.role);

  return (
    <AdminPageShell
      breadcrumbs={[{ label: 'Home', href: '/admin' }, { label: 'Theme' }]}
      title="Theme"
      description="Customize storefront appearance: layout surfaces, form fields, and buttons."
    >
      <div className="space-y-4">
        {role === 'SUPER_ADMIN' ? (
          <p className="text-sm text-[#64748b]">
            As a super admin, configure theme per tenant on{' '}
            <Link href="/admin/super/brands" className="font-medium text-[#3874ff] hover:underline">
              Brands → Create / Edit
            </Link>
            . The pages below apply to <span className="font-medium text-[#1c2740]">your selected brand</span> when you use{' '}
            <code className="rounded bg-[#f1f5f9] px-1 font-mono text-xs">brandId</code> (defaults to brand 1 if omitted).
          </p>
        ) : null}
        <p className="text-sm text-[#64748b]">
          <Link href="/admin/theme/layout" className="font-medium text-[#3874ff] hover:underline">
            Theme → Layout
          </Link>{' '}
          — page background, card and section colors, borders, radii, and shadows.
        </p>
        <p className="text-sm text-[#64748b]">
          <Link href="/admin/theme/inputs" className="font-medium text-[#3874ff] hover:underline">
            Theme → Inputs
          </Link>{' '}
          — button colors (primary, secondary, info), input and dropdown styles for public forms.
        </p>
      </div>
    </AdminPageShell>
  );
}
