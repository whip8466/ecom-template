'use client';

import Link from 'next/link';
import { AdminPageShell } from '@/components/admin-shell';

export default function AdminThemeOverviewPage() {
  return (
    <AdminPageShell
      breadcrumbs={[{ label: 'Home', href: '/admin' }, { label: 'Theme' }]}
      title="Theme"
      description="Customize storefront appearance. Form fields, buttons, and radii are configured under Inputs."
    >
      <div>
      <p className="text-sm text-[#64748b]">
        Go to{' '}
        <Link href="/admin/theme/inputs" className="font-medium text-[#3874ff] hover:underline">
          Theme → Inputs
        </Link>{' '}
        to set button colors (primary, secondary, info), corner radii, and shared input styles for public forms.
      </p>
      </div>
    </AdminPageShell>
  );
}
