'use client';

import Link from 'next/link';
import { useState, type FormEvent } from 'react';
import { withAuth } from '@/components/auth';
import { apiRequest } from '@/lib/api';
import { useAuthStore } from '@/store/auth-store';

const inputClass =
  'mt-1 w-full rounded-md border border-[#d7e4f6] bg-white px-3 py-2 text-sm text-[#0f1f40] outline-none ring-[#0989ff]/30 focus:border-[#0989ff] focus:ring-2';

function ResetPasswordPage() {
  const token = useAuthStore((s) => s.token);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!token) return;
    setError('');
    setMessage('');
    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('New password and confirmation do not match.');
      return;
    }
    setSaving(true);
    try {
      await apiRequest<{ message: string }>('/api/auth/password', {
        method: 'PATCH',
        body: JSON.stringify({ currentPassword, newPassword }),
        token,
      });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setMessage('Your password was updated.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update password.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-semibold text-[#0f1f40]">Reset password</h1>
        <p className="mt-2 text-sm text-[#7c8ea6]">
          <Link href="/" className="hover:text-[#0989ff]">
            Home
          </Link>{' '}
          /{' '}
          <Link href="/account/profile" className="hover:text-[#0989ff]">
            Profile
          </Link>{' '}
          / Reset password
        </p>
      </div>

      <section className="rounded-md border border-[#e5ecf6] bg-white p-6 sm:p-8">
        <p className="text-sm text-[#64748b]">Enter your current password, then choose a new one.</p>

        <form onSubmit={onSubmit} className="mt-6 max-w-md space-y-4">
          <div>
            <label htmlFor="reset-current-password" className="text-sm font-medium text-[#0f1f40]">
              Current password
            </label>
            <input
              id="reset-current-password"
              name="currentPassword"
              type="password"
              autoComplete="current-password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className={inputClass}
              required
            />
          </div>
          <div>
            <label htmlFor="reset-new-password" className="text-sm font-medium text-[#0f1f40]">
              New password
            </label>
            <input
              id="reset-new-password"
              name="newPassword"
              type="password"
              autoComplete="new-password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className={inputClass}
              required
              minLength={6}
            />
          </div>
          <div>
            <label htmlFor="reset-confirm-password" className="text-sm font-medium text-[#0f1f40]">
              Confirm new password
            </label>
            <input
              id="reset-confirm-password"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={inputClass}
              required
              minLength={6}
            />
          </div>
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          {message ? <p className="text-sm text-emerald-700">{message}</p> : null}
          <div className="flex flex-wrap gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center justify-center rounded-md bg-[#0989ff] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#0476df] disabled:opacity-60"
            >
              {saving ? 'Updating…' : 'Update password'}
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

export default withAuth(ResetPasswordPage);
