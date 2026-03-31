'use client';

import Link from 'next/link';
import { useEffect, useState, type FormEvent } from 'react';
import { withAuth } from '@/components/auth';
import { apiRequest } from '@/lib/api';
import type { User } from '@/lib/types';
import { useAuthStore } from '@/store/auth-store';

const inputClass =
  'mt-1 w-full rounded-md border border-[#d7e4f6] bg-white px-3 py-2 text-sm text-[#0f1f40] outline-none ring-[#0989ff]/30 focus:border-[#0989ff] focus:ring-2';

function EditProfilePage() {
  const user = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);
  const refreshMe = useAuthStore((s) => s.refreshMe);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) return;
    setFirstName(user.firstName ?? '');
    setLastName(user.lastName ?? '');
  }, [user]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!token) return;
    setError('');
    setMessage('');
    const fn = firstName.trim();
    const ln = lastName.trim();
    if (fn.length < 2 || ln.length < 2) {
      setError('First and last name must be at least 2 characters.');
      return;
    }
    setSaving(true);
    try {
      await apiRequest<{ user: User }>('/api/auth/profile', {
        method: 'PATCH',
        body: JSON.stringify({ firstName: fn, lastName: ln }),
        token,
      });
      await refreshMe();
      setMessage('Your name was updated.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save profile.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-semibold text-[#0f1f40]">Edit profile</h1>
        <p className="mt-2 text-sm text-[#7c8ea6]">
          <Link href="/" className="hover:text-[#0989ff]">
            Home
          </Link>{' '}
          /{' '}
          <Link href="/account/profile" className="hover:text-[#0989ff]">
            Profile
          </Link>{' '}
          / Edit
        </p>
      </div>

      <section className="rounded-md border border-[#e5ecf6] bg-white p-6 sm:p-8">
        <p className="text-sm text-[#64748b]">Update how your name appears on orders and reviews.</p>

        <form onSubmit={onSubmit} className="mt-6 max-w-xl">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="edit-first-name" className="text-sm font-medium text-[#0f1f40]">
                First name
              </label>
              <input
                id="edit-first-name"
                name="firstName"
                autoComplete="given-name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className={inputClass}
                required
                minLength={2}
              />
            </div>
            <div>
              <label htmlFor="edit-last-name" className="text-sm font-medium text-[#0f1f40]">
                Last name
              </label>
              <input
                id="edit-last-name"
                name="lastName"
                autoComplete="family-name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className={inputClass}
                required
                minLength={2}
              />
            </div>
          </div>
          {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
          {message ? <p className="mt-3 text-sm text-emerald-700">{message}</p> : null}
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center justify-center rounded-md bg-[#0989ff] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#0476df] disabled:opacity-60"
            >
              {saving ? 'Saving…' : 'Save changes'}
            </button>
            <Link
              href="/account/profile"
              className="inline-flex items-center justify-center rounded-md border border-[#d7e4f6] bg-white px-4 py-2 text-sm font-semibold text-[#0f1f40] hover:bg-[#f8fafc]"
            >
              Back to profile
            </Link>
          </div>
        </form>
      </section>
    </div>
  );
}

export default withAuth(EditProfilePage);
