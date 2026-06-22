declare module "@stoplight/elements" {
  import type { ComponentType } from "react";

  export type APIProps = {
    apiDescriptionUrl: string;
    router?: "history" | "hash" | "memory" | "static";
    layout?: "sidebar" | "stacked" | "responsive";
    hideTryItPanel?: boolean;
  };

  export const API: ComponentType<APIProps>;
}
