import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { FastifyAdapter, type NestFastifyApplication } from "@nestjs/platform-fastify";
import { readEnv } from "./config/env.js";
import { AppModule } from "./app.module.js";

async function bootstrap() {
  const env = readEnv();
  const app = await NestFactory.create<NestFastifyApplication>(AppModule, new FastifyAdapter());

  app.enableCors();
  app.enableShutdownHooks();
  app.getHttpAdapter().getInstance().get("/health", async () => ({ status: "ok" }));

  await app.listen({ port: env.port, host: "0.0.0.0" });
  console.log(`API listening on ${await app.getUrl()}`);
}

void bootstrap();
