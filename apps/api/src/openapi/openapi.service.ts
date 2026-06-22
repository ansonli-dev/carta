import SwaggerParser from "@apidevtools/swagger-parser";
import { Injectable } from "@nestjs/common";
import YAML from "yaml";

const HTTP_METHODS = ["get", "put", "post", "delete", "patch", "options", "head", "trace"] as const;
type SwaggerDocument = Parameters<typeof SwaggerParser.validate>[0];

export type OpenApiEndpoint = {
  path: string;
  method: string;
  operationId: string | null;
  summary: string | null;
  tags: string[];
  deprecated: boolean;
};

export type ParseError = {
  message: string;
};

export type ParseResult =
  | {
      status: "valid";
      title: string;
      version: string;
      document: unknown;
      endpoints: OpenApiEndpoint[];
      errors: [];
    }
  | {
      status: "invalid";
      title?: never;
      version?: never;
      document: unknown | null;
      endpoints: [];
      errors: ParseError[];
    };

@Injectable()
export class OpenApiService {
  async parse(rawContent: string): Promise<ParseResult> {
    let document: unknown;

    try {
      document = YAML.parse(rawContent);
    } catch (error) {
      return this.invalid(null, error);
    }

    const metadataErrors = this.validateRequiredMetadata(document);
    if (metadataErrors.length > 0) {
      return {
        status: "invalid",
        document,
        endpoints: [],
        errors: metadataErrors,
      };
    }

    const externalRefErrors = this.findExternalRefs(document);
    if (externalRefErrors.length > 0) {
      return {
        status: "invalid",
        document,
        endpoints: [],
        errors: externalRefErrors,
      };
    }

    try {
      await SwaggerParser.validate(document as SwaggerDocument, {
        resolve: {
          external: false,
        },
      });
    } catch (error) {
      return this.invalid(document, error);
    }

    const openApiDocument = document as OpenApiDocument;

    return {
      status: "valid",
      title: openApiDocument.info.title,
      version: openApiDocument.info.version,
      document,
      endpoints: this.indexEndpoints(openApiDocument),
      errors: [],
    };
  }

  private indexEndpoints(document: OpenApiDocument): OpenApiEndpoint[] {
    return Object.entries(document.paths)
      .flatMap(([path, pathItem]) => {
        if (!isRecord(pathItem)) {
          return [];
        }

        return HTTP_METHODS.flatMap((method) => {
          const operation = pathItem[method];
          if (!isRecord(operation)) {
            return [];
          }

          return [
            {
              path,
              method: method.toUpperCase(),
              operationId: typeof operation.operationId === "string" ? operation.operationId : null,
              summary: typeof operation.summary === "string" ? operation.summary : null,
              tags: Array.isArray(operation.tags)
                ? operation.tags.filter((tag): tag is string => typeof tag === "string")
                : [],
              deprecated: operation.deprecated === true,
            },
          ];
        });
      })
      .sort((left, right) => `${left.path} ${left.method}`.localeCompare(`${right.path} ${right.method}`));
  }

  private validateRequiredMetadata(document: unknown): ParseError[] {
    const errors: ParseError[] = [];

    if (!isRecord(document)) {
      return [{ message: "OpenAPI document must be an object" }];
    }

    if (typeof document.openapi !== "string" || document.openapi.length === 0) {
      errors.push({ message: "Missing required field: openapi" });
    }

    if (!isRecord(document.info)) {
      errors.push({ message: "Missing required field: info" });
    } else {
      if (typeof document.info.title !== "string" || document.info.title.length === 0) {
        errors.push({ message: "Missing required field: info.title" });
      }

      if (typeof document.info.version !== "string" || document.info.version.length === 0) {
        errors.push({ message: "Missing required field: info.version" });
      }
    }

    if (!isRecord(document.paths)) {
      errors.push({ message: "Missing required field: paths" });
    }

    return errors;
  }

  private findExternalRefs(document: unknown): ParseError[] {
    const errors: ParseError[] = [];
    const seen = new WeakSet<object>();

    function visit(value: unknown): void {
      if (Array.isArray(value)) {
        if (seen.has(value)) return;
        seen.add(value);
        for (const item of value) visit(item);
        return;
      }

      if (!isRecord(value)) {
        return;
      }

      if (seen.has(value)) return;
      seen.add(value);

      const ref = value.$ref;
      if (typeof ref === "string" && !ref.startsWith("#/")) {
        errors.push({ message: `External $ref values are not supported: ${ref}` });
      }

      for (const child of Object.values(value)) {
        visit(child);
      }
    }

    visit(document);
    return errors;
  }

  private invalid(document: unknown | null, error: unknown): ParseResult {
    return {
      status: "invalid",
      document,
      endpoints: [],
      errors: [{ message: this.normalizeError(error) }],
    };
  }

  private normalizeError(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
  }
}

type OpenApiDocument = {
  openapi: string;
  info: {
    title: string;
    version: string;
  };
  paths: Record<string, unknown>;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
