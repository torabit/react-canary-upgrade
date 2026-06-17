import { describe, expect, it } from "vitest";
import { buildBeaconPayload, buildErrorPayload } from "./vitals";

describe("buildBeaconPayload", () => {
  it("metric を bucket 付きの送信ペイロードに変換する", () => {
    const payload = buildBeaconPayload(
      { name: "LCP", value: 1234.5, id: "v1-1" },
      "treatment",
    );
    expect(payload).toEqual({
      kind: "web-vital",
      metric: "LCP",
      value: 1234.5,
      id: "v1-1",
      bucket: "treatment",
    });
  });

  it("エラーを bucket 付きの error ペイロードに変換する", () => {
    const payload = buildErrorPayload(
      "TypeError: x is not a function",
      "control",
    );
    expect(payload).toEqual({
      kind: "error",
      metric: "TypeError: x is not a function",
      value: 1,
      id: "TypeError: x is not a function",
      bucket: "control",
    });
  });
});
