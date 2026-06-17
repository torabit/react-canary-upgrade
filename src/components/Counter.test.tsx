import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { Counter } from "./Counter";

describe("Counter", () => {
  it("初期値 0 を表示する", () => {
    render(<Counter />);
    expect(screen.getByRole("status")).toHaveTextContent("count: 0");
  });

  it("ボタンクリックでインクリメントする", async () => {
    render(<Counter />);
    await userEvent.click(screen.getByRole("button", { name: "increment" }));
    expect(screen.getByRole("status")).toHaveTextContent("count: 1");
  });
});
