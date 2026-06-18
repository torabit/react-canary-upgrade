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

// React 18→19 の breaking change（ref を prop で渡す / <meta> の head 巻き上げ）が
// 挙動として現れることを検証する。同一コードがバージョン差でだけ結果を変える。
test(`react behavior reflects ${expectedMajor} [${variant}]`, async ({
  page,
}) => {
  await page.goto("/");
  const marker = `React ${expectedMajor}`;
  await expect(page.getByTestId("probe-ref")).toContainText(marker);
  await expect(page.getByTestId("probe-meta")).toContainText(marker);
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
    mask: [
      page.getByTestId("react-version"),
      page.getByTestId("behavior-probe"),
    ],
    maxDiffPixelRatio: 0.01,
  });
});
