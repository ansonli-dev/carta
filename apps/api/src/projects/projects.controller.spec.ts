import { Test } from "@nestjs/testing";
import { FastifyAdapter, type NestFastifyApplication } from "@nestjs/platform-fastify";
import type { Kysely } from "kysely";
import request from "supertest";
import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { AppModule } from "../app.module.js";
import type { CartaDatabase } from "../database/database.js";
import { DATABASE } from "../database/database.module.js";

describe("Projects API", () => {
  let app: NestFastifyApplication;
  let db: Kysely<CartaDatabase>;
  let createdProjectId: string | null = null;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication<NestFastifyApplication>(new FastifyAdapter());
    await app.init();
    await app.getHttpAdapter().getInstance().ready();
    db = app.get(DATABASE);
  });

  afterEach(async () => {
    try {
      if (createdProjectId) {
        await db.deleteFrom("api_projects").where("id", "=", createdProjectId).execute();
      }
    } finally {
      createdProjectId = null;
      await app.close();
    }
  });

  test("creates a project and saves a valid OpenAPI revision", async () => {
    const suffix = Date.now().toString(36);
    const projectResponse = await request(app.getHttpServer())
      .post("/api/projects")
      .send({ name: "Todo API", code: `todo-${suffix}`, ownerTeam: "platform", sourceMode: "standalone" })
      .expect(201);
    createdProjectId = projectResponse.body.id;

    const revisionResponse = await request(app.getHttpServer())
      .post(`/api/projects/${projectResponse.body.id}/revisions`)
      .send({
        sourceMode: "standalone",
        rawContent: "openapi: 3.0.3\ninfo:\n  title: Todo API\n  version: 1.0.0\npaths: {}\n",
      })
      .expect(201);

    expect(revisionResponse.body.parseStatus).toBe("valid");
  });
});
