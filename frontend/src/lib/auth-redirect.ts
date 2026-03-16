export function buildLoginRedirectHref(fallbackPath = '/'): string {
  if (typeof window === 'undefined') {
    return `/login?redirect=${encodeURIComponent(fallbackPath)}`;
  }

  const currentPath = `${window.location.pathname}${window.location.search}`;
  return `/login?redirect=${encodeURIComponent(currentPath || fallbackPath)}`;
}

export function getSafePostLoginPath(redirectParam: string | null, fallbackPath = '/'): string {
  if (!redirectParam) return fallbackPath;
  if (!redirectParam.startsWith('/') || redirectParam.startsWith('//')) return fallbackPath;
  return redirectParam;
}
