import { Controller, Get, Inject, Param, Post } from "@nestjs/common";
import { ProjectsService } from "../projects/projects.service.js";
import { MockService } from "./mock.service.js";

@Controller("/api")
export class MockController {
  constructor(
    @Inject(ProjectsService) private readonly projects: ProjectsService,
    @Inject(MockService) private readonly mock: MockService,
  ) {}

  @Post("projects/:projectId/mock/start")
  async start(@Param("projectId") projectId: string) {
    const input = await this.projects.getLatestMockInput(projectId);
    return this.mock.start(input);
  }

  @Get("mock")
  list() {
    return this.mock.list();
  }

  @Post("mock/:mockId/stop")
  stop(@Param("mockId") mockId: string) {
    return this.mock.stop(mockId);
  }
}
