import { version } from "react";
import { BehaviorProbe } from "@/components/BehaviorProbe";

export default function Home() {
  return (
    <main className="mx-auto flex max-w-xl flex-col gap-6 p-10">
      <h1 className="text-2xl font-bold">react-canary-upgrade</h1>
      <p data-testid="react-version" className="text-gray-600">
        Running React {version}
      </p>
      <BehaviorProbe />
    </main>
  );
}
