import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  snapshotPathTemplate: "{testDir}/__screenshots__/{arg}{ext}",
  use: { baseURL: process.env.E2E_BASE_URL ?? "http://localhost:3000" },
});
