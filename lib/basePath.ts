/**
 * The subpath the app is served from — "" on a root domain, "/<repo>" on a GitHub
 * Pages project site. Inlined at build time from next.config.mjs's own source.
 */
export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

/**
 * Builds an absolute URL for a share link.
 *
 * `window.location.origin` alone drops the base path, which would produce a link to
 * https://user.github.io/fill/ instead of https://user.github.io/<repo>/fill/ — a
 * 404 for whoever we sent it to. Always route share links through this.
 */
export function appUrl(path: string): string {
  const suffix = path.startsWith("/") ? path : `/${path}`;
  return `${window.location.origin}${BASE_PATH}${suffix}`;
}
