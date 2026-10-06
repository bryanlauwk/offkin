/** Normalize a public company URL without fetching or researching its contents. */
export function normalizeCompanyWebsite(input: string): string | null {
  const value = input.trim();
  if (!value || /\s/.test(value)) return null;
  try {
    const url = new URL(/^[a-z][a-z\d+.-]*:/i.test(value) ? value : `https://${value}`);
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || !url.hostname.includes('.') || url.hostname.endsWith('.') || url.port) return null;
    const normalized = `${url.protocol}//${url.hostname}${url.pathname === '/' ? '' : url.pathname}`;
    return normalized.length <= 300 ? normalized : null;
  } catch { return null; }
}

