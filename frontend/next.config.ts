import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "<IP_Address>",  // Update the hostname to IP address when deploying
        port: "5000",
        pathname: "/uploads/**",
      },
    ],
  },
};

export default nextConfig;
