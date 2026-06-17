import { createRequire } from "node:module";
import path from "node:path";
import type { NextConfig } from "next";

const require = createRequire(import.meta.url);
const useUpgrade = process.env.REACT_UPGRADE === "true";

const nextConfig: NextConfig = {
  // Docker コンテナ用に最小ランタイム（server.js + 必要な node_modules）を出力する。
  output: "standalone",
  // control/treatment は別 distDir でビルドする。共有すると webpack キャッシュが
  // 汚染され、alias 無しの control が前回 treatment の react-19 を再利用してしまう。
  distDir: process.env.DIST_DIR ?? ".next",
  env: { NEXT_PUBLIC_REACT_UPGRADE: String(useUpgrade) },
  webpack: (config) => {
    if (useUpgrade) {
      const react19 = path.dirname(require.resolve("react-19/package.json"));
      const reactDom19 = path.dirname(require.resolve("react-dom-19/package.json"));
      // Next は `react$` / `react-dom$`（完全一致）で installed React を指すため、
      // 完全一致 alias で上書きし、prefix でサブパス（jsx-runtime, client 等）も差し替える。
      config.resolve.alias = {
        ...config.resolve.alias,
        react$: require.resolve("react-19"),
        "react-dom$": require.resolve("react-dom-19"),
        react: react19,
        "react-dom": reactDom19,
      };
    }
    return config;
  },
};

export default nextConfig;
