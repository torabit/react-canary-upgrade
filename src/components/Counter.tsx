import { useState } from "react";

export function Counter() {
  const [count, setCount] = useState(0);
  return (
    <div className="flex items-center gap-3">
      <output className="tabular-nums">count: {count}</output>
      <button
        type="button"
        aria-label="increment"
        className="rounded bg-blue-600 px-3 py-1 text-white"
        onClick={() => setCount((c) => c + 1)}
      >
        +1
      </button>
    </div>
  );
}
