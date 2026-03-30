import slugify from 'slugify';

/** Matches backend `slugBaseFromTitle` / create slug logic (max 180 chars, fallback `post`). */
export function slugFromTitle(title: string): string {
  const raw = slugify(String(title), { lower: true, strict: true, trim: true });
  return raw.slice(0, 180) || 'post';
}
