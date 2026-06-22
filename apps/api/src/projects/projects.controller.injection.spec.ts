import { Test } from "@nestjs/testing";
import { FastifyAdapter, type NestFastifyApplication } from "@nestjs/platform-fastify";
import request from "supertest";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { ProjectsController } from "./projects.controller.js";
import { ProjectsService } from "./projects.service.js";

describe("ProjectsController injection", () => {
  let app: NestFastifyApplication;
  const projectsService = {
    listProjects: vi.fn(async () => [{ id: "prj_1", name: "Todo API" }]),
    createProject: vi.fn(),
    saveRevision: vi.fn(),
    listEndpoints: vi.fn(),
    getLatestOpenApiSource: vi.fn(),
  };

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [ProjectsController],
      providers: [{ provide: ProjectsService, useValue: projectsService }],
    }).compile();

    app = moduleRef.createNestApplication<NestFastifyApplication>(new FastifyAdapter());
    await app.init();
    await app.getHttpAdapter().getInstance().ready();
  });

  afterEach(async () => {
    vi.clearAllMocks();
    await app.close();
  });

  test("routes list requests through the injected service", async () => {
    const response = await request(app.getHttpServer()).get("/api/projects").expect(200);

    expect(projectsService.listProjects).toHaveBeenCalledTimes(1);
    expect(response.body).toEqual([{ id: "prj_1", name: "Todo API" }]);
  });
});
