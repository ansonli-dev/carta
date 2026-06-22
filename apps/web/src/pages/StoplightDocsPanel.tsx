import { useEffect, useRef, useState } from "react";
import { Alert, Empty, Spin } from "antd";

type ElementsApiElement = HTMLElement & {
  apiDescriptionDocument?: string;
};

type StoplightDocsPanelProps = {
  apiDescriptionUrl?: string;
  layout?: "sidebar" | "stacked";
  router?: "history" | "hash" | "memory";
  source?: string;
};

export function StoplightDocsPanel({ apiDescriptionUrl, layout = "sidebar", router = "history", source }: StoplightDocsPanelProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const elementRef = useRef<ElementsApiElement | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "failed">("loading");

  useEffect(() => {
    if (import.meta.env.MODE === "test") {
      setState("ready");
      return;
    }

    let cancelled = false;

    async function mountElement() {
      try {
        await import("@stoplight/elements/web-components.min.js");

        if (cancelled || !hostRef.current) {
          return;
        }

        hostRef.current.replaceChildren();

        const element = document.createElement("elements-api") as ElementsApiElement;
        element.setAttribute("router", router);
        element.setAttribute("layout", layout);
        if (apiDescriptionUrl) {
          element.setAttribute("apiDescriptionUrl", apiDescriptionUrl);
        }
        if (source) {
          element.apiDescriptionDocument = source;
        }
        elementRef.current = element;
        hostRef.current.appendChild(element);
        setState("ready");
      } catch {
        if (!cancelled) {
          setState("failed");
        }
      }
    }

    void mountElement();

    return () => {
      cancelled = true;
      elementRef.current = null;
      hostRef.current?.replaceChildren();
    };
  }, []);

  useEffect(() => {
    if (elementRef.current && source) {
      elementRef.current.apiDescriptionDocument = source;
    }
  }, [source]);

  useEffect(() => {
    if (elementRef.current && apiDescriptionUrl) {
      elementRef.current.setAttribute("apiDescriptionUrl", apiDescriptionUrl);
    }
  }, [apiDescriptionUrl]);

  if (import.meta.env.MODE === "test") {
    return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Documentation preview" />;
  }

  return (
    <div className="stoplight-docs-shell">
      {state === "loading" ? (
        <div className="docs-loading">
          <Spin size="small" />
        </div>
      ) : null}
      {state === "failed" ? (
        <Alert type="warning" showIcon title="Documentation preview could not be loaded" />
      ) : null}
      <div ref={hostRef} className={state === "ready" ? "stoplight-docs-host ready" : "stoplight-docs-host"} />
    </div>
  );
}
