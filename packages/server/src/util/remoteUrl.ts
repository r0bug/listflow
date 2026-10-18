// Allowlist for server-side fetches of image URLs that arrive from clients
// (listing capture, import-from-active, comp thumbnails). Without it, anyone
// holding a machine key could make the server fetch internal addresses —
// the fleet overlay, localhost services, cloud metadata — and store the reply.

const ALLOWED_HOST_SUFFIXES = ['ebayimg.com', 'ebaystatic.com', 'worthpoint.com'];

export function isAllowedImageUrl(raw: string): boolean {
  let u: URL;
  try {
    u = new URL(raw);
  } catch {
    return false;
  }
  if (u.protocol !== 'https:') return false;
  const host = u.hostname.toLowerCase();
  return ALLOWED_HOST_SUFFIXES.some((s) => host === s || host.endsWith(`.${s}`));
}

/** fetch() for an allowlisted image URL; also re-checks the post-redirect URL. */
export async function fetchAllowedImage(url: string, timeoutMs: number): Promise<Response> {
  if (!isAllowedImageUrl(url)) throw new Error('image host not allowed');
  const res = await fetch(url, { signal: AbortSignal.timeout(timeoutMs) });
  if (res.url && !isAllowedImageUrl(res.url)) throw new Error('image redirected to a host that is not allowed');
  return res;
}
