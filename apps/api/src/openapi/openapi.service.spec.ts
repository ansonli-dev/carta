import { describe, expect, test } from "vitest";
import { OpenApiService } from "./openapi.service.js";

const validSpec = `
openapi: 3.0.3
info:
  title: Todo API
  version: 1.0.0
paths:
  /todos:
    get:
      operationId: listTodos
      summary: List todos
      tags: [Todos]
      responses:
        "200":
          description: OK
components:
  schemas:
    Todo:
      type: object
`;

describe("OpenApiService", () => {
  test("parses a valid OpenAPI document and indexes endpoints", async () => {
    const service = new OpenApiService();
    const result = await service.parse(validSpec);

    expect(result.status).toBe("valid");
    expect(result.title).toBe("Todo API");
    expect(result.version).toBe("1.0.0");
    expect(result.endpoints).toEqual([
      {
        path: "/todos",
        method: "GET",
        operationId: "listTodos",
        summary: "List todos",
        tags: ["Todos"],
        deprecated: false,
      },
    ]);
  });

  test("returns normalized errors when required metadata is missing", async () => {
    const service = new OpenApiService();
    const result = await service.parse("openapi: 3.0.3\ninfo:\n  title: Missing Version\npaths: {}\n");

    expect(result.status).toBe("invalid");
    expect(result.errors[0].message).toContain("info.version");
  });

  test("indexes supported methods in stable order with normalized fields", async () => {
    const service = new OpenApiService();
    const result = await service.parse(`
openapi: 3.0.3
info:
  title: Multi API
  version: 1.0.0
paths:
  /z:
    post:
      deprecated: true
      tags: [Writes]
      responses:
        "201":
          description: Created
  /a:
    get:
      responses:
        "200":
          description: OK
`);

    expect(result.status).toBe("valid");
    expect(result.endpoints).toEqual([
      {
        path: "/a",
        method: "GET",
        operationId: null,
        summary: null,
        tags: [],
        deprecated: false,
      },
      {
        path: "/z",
        method: "POST",
        operationId: null,
        summary: null,
        tags: ["Writes"],
        deprecated: true,
      },
    ]);
  });

  test("rejects external refs without resolving from process cwd", async () => {
    const service = new OpenApiService();
    const result = await service.parse(`
openapi: 3.0.3
info:
  title: External Ref API
  version: 1.0.0
paths:
  /todos:
    get:
      responses:
        "200":
          description: OK
          content:
            application/json:
              schema:
                $ref: ./schemas.yaml#/Todo
`);

    expect(result.status).toBe("invalid");
    expect(result.errors[0].message).toContain("External $ref");
  });

  test("does not recurse forever on cyclic YAML anchors", async () => {
    const service = new OpenApiService();
    const result = await service.parse(`
openapi: 3.0.3
info:
  title: Cyclic API
  version: 1.0.0
paths: {}
components:
  schemas:
    Node: &node
      type: object
      properties:
        child: *node
`);

    expect(result.status).toBe("invalid");
    expect(result.errors[0].message.length).toBeGreaterThan(0);
  });
});
