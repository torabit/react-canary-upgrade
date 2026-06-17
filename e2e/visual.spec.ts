import { expect, test } from "@playwright/test";

const variant = process.env.E2E_VARIANT ?? "control";
const expectedMajor = variant === "treatment" ? "19" : "18";

// ブラウザ（クライアント）で実際に動く React のメジャーバージョンを検証する。
// npm-alias により control=18 / treatment=19 がハイドレーション後 DOM に反映される。
test(`client runs React ${expectedMajor} [${variant}]`, async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("button", { name: "increment" })).toBeVisible();
  await expect(page.getByTestId("react-version")).toContainText(
    `React ${expectedMajor}.`,
  );
});

// 同一コードが両 React バージョンで機能することを実ブラウザで検証する。
test(`counter increments [${variant}]`, async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "increment" }).click();
  await expect(page.getByRole("status")).toHaveText("count: 1");
});

// React バージョン表記は control/treatment で異なるため mask し、
// レイアウト・描画の回帰のみを control の baseline と比較する。
test(`home page renders consistently [${variant}]`, async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("button", { name: "increment" })).toBeVisible();
  await expect(page).toHaveScreenshot("home.png", {
    mask: [page.getByTestId("react-version")],
    maxDiffPixelRatio: 0.01,
  });
});
