import { createRequire } from "node:module";
import path from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

const require = createRequire(import.meta.url);
const useUpgrade = process.env.REACT_UPGRADE === "true";

const reactAlias: Record<string, string> = useUpgrade
  ? {
      react: path.dirname(require.resolve("react-19/package.json")),
      "react-dom": path.dirname(require.resolve("react-dom-19/package.json")),
    }
  : {};

export default defineConfig({
  plugins: [react()],
  resolve: { alias: { "@": path.resolve(__dirname, "src"), ...reactAlias } },
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    globals: true,
    include: ["src/**/*.test.{ts,tsx}", "workers/**/*.test.ts"],
  },
});
