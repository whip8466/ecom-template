/** Normalize Fastify + Zod error payloads into a single message for UI. */
export function messageFromApiErrorPayload(data: unknown): string {
  const d = data as {
    message?: string;
    errors?: Record<string, string[] | string>;
    formErrors?: string[];
  };
  if (d.formErrors?.length) {
    return [d.message, ...d.formErrors].filter(Boolean).join(' ');
  }
  if (d.errors && typeof d.errors === 'object') {
    const parts: string[] = [];
    for (const [key, val] of Object.entries(d.errors)) {
      if (key === '_errors' && Array.isArray(val)) {
        parts.push(...val.filter(Boolean).map(String));
        continue;
      }
      const msg = Array.isArray(val) ? val.join(', ') : String(val);
      if (msg) parts.push(`${key}: ${msg}`);
    }
    if (parts.length) return parts.join(' ');
  }
  return d.message || 'Request failed';
}
