import { version } from "react";

/** 実行中の React バージョン（alias 検証・画面表示用）。 */
export const reactVersion: string = version;

/** メジャーバージョン（"18" | "19" など）。 */
export const reactMajor: string = version.split(".")[0];
