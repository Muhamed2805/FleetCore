// `next` comes from the query string, so anyone can craft a login or auth
// callback link with it. Only same-site paths are followed: "/dashboard"
// is kept, while "//evil.com", "/\evil.com", "https://evil.com" and
// "@evil.com" (which would turn "https://app" + next into a URL with
// userinfo) fall back.
export function safeNextPath(
  next: string | null | undefined,
  fallback = "/dashboard"
) {
  if (!next || !next.startsWith("/") || /^\/[/\\]/.test(next)) {
    return fallback;
  }
  return next;
}
