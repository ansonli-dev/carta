import { Injectable, NotFoundException, type OnModuleDestroy } from "@nestjs/common";
import { nanoid } from "nanoid";

export type StartMockInput = {
  projectId: string;
  apiVersionId: string;
  revisionId: string;
  rawContent: string;
};

export type MockInstance = {
  id: string;
  projectId: string;
  apiVersionId: string;
  revisionId: string;
  status: "running" | "stopped" | "failed" | "needs_reload";
  baseUrl: string;
  port: number;
  startedAt: string;
  stoppedAt: string | null;
  lastError: string | null;
};

export type MockProcessAdapter = {
  start(input: StartMockInput & { port: number }): Promise<{
    baseUrl: string;
    stop: () => Promise<void>;
  }>;
};

@Injectable()
export class MockService implements OnModuleDestroy {
  private readonly instances = new Map<string, MockInstance>();
  private readonly stops = new Map<string, () => Promise<void>>();
  private nextPort = 5100;

  constructor(private readonly adapter: MockProcessAdapter) {}

  list() {
    return Array.from(this.instances.values());
  }

  async start(input: StartMockInput) {
    const port = this.nextPort++;
    const process = await this.adapter.start({ ...input, port });
    const instance: MockInstance = {
      id: `mock_${nanoid(12)}`,
      projectId: input.projectId,
      apiVersionId: input.apiVersionId,
      revisionId: input.revisionId,
      status: "running",
      baseUrl: process.baseUrl,
      port,
      startedAt: new Date().toISOString(),
      stoppedAt: null,
      lastError: null,
    };

    this.instances.set(instance.id, instance);
    this.stops.set(instance.id, process.stop);

    return instance;
  }

  async stop(id: string) {
    const instance = this.instances.get(id);
    if (!instance) {
      throw new NotFoundException("Mock instance not found");
    }

    const stop = this.stops.get(id);
    if (stop) {
      try {
        await stop();
        this.stops.delete(id);
      } catch (error) {
        const failed: MockInstance = {
          ...instance,
          status: "failed",
          lastError: this.errorMessage(error),
        };
        this.instances.set(id, failed);
        throw error;
      }
    }

    const stopped: MockInstance = {
      ...instance,
      status: "stopped",
      stoppedAt: new Date().toISOString(),
      lastError: null,
    };

    this.instances.set(id, stopped);
    return stopped;
  }

  async onModuleDestroy() {
    await Promise.allSettled(Array.from(this.stops.keys()).map((id) => this.stop(id)));
  }

  private errorMessage(error: unknown) {
    return error instanceof Error ? error.message : String(error);
  }
}
