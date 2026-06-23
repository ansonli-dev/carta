import defaultOpenApiTemplate from "../fixtures/default-openapi.yaml?raw";

const titlePlaceholder = "__API_TITLE__";

export function defaultOpenApiSource(title = "Todo API") {
  return defaultOpenApiTemplate.replace(titlePlaceholder, title);
}
