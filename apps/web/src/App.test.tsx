import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test } from "vitest";
import { App } from "./App";

describe("Carta Elements demo", () => {
  test("renders the Stoplight-style demo controls", async () => {
    render(<App />);

    expect(screen.getByText("Stoplight Elements Demo")).toBeInTheDocument();
    expect(screen.getByLabelText("URL to an OpenAPI document")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Try It!" })).toBeInTheDocument();
    expect(screen.getByLabelText("Pick an Example")).toBeInTheDocument();
    expect(screen.getByText("Documentation preview")).toBeInTheDocument();

    await userEvent.click(screen.getByLabelText("Pick an Example"));
    await userEvent.click(screen.getByRole("button", { name: "Zoom" }));

    expect(screen.getByLabelText("URL to an OpenAPI document")).toHaveValue(
      "https://raw.githubusercontent.com/stoplightio/Public-APIs/master/reference/zoom/openapi.yaml",
    );
  });
});
