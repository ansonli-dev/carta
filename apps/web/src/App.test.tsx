import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, test, vi } from "vitest";
import { App } from "./App";

describe("Carta project flow", () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  test("selects a project before opening API management", async () => {
    vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(
        json([
          {
            id: "prj_1",
            name: "Payments API",
            code: "payments",
            ownerTeam: "platform",
            currentVersion: { id: "ver_1", status: "draft" },
          },
        ]),
      )
      .mockResolvedValueOnce(
        new Response("openapi: 3.0.3\ninfo:\n  title: Payments API\n  version: 1.0.0\npaths: {}\n", {
          status: 200,
          headers: { "Content-Type": "text/yaml" },
        }),
      );

    render(<App />);

    expect(await screen.findByRole("heading", { name: "Projects" })).toBeInTheDocument();
    expect(screen.getByText("Select a project")).toBeInTheDocument();

    await userEvent.click(await screen.findByRole("button", { name: "Manage API" }));

    expect(await screen.findByText("Payments API")).toBeInTheDocument();
    expect(screen.queryByLabelText("OpenAPI source")).not.toBeInTheDocument();
    expect(screen.getByText("Documentation preview")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "OpenAPI source" }));

    expect(screen.getByLabelText("OpenAPI source")).toHaveValue(
      "openapi: 3.0.3\ninfo:\n  title: Payments API\n  version: 1.0.0\npaths: {}\n",
    );
  });

  test("creates a project and enters API management", async () => {
    vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(json([]))
      .mockResolvedValueOnce(
        json({
          id: "prj_2",
          name: "Orders API",
          code: "orders",
          ownerTeam: "platform",
          currentVersion: { id: "ver_2", status: "draft" },
        }),
      );

    render(<App />);

    await screen.findByRole("heading", { name: "Projects" });
    await userEvent.type(screen.getByLabelText("Project name"), "Orders API");
    await userEvent.type(screen.getByLabelText("Project code"), "orders");
    await userEvent.click(screen.getByRole("button", { name: "Create and manage API" }));

    await waitFor(() => expect(screen.getByText("Orders API")).toBeInTheDocument());
    await userEvent.click(screen.getByRole("button", { name: "OpenAPI source" }));
    const source = screen.getByLabelText<HTMLTextAreaElement>("OpenAPI source").value;
    expect(source).toContain("title: Orders API");
    expect(source).toContain("summary: List Todos");
    expect(source).toContain("summary: Create User");
    expect(source).toContain("securitySchemes:");
    expect(source).toContain("components:");
  });
});

function json(body: unknown) {
  return new Response(JSON.stringify(body), { status: 200, headers: { "Content-Type": "application/json" } });
}
