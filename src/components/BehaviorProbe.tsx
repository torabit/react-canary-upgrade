import { createElement, type Ref, useEffect, useRef, useState } from "react";

// React 19 は ref を通常の prop として関数コンポーネントに渡せる（forwardRef 不要）。
// React 18 では ref は特別扱いされ関数コンポーネントには渡らない（null + 警告）。
function RefAsProp(props: { ref?: Ref<HTMLSpanElement> }) {
  return <span ref={props.ref} />;
}

function label(v: boolean | null, yes: string, no: string): string {
  if (v === null) return "判定中…";
  return v ? yes : no;
}

/**
 * 実行中の React が 18 か 19 かを「挙動」で炙り出すプローブ。
 * 同一コードが React のバージョン差でだけ結果を変える。
 */
export function BehaviorProbe() {
  const ref = useRef<HTMLSpanElement>(null);
  const [refAsProp, setRefAsProp] = useState<boolean | null>(null);
  const [metaHoisted, setMetaHoisted] = useState<boolean | null>(null);

  useEffect(() => {
    // React 19: ref が関数コンポーネントに渡り current が埋まる / React 18: null のまま
    setRefAsProp(ref.current !== null);
    // React 19: コンポーネント内の <meta> が <head> へ巻き上げられる / React 18: body に残る
    setMetaHoisted(
      document.head.querySelector('meta[name="rcu-probe"]') !== null,
    );
  }, []);

  return (
    <section
      data-testid="behavior-probe"
      className="flex flex-col gap-1 rounded border border-gray-200 p-4 text-sm"
    >
      {/* ref-as-prop プローブ（ref を特別扱いさせるため createElement で渡す） */}
      {createElement(RefAsProp, { ref } as { ref?: Ref<HTMLSpanElement> })}
      {/* head 巻き上げプローブ */}
      <meta name="rcu-probe" content="probe" />
      <h2 className="font-semibold">React 挙動プローブ</h2>
      <p data-testid="probe-ref">
        ref を prop として渡す:{" "}
        {label(refAsProp, "✅ 動作（React 19）", "❌ null（React 18）")}
      </p>
      <p data-testid="probe-meta">
        {"<meta> の <head> 巻き上げ: "}
        {label(metaHoisted, "✅ あり（React 19）", "❌ なし（React 18）")}
      </p>
    </section>
  );
}
