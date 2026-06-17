export type Bucket = "control" | "treatment";

function isBucket(v: unknown): v is Bucket {
  return v === "control" || v === "treatment";
}

/** splitPercent(0-100) と乱数(0-1) から割当てる。rand < split/100 で treatment。 */
export function pickBucket(splitPercent: number, rand: number): Bucket {
  return rand < splitPercent / 100 ? "treatment" : "control";
}

/** override(クエリ) > cookie > splitPercent 割当て の優先順で bucket を決める。 */
export function resolveBucket(
  override: string | undefined,
  cookie: string | undefined,
  splitPercent: number,
  rand: number,
): Bucket {
  if (isBucket(override)) return override;
  if (isBucket(cookie)) return cookie;
  return pickBucket(splitPercent, rand);
}
