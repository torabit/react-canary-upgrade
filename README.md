# react-canary-upgrade

Airbnb の記事 [How Airbnb Smoothly Upgrades React](https://medium.com/airbnb-engineering/how-airbnb-smoothly-upgrades-react-b1d772a565fd) で紹介されている React の段階的アップグレード手法を、ローカル + Cloudflare デプロイで再現する学習用リポジトリ。

2 層を扱う:

1. **モジュールエイリアシング** — 単一コードベースから `REACT_UPGRADE` env と npm-alias で **control(React 18) / treatment(React 19)** の 2 成果物をビルドする。ソースコードは無変更。
2. **トラフィック分割** — control / treatment を Cloudflare Workers に並べ、Hono 製ルーターが cookie バケッティングで `%` 制御の段階ロールアウトを行い、Web Vitals / エラー率を計測して出荷判断する。

## 実ブラウザでの React バージョン差し替え

同一コードが、ビルド時の `REACT_UPGRADE` だけでブラウザ実行 React を切り替える（クライアントチャンク・ハイドレーション後 DOM で確認済み）:

| control (`REACT_UPGRADE=false`) | treatment (`REACT_UPGRADE=true`) |
| --- | --- |
| ![control React 18](docs/home-control.png) | ![treatment React 19](docs/home-treatment.png) |
| Running React **18.2.0** | Running React **19.2.0** |

Playwright e2e（`e2e/visual.spec.ts`）が、control を baseline に treatment のレイアウト一致・各バージョンでの Counter 動作・クライアント React メジャーを検証する。

## Next.js での注意点（重要な学び）

- **App Router は React ランタイムを Next 同梱版（`next/dist/compiled/react`）に固定**するため、npm-alias でアプリの `react` を差し替えても実行時 React は変わらない。
- そこで本リポジトリは **Pages Router** を採用。Pages Router は `node_modules` の React を使うため、webpack alias（`react$` / `react-dom$` を exact 上書き）で **クライアントバンドルの React を 18↔19 に実際に差し替えられる**。
- SSR サーバ側は Next が `react` を externalize するため bare の react@18 を使う（ブラウザ実行＝クライアントが切り替わるのが本実験の要点）。
- control / treatment は **別 distDir** でビルドする（共有すると webpack キャッシュが汚染され、alias 無しの control が前回 treatment の react を再利用してしまう）。

## コマンド

```bash
pnpm dev                 # 開発サーバ
pnpm build:control       # React 18 ビルド
pnpm build:treatment     # React 19 ビルド
pnpm test                # Vitest（インストール済み React = 18 をテスト）
E2E_VARIANT=control   pnpm e2e --update-snapshots   # baseline 生成（React 18）
E2E_VARIANT=treatment pnpm e2e                        # 比較・検証（React 19）
```

## 構成

- `src/pages/` — Pages Router（`_app.tsx` で Web Vitals/エラー収集を起動）
- `src/lib/vitals.ts` — `web-vitals` 収集 → `/beacon` 送信
- `workers/router/` — Hono ルーター（cookie バケッティング・`/beacon` の KV 集計・`/stats`・プロキシ）
- `next.config.ts` — `REACT_UPGRADE` による react alias と distDir 切替
