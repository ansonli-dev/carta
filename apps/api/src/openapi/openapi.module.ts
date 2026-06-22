import { Module } from "@nestjs/common";
import { OpenApiService } from "./openapi.service.js";

@Module({
  providers: [OpenApiService],
  exports: [OpenApiService],
})
export class OpenApiModule {}
