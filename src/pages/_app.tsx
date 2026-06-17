import type { AppProps } from "next/app";
import { useEffect } from "react";
import { type Bucket, reportErrors, reportWebVitals } from "@/lib/vitals";
import "@/styles/globals.css";

function readBucket(): Bucket {
  if (typeof document === "undefined") return "control";
  const m = document.cookie.match(/(?:^|; )exp_bucket=(control|treatment)/);
  return m?.[1] === "treatment" ? "treatment" : "control";
}

export default function App({ Component, pageProps }: AppProps) {
  useEffect(() => {
    const bucket = readBucket();
    reportWebVitals(bucket);
    reportErrors(bucket);
  }, []);
  return <Component {...pageProps} />;
}
