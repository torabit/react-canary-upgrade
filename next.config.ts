import { createRequire } from "node:module";
import path from "node:path";
import type { NextConfig } from "next";

const require = createRequire(import.meta.url);
const useUpgrade = process.env.REACT_UPGRADE === "true";

const nextConfig: NextConfig = {
  env: { NEXT_PUBLIC_REACT_UPGRADE: String(useUpgrade) },
  webpack: (config) => {
    if (useUpgrade) {
      config.resolve.alias = {
        ...config.resolve.alias,
        react: path.dirname(require.resolve("react-19/package.json")),
        "react-dom": path.dirname(require.resolve("react-dom-19/package.json")),
      };
    }
    return config;
  },
};

export default nextConfig;
