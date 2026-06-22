import { Module } from "@nestjs/common";
import { DatabaseModule } from "../database/database.module.js";
import { OpenApiModule } from "../openapi/openapi.module.js";
import { ProjectsController } from "./projects.controller.js";
import { ProjectsService } from "./projects.service.js";

@Module({
  imports: [DatabaseModule, OpenApiModule],
  controllers: [ProjectsController],
  providers: [ProjectsService],
  exports: [ProjectsService],
})
export class ProjectsModule {}
