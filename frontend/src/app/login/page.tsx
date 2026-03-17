'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginUser } from '@/lib/auth-api';
import { getSafePostLoginPath } from '@/lib/auth-redirect';
import { useAuthStore } from '@/store/auth-store';

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

type FormValues = z.infer<typeof schema>;

export default function LoginPage() {
  const router = useRouter();
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const setSession = useAuthStore((state) => state.setSession);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  async function onSubmit(values: FormValues) {
    try {
      setError('');
      const loginRes = await loginUser(values);
      setSession(loginRes.token, loginRes.user);
      const redirectParam =
        typeof window === 'undefined'
          ? null
          : new URLSearchParams(window.location.search).get('redirect');
      const defaultPath =
        loginRes.user.role === 'ADMIN' || loginRes.user.role === 'MANAGER' ? '/admin' : '/';
      router.push(getSafePostLoginPath(redirectParam, defaultPath));
    } catch (e) {
      setError((e as Error).message || 'Auth failed');
    }
  }

  return (
    <div className="relative mx-auto w-full max-w-5xl py-4 sm:py-8">
      <div className="mb-8 text-center">
        <h1 className="text-5xl font-semibold text-[#0f1f40]">My account</h1>
        <p className="mt-2 text-sm text-[#7c8ea6]">
          <Link href="/" className="hover:text-[#0989ff]">Home</Link> / My account
        </p>
      </div>

      <div className="relative mx-auto max-w-md rounded-md border border-[#e5ecf6] bg-white p-8 shadow-[0_12px_30px_rgba(16,24,40,0.08)]">
        <h2 className="text-4xl font-semibold text-[#0f1f40]">Login to Lumina.</h2>
        <p className="mt-2 text-sm text-[#667085]">
          Don&apos;t have an account?{' '}
          <Link href="/register" className="font-medium text-[#0989ff] hover:underline">
            Create a free account
          </Link>
        </p>

        <div className="mt-5 grid grid-cols-3 gap-2">
          <button type="button" className="flex items-center justify-center gap-2 rounded border border-[#dce5f2] px-3 py-2 text-xs font-medium text-[#344054] hover:bg-[#f7fbff]">
            <span className="text-[#ea4335]">G</span>
            Google
          </button>
          <button type="button" className="flex items-center justify-center gap-2 rounded border border-[#dce5f2] px-3 py-2 text-xs font-medium text-[#344054] hover:bg-[#f7fbff]">
            <svg className="h-4 w-4 text-[#1877f2]" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path d="M13.5 22v-8h2.7l.4-3h-3.1V9.1c0-.9.3-1.5 1.6-1.5h1.7V4.9c-.3 0-1.3-.1-2.4-.1-2.4 0-4 1.5-4 4.2V11H8v3h2.8v8h2.7z" />
            </svg>
            Facebook
          </button>
          <button type="button" className="flex items-center justify-center gap-2 rounded border border-[#dce5f2] px-3 py-2 text-xs font-medium text-[#344054] hover:bg-[#f7fbff]">
            <svg className="h-4 w-4 text-[#111827]" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path d="M16.37 12.24c.02 2.1 1.84 2.8 1.86 2.8-.02.05-.29 1-.95 1.97-.57.84-1.16 1.68-2.1 1.7-.92.02-1.22-.55-2.28-.55-1.06 0-1.39.53-2.26.57-.9.03-1.58-.9-2.16-1.73-1.18-1.7-2.08-4.78-.87-6.88.6-1.04 1.66-1.7 2.82-1.72.88-.02 1.71.6 2.25.6.53 0 1.53-.73 2.58-.62.44.02 1.68.18 2.47 1.34-.06.04-1.47.86-1.45 2.52zM14.67 6.17c.47-.57.79-1.36.7-2.17-.68.03-1.5.45-1.99 1.02-.43.5-.8 1.3-.7 2.07.76.06 1.53-.39 1.99-.92z" />
            </svg>
            Apple
          </button>
        </div>

        <p className="mt-4 text-center text-xs text-[#98a2b3]">or Sign in with Email</p>

        <form className="mt-4 space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <div>
            <label className="mb-1 block text-sm font-medium text-[#111827]">Your Email</label>
            <input
              className="h-11 w-full rounded border border-[#d7e4f6] px-3 text-sm outline-none focus:border-[#0989ff]"
              placeholder="shofy@mail.com"
              {...register('email')}
            />
            {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-[#111827]">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                className="h-11 w-full rounded border border-[#d7e4f6] px-3 pr-10 text-sm outline-none focus:border-[#0989ff]"
                placeholder="Min. 6 character"
                {...register('password')}
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                className="absolute inset-y-0 right-3 text-[#98a2b3]"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 3l18 18" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M10.58 10.58A3 3 0 0012 15a3 3 0 002.42-4.42" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9.88 5.09A9.77 9.77 0 0112 5c4.48 0 8.27 2.94 9.54 7a9.96 9.96 0 01-3.03 4.16M6.1 6.1A10 10 0 002.46 12c1.27 4.06 5.06 7 9.54 7 1.66 0 3.25-.4 4.64-1.1" />
                  </svg>
                ) : (
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M2.46 12C3.73 7.94 7.52 5 12 5s8.27 2.94 9.54 7c-1.27 4.06-5.06 7-9.54 7S3.73 16.06 2.46 12z" />
                  </svg>
                )}
              </button>
            </div>
            {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>}
          </div>

          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center gap-2 text-[#475467]">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              Remember me
            </label>
            <button type="button" className="text-[#0989ff] hover:underline">
              Forgot Password?
            </button>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            disabled={isSubmitting}
            className="h-11 w-full rounded bg-[#0f1f40] px-4 text-sm font-semibold text-white hover:bg-[#102b57] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? 'Please wait...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
}
