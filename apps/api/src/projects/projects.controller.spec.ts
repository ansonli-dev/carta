import { Test } from "@nestjs/testing";
import { FastifyAdapter, type NestFastifyApplication } from "@nestjs/platform-fastify";
import type { Kysely } from "kysely";
import request from "supertest";
import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { AppModule } from "../app.module.js";
import type { CartaDatabase } from "../database/database.js";
import { DATABASE } from "../database/database.module.js";

const hasDatabaseUrl = Boolean(process.env.TEST_DATABASE_URL ?? process.env.DATABASE_URL);

describe("Projects API", () => {
  let app: NestFastifyApplication;
  let db: Kysely<CartaDatabase>;
  let createdProjectIds: string[] = [];

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication<NestFastifyApplication>(new FastifyAdapter());
    await app.init();
    await app.getHttpAdapter().getInstance().ready();
    db = app.get(DATABASE);
  });

  afterEach(async () => {
    try {
      if (createdProjectIds.length > 0) {
        await db.deleteFrom("api_projects").where("id", "in", createdProjectIds).execute();
      }
    } finally {
      createdProjectIds = [];
      await app.close();
    }
  });

  test.skipIf(!hasDatabaseUrl)("creates a project and saves a valid OpenAPI revision", async () => {
    const suffix = Date.now().toString(36);
    const projectResponse = await request(app.getHttpServer())
      .post("/api/projects")
      .send({ name: "Todo API", code: `todo-${suffix}`, ownerTeam: "platform", sourceMode: "standalone" })
      .expect(201);
    createdProjectIds.push(projectResponse.body.id);

    const revisionResponse = await request(app.getHttpServer())
      .post(`/api/projects/${projectResponse.body.id}/revisions`)
      .send({
        sourceMode: "standalone",
        rawContent: "openapi: 3.0.3\ninfo:\n  title: Todo API\n  version: 1.0.0\npaths: {}\n",
      })
      .expect(201);

    expect(revisionResponse.body.parseStatus).toBe("valid");

    const projects = await request(app.getHttpServer()).get("/api/projects").expect(200);
    expect(projects.body[0].tags).toEqual([]);
  });

  test.skipIf(!hasDatabaseUrl)("returns endpoint catalog and latest OpenAPI source for docs", async () => {
    const suffix = Date.now().toString(36);
    const projectResponse = await request(app.getHttpServer())
      .post("/api/projects")
      .send({ name: "Todo API", code: `todo-docs-${suffix}`, ownerTeam: "platform", sourceMode: "standalone" })
      .expect(201);
    createdProjectIds.push(projectResponse.body.id);

    await request(app.getHttpServer())
      .post(`/api/projects/${projectResponse.body.id}/revisions`)
      .send({
        sourceMode: "standalone",
        rawContent:
          "openapi: 3.0.3\ninfo:\n  title: Todo API\n  version: 1.0.0\npaths:\n  /todos:\n    get:\n      operationId: listTodos\n      responses:\n        '200':\n          description: OK\n",
      })
      .expect(201);

    const endpoints = await request(app.getHttpServer())
      .get(`/api/projects/${projectResponse.body.id}/endpoints`)
      .expect(200);
    expect(endpoints.body[0]).toMatchObject({
      path: "/todos",
      method: "GET",
      operation_id: "listTodos",
      tags: [],
    });

    const source = await request(app.getHttpServer())
      .get(`/api/projects/${projectResponse.body.id}/docs/openapi.yaml`)
      .expect(200);
    expect(source.text).toContain("title: Todo API");
  });
});
