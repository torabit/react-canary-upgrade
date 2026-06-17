# syntax=docker/dockerfile:1
# マルチステージ: base -> deps -> builder(REACT_UPGRADE で alias 切替) -> 最小 runner
FROM node:22-bookworm-slim AS base
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
ENV NEXT_TELEMETRY_DISABLED=1
# tini を PID1 にしてシグナル処理・ゾンビ回収を任せる
RUN --mount=type=cache,target=/var/cache/apt,sharing=locked \
    --mount=type=cache,target=/var/lib/apt/lists,sharing=locked \
    apt-get update && apt-get install -y --no-install-recommends tini
RUN corepack enable
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-lock.yaml ./
# pnpm store を BuildKit キャッシュに載せて再ビルドを高速化（store は content-addressed で汚染しない）
RUN --mount=type=cache,target=/pnpm/store,sharing=locked \
    pnpm config set store-dir /pnpm/store && pnpm install --frozen-lockfile

FROM base AS builder
# REACT_UPGRADE=false -> control(React18) / true -> treatment(React19)
# 注: .next/cache の共有キャッシュマウントは付けない（control/treatment 間で
# webpack キャッシュが汚染され alias 無しの control が treatment の react を拾うため）
ARG REACT_UPGRADE=false
ENV REACT_UPGRADE=$REACT_UPGRADE
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm build

FROM base AS runner
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
# standalone 出力（server.js + トレース済み node_modules）と静的アセットのみ、非 root で配置
COPY --from=builder --chown=node:node /app/.next/standalone ./
COPY --from=builder --chown=node:node /app/.next/static ./.next/static
COPY --from=builder --chown=node:node /app/public ./public
USER node
EXPOSE 3000
ENTRYPOINT ["/usr/bin/tini", "--"]
CMD ["node", "server.js"]
