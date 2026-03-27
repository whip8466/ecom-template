/**
 * Clears persisted auth and sends the user to /login when the API reports an invalid JWT.
 */
export async function invalidateSessionAndRedirect(): Promise<void> {
  if (typeof window === 'undefined') return;
  const { useAuthStore } = await import('@/store/auth-store');
  useAuthStore.getState().logout();
  window.location.assign('/login');
}

/** Call after parsing JSON when `response.ok` is false. */
export async function handleInvalidTokenIfNeeded(status: number, payload: unknown): Promise<void> {
  if (status !== 401) return;
  const msg = (payload as { message?: string }).message;
  if (msg !== 'Invalid token') return;
  await invalidateSessionAndRedirect();
}
