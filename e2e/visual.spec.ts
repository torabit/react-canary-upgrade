import { expect, test } from "@playwright/test";

const variant = process.env.E2E_VARIANT ?? "control";
const isTreatment = variant === "treatment";
const expectedMajor = isTreatment ? "19" : "18";

// ブラウザ（クライアント）で実際に動く React のメジャーバージョンを検証する。
test(`client runs React ${expectedMajor} [${variant}]`, async ({ page }) => {
  await page.goto("/");
  await expect(page.getByTestId("behavior-probe")).toBeVisible();
  await expect(page.getByTestId("react-version")).toContainText(
    `React ${expectedMajor}.`,
  );
});

// React 18→19 の breaking change（ref を prop で渡す / <meta> の配置先）が
// 観測値として現れることを検証する。
test(`react behavior reflects ${expectedMajor} [${variant}]`, async ({
  page,
}) => {
  await page.goto("/");
  const ref = page.getByTestId("probe-ref");
  const meta = page.getByTestId("probe-meta");
  if (isTreatment) {
    await expect(ref).toContainText("spanRef.current = <span>");
    await expect(meta).toContainText("= HEAD"); // <head> へ巻き上げ
  } else {
    await expect(ref).toContainText("spanRef.current = null");
    await expect(meta).not.toContainText("= HEAD"); // 巻き上げられず描画位置に残る
  }
});

// バージョン依存の表示（version 行・挙動プローブ）は mask し、
// レイアウト・描画の回帰のみを control の baseline と比較する。
test(`home page renders consistently [${variant}]`, async ({ page }) => {
  await page.goto("/");
  await expect(page.getByTestId("behavior-probe")).toBeVisible();
  await expect(page).toHaveScreenshot("home.png", {
    mask: [
      page.getByTestId("react-version"),
      page.getByTestId("behavior-probe"),
    ],
    maxDiffPixelRatio: 0.01,
  });
});
