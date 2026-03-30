'use client';

import Link from 'next/link';
import { withAuth } from '@/components/auth';
import { useAuthStore } from '@/store/auth-store';

function ProfilePage() {
  const user = useAuthStore((s) => s.user);
  const displayName =
    user?.name?.trim() ||
    [user?.firstName, user?.lastName].filter(Boolean).join(' ').trim() ||
    'Member';

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-semibold text-[#0f1f40]">Profile</h1>
        <p className="mt-2 text-sm text-[#7c8ea6]">
          <Link href="/" className="hover:text-[#0989ff]">
            Home
          </Link>{' '}
          / Profile
        </p>
      </div>

      <section className="rounded-md border border-[#e5ecf6] bg-white p-6 sm:p-8">
        <h2 className="text-lg font-semibold text-[#0f1f40]">Account details</h2>
        <dl className="mt-4 space-y-4 text-sm">
          <div>
            <dt className="text-[#64748b]">Name</dt>
            <dd className="mt-0.5 font-medium text-[#0f1f40]">{displayName}</dd>
          </div>
          <div>
            <dt className="text-[#64748b]">Email</dt>
            <dd className="mt-0.5 font-medium text-[#0f1f40]">{user?.email ?? '—'}</dd>
          </div>
          {user?.phone ? (
            <div>
              <dt className="text-[#64748b]">Phone</dt>
              <dd className="mt-0.5 font-medium text-[#0f1f40]">{user.phone}</dd>
            </div>
          ) : null}
        </dl>

        <div className="mt-8 flex flex-wrap gap-3 border-t border-[#edf2f8] pt-6">
          <Link
            href="/account/orders"
            className="inline-flex items-center justify-center rounded-md border border-[#d7e4f6] bg-white px-4 py-2 text-sm font-semibold text-[#0f1f40] hover:bg-[#f8fafc]"
          >
            My orders
          </Link>
          <Link
            href="/account/addresses"
            className="inline-flex items-center justify-center rounded-md border border-[#d7e4f6] bg-white px-4 py-2 text-sm font-semibold text-[#0f1f40] hover:bg-[#f8fafc]"
          >
            Addresses
          </Link>
        </div>
      </section>
    </div>
  );
}

export default withAuth(ProfilePage);
