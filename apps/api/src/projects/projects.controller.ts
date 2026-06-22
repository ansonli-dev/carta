import { Body, Controller, Get, Param, Post } from "@nestjs/common";
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
  constructor(private readonly projects: ProjectsService) {}

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
}
