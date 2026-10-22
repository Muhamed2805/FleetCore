import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

// Sent with every response. A full script CSP would need per-request
// nonces for Next.js's inline scripts; framing is the part that matters for
// an app with destructive buttons, so only frame-ancestors is set.
const securityHeaders = [
  { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Keeps signed document URLs and invite tokens out of Referer headers
  // sent to other sites.
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains",
  },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  experimental: {
    serverActions: {
      // Document scans send the file in the action request. The default is
      // 1 MB; this leaves room for MAX_SCAN_FILE_MB (src/lib/document-scan.ts)
      // plus the multipart overhead.
      bodySizeLimit: "4.5mb",
    },
  },
  headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

export default withNextIntl(nextConfig);
