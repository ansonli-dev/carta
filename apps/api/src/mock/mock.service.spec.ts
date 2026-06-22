import { describe, expect, test, vi } from "vitest";
import { MockService } from "./mock.service.js";

describe("MockService", () => {
  test("starts and stops an OpenAPI-derived mock instance through an adapter", async () => {
    const service = new MockService({
      start: async ({ port }) => ({
        baseUrl: `http://127.0.0.1:${port}`,
        stop: async () => undefined,
      }),
    });

    const instance = await service.start({
      projectId: "prj_1",
      apiVersionId: "ver_1",
      revisionId: "rev_1",
      rawContent: "openapi: 3.0.3\ninfo:\n  title: Todo\n  version: 1.0.0\npaths: {}\n",
    });

    expect(instance.status).toBe("running");
    expect(instance.baseUrl).toContain("http://127.0.0.1:");

    const stopped = await service.stop(instance.id);
    expect(stopped.status).toBe("stopped");
  });

  test("records stop failures and leaves the instance retryable", async () => {
    const stop = vi.fn(async () => {
      throw new Error("cleanup failed");
    });
    const service = new MockService({
      start: async ({ port }) => ({
        baseUrl: `http://127.0.0.1:${port}`,
        stop,
      }),
    });

    const instance = await service.start({
      projectId: "prj_1",
      apiVersionId: "ver_1",
      revisionId: "rev_1",
      rawContent: "openapi: 3.0.3\ninfo:\n  title: Todo\n  version: 1.0.0\npaths: {}\n",
    });

    await expect(service.stop(instance.id)).rejects.toThrow("cleanup failed");
    expect(service.list()[0]).toMatchObject({ id: instance.id, status: "failed", lastError: "cleanup failed" });
    expect(stop).toHaveBeenCalledTimes(1);
  });

  test("stops running mocks when the module is destroyed", async () => {
    const stop = vi.fn(async () => undefined);
    const service = new MockService({
      start: async ({ port }) => ({
        baseUrl: `http://127.0.0.1:${port}`,
        stop,
      }),
    });

    await service.start({
      projectId: "prj_1",
      apiVersionId: "ver_1",
      revisionId: "rev_1",
      rawContent: "openapi: 3.0.3\ninfo:\n  title: Todo\n  version: 1.0.0\npaths: {}\n",
    });

    await service.onModuleDestroy();

    expect(stop).toHaveBeenCalledTimes(1);
    expect(service.list()[0].status).toBe("stopped");
  });
});
