import { Module } from "@nestjs/common";
import { MockModule } from "./mock/mock.module.js";
import { ProjectsModule } from "./projects/projects.module.js";

@Module({
  imports: [ProjectsModule, MockModule],
})
export class AppModule {}
