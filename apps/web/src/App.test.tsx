import "@testing-library/jest-dom/vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, test, vi } from "vitest";
import { App } from "./App";

Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn()
  }))
});

const getComputedStyle = window.getComputedStyle;
Object.defineProperty(window, "getComputedStyle", {
  writable: true,
  value: (element: Element) => getComputedStyle(element)
});

describe("Carta web console", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  test("creates a project and saves OpenAPI", async () => {
    vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(json([]))
      .mockResolvedValueOnce(
        json({
          id: "prj_1",
          name: "Todo API",
          code: "todo",
          ownerTeam: "platform",
          currentVersion: { id: "ver_1", status: "draft" }
        })
      )
      .mockResolvedValueOnce(json({ id: "rev_1", parseStatus: "valid" }))
      .mockResolvedValueOnce(json([{ path: "/todos", method: "GET", operation_id: "listTodos" }]));

    render(<App />);
    await userEvent.type(screen.getByLabelText("Project name"), "Todo API");
    await userEvent.type(screen.getByLabelText("Project code"), "todo");
    await userEvent.click(screen.getByRole("button", { name: "Create project" }));
    await userEvent.click(screen.getByRole("button", { name: "Save OpenAPI" }));

    await waitFor(() => expect(screen.getByText("Saved revision rev_1")).toBeInTheDocument());
  });
});

function json(body: unknown) {
  return new Response(JSON.stringify(body), { status: 200, headers: { "Content-Type": "application/json" } });
}
