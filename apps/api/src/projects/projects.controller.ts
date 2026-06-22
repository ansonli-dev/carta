import { Body, Controller, Get, Inject, Param, Post } from "@nestjs/common";
import { ProjectsService } from "./projects.service.js";

type CreateProjectBody = {
  name: string;
  code: string;
  ownerTeam: string;
  sourceMode: string;
};

type SaveRevisionBody = {
  sourceMode: string;
  rawContent: string;
};

@Controller("/api/projects")
export class ProjectsController {
  constructor(@Inject(ProjectsService) private readonly projects: ProjectsService) {}

  @Get()
  listProjects() {
    return this.projects.listProjects();
  }

  @Post()
  createProject(@Body() body: CreateProjectBody) {
    return this.projects.createProject(body);
  }

  @Post(":projectId/revisions")
  saveRevision(@Param("projectId") projectId: string, @Body() body: SaveRevisionBody) {
    return this.projects.saveRevision(projectId, body);
  }

  @Get(":projectId/endpoints")
  listEndpoints(@Param("projectId") projectId: string) {
    return this.projects.listEndpoints(projectId);
  }

  @Get(":projectId/docs/openapi.yaml")
  getLatestOpenApiSource(@Param("projectId") projectId: string) {
    return this.projects.getLatestOpenApiSource(projectId);
  }
}
