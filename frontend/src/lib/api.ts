import { handleInvalidTokenIfNeeded } from './invalidate-session';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000';

export async function apiRequest<T>(
  path: string,
  options?: RequestInit & { token?: string }
): Promise<T> {
  const headers = new Headers(options?.headers || {});
  // Avoid Content-Type: application/json on DELETE/GET with no body — Fastify can reject the request.
  if (options?.body != null && options.body !== '') {
    headers.set('Content-Type', 'application/json');
  }

  if (options?.token) {
    headers.set('Authorization', `Bearer ${options.token}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
    cache: 'no-store',
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    await handleInvalidTokenIfNeeded(response.status, payload);
    throw new Error((payload as { message?: string }).message || 'Request failed');
  }

  return payload as T;
}
