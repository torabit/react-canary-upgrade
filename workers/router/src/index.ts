/// <reference types="@cloudflare/workers-types" />
import { Hono } from "hono";
import { getCookie, setCookie } from "hono/cookie";
import { type Bucket, resolveBucket } from "./bucket";

interface Env {
  CONTROL_URL: string;
  TREATMENT_URL: string;
  SPLIT_PERCENT: string;
  METRICS: KVNamespace;
}

interface BeaconBody {
  kind: "web-vital" | "error";
  metric: string;
  value: number;
  bucket: Bucket;
}

interface Agg {
  sum: number;
  count: number;
}

const app = new Hono<{ Bindings: Env; Variables: { bucket: Bucket } }>();

// バケット割当（override クエリ > cookie > SPLIT_PERCENT）。
app.use("*", async (c, next) => {
  const cookie = getCookie(c, "exp_bucket");
  const split = Number(c.env.SPLIT_PERCENT ?? "0");
  const bucket = resolveBucket(
    c.req.query("variant"),
    cookie,
    split,
    Math.random(),
  );
  if (cookie !== bucket) {
    setCookie(c, "exp_bucket", bucket, {
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });
  }
  c.set("bucket", bucket);
  await next();
});

// 計測 beacon を受け取り KV にバケット別集計（sum/count）。
app.post("/beacon", async (c) => {
  const body = await c.req.json<BeaconBody>();
  const key = `agg:${body.bucket}:${body.kind}:${body.metric}`;
  const prev = (await c.env.METRICS.get<Agg>(key, "json")) ?? {
    sum: 0,
    count: 0,
  };
  const next: Agg = { sum: prev.sum + body.value, count: prev.count + 1 };
  await c.env.METRICS.put(key, JSON.stringify(next));
  return c.body(null, 204);
});

// バケット別の平均値（出荷判断用）を返す。
app.get("/stats", async (c) => {
  const list = await c.env.METRICS.list({ prefix: "agg:" });
  const stats: Record<string, { sum: number; count: number; avg: number }> = {};
  for (const { name } of list.keys) {
    const agg = await c.env.METRICS.get<Agg>(name, "json");
    if (agg) {
      stats[name.slice("agg:".length)] = {
        sum: agg.sum,
        count: agg.count,
        avg: agg.count ? agg.sum / agg.count : 0,
      };
    }
  }
  return c.json(stats);
});

// それ以外は割当先 Worker へプロキシ（nginx の weighted upstream 相当）。
app.all("*", (c) => {
  const base =
    c.get("bucket") === "treatment" ? c.env.TREATMENT_URL : c.env.CONTROL_URL;
  const url = new URL(c.req.url);
  return fetch(new Request(base + url.pathname + url.search, c.req.raw));
});

export default app;
