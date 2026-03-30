/**
 * Legacy plain-text posts → HTML for TipTap. Strings that already look like HTML pass through.
 */
export function normalizeBodyForEditor(raw: string): string {
  const t = raw.trim();
  if (!t) return '<p></p>';
  if (/<[a-z][\s\S]*>/i.test(t)) {
    return raw;
  }
  const escaped = raw
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  const parts = escaped.replace(/\r\n/g, '\n').split(/\n\n+/);
  const html = parts.map((para) => `<p>${para.replace(/\n/g, '<br>')}</p>`).join('');
  return html || '<p></p>';
}

/** True when the editor body has no visible text (empty paragraphs only). */
export function isBodyEmpty(html: string): boolean {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const text = doc.body.textContent?.replace(/\u00a0/g, ' ').trim() ?? '';
  return text.length === 0;
}

/** Plain text from HTML (e.g. for API shortDescription limits). */
export function plainTextFromHtml(html: string): string {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  return doc.body.textContent?.replace(/\s+/g, ' ').trim() ?? '';
}

/** Whether a string is likely HTML markup vs plain text (matches normalizeBodyForEditor heuristic). */
export function looksLikeHtmlMarkup(raw: string): boolean {
  return /<[a-z][\s\S]*>/i.test(raw.trim());
}
