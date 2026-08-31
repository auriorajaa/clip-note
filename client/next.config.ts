import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  allowedDevOrigins: ["192.168.1.2"],
  images: {
    remotePatterns: [
      new URL("https://i.ytimg.com/**"),
      new URL("https://placehold.net/**"),
    ],
  },
};

export default nextConfig;
