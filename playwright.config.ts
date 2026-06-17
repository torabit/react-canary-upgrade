import { defineConfig } from "@playwright/test";

// E2E_VARIANT で control(React18) / treatment(React19) を切り替えて本番ビルドを起動する。
// control の screenshot を baseline とし、treatment が同一レイアウトかを比較する。
const variant = process.env.E2E_VARIANT ?? "control";
const reactUpgrade = variant === "treatment" ? "true" : "false";

export default defineConfig({
  testDir: "./e2e",
  snapshotPathTemplate: "{testDir}/__screenshots__/{arg}{ext}",
  use: { baseURL: "http://localhost:3000" },
  webServer: {
    // 変数ごとに別 distDir でビルド/起動し、webpack キャッシュ汚染を防ぐ。
    command: `DIST_DIR=.next-${variant} REACT_UPGRADE=${reactUpgrade} pnpm exec next build && DIST_DIR=.next-${variant} REACT_UPGRADE=${reactUpgrade} pnpm exec next start -p 3000`,
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
