import {
  createElement,
  type Ref,
  useEffect,
  useRef,
  useState,
  version,
} from "react";

// React 19 は ref を通常の prop として関数コンポーネントに渡せる（forwardRef 不要）。
// React 18 では ref は特別扱いされ関数コンポーネントには渡らない。
function RefAsProp(props: { ref?: Ref<HTMLSpanElement> }) {
  return <span ref={props.ref} />;
}

const REF_CODE = `function Box({ ref }) {
  return <span ref={ref} />;
}
<Box ref={spanRef} />`;

const META_CODE = `<meta name="rcu-probe" content="probe" />`;

/**
 * 実行中の React が 18 か 19 かを「挙動」で観測するプローブ。
 * 判定文ではなく、実行したコードと実際に観測した値・実行環境をそのまま表示する。
 */
export function BehaviorProbe() {
  const spanRef = useRef<HTMLSpanElement>(null);
  const [refResult, setRefResult] = useState("(評価前)");
  const [metaParent, setMetaParent] = useState("(評価前)");
  const [bucket, setBucket] = useState("(評価前)");

  useEffect(() => {
    const el = spanRef.current;
    setRefResult(el ? `<${el.tagName.toLowerCase()}>` : "null");
    const meta = document.querySelector('meta[name="rcu-probe"]');
    setMetaParent(meta?.parentElement?.tagName ?? "(not found)");
    const m = document.cookie.match(/(?:^|; )exp_bucket=(control|treatment)/);
    setBucket(m?.[1] ?? "(none)");
  }, []);

  return (
    <section
      data-testid="behavior-probe"
      className="flex flex-col gap-4 rounded border border-gray-200 p-4 text-sm"
    >
      <h2 className="font-semibold">React 挙動プローブ</h2>

      <div
        data-testid="probe-env"
        className="flex flex-col gap-0.5 font-mono text-xs"
      >
        <span>react.version = "{version}"</span>
        <span>
          process.env.NEXT_PUBLIC_REACT_UPGRADE = "
          {process.env.NEXT_PUBLIC_REACT_UPGRADE}"
        </span>
        <span>document.cookie exp_bucket = "{bucket}"</span>
      </div>

      <div className="flex flex-col gap-1">
        <p className="font-medium">
          1. ref を関数コンポーネントの prop として渡す
        </p>
        <pre className="overflow-x-auto rounded bg-gray-100 p-2 text-xs">
          <code>{REF_CODE}</code>
        </pre>
        <p data-testid="probe-ref" className="font-mono text-xs">
          spanRef.current = {refResult}
        </p>
      </div>

      <div className="flex flex-col gap-1">
        <p className="font-medium">2. コンポーネント内 {"<meta>"} の配置先</p>
        <pre className="overflow-x-auto rounded bg-gray-100 p-2 text-xs">
          <code>{META_CODE}</code>
        </pre>
        <p data-testid="probe-meta" className="font-mono text-xs">
          {
            "document.querySelector('meta[name=\"rcu-probe\"]').parentElement.tagName = "
          }
          {metaParent}
        </p>
      </div>

      {/* 実プローブ: ref を特別扱いさせるため createElement で渡す */}
      {createElement(RefAsProp, { ref: spanRef } as {
        ref?: Ref<HTMLSpanElement>;
      })}
      <meta name="rcu-probe" content="probe" />
    </section>
  );
}
