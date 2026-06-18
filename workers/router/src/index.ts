/// <reference types="@cloudflare/workers-types" />
import { Container, getContainer } from "@cloudflare/containers";
import { Hono } from "hono";
import { getCookie } from "hono/cookie";
import { type Bucket, resolveBucket } from "./bucket";

// control(React18) / treatment(React19) を別イメージで動かすコンテナ。
// 実体は同一 Dockerfile を image_vars(REACT_UPGRADE) で出し分けたもの（wrangler.jsonc）。
export class ControlContainer extends Container {
  defaultPort = 3000;
  sleepAfter = "10m";
}

export class TreatmentContainer extends Container {
  defaultPort = 3000;
  sleepAfter = "10m";
}

interface Env {
  CONTROL: DurableObjectNamespace<ControlContainer>;
  TREATMENT: DurableObjectNamespace<TreatmentContainer>;
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

// それ以外は割当先コンテナへ転送（control=React18 / treatment=React19）。
// コンテナ応答をそのまま返すと Hono の Set-Cookie が失われるため、
// 応答を作り直してスティッキー cookie を付与する。
app.all("*", async (c) => {
  const bucket = c.get("bucket");
  const ns = bucket === "treatment" ? c.env.TREATMENT : c.env.CONTROL;
  const upstream = await getContainer(ns).fetch(c.req.raw);
  const res = new Response(upstream.body, upstream);
  res.headers.append(
    "Set-Cookie",
    `exp_bucket=${bucket}; Path=/; Max-Age=${60 * 60 * 24 * 30}; SameSite=Lax`,
  );
  return res;
});

export default app;
