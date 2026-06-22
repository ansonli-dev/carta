import { Module } from "@nestjs/common";
import { ProjectsModule } from "../projects/projects.module.js";
import { MockController } from "./mock.controller.js";
import { MockService } from "./mock.service.js";
import { PrismProcessAdapter } from "./prism-process.js";

@Module({
  imports: [ProjectsModule],
  controllers: [MockController],
  providers: [
    {
      provide: MockService,
      useFactory: () => new MockService(new PrismProcessAdapter()),
    },
  ],
  exports: [MockService],
})
export class MockModule {}
