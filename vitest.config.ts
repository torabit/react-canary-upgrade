import path from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

// vitest は node_modules を externalize するため npm-alias の react-19 を
// react-dom と整合させられない（pnpm の peer は実名解決のため react-dom@19 が
// react@18 にリンクされる）。よって vitest はインストール済みの React のみを
// テストする。React 19 ランタイムの検証は Playwright e2e（実ブラウザ）で行う。
export default defineConfig({
  plugins: [react()],
  resolve: { alias: { "@": path.resolve(__dirname, "src") } },
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    globals: true,
    include: ["src/**/*.test.{ts,tsx}", "workers/**/*.test.ts"],
  },
});
