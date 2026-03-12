'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { apiRequest } from '@/lib/api';
import { useAuthStore } from '@/store/auth-store';
import type { User } from '@/lib/types';

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

type FormValues = z.infer<typeof schema>;

export default function LoginPage() {
  const router = useRouter();
  const [isRegister, setIsRegister] = useState(false);
  const [error, setError] = useState('');
  const setSession = useAuthStore((state) => state.setSession);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  async function onSubmit(values: FormValues) {
    try {
      setError('');
      if (isRegister) {
        const registerPayload = {
          firstName: 'New',
          lastName: 'User',
          email: values.email,
          password: values.password,
          phone: '0000000000',
        };
        const registerRes = await apiRequest<{ token: string; user: User }>('/api/auth/register', {
          method: 'POST',
          body: JSON.stringify(registerPayload),
        });
        setSession(registerRes.token, registerRes.user);
      } else {
        const loginRes = await apiRequest<{ token: string; user: User }>('/api/auth/login', {
          method: 'POST',
          body: JSON.stringify(values),
        });
        setSession(loginRes.token, loginRes.user);
      }
      router.push('/');
    } catch (e) {
      setError((e as Error).message || 'Auth failed');
    }
  }

  return (
    <div className="mx-auto w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h1 className="text-xl font-semibold">{isRegister ? 'Create customer account' : 'Login'}</h1>
      <p className="mt-1 text-sm text-slate-600">Admin and manager can login with seeded credentials.</p>
      <form className="mt-4 space-y-3" onSubmit={handleSubmit(onSubmit)}>
        <div>
          <input
            className="w-full rounded-md border border-slate-300 px-3 py-2"
            placeholder="Email"
            {...register('email')}
          />
          {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>}
        </div>
        <div>
          <input
            type="password"
            className="w-full rounded-md border border-slate-300 px-3 py-2"
            placeholder="Password"
            {...register('password')}
          />
          {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>}
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button disabled={isSubmitting} className="w-full rounded-md bg-slate-900 px-4 py-2 text-white">
          {isSubmitting ? 'Please wait...' : isRegister ? 'Register' : 'Login'}
        </button>
      </form>
      <button className="mt-3 text-sm text-blue-600" onClick={() => setIsRegister((s) => !s)}>
        {isRegister ? 'Already have an account? Login' : 'No account? Register as customer'}
      </button>
    </div>
  );
}
