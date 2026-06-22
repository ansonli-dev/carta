import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import type { MockProcessAdapter, StartMockInput } from "./mock.service.js";

export class PrismProcessAdapter implements MockProcessAdapter {
  async start(input: StartMockInput & { port: number }) {
    const dir = await mkdtemp(join(tmpdir(), "carta-prism-"));
    const specPath = join(dir, "openapi.yaml");
    await writeFile(specPath, input.rawContent, "utf8");

    const baseUrl = `http://127.0.0.1:${input.port}`;

    try {
      await this.assertPortAvailable(input.port);
      const child = spawn("npx", ["prism", "mock", specPath, "--host", "127.0.0.1", "--port", String(input.port)], {
        stdio: "pipe",
      });

      await this.waitForReady(child, dir, baseUrl);

      return {
        baseUrl,
        stop: async () => {
          await this.stopChild(child);
          await rm(dir, { force: true, recursive: true });
        },
      };
    } catch (error) {
      await rm(dir, { force: true, recursive: true });
      throw error;
    }
  }

  private assertPortAvailable(port: number) {
    return new Promise<void>((resolve, reject) => {
      const server = createServer();

      server.once("error", (error) => {
        reject(new Error(`Port ${port} is not available for Prism mock: ${error.message}`));
      });

      server.listen(port, "127.0.0.1", () => {
        server.close((error) => {
          if (error) {
            reject(error);
            return;
          }
          resolve();
        });
      });
    });
  }

  private waitForReady(child: ChildProcessWithoutNullStreams, dir: string, baseUrl: string) {
    return new Promise<void>((resolve, reject) => {
      let settled = false;
      let output = "";
      const timeout = setTimeout(() => {
        fail(new Error(`Prism mock did not start within 5 seconds${output ? `: ${output}` : ""}`));
      }, 5000);

      const cleanup = () => {
        clearTimeout(timeout);
        child.stdout.off("data", onOutput);
        child.stderr.off("data", onOutput);
        child.off("error", fail);
        child.off("exit", onExit);
      };

      const succeed = async () => {
        if (settled) {
          return;
        }
        await delay(250);
        if (settled) {
          return;
        }
        if (child.exitCode !== null || child.killed) {
          fail(new Error(`Prism mock exited during startup${output ? `: ${output}` : ""}`));
          return;
        }
        settled = true;
        cleanup();
        resolve();
      };

      const fail = (error: Error) => {
        if (settled) {
          return;
        }
        settled = true;
        cleanup();
        void this.stopChild(child).finally(() => {
          void rm(dir, { force: true, recursive: true });
          reject(error);
        });
      };

      const onOutput = (chunk: Buffer) => {
        output = `${output}${chunk.toString("utf8")}`.slice(-1000).trim();
      };

      const onExit = (code: number | null, signal: NodeJS.Signals | null) => {
        fail(
          new Error(
            `Prism mock exited before startup: code ${code ?? "null"}, signal ${signal ?? "null"}${
              output ? `: ${output}` : ""
            }`,
          ),
        );
      };

      const probe = async () => {
        while (!settled) {
          try {
            await fetch(baseUrl);
            await succeed();
            return;
          } catch {
            await delay(100);
          }
        }
      };

      child.stdout.on("data", onOutput);
      child.stderr.on("data", onOutput);
      child.once("error", fail);
      child.once("exit", onExit);
      void probe();
    });
  }

  private stopChild(child: ChildProcessWithoutNullStreams) {
    return new Promise<void>((resolve) => {
      if (child.exitCode !== null || child.killed) {
        resolve();
        return;
      }

      const timeout = setTimeout(() => {
        child.kill("SIGKILL");
        resolve();
      }, 1000);

      child.once("exit", () => {
        clearTimeout(timeout);
        resolve();
      });

      child.kill("SIGTERM");
    });
  }
}
