import { Counter } from "@/components/Counter";
import { reactVersion } from "@/lib/react-version";

export default function Home() {
  return (
    <main className="mx-auto flex max-w-xl flex-col gap-6 p-10">
      <h1 className="text-2xl font-bold">react-canary-upgrade</h1>
      <p data-testid="server-react-version" className="text-gray-600">
        Server React {reactVersion}
      </p>
      <Counter />
    </main>
  );
}
