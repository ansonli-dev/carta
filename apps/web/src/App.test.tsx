import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, test, vi } from "vitest";
import { App } from "./App";

describe("Carta project flow", () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    window.history.pushState({}, "", "/");
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
    expect(window.location.pathname).toBe("/projects/prj_1/apis");
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
      )
      .mockResolvedValueOnce(
        new Response(
          "openapi: 3.0.3\ninfo:\n  title: Orders API\n  version: 1.0.0\npaths:\n  /todos:\n    get:\n      summary: List Todos\n      operationId: listTodos\n      responses:\n        '200':\n          description: OK\n  /users:\n    post:\n      summary: Create User\n      operationId: createUser\n      responses:\n        '201':\n          description: Created\ncomponents:\n  securitySchemes:\n    ApiKeyAuth:\n      type: apiKey\n      in: header\n      name: X-API-Key\n",
          {
            status: 200,
            headers: { "Content-Type": "text/yaml" },
          },
        ),
      );

    render(<App />);

    await screen.findByRole("heading", { name: "Projects" });
    await userEvent.type(screen.getByLabelText("Project name"), "Orders API");
    await userEvent.type(screen.getByLabelText("Project code"), "orders");
    await userEvent.click(screen.getByRole("button", { name: "Create and manage API" }));

    await waitFor(() => expect(screen.getByText("Orders API")).toBeInTheDocument());
    expect(window.location.pathname).toBe("/projects/prj_2/apis");
    await userEvent.click(screen.getByRole("button", { name: "OpenAPI source" }));
    const source = screen.getByLabelText<HTMLTextAreaElement>("OpenAPI source").value;
    expect(source).toContain("title: Orders API");
    expect(source).toContain("summary: List Todos");
    expect(source).toContain("summary: Create User");
    expect(source).toContain("securitySchemes:");
    expect(source).toContain("components:");
  });

  test("opens API management from a project route", async () => {
    window.history.pushState({}, "", "/projects/prj_1/apis");
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

    expect(await screen.findByText("Payments API")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Projects" }));

    expect(window.location.pathname).toBe("/projects");
  });
});

function json(body: unknown) {
  return new Response(JSON.stringify(body), { status: 200, headers: { "Content-Type": "application/json" } });
}
