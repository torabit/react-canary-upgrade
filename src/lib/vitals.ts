import { type Metric, onCLS, onINP, onLCP } from "web-vitals";

export type Bucket = "control" | "treatment";

export interface BeaconPayload {
  kind: "web-vital" | "error";
  metric: string;
  value: number;
  id: string;
  bucket: Bucket;
}

/** Metric を /beacon 送信用ペイロードに変換する（テスト可能な純粋関数）。 */
export function buildBeaconPayload(
  metric: Pick<Metric, "name" | "value" | "id">,
  bucket: Bucket,
): BeaconPayload {
  return {
    kind: "web-vital",
    metric: metric.name,
    value: metric.value,
    id: metric.id,
    bucket,
  };
}

/** クライアントエラーメッセージを /beacon 送信用ペイロードに変換する。 */
export function buildErrorPayload(
  message: string,
  bucket: Bucket,
): BeaconPayload {
  return { kind: "error", metric: message, value: 1, id: message, bucket };
}

function send(payload: BeaconPayload): void {
  const body = JSON.stringify(payload);
  if (navigator.sendBeacon) {
    navigator.sendBeacon("/beacon", body);
  } else {
    void fetch("/beacon", { method: "POST", body, keepalive: true });
  }
}

/** クライアントで Web Vitals の収集を開始する。 */
export function reportWebVitals(bucket: Bucket): void {
  const report = (metric: Metric) => send(buildBeaconPayload(metric, bucket));
  onLCP(report);
  onINP(report);
  onCLS(report);
}

/** クライアントエラーの収集を開始する（JS エラー率の安全ネット）。 */
export function reportErrors(bucket: Bucket): void {
  window.addEventListener("error", (e) =>
    send(buildErrorPayload(e.message, bucket)),
  );
  window.addEventListener("unhandledrejection", (e) =>
    send(buildErrorPayload(String(e.reason), bucket)),
  );
}
