'use client';

import Link from 'next/link';
import { useState, type FormEvent } from 'react';
import { withAuth } from '@/components/auth';
import { apiRequest } from '@/lib/api';
import { useAuthStore } from '@/store/auth-store';

const inputClass = 'sf-field mt-1';

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
          <Link href="/" className="hover:text-[var(--sf-btn-primary-bg)]">
            Home
          </Link>{' '}
          /{' '}
          <Link href="/account/profile" className="hover:text-[var(--sf-btn-primary-bg)]">
            Profile
          </Link>{' '}
          / Reset password
        </p>
      </div>

      <section className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--card-bg)] p-6 sm:p-8">
        <p className="text-sm text-[#64748b]">Enter your current password, then choose a new one.</p>

        <form onSubmit={onSubmit} className="mt-6 max-w-md space-y-4">
          <div>
            <label htmlFor="reset-current-password" className="sf-label">
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
            <label htmlFor="reset-new-password" className="sf-label">
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
            <label htmlFor="reset-confirm-password" className="sf-label">
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
            <button type="submit" disabled={saving} className="sf-btn-primary px-4 py-2 text-sm disabled:opacity-60">
              {saving ? 'Updating…' : 'Update password'}
            </button>
            <Link href="/account/profile" className="sf-btn-secondary inline-flex items-center justify-center px-4 py-2 text-sm no-underline">
              Back to profile
            </Link>
          </div>
        </form>
      </section>
    </div>
  );
}

export default withAuth(ResetPasswordPage);
