import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "172.30.85.64",
        port: "5000",
        pathname: "/uploads/**",
      },
    ],
  },
};

export default nextConfig;
