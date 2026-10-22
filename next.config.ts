import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Document scans send the file in the action request. The default is
      // 1 MB; this leaves room for MAX_SCAN_FILE_MB (src/lib/document-scan.ts)
      // plus the multipart overhead.
      bodySizeLimit: "4.5mb",
    },
  },
};

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

export default withNextIntl(nextConfig);
