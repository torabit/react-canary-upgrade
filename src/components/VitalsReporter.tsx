"use client";

import { useEffect } from "react";
import { type Bucket, reportErrors, reportWebVitals } from "@/lib/vitals";

function readBucket(): Bucket {
  const m = document.cookie.match(/(?:^|; )exp_bucket=(control|treatment)/);
  return m?.[1] === "treatment" ? "treatment" : "control";
}

export function VitalsReporter() {
  useEffect(() => {
    const bucket = readBucket();
    reportWebVitals(bucket);
    reportErrors(bucket);
  }, []);
  return null;
}
