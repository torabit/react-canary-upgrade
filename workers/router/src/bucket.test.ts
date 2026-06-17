import { describe, expect, it } from "vitest";
import { pickBucket, resolveBucket } from "./bucket";

describe("pickBucket", () => {
  it("splitPercent=0 なら常に control", () => {
    expect(pickBucket(0, 0.99)).toBe("control");
    expect(pickBucket(0, 0)).toBe("control");
  });
  it("splitPercent=100 なら常に treatment", () => {
    expect(pickBucket(100, 0)).toBe("treatment");
    expect(pickBucket(100, 0.99)).toBe("treatment");
  });
  it("乱数が閾値未満なら treatment", () => {
    expect(pickBucket(10, 0.05)).toBe("treatment");
    expect(pickBucket(10, 0.5)).toBe("control");
  });
});

describe("resolveBucket", () => {
  it("override クエリを最優先する", () => {
    expect(resolveBucket("treatment", "control", 0, 0.99)).toBe("treatment");
  });
  it("override が無ければ cookie を使う", () => {
    expect(resolveBucket(undefined, "treatment", 0, 0.99)).toBe("treatment");
  });
  it("override も cookie も無ければ splitPercent で割当てる", () => {
    expect(resolveBucket(undefined, undefined, 100, 0.5)).toBe("treatment");
  });
  it("不正な override は無視して cookie/割当てにフォールバックする", () => {
    expect(resolveBucket("bogus", undefined, 0, 0.99)).toBe("control");
  });
});
