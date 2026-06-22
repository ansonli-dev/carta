import { useMemo, useState } from "react";
import { StoplightDocsPanel } from "./pages/StoplightDocsPanel";

const DEFAULT_API_URL = "https://raw.githubusercontent.com/stoplightio/elements/main/demo/src/reference/todo.v1.yaml";

const EXAMPLE_SPECS = [
  {
    text: "Todo API (default example)",
    value: "https://raw.githubusercontent.com/stoplightio/elements/main/demo/src/reference/todo.v1.yaml",
  },
  {
    text: "Zoom",
    value: "https://raw.githubusercontent.com/stoplightio/Public-APIs/master/reference/zoom/openapi.yaml",
  },
  {
    text: "Digital Ocean",
    value: "https://raw.githubusercontent.com/digitalocean/openapi/main/specification/DigitalOcean-public.v2.yaml",
  },
  {
    text: "GitHub",
    value: "https://raw.githubusercontent.com/github/rest-api-description/main/descriptions/ghes-3.0/ghes-3.0.json",
  },
  {
    text: "Museum API",
    value: "https://raw.githubusercontent.com/Redocly/museum-openapi-example/main/openapi.yaml",
  },
];

type ElementsLayout = "sidebar" | "stacked";

export function App() {
  const initialSpec = useMemo(() => new URLSearchParams(window.location.search).get("spec") || DEFAULT_API_URL, []);
  const initialLayout = useMemo(() => new URLSearchParams(window.location.search).get("layout"), []);
  const [apiDescriptionUrl, setApiDescriptionUrl] = useState(initialSpec);
  const [draftUrl, setDraftUrl] = useState(initialSpec === DEFAULT_API_URL ? "" : initialSpec);
  const [layout] = useState<ElementsLayout>(initialLayout === "stacked" ? "stacked" : "sidebar");

  function applySpec(nextValue = draftUrl) {
    const value = nextValue.trim() || DEFAULT_API_URL;
    const params = new URLSearchParams();

    if (value !== DEFAULT_API_URL) {
      params.set("spec", value);
    }
    if (layout === "stacked") {
      params.set("layout", "stacked");
    }

    window.history.pushState(undefined, "", params.size > 0 ? `?${params.toString()}` : "/");
    setApiDescriptionUrl(value);
    setDraftUrl(value === DEFAULT_API_URL ? "" : value);
  }

  return (
    <div className="demo-shell">
      <header className="demo-navbar">
        <div className="demo-navbar-third demo-title">
          <span>Stoplight Elements Demo</span>
        </div>

        <div className="demo-navbar-third demo-spec-controls">
          <input
            aria-label="URL to an OpenAPI document"
            value={draftUrl}
            placeholder="URL to an OpenAPI document..."
            onChange={(event) => setDraftUrl(event.currentTarget.value)}
            onBlur={() => {
              if (!draftUrl.trim() && apiDescriptionUrl !== DEFAULT_API_URL) {
                applySpec(DEFAULT_API_URL);
              }
            }}
            onKeyUp={(event) => {
              if (event.key === "Enter") {
                applySpec();
              }
            }}
          />
          <button type="button" onClick={() => applySpec()}>
            Try It!
          </button>
          <span className="demo-or">or</span>
          <details className="example-picker">
            <summary aria-label="Pick an Example">Pick an Example</summary>
            <div className="example-menu">
              {EXAMPLE_SPECS.map((spec) => (
                <button
                  key={spec.value}
                  type="button"
                  className={spec.value === apiDescriptionUrl ? "selected" : undefined}
                  onClick={(event) => {
                    applySpec(spec.value);
                    event.currentTarget.closest("details")?.removeAttribute("open");
                  }}
                >
                  {spec.text}
                </button>
              ))}
            </div>
          </details>
        </div>

        <div className="demo-navbar-third demo-link">
          <a href="https://stoplight.io" target="_blank" rel="noreferrer">
            Stoplight
          </a>
        </div>
      </header>

      <main className="demo-docs">
        <StoplightDocsPanel apiDescriptionUrl={apiDescriptionUrl} layout={layout} />
      </main>
    </div>
  );
}
