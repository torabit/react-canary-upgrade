# react-canary-upgrade

Airbnb の記事 [How Airbnb Smoothly Upgrades React](https://medium.com/airbnb-engineering/how-airbnb-smoothly-upgrades-react-b1d772a565fd) で紹介されている React の段階的アップグレード手法を、ローカル + Cloudflare デプロイで再現する学習用リポジトリ。

2 層を扱う:

1. **モジュールエイリアシング** — 単一コードベースから `REACT_UPGRADE` env と npm-alias で **control(React 18) / treatment(React 19)** の 2 成果物をビルドする。ソースコードは無変更。
2. **トラフィック分割** — control / treatment を **Cloudflare Containers**（マルチステージ Docker イメージ）として動かし、前段の **Hono ルーター Worker** が cookie バケッティングで `%` 制御の段階ロールアウトを行い、Web Vitals / エラー率を KV に集計して出荷判断する。

## 実ブラウザでの React バージョン差し替え

同一コードが、ビルド時の `REACT_UPGRADE` だけでブラウザ実行 React を切り替える（クライアントチャンク・ハイドレーション後 DOM で確認済み）:

| control (`REACT_UPGRADE=false`) | treatment (`REACT_UPGRADE=true`) |
| --- | --- |
| ![control React 18](docs/home-control.png) | ![treatment React 19](docs/home-treatment.png) |
| Running React **18.2.0** | Running React **19.2.0** |

### 挙動による証明（バージョン文字列だけに頼らない）

`BehaviorProbe` が React 18→19 の breaking change を実行時に判定して画面に表示する。同一コードがバージョン差でだけ結果を変えるため、18/19 が本当に動いていることを挙動で示せる:

| プローブ | React 18 (control) | React 19 (treatment) |
| --- | --- | --- |
| `ref` を関数コンポーネントに prop として渡す | ❌ null（forwardRef 必須） | ✅ 動作（ref が通常の prop に） |
| コンポーネント内の `<meta>` の `<head>` 巻き上げ | ❌ body に残る | ✅ head へ自動巻き上げ |

Playwright e2e（`e2e/visual.spec.ts`）が、control を baseline に treatment のレイアウト一致・Counter 動作・クライアント React メジャー・上記プローブ挙動を検証する。

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

# Docker（control=React18 / treatment=React19）
docker build --build-arg REACT_UPGRADE=false -t rcu-control .
docker build --build-arg REACT_UPGRADE=true  -t rcu-treatment .
```

## デプロイ（Cloudflare Containers）

Cloudflare Containers は **Workers Paid プラン（$5/月）** が必要（コンテナ稼働分は月間無料枠に収まる）。

```bash
wrangler login
wrangler kv namespace create METRICS          # 出力の id を workers/router/wrangler.jsonc の REPLACE_WITH_KV_ID に設定
pnpm cf:deploy                                  # 両 Docker イメージをビルド・push し Worker + Containers をデプロイ
```

`SPLIT_PERCENT`（treatment へ振る %）と KV の `/stats` で control/treatment を比較し段階ロールアウトする。

## 構成

- `src/pages/` — Pages Router（`_app.tsx` で Web Vitals/エラー収集を起動）
- `src/lib/vitals.ts` — `web-vitals` 収集 → `/beacon` 送信
- `Dockerfile` — マルチステージ。`ARG REACT_UPGRADE` で control/treatment イメージを出し分け（standalone 出力 / 非 root / tini）
- `workers/router/` — Hono ルーター Worker。`getContainer()` で control/treatment コンテナへ分割、`/beacon` の KV 集計・`/stats`
- `next.config.ts` — `REACT_UPGRADE` による react alias と distDir 切替
