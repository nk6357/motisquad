import type { NextConfig } from "next";

const scriptPolicy = process.env.NODE_ENV === "production" ? "script-src 'self' 'unsafe-inline'" : "script-src 'self' 'unsafe-inline' 'unsafe-eval'";

const nextConfig: NextConfig = {
  output: "standalone",
  poweredByHeader: false,
  async headers() {
    return [{ source:"/(.*)", headers:[
      { key:"X-Content-Type-Options", value:"nosniff" },
      { key:"X-Frame-Options", value:"DENY" },
      { key:"Referrer-Policy", value:"strict-origin-when-cross-origin" },
      { key:"Permissions-Policy", value:"camera=(), microphone=(), geolocation=()" },
      { key:"Cross-Origin-Opener-Policy", value:"same-origin" },
      { key:"Strict-Transport-Security", value:"max-age=63072000; includeSubDomains; preload" },
      { key:"Content-Security-Policy", value:`default-src 'self'; ${scriptPolicy}; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'; upgrade-insecure-requests` },
    ] }];
  },
};

export default nextConfig;
