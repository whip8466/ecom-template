'use client';

import Link from 'next/link';
import { AdminPageShell } from '@/components/admin-shell';

export default function AdminThemeOverviewPage() {
  return (
    <AdminPageShell
      breadcrumbs={[{ label: 'Home', href: '/admin' }, { label: 'Theme' }]}
      title="Theme"
      description="Customize storefront appearance: layout surfaces, form fields, and buttons."
    >
      <div className="space-y-4">
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
