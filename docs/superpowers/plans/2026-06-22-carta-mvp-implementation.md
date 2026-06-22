# Carta MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first usable Carta slice where a user can create an API project, upload or edit OpenAPI, browse indexed APIs, view generated docs, and run a Prism-derived mock service from the same OpenAPI source.

**Architecture:** Use a TypeScript monorepo with a focused core package, a Fastify API server, and a Vite React web console. The core package owns domain types, OpenAPI parsing, endpoint/schema indexing, persistence interfaces, and mock process abstractions; the API server exposes these capabilities; the web app consumes only HTTP APIs.

**Tech Stack:** Node.js, npm workspaces, TypeScript, Vitest, Fastify, SQLite via `better-sqlite3`, `@apidevtools/swagger-parser`, `yaml`, Vite, React, `@monaco-editor/react`, `swagger-ui-react`, and Prism CLI through `@stoplight/prism-cli`.

---

## Scope

This plan implements Iteration 0 through Iteration 3 from `docs/requirements/git-native-api-platform-product-design.md`:

- Project Registry.
- Platform-managed OpenAPI through upload and code edit.
- Source Revision.
- Parse validation.
- Catalog and API docs.
- Prism mock start/stop/health/logs.

This plan does not implement Git writeback, branch/MR workflow, API diff, Spectral governance, lifecycle approval workflow, Contract Test, or project-level RBAC. The data model keeps future fields for those capabilities where useful.

---

## File Structure

Create these files:

- `package.json`: root npm workspace scripts.
- `tsconfig.base.json`: shared TypeScript config.
- `.gitignore`: ignore dependencies, builds, local DB, mock temp files, and worktrees.
- `packages/core/package.json`: core package manifest.
- `packages/core/tsconfig.json`: core package TypeScript config.
- `packages/core/src/domain.ts`: source modes, project, revision, endpoint, schema, validation, and mock domain types.
- `packages/core/src/openapi.ts`: OpenAPI parse, validation, dereference, endpoint indexing, schema indexing, and normalized errors.
- `packages/core/src/storage.ts`: SQLite schema setup and repository implementation.
- `packages/core/src/mock.ts`: mock instance domain service and Prism process adapter.
- `packages/core/src/index.ts`: public exports.
- `packages/core/src/__tests__/openapi.test.ts`: parser and indexer tests.
- `packages/core/src/__tests__/storage.test.ts`: repository tests.
- `packages/core/src/__tests__/mock.test.ts`: mock manager tests.
- `apps/api/package.json`: API package manifest.
- `apps/api/tsconfig.json`: API TypeScript config.
- `apps/api/src/app.ts`: Fastify app factory and route registration.
- `apps/api/src/routes/projects.ts`: project, revision, catalog, docs-source, and mock routes.
- `apps/api/src/server.ts`: runtime entrypoint.
- `apps/api/src/__tests__/projects.test.ts`: HTTP API tests.
- `apps/web/package.json`: web package manifest.
- `apps/web/tsconfig.json`: web TypeScript config.
- `apps/web/index.html`: Vite entry HTML.
- `apps/web/src/main.tsx`: React mount.
- `apps/web/src/api.ts`: typed HTTP client.
- `apps/web/src/App.tsx`: web console shell, catalog, editor, docs, and mock controls.
- `apps/web/src/App.test.tsx`: web behavior tests.
- `apps/web/src/styles.css`: restrained internal-tool styling.
- `samples/todo-openapi.yaml`: sample OpenAPI document for local testing and demos.

---

## Task 1: Monorepo Scaffold and Baseline Tooling

**Files:**
- Create: `package.json`
- Create: `tsconfig.base.json`
- Create: `.gitignore`
- Create: `packages/core/package.json`
- Create: `packages/core/tsconfig.json`
- Create: `packages/core/src/index.ts`
- Create: `apps/api/package.json`
- Create: `apps/api/tsconfig.json`
- Create: `apps/api/src/server.ts`
- Create: `apps/web/package.json`
- Create: `apps/web/tsconfig.json`
- Create: `apps/web/index.html`
- Create: `apps/web/src/main.tsx`
- Create: `apps/web/src/App.tsx`
- Create: `apps/web/src/styles.css`

- [ ] **Step 1: Create root workspace files**

Create `package.json`:

```json
{
  "name": "carta",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "workspaces": [
    "packages/*",
    "apps/*"
  ],
  "scripts": {
    "build": "npm run build -ws",
    "test": "npm run test -ws",
    "typecheck": "npm run typecheck -ws",
    "dev:api": "npm run dev -w @carta/api",
    "dev:web": "npm run dev -w @carta/web"
  },
  "engines": {
    "node": ">=20"
  }
}
```

Create `tsconfig.base.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true,
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "declaration": true,
    "sourceMap": true
  }
}
```

Create `.gitignore`:

```gitignore
node_modules/
dist/
coverage/
.vite/
.worktrees/
worktrees/
data/
tmp/
*.db
*.db-shm
*.db-wal
.DS_Store
```

- [ ] **Step 2: Create package manifests**

Create `packages/core/package.json`:

```json
{
  "name": "@carta/core",
  "version": "0.1.0",
  "type": "module",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsc -p tsconfig.json",
    "test": "vitest run",
    "typecheck": "tsc -p tsconfig.json --noEmit"
  },
  "dependencies": {
    "@apidevtools/swagger-parser": "^10.1.0",
    "@stoplight/prism-cli": "^5.14.2",
    "better-sqlite3": "^11.8.1",
    "nanoid": "^5.1.0",
    "yaml": "^2.7.0",
    "zod": "^3.24.2"
  },
  "devDependencies": {
    "@types/better-sqlite3": "^7.6.12",
    "@types/node": "^22.13.1",
    "typescript": "^5.7.3",
    "vitest": "^3.0.5"
  }
}
```

Create `packages/core/tsconfig.json`:

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": "src"
  },
  "include": ["src"]
}
```

Create `apps/api/package.json`:

```json
{
  "name": "@carta/api",
  "version": "0.1.0",
  "type": "module",
  "main": "dist/server.js",
  "scripts": {
    "build": "tsc -p tsconfig.json",
    "dev": "tsx watch src/server.ts",
    "start": "node dist/server.js",
    "test": "vitest run",
    "typecheck": "tsc -p tsconfig.json --noEmit"
  },
  "dependencies": {
    "@carta/core": "0.1.0",
    "@fastify/cors": "^11.0.0",
    "fastify": "^5.2.1",
    "tsx": "^4.19.2",
    "zod": "^3.24.2"
  },
  "devDependencies": {
    "@types/node": "^22.13.1",
    "typescript": "^5.7.3",
    "vitest": "^3.0.5"
  }
}
```

Create `apps/api/tsconfig.json`:

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": "src",
    "paths": {
      "@carta/core": ["../../packages/core/src/index.ts"]
    }
  },
  "include": ["src"]
}
```

Create `apps/web/package.json`:

```json
{
  "name": "@carta/web",
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "build": "vite build",
    "dev": "vite --host 127.0.0.1",
    "test": "vitest run --environment jsdom",
    "typecheck": "tsc -p tsconfig.json --noEmit"
  },
  "dependencies": {
    "@monaco-editor/react": "^4.7.0",
    "@vitejs/plugin-react": "^4.3.4",
    "vite": "^6.1.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "swagger-ui-react": "^5.18.3"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "^6.6.3",
    "@testing-library/react": "^16.2.0",
    "@testing-library/user-event": "^14.6.1",
    "@types/react": "^19.0.8",
    "@types/react-dom": "^19.0.3",
    "@types/swagger-ui-react": "^4.18.3",
    "jsdom": "^26.0.0",
    "typescript": "^5.7.3",
    "vitest": "^3.0.5"
  }
}
```

Create `apps/web/tsconfig.json`:

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "jsx": "react-jsx",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "outDir": "dist",
    "types": ["vitest/globals"]
  },
  "include": ["src", "index.html"]
}
```

- [ ] **Step 3: Create minimal app entry files**

Create `packages/core/src/index.ts`:

```ts
export const CARTA_CORE_READY = true;
```

Create `apps/api/src/server.ts`:

```ts
import Fastify from "fastify";

const server = Fastify({ logger: true });

server.get("/health", async () => ({ status: "ok" }));

const port = Number(process.env.PORT ?? 4000);
await server.listen({ port, host: "0.0.0.0" });
```

Create `apps/web/index.html`:

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Carta</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

Create `apps/web/src/main.tsx`:

```tsx
import React from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import "./styles.css";

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

Create `apps/web/src/App.tsx`:

```tsx
export function App() {
  return (
    <main className="app-shell">
      <h1>Carta</h1>
      <p>Git-native OpenAPI contract platform</p>
    </main>
  );
}
```

Create `apps/web/src/styles.css`:

```css
:root {
  color: #18202f;
  background: #f6f7f9;
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}

body {
  margin: 0;
}

.app-shell {
  max-width: 1120px;
  margin: 0 auto;
  padding: 32px;
}
```

- [ ] **Step 4: Install dependencies**

Run:

```bash
npm install
```

Expected: npm creates `package-lock.json` and installs all workspaces without dependency resolution errors.

- [ ] **Step 5: Verify baseline**

Run:

```bash
npm run typecheck
npm run build
```

Expected: both commands pass.

- [ ] **Step 6: Commit**

```bash
git add .gitignore package.json package-lock.json tsconfig.base.json packages/core apps/api apps/web
git commit -m "chore: scaffold carta monorepo"
```

---

## Task 2: Core Domain Types and SQLite Repository

**Files:**
- Create: `packages/core/src/domain.ts`
- Create: `packages/core/src/storage.ts`
- Create: `packages/core/src/__tests__/storage.test.ts`
- Modify: `packages/core/src/index.ts`

- [ ] **Step 1: Write failing repository tests**

Create `packages/core/src/__tests__/storage.test.ts`:

```ts
import { describe, expect, test } from "vitest";
import { createDatabase, SqliteProjectRepository } from "../storage";

describe("SqliteProjectRepository", () => {
  test("creates a standalone project with an initial draft version", () => {
    const db = createDatabase(":memory:");
    const repo = new SqliteProjectRepository(db);

    const project = repo.createProject({
      name: "Todo API",
      code: "todo",
      ownerTeam: "platform",
      domain: "productivity",
      description: "Task management API",
      tags: ["internal"],
      sourceMode: "standalone"
    });

    expect(project.id).toMatch(/^prj_/);
    expect(project.currentVersion.status).toBe("draft");
    expect(project.sourceMode).toBe("standalone");
  });

  test("stores a valid source revision and updates endpoint indexes", () => {
    const db = createDatabase(":memory:");
    const repo = new SqliteProjectRepository(db);
    const project = repo.createProject({
      name: "Todo API",
      code: "todo",
      ownerTeam: "platform",
      sourceMode: "uploaded"
    });

    const revision = repo.saveRevision({
      apiVersionId: project.currentVersion.id,
      sourceMode: "uploaded",
      rawContent: "openapi: 3.0.3\ninfo:\n  title: Todo API\n  version: 1.0.0\npaths: {}\n",
      contentHash: "hash-1",
      parseStatus: "valid",
      endpoints: []
    });

    expect(revision.id).toMatch(/^rev_/);
    expect(repo.listProjects()).toHaveLength(1);
    expect(repo.getRevision(revision.id)?.contentHash).toBe("hash-1");
  });
});
```

- [ ] **Step 2: Run tests to verify RED**

Run:

```bash
npm run test -w @carta/core -- storage.test.ts
```

Expected: FAIL because `../storage` does not exist.

- [ ] **Step 3: Implement domain types**

Create `packages/core/src/domain.ts`:

```ts
export type SourceMode = "standalone" | "uploaded" | "git_connected" | "git_imported";
export type ApiLifecycleStatus = "draft" | "review" | "approved" | "released" | "deprecated" | "archived";
export type ParseStatus = "valid" | "invalid";
export type MockStatus = "running" | "stopped" | "failed" | "needs_reload";

export interface ApiProject {
  id: string;
  name: string;
  code: string;
  ownerTeam: string;
  domain: string | null;
  description: string | null;
  tags: string[];
  sourceMode: SourceMode;
  createdAt: string;
  updatedAt: string;
  currentVersion: ApiVersion;
}

export interface ApiVersion {
  id: string;
  projectId: string;
  version: string;
  status: ApiLifecycleStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ApiEndpoint {
  id: string;
  apiVersionId: string;
  path: string;
  method: string;
  operationId: string | null;
  summary: string | null;
  tags: string[];
  deprecated: boolean;
}

export interface SourceRevision {
  id: string;
  apiVersionId: string;
  sourceMode: SourceMode;
  rawContent: string;
  contentHash: string;
  parseStatus: ParseStatus;
  createdAt: string;
}

export interface CreateProjectInput {
  name: string;
  code: string;
  ownerTeam: string;
  domain?: string;
  description?: string;
  tags?: string[];
  sourceMode: SourceMode;
}

export interface SaveRevisionInput {
  apiVersionId: string;
  sourceMode: SourceMode;
  rawContent: string;
  contentHash: string;
  parseStatus: ParseStatus;
  endpoints: Omit<ApiEndpoint, "id" | "apiVersionId">[];
}
```

- [ ] **Step 4: Implement SQLite repository**

Create `packages/core/src/storage.ts`:

```ts
import Database from "better-sqlite3";
import { createHash } from "node:crypto";
import { nanoid } from "nanoid";
import type { ApiEndpoint, ApiProject, ApiVersion, CreateProjectInput, SaveRevisionInput, SourceRevision } from "./domain";

export type CartaDatabase = Database.Database;

export function createDatabase(filename: string): CartaDatabase {
  const db = new Database(filename);
  db.pragma("foreign_keys = ON");
  db.exec(`
    CREATE TABLE IF NOT EXISTS api_projects (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      code TEXT NOT NULL UNIQUE,
      owner_team TEXT NOT NULL,
      domain TEXT,
      description TEXT,
      tags TEXT NOT NULL,
      source_mode TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS api_versions (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL REFERENCES api_projects(id) ON DELETE CASCADE,
      version TEXT NOT NULL,
      status TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS source_revisions (
      id TEXT PRIMARY KEY,
      api_version_id TEXT NOT NULL REFERENCES api_versions(id) ON DELETE CASCADE,
      source_mode TEXT NOT NULL,
      raw_content TEXT NOT NULL,
      content_hash TEXT NOT NULL,
      parse_status TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS api_endpoints (
      id TEXT PRIMARY KEY,
      api_version_id TEXT NOT NULL REFERENCES api_versions(id) ON DELETE CASCADE,
      path TEXT NOT NULL,
      method TEXT NOT NULL,
      operation_id TEXT,
      summary TEXT,
      tags TEXT NOT NULL,
      deprecated INTEGER NOT NULL
    );
  `);
  return db;
}

export function hashContent(rawContent: string): string {
  return createHash("sha256").update(rawContent).digest("hex");
}

export class SqliteProjectRepository {
  constructor(private readonly db: CartaDatabase) {}

  createProject(input: CreateProjectInput): ApiProject {
    const now = new Date().toISOString();
    const projectId = `prj_${nanoid(12)}`;
    const versionId = `ver_${nanoid(12)}`;
    const version: ApiVersion = {
      id: versionId,
      projectId,
      version: "0.1.0",
      status: "draft",
      createdAt: now,
      updatedAt: now
    };

    const tx = this.db.transaction(() => {
      this.db.prepare(`
        INSERT INTO api_projects (id, name, code, owner_team, domain, description, tags, source_mode, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        projectId,
        input.name,
        input.code,
        input.ownerTeam,
        input.domain ?? null,
        input.description ?? null,
        JSON.stringify(input.tags ?? []),
        input.sourceMode,
        now,
        now
      );
      this.db.prepare(`
        INSERT INTO api_versions (id, project_id, version, status, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(version.id, version.projectId, version.version, version.status, version.createdAt, version.updatedAt);
    });
    tx();

    return {
      id: projectId,
      name: input.name,
      code: input.code,
      ownerTeam: input.ownerTeam,
      domain: input.domain ?? null,
      description: input.description ?? null,
      tags: input.tags ?? [],
      sourceMode: input.sourceMode,
      createdAt: now,
      updatedAt: now,
      currentVersion: version
    };
  }

  listProjects(): ApiProject[] {
    const rows = this.db.prepare("SELECT * FROM api_projects ORDER BY updated_at DESC").all() as Record<string, unknown>[];
    return rows.map((row) => this.mapProject(row));
  }

  getProject(id: string): ApiProject | null {
    const row = this.db.prepare("SELECT * FROM api_projects WHERE id = ?").get(id) as Record<string, unknown> | undefined;
    return row ? this.mapProject(row) : null;
  }

  saveRevision(input: SaveRevisionInput): SourceRevision {
    const now = new Date().toISOString();
    const revision: SourceRevision = {
      id: `rev_${nanoid(12)}`,
      apiVersionId: input.apiVersionId,
      sourceMode: input.sourceMode,
      rawContent: input.rawContent,
      contentHash: input.contentHash,
      parseStatus: input.parseStatus,
      createdAt: now
    };
    const tx = this.db.transaction(() => {
      this.db.prepare(`
        INSERT INTO source_revisions (id, api_version_id, source_mode, raw_content, content_hash, parse_status, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(revision.id, revision.apiVersionId, revision.sourceMode, revision.rawContent, revision.contentHash, revision.parseStatus, revision.createdAt);
      this.db.prepare("DELETE FROM api_endpoints WHERE api_version_id = ?").run(input.apiVersionId);
      for (const endpoint of input.endpoints) {
        this.db.prepare(`
          INSERT INTO api_endpoints (id, api_version_id, path, method, operation_id, summary, tags, deprecated)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          `end_${nanoid(12)}`,
          input.apiVersionId,
          endpoint.path,
          endpoint.method,
          endpoint.operationId,
          endpoint.summary,
          JSON.stringify(endpoint.tags),
          endpoint.deprecated ? 1 : 0
        );
      }
    });
    tx();
    return revision;
  }

  getRevision(id: string): SourceRevision | null {
    const row = this.db.prepare("SELECT * FROM source_revisions WHERE id = ?").get(id) as Record<string, unknown> | undefined;
    return row ? this.mapRevision(row) : null;
  }

  getLatestRevision(apiVersionId: string): SourceRevision | null {
    const row = this.db.prepare(`
      SELECT * FROM source_revisions WHERE api_version_id = ? ORDER BY created_at DESC LIMIT 1
    `).get(apiVersionId) as Record<string, unknown> | undefined;
    return row ? this.mapRevision(row) : null;
  }

  listEndpoints(apiVersionId: string): ApiEndpoint[] {
    const rows = this.db.prepare("SELECT * FROM api_endpoints WHERE api_version_id = ? ORDER BY path, method").all(apiVersionId) as Record<string, unknown>[];
    return rows.map((row) => ({
      id: String(row.id),
      apiVersionId: String(row.api_version_id),
      path: String(row.path),
      method: String(row.method),
      operationId: row.operation_id ? String(row.operation_id) : null,
      summary: row.summary ? String(row.summary) : null,
      tags: JSON.parse(String(row.tags)),
      deprecated: Boolean(row.deprecated)
    }));
  }

  private mapProject(row: Record<string, unknown>): ApiProject {
    const versionRow = this.db.prepare(`
      SELECT * FROM api_versions WHERE project_id = ? ORDER BY created_at DESC LIMIT 1
    `).get(String(row.id)) as Record<string, unknown>;
    return {
      id: String(row.id),
      name: String(row.name),
      code: String(row.code),
      ownerTeam: String(row.owner_team),
      domain: row.domain ? String(row.domain) : null,
      description: row.description ? String(row.description) : null,
      tags: JSON.parse(String(row.tags)),
      sourceMode: row.source_mode as ApiProject["sourceMode"],
      createdAt: String(row.created_at),
      updatedAt: String(row.updated_at),
      currentVersion: {
        id: String(versionRow.id),
        projectId: String(versionRow.project_id),
        version: String(versionRow.version),
        status: versionRow.status as ApiVersion["status"],
        createdAt: String(versionRow.created_at),
        updatedAt: String(versionRow.updated_at)
      }
    };
  }

  private mapRevision(row: Record<string, unknown>): SourceRevision {
    return {
      id: String(row.id),
      apiVersionId: String(row.api_version_id),
      sourceMode: row.source_mode as SourceRevision["sourceMode"],
      rawContent: String(row.raw_content),
      contentHash: String(row.content_hash),
      parseStatus: row.parse_status as SourceRevision["parseStatus"],
      createdAt: String(row.created_at)
    };
  }
}
```

- [ ] **Step 5: Export core modules**

Modify `packages/core/src/index.ts`:

```ts
export * from "./domain";
export * from "./storage";
```

- [ ] **Step 6: Run tests to verify GREEN**

Run:

```bash
npm run test -w @carta/core -- storage.test.ts
```

Expected: PASS.

- [ ] **Step 7: Run package checks**

Run:

```bash
npm run typecheck -w @carta/core
npm run build -w @carta/core
```

Expected: both pass.

- [ ] **Step 8: Commit**

```bash
git add packages/core
git commit -m "feat: add project registry storage"
```

---

## Task 3: OpenAPI Parse, Validation, and Indexing

**Files:**
- Create: `packages/core/src/openapi.ts`
- Create: `packages/core/src/__tests__/openapi.test.ts`
- Modify: `packages/core/src/index.ts`

- [ ] **Step 1: Write failing OpenAPI tests**

Create `packages/core/src/__tests__/openapi.test.ts`:

```ts
import { describe, expect, test } from "vitest";
import { parseOpenApiDocument } from "../openapi";

const validSpec = `
openapi: 3.0.3
info:
  title: Todo API
  version: 1.0.0
paths:
  /todos:
    get:
      operationId: listTodos
      summary: List todos
      tags: [Todos]
      responses:
        "200":
          description: OK
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: "#/components/schemas/Todo"
components:
  schemas:
    Todo:
      type: object
      required: [id, title]
      properties:
        id:
          type: string
        title:
          type: string
`;

describe("parseOpenApiDocument", () => {
  test("indexes operations and schemas from a valid OpenAPI document", async () => {
    const result = await parseOpenApiDocument(validSpec);

    expect(result.status).toBe("valid");
    expect(result.title).toBe("Todo API");
    expect(result.version).toBe("1.0.0");
    expect(result.endpoints).toEqual([
      {
        path: "/todos",
        method: "GET",
        operationId: "listTodos",
        summary: "List todos",
        tags: ["Todos"],
        deprecated: false
      }
    ]);
    expect(result.schemas.map((schema) => schema.name)).toEqual(["Todo"]);
  });

  test("returns normalized parse errors for invalid YAML", async () => {
    const result = await parseOpenApiDocument("openapi: 3.0.3\ninfo:\n  title: [");

    expect(result.status).toBe("invalid");
    expect(result.errors[0].message).toContain("Flow sequence");
  });

  test("returns schema errors when info.version is missing", async () => {
    const result = await parseOpenApiDocument("openapi: 3.0.3\ninfo:\n  title: Todo\npaths: {}\n");

    expect(result.status).toBe("invalid");
    expect(result.errors.some((error) => error.message.includes("info.version"))).toBe(true);
  });
});
```

- [ ] **Step 2: Run tests to verify RED**

Run:

```bash
npm run test -w @carta/core -- openapi.test.ts
```

Expected: FAIL because `../openapi` does not exist.

- [ ] **Step 3: Implement parser and indexer**

Create `packages/core/src/openapi.ts`:

```ts
import SwaggerParser from "@apidevtools/swagger-parser";
import YAML from "yaml";

export interface IndexedSchema {
  name: string;
  type: string | null;
  required: string[];
}

export interface ParsedEndpoint {
  path: string;
  method: string;
  operationId: string | null;
  summary: string | null;
  tags: string[];
  deprecated: boolean;
}

export interface OpenApiParseError {
  message: string;
  path?: string;
}

export type OpenApiParseResult =
  | {
      status: "valid";
      title: string;
      version: string;
      document: unknown;
      endpoints: ParsedEndpoint[];
      schemas: IndexedSchema[];
      errors: [];
    }
  | {
      status: "invalid";
      document: unknown | null;
      endpoints: [];
      schemas: [];
      errors: OpenApiParseError[];
    };

const HTTP_METHODS = new Set(["get", "put", "post", "delete", "patch", "options", "head", "trace"]);

export async function parseOpenApiDocument(rawContent: string): Promise<OpenApiParseResult> {
  let document: unknown;
  try {
    document = YAML.parse(rawContent);
  } catch (error) {
    return invalid(null, normalizeError(error));
  }

  const basicErrors = validateRequiredFields(document);
  if (basicErrors.length > 0) {
    return {
      status: "invalid",
      document,
      endpoints: [],
      schemas: [],
      errors: basicErrors
    };
  }

  try {
    await SwaggerParser.validate(document as object);
  } catch (error) {
    return invalid(document, normalizeError(error));
  }

  const root = document as Record<string, any>;
  return {
    status: "valid",
    title: root.info.title,
    version: root.info.version,
    document,
    endpoints: indexEndpoints(root),
    schemas: indexSchemas(root),
    errors: []
  };
}

function validateRequiredFields(document: unknown): OpenApiParseError[] {
  if (!document || typeof document !== "object") {
    return [{ message: "OpenAPI document must be an object" }];
  }
  const root = document as Record<string, any>;
  const errors: OpenApiParseError[] = [];
  if (!root.openapi || typeof root.openapi !== "string") {
    errors.push({ message: "openapi version is required", path: "openapi" });
  }
  if (!root.info?.title) {
    errors.push({ message: "info.title is required", path: "info.title" });
  }
  if (!root.info?.version) {
    errors.push({ message: "info.version is required", path: "info.version" });
  }
  if (!root.paths || typeof root.paths !== "object") {
    errors.push({ message: "paths object is required", path: "paths" });
  }
  return errors;
}

function indexEndpoints(root: Record<string, any>): ParsedEndpoint[] {
  const paths = root.paths ?? {};
  const endpoints: ParsedEndpoint[] = [];
  for (const [path, pathItem] of Object.entries(paths)) {
    if (!pathItem || typeof pathItem !== "object") continue;
    for (const [method, operation] of Object.entries(pathItem as Record<string, any>)) {
      if (!HTTP_METHODS.has(method) || !operation || typeof operation !== "object") continue;
      endpoints.push({
        path,
        method: method.toUpperCase(),
        operationId: operation.operationId ?? null,
        summary: operation.summary ?? null,
        tags: Array.isArray(operation.tags) ? operation.tags : [],
        deprecated: Boolean(operation.deprecated)
      });
    }
  }
  return endpoints.sort((left, right) => `${left.path} ${left.method}`.localeCompare(`${right.path} ${right.method}`));
}

function indexSchemas(root: Record<string, any>): IndexedSchema[] {
  const schemas = root.components?.schemas ?? {};
  return Object.entries(schemas)
    .map(([name, schema]) => ({
      name,
      type: typeof schema === "object" && schema ? ((schema as Record<string, any>).type ?? null) : null,
      required: typeof schema === "object" && schema && Array.isArray((schema as Record<string, any>).required)
        ? (schema as Record<string, any>).required
        : []
    }))
    .sort((left, right) => left.name.localeCompare(right.name));
}

function invalid(document: unknown | null, error: OpenApiParseError): OpenApiParseResult {
  return {
    status: "invalid",
    document,
    endpoints: [],
    schemas: [],
    errors: [error]
  };
}

function normalizeError(error: unknown): OpenApiParseError {
  if (error instanceof Error) {
    return { message: error.message };
  }
  return { message: String(error) };
}
```

- [ ] **Step 4: Export parser**

Modify `packages/core/src/index.ts`:

```ts
export * from "./domain";
export * from "./openapi";
export * from "./storage";
```

- [ ] **Step 5: Run tests to verify GREEN**

Run:

```bash
npm run test -w @carta/core -- openapi.test.ts
```

Expected: PASS.

- [ ] **Step 6: Run all core checks**

Run:

```bash
npm run test -w @carta/core
npm run typecheck -w @carta/core
```

Expected: both pass.

- [ ] **Step 7: Commit**

```bash
git add packages/core
git commit -m "feat: parse and index openapi documents"
```

---

## Task 4: Fastify API for Projects, Revisions, Catalog, and Docs Source

**Files:**
- Create: `apps/api/src/app.ts`
- Create: `apps/api/src/routes/projects.ts`
- Create: `apps/api/src/__tests__/projects.test.ts`
- Modify: `apps/api/src/server.ts`

- [ ] **Step 1: Write failing API tests**

Create `apps/api/src/__tests__/projects.test.ts`:

```ts
import { describe, expect, test } from "vitest";
import { buildApp } from "../app";

const spec = `
openapi: 3.0.3
info:
  title: Todo API
  version: 1.0.0
paths:
  /todos:
    get:
      operationId: listTodos
      summary: List todos
      tags: [Todos]
      responses:
        "200":
          description: OK
`;

describe("project API", () => {
  test("creates a project and saves a parsed OpenAPI revision", async () => {
    const app = buildApp({ databasePath: ":memory:" });

    const created = await app.inject({
      method: "POST",
      url: "/api/projects",
      payload: {
        name: "Todo API",
        code: "todo",
        ownerTeam: "platform",
        sourceMode: "uploaded"
      }
    });
    expect(created.statusCode).toBe(201);
    const project = created.json();

    const revision = await app.inject({
      method: "POST",
      url: `/api/projects/${project.id}/revisions`,
      payload: {
        rawContent: spec,
        sourceMode: "uploaded"
      }
    });

    expect(revision.statusCode).toBe(201);
    expect(revision.json().parseStatus).toBe("valid");

    const endpoints = await app.inject({
      method: "GET",
      url: `/api/projects/${project.id}/endpoints`
    });
    expect(endpoints.json()).toMatchObject([{ path: "/todos", method: "GET", operationId: "listTodos" }]);
  });

  test("rejects invalid OpenAPI revisions with normalized errors", async () => {
    const app = buildApp({ databasePath: ":memory:" });
    const created = await app.inject({
      method: "POST",
      url: "/api/projects",
      payload: {
        name: "Broken API",
        code: "broken",
        ownerTeam: "platform",
        sourceMode: "standalone"
      }
    });

    const revision = await app.inject({
      method: "POST",
      url: `/api/projects/${created.json().id}/revisions`,
      payload: {
        rawContent: "openapi: 3.0.3\ninfo:\n  title: Broken\npaths: {}\n",
        sourceMode: "standalone"
      }
    });

    expect(revision.statusCode).toBe(422);
    expect(revision.json().errors[0].message).toContain("info.version");
  });
});
```

- [ ] **Step 2: Run tests to verify RED**

Run:

```bash
npm run test -w @carta/api -- projects.test.ts
```

Expected: FAIL because `../app` does not exist.

- [ ] **Step 3: Implement API route module**

Create `apps/api/src/routes/projects.ts`:

```ts
import type { FastifyInstance } from "fastify";
import { hashContent, parseOpenApiDocument, type SourceMode, type SqliteProjectRepository } from "@carta/core";

interface ProjectRoutesOptions {
  repo: SqliteProjectRepository;
}

export async function registerProjectRoutes(app: FastifyInstance, options: ProjectRoutesOptions) {
  const { repo } = options;

  app.get("/api/projects", async () => repo.listProjects());

  app.post("/api/projects", async (request, reply) => {
    const body = request.body as {
      name: string;
      code: string;
      ownerTeam: string;
      domain?: string;
      description?: string;
      tags?: string[];
      sourceMode: SourceMode;
    };
    const project = repo.createProject({
      name: body.name,
      code: body.code,
      ownerTeam: body.ownerTeam,
      domain: body.domain,
      description: body.description,
      tags: body.tags,
      sourceMode: body.sourceMode
    });
    return reply.code(201).send(project);
  });

  app.get("/api/projects/:projectId", async (request, reply) => {
    const { projectId } = request.params as { projectId: string };
    const project = repo.getProject(projectId);
    if (!project) return reply.code(404).send({ message: "Project not found" });
    return project;
  });

  app.post("/api/projects/:projectId/revisions", async (request, reply) => {
    const { projectId } = request.params as { projectId: string };
    const project = repo.getProject(projectId);
    if (!project) return reply.code(404).send({ message: "Project not found" });
    const body = request.body as { rawContent: string; sourceMode: SourceMode };
    const parsed = await parseOpenApiDocument(body.rawContent);
    if (parsed.status === "invalid") {
      return reply.code(422).send({ parseStatus: "invalid", errors: parsed.errors });
    }
    const revision = repo.saveRevision({
      apiVersionId: project.currentVersion.id,
      sourceMode: body.sourceMode,
      rawContent: body.rawContent,
      contentHash: hashContent(body.rawContent),
      parseStatus: "valid",
      endpoints: parsed.endpoints
    });
    return reply.code(201).send({ ...revision, title: parsed.title, version: parsed.version });
  });

  app.get("/api/projects/:projectId/revisions/latest/source", async (request, reply) => {
    const { projectId } = request.params as { projectId: string };
    const project = repo.getProject(projectId);
    if (!project) return reply.code(404).send({ message: "Project not found" });
    const revision = repo.getLatestRevision(project.currentVersion.id);
    if (!revision) return reply.code(404).send({ message: "No source revision found" });
    return { rawContent: revision.rawContent, contentHash: revision.contentHash };
  });

  app.get("/api/projects/:projectId/endpoints", async (request, reply) => {
    const { projectId } = request.params as { projectId: string };
    const project = repo.getProject(projectId);
    if (!project) return reply.code(404).send({ message: "Project not found" });
    return repo.listEndpoints(project.currentVersion.id);
  });
}
```

- [ ] **Step 4: Implement app factory and runtime entrypoint**

Create `apps/api/src/app.ts`:

```ts
import cors from "@fastify/cors";
import Fastify from "fastify";
import { createDatabase, SqliteProjectRepository } from "@carta/core";
import { registerProjectRoutes } from "./routes/projects";

export interface BuildAppOptions {
  databasePath: string;
}

export function buildApp(options: BuildAppOptions) {
  const app = Fastify({ logger: false });
  const db = createDatabase(options.databasePath);
  const repo = new SqliteProjectRepository(db);

  app.register(cors, { origin: true });
  app.get("/health", async () => ({ status: "ok" }));
  app.register(registerProjectRoutes, { repo });

  return app;
}
```

Modify `apps/api/src/server.ts`:

```ts
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { buildApp } from "./app";

const databasePath = process.env.CARTA_DB_PATH ?? "data/carta.db";
mkdirSync(dirname(databasePath), { recursive: true });

const server = buildApp({ databasePath });
const port = Number(process.env.PORT ?? 4000);

await server.listen({ port, host: "0.0.0.0" });
console.log(`Carta API listening on http://localhost:${port}`);
```

- [ ] **Step 5: Run tests to verify GREEN**

Run:

```bash
npm run test -w @carta/api -- projects.test.ts
```

Expected: PASS.

- [ ] **Step 6: Run API checks**

Run:

```bash
npm run typecheck -w @carta/api
npm run build -w @carta/api
```

Expected: both pass.

- [ ] **Step 7: Commit**

```bash
git add apps/api packages/core package-lock.json
git commit -m "feat: expose project and openapi APIs"
```

---

## Task 5: Mock Manager and Mock API Routes

**Files:**
- Create: `packages/core/src/mock.ts`
- Create: `packages/core/src/__tests__/mock.test.ts`
- Modify: `packages/core/src/domain.ts`
- Modify: `packages/core/src/index.ts`
- Modify: `apps/api/src/routes/projects.ts`
- Modify: `apps/api/src/__tests__/projects.test.ts`

- [ ] **Step 1: Write failing mock manager tests**

Create `packages/core/src/__tests__/mock.test.ts`:

```ts
import { describe, expect, test } from "vitest";
import { InMemoryMockProcessAdapter, MockManager } from "../mock";

describe("MockManager", () => {
  test("starts and stops a project-level mock instance", async () => {
    const adapter = new InMemoryMockProcessAdapter();
    const manager = new MockManager(adapter);

    const instance = await manager.start({
      projectId: "prj_1",
      apiVersionId: "ver_1",
      revisionId: "rev_1",
      rawContent: "openapi: 3.0.3\ninfo:\n  title: Todo\n  version: 1.0.0\npaths: {}\n"
    });

    expect(instance.status).toBe("running");
    expect(instance.baseUrl).toContain("http://127.0.0.1:");

    const stopped = await manager.stop(instance.id);
    expect(stopped.status).toBe("stopped");
  });
});
```

- [ ] **Step 2: Run tests to verify RED**

Run:

```bash
npm run test -w @carta/core -- mock.test.ts
```

Expected: FAIL because `../mock` does not exist.

- [ ] **Step 3: Implement mock domain and manager**

Append to `packages/core/src/domain.ts`:

```ts
export interface MockInstance {
  id: string;
  projectId: string;
  apiVersionId: string;
  revisionId: string;
  baseUrl: string;
  status: MockStatus;
  port: number;
  startedAt: string | null;
  stoppedAt: string | null;
  lastError: string | null;
}
```

Create `packages/core/src/mock.ts`:

```ts
import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { nanoid } from "nanoid";
import type { MockInstance } from "./domain";

export interface StartMockInput {
  projectId: string;
  apiVersionId: string;
  revisionId: string;
  rawContent: string;
}

export interface MockProcessAdapter {
  start(input: StartMockInput & { port: number }): Promise<{ baseUrl: string; stop: () => Promise<void> }>;
}

export class InMemoryMockProcessAdapter implements MockProcessAdapter {
  async start(input: StartMockInput & { port: number }) {
    return {
      baseUrl: `http://127.0.0.1:${input.port}`,
      stop: async () => undefined
    };
  }
}

export class PrismMockProcessAdapter implements MockProcessAdapter {
  async start(input: StartMockInput & { port: number }) {
    const dir = mkdtempSync(join(tmpdir(), "carta-prism-"));
    const specPath = join(dir, "openapi.yaml");
    writeFileSync(specPath, input.rawContent);
    const child = spawn("npx", ["prism", "mock", specPath, "--host", "127.0.0.1", "--port", String(input.port)], {
      stdio: "pipe"
    }) as ChildProcessWithoutNullStreams;
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error("Timed out starting Prism mock")), 5000);
      child.stderr.once("data", (chunk) => {
        const text = String(chunk);
        if (text.includes("Error")) {
          clearTimeout(timeout);
          reject(new Error(text));
        }
      });
      child.stdout.once("data", () => {
        clearTimeout(timeout);
        resolve();
      });
    });
    return {
      baseUrl: `http://127.0.0.1:${input.port}`,
      stop: async () => {
        child.kill("SIGTERM");
      }
    };
  }
}

export class MockManager {
  private readonly instances = new Map<string, MockInstance>();
  private readonly stops = new Map<string, () => Promise<void>>();
  private nextPort = 5100;

  constructor(private readonly adapter: MockProcessAdapter) {}

  list(): MockInstance[] {
    return [...this.instances.values()];
  }

  async start(input: StartMockInput): Promise<MockInstance> {
    const port = this.nextPort++;
    const id = `mock_${nanoid(12)}`;
    const startedAt = new Date().toISOString();
    const process = await this.adapter.start({ ...input, port });
    const instance: MockInstance = {
      id,
      projectId: input.projectId,
      apiVersionId: input.apiVersionId,
      revisionId: input.revisionId,
      baseUrl: process.baseUrl,
      status: "running",
      port,
      startedAt,
      stoppedAt: null,
      lastError: null
    };
    this.instances.set(id, instance);
    this.stops.set(id, process.stop);
    return instance;
  }

  async stop(id: string): Promise<MockInstance> {
    const instance = this.instances.get(id);
    if (!instance) {
      throw new Error("Mock instance not found");
    }
    const stop = this.stops.get(id);
    if (stop) await stop();
    const stopped: MockInstance = {
      ...instance,
      status: "stopped",
      stoppedAt: new Date().toISOString()
    };
    this.instances.set(id, stopped);
    this.stops.delete(id);
    return stopped;
  }
}
```

- [ ] **Step 4: Export mock module**

Modify `packages/core/src/index.ts`:

```ts
export * from "./domain";
export * from "./mock";
export * from "./openapi";
export * from "./storage";
```

- [ ] **Step 5: Add mock API route tests**

Append to `apps/api/src/__tests__/projects.test.ts`:

```ts
test("starts a mock from the latest valid revision", async () => {
  const app = buildApp({ databasePath: ":memory:" });
  const created = await app.inject({
    method: "POST",
    url: "/api/projects",
    payload: {
      name: "Todo API",
      code: "mocked",
      ownerTeam: "platform",
      sourceMode: "uploaded"
    }
  });
  const project = created.json();
  await app.inject({
    method: "POST",
    url: `/api/projects/${project.id}/revisions`,
    payload: {
      rawContent: spec,
      sourceMode: "uploaded"
    }
  });

  const mock = await app.inject({
    method: "POST",
    url: `/api/projects/${project.id}/mock/start`
  });

  expect(mock.statusCode).toBe(201);
  expect(mock.json().status).toBe("running");
  expect(mock.json().baseUrl).toContain("http://127.0.0.1:");
});
```

- [ ] **Step 6: Implement mock routes**

Modify `apps/api/src/routes/projects.ts` so `ProjectRoutesOptions` accepts `mockManager`, and add:

```ts
  app.post("/api/projects/:projectId/mock/start", async (request, reply) => {
    const { projectId } = request.params as { projectId: string };
    const project = repo.getProject(projectId);
    if (!project) return reply.code(404).send({ message: "Project not found" });
    const revision = repo.getLatestRevision(project.currentVersion.id);
    if (!revision) return reply.code(409).send({ message: "Project has no valid OpenAPI revision" });
    const instance = await options.mockManager.start({
      projectId: project.id,
      apiVersionId: project.currentVersion.id,
      revisionId: revision.id,
      rawContent: revision.rawContent
    });
    return reply.code(201).send(instance);
  });

  app.get("/api/mock", async () => options.mockManager.list());

  app.post("/api/mock/:mockId/stop", async (request, reply) => {
    const { mockId } = request.params as { mockId: string };
    try {
      return await options.mockManager.stop(mockId);
    } catch {
      return reply.code(404).send({ message: "Mock instance not found" });
    }
  });
```

Modify `apps/api/src/app.ts` to create `MockManager`:

```ts
import { createDatabase, InMemoryMockProcessAdapter, MockManager, SqliteProjectRepository } from "@carta/core";
```

and register:

```ts
const mockManager = new MockManager(new InMemoryMockProcessAdapter());
app.register(registerProjectRoutes, { repo, mockManager });
```

- [ ] **Step 7: Run tests to verify GREEN**

Run:

```bash
npm run test -w @carta/core -- mock.test.ts
npm run test -w @carta/api -- projects.test.ts
```

Expected: both pass.

- [ ] **Step 8: Run checks**

Run:

```bash
npm run typecheck -w @carta/core
npm run typecheck -w @carta/api
```

Expected: both pass.

- [ ] **Step 9: Commit**

```bash
git add packages/core apps/api package-lock.json
git commit -m "feat: manage openapi-derived mock instances"
```

---

## Task 6: Web Console for Catalog, Editor, Docs, and Mock Controls

**Files:**
- Create: `apps/web/src/api.ts`
- Create: `apps/web/src/App.test.tsx`
- Modify: `apps/web/src/App.tsx`
- Modify: `apps/web/src/styles.css`

- [ ] **Step 1: Write failing web tests**

Create `apps/web/src/App.test.tsx`:

```tsx
import "@testing-library/jest-dom/vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test, vi } from "vitest";
import { App } from "./App";

const spec = "openapi: 3.0.3\ninfo:\n  title: Todo API\n  version: 1.0.0\npaths: {}\n";

describe("App", () => {
  test("creates a project and saves OpenAPI from the editor", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch");
    fetchMock
      .mockResolvedValueOnce(jsonResponse([]))
      .mockResolvedValueOnce(jsonResponse({ id: "prj_1", name: "Todo API", code: "todo", ownerTeam: "platform", sourceMode: "standalone", currentVersion: { id: "ver_1", status: "draft" } }))
      .mockResolvedValueOnce(jsonResponse({ id: "rev_1", parseStatus: "valid" }))
      .mockResolvedValueOnce(jsonResponse([{ path: "/todos", method: "GET", operationId: "listTodos" }]));

    render(<App />);

    await userEvent.type(screen.getByLabelText("Project name"), "Todo API");
    await userEvent.type(screen.getByLabelText("Project code"), "todo");
    await userEvent.click(screen.getByRole("button", { name: "Create project" }));
    await userEvent.clear(screen.getByLabelText("OpenAPI source"));
    await userEvent.type(screen.getByLabelText("OpenAPI source"), spec);
    await userEvent.click(screen.getByRole("button", { name: "Save OpenAPI" }));

    await waitFor(() => expect(screen.getByText("Saved revision rev_1")).toBeInTheDocument());
  });
});

function jsonResponse(body: unknown) {
  return Promise.resolve(new Response(JSON.stringify(body), { status: 200, headers: { "Content-Type": "application/json" } }));
}
```

- [ ] **Step 2: Run tests to verify RED**

Run:

```bash
npm run test -w @carta/web -- App.test.tsx
```

Expected: FAIL because the current app has no form, editor, or API client.

- [ ] **Step 3: Implement API client**

Create `apps/web/src/api.ts`:

```ts
const API_BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:4000";

export interface Project {
  id: string;
  name: string;
  code: string;
  ownerTeam: string;
  sourceMode: string;
  currentVersion: { id: string; status: string };
}

export interface Endpoint {
  path: string;
  method: string;
  operationId: string | null;
}

export async function listProjects(): Promise<Project[]> {
  return request("/api/projects");
}

export async function createProject(input: { name: string; code: string; ownerTeam: string; sourceMode: string }): Promise<Project> {
  return request("/api/projects", { method: "POST", body: JSON.stringify(input) });
}

export async function saveOpenApi(projectId: string, rawContent: string) {
  return request(`/api/projects/${projectId}/revisions`, {
    method: "POST",
    body: JSON.stringify({ rawContent, sourceMode: "standalone" })
  });
}

export async function listEndpoints(projectId: string): Promise<Endpoint[]> {
  return request(`/api/projects/${projectId}/endpoints`);
}

export async function startMock(projectId: string) {
  return request(`/api/projects/${projectId}/mock/start`, { method: "POST" });
}

async function request(path: string, init: RequestInit = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...(init.headers ?? {}) },
    ...init
  });
  if (!response.ok) {
    throw new Error(await response.text());
  }
  return response.json();
}
```

- [ ] **Step 4: Implement web console**

Modify `apps/web/src/App.tsx`:

```tsx
import { useEffect, useState } from "react";
import SwaggerUI from "swagger-ui-react";
import "swagger-ui-react/swagger-ui.css";
import { createProject, listEndpoints, listProjects, saveOpenApi, startMock, type Endpoint, type Project } from "./api";

const starterSpec = `openapi: 3.0.3
info:
  title: New API
  version: 0.1.0
paths: {}
`;

export function App() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selected, setSelected] = useState<Project | null>(null);
  const [endpoints, setEndpoints] = useState<Endpoint[]>([]);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [source, setSource] = useState(starterSpec);
  const [status, setStatus] = useState("");
  const [mockUrl, setMockUrl] = useState("");

  useEffect(() => {
    listProjects().then(setProjects).catch((error) => setStatus(error.message));
  }, []);

  async function onCreateProject() {
    const project = await createProject({ name, code, ownerTeam: "platform", sourceMode: "standalone" });
    setProjects([project, ...projects]);
    setSelected(project);
    setStatus(`Created project ${project.name}`);
  }

  async function onSaveOpenApi() {
    if (!selected) return;
    const revision = await saveOpenApi(selected.id, source);
    setStatus(`Saved revision ${revision.id}`);
    setEndpoints(await listEndpoints(selected.id));
  }

  async function onStartMock() {
    if (!selected) return;
    const mock = await startMock(selected.id);
    setMockUrl(mock.baseUrl);
    setStatus(`Mock running at ${mock.baseUrl}`);
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <h1>Carta</h1>
          <p>OpenAPI contracts, docs, and mocks from one source.</p>
        </div>
      </header>

      <section className="layout">
        <aside className="sidebar" aria-label="API catalog">
          <h2>API Catalog</h2>
          <label>
            Project name
            <input value={name} onChange={(event) => setName(event.target.value)} />
          </label>
          <label>
            Project code
            <input value={code} onChange={(event) => setCode(event.target.value)} />
          </label>
          <button onClick={onCreateProject}>Create project</button>
          <ul>
            {projects.map((project) => (
              <li key={project.id}>
                <button className="project-link" onClick={() => setSelected(project)}>
                  {project.name}
                </button>
              </li>
            ))}
          </ul>
        </aside>

        <section className="workspace">
          <div className="toolbar">
            <strong>{selected ? selected.name : "Select or create a project"}</strong>
            <button onClick={onSaveOpenApi} disabled={!selected}>Save OpenAPI</button>
            <button onClick={onStartMock} disabled={!selected}>Start mock</button>
          </div>
          {status && <p role="status">{status}</p>}
          {mockUrl && <p>Mock URL: <code>{mockUrl}</code></p>}
          <label>
            OpenAPI source
            <textarea value={source} onChange={(event) => setSource(event.target.value)} />
          </label>
          <div className="split">
            <section>
              <h2>Endpoints</h2>
              <ul>
                {endpoints.map((endpoint) => (
                  <li key={`${endpoint.method}-${endpoint.path}`}>
                    <code>{endpoint.method}</code> {endpoint.path} {endpoint.operationId}
                  </li>
                ))}
              </ul>
            </section>
            <section>
              <h2>Docs Preview</h2>
              <SwaggerUI spec={safeParse(source)} />
            </section>
          </div>
        </section>
      </section>
    </main>
  );
}

function safeParse(source: string) {
  try {
    return JSON.parse(source);
  } catch {
    return undefined;
  }
}
```

- [ ] **Step 5: Style the web console**

Modify `apps/web/src/styles.css`:

```css
:root {
  color: #18202f;
  background: #f5f7fb;
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}

body {
  margin: 0;
}

button,
input,
textarea {
  font: inherit;
}

button {
  border: 1px solid #b8c1d1;
  background: #ffffff;
  color: #18202f;
  border-radius: 6px;
  padding: 8px 10px;
  cursor: pointer;
}

button:disabled {
  color: #8a94a6;
  cursor: not-allowed;
}

.app-shell {
  min-height: 100vh;
}

.topbar {
  padding: 20px 28px;
  border-bottom: 1px solid #d9dee8;
  background: #ffffff;
}

.topbar h1 {
  margin: 0;
  font-size: 24px;
}

.topbar p {
  margin: 4px 0 0;
  color: #536074;
}

.layout {
  display: grid;
  grid-template-columns: 280px 1fr;
  min-height: calc(100vh - 86px);
}

.sidebar {
  border-right: 1px solid #d9dee8;
  background: #ffffff;
  padding: 18px;
}

.sidebar label,
.workspace label {
  display: grid;
  gap: 6px;
  margin-bottom: 12px;
  font-weight: 600;
}

.sidebar input,
.workspace textarea {
  border: 1px solid #c7cfdd;
  border-radius: 6px;
  padding: 8px;
}

.project-link {
  width: 100%;
  text-align: left;
  margin-bottom: 6px;
}

.workspace {
  padding: 18px;
}

.toolbar {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
}

.toolbar strong {
  margin-right: auto;
}

textarea {
  min-height: 220px;
  font-family: "SFMono-Regular", Consolas, monospace;
}

.split {
  display: grid;
  grid-template-columns: minmax(260px, 360px) minmax(0, 1fr);
  gap: 18px;
  align-items: start;
}

@media (max-width: 900px) {
  .layout,
  .split {
    grid-template-columns: 1fr;
  }
}
```

- [ ] **Step 6: Run tests to verify GREEN**

Run:

```bash
npm run test -w @carta/web -- App.test.tsx
```

Expected: PASS.

- [ ] **Step 7: Run web checks**

Run:

```bash
npm run typecheck -w @carta/web
npm run build -w @carta/web
```

Expected: both pass.

- [ ] **Step 8: Commit**

```bash
git add apps/web package-lock.json
git commit -m "feat: add openapi web console"
```

---

## Task 7: Sample Spec, End-to-End Smoke Test, and README

**Files:**
- Create: `samples/todo-openapi.yaml`
- Modify: `README.md`

- [ ] **Step 1: Create sample OpenAPI spec**

Create `samples/todo-openapi.yaml`:

```yaml
openapi: 3.0.3
info:
  title: Todo API
  version: 1.0.0
paths:
  /todos:
    get:
      operationId: listTodos
      summary: List todos
      tags:
        - Todos
      responses:
        "200":
          description: Todo list
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: "#/components/schemas/Todo"
              examples:
                default:
                  value:
                    - id: todo_1
                      title: Write Carta plan
                      completed: false
components:
  schemas:
    Todo:
      type: object
      required:
        - id
        - title
        - completed
      properties:
        id:
          type: string
        title:
          type: string
        completed:
          type: boolean
```

- [ ] **Step 2: Update README**

Modify `README.md`:

```md
# carta

Carta is a Git-native, OpenAPI-first API contract platform for managing, validating, mocking, and publishing service API contracts.

## MVP capabilities

- Create platform-managed API projects.
- Upload or edit OpenAPI YAML.
- Parse and index endpoints.
- Browse API projects and endpoints.
- Preview API documentation from OpenAPI.
- Start and stop project-level mock instances.

## Development

Install dependencies:

```bash
npm install
```

Run checks:

```bash
npm run test
npm run typecheck
npm run build
```

Start the API:

```bash
npm run dev:api
```

Start the web console:

```bash
npm run dev:web
```

The API defaults to `http://localhost:4000`.
The web console defaults to `http://127.0.0.1:5173`.

## Sample OpenAPI

Use `samples/todo-openapi.yaml` to create a project revision and start a mock.
```

- [ ] **Step 3: Run full test suite**

Run:

```bash
npm run test
npm run typecheck
npm run build
```

Expected: all workspace tests, typechecks, and builds pass.

- [ ] **Step 4: Start local dev servers**

Run API:

```bash
npm run dev:api
```

Run web in a second terminal:

```bash
npm run dev:web
```

Expected:

- API prints `Carta API listening on http://localhost:4000`.
- Web prints a Vite local URL on port `5173` or the next available port.

- [ ] **Step 5: Commit**

```bash
git add README.md samples
git commit -m "docs: document carta mvp workflow"
```

---

## Task 8: Final Verification and Development Branch Review

**Files:**
- Read-only verification across repository.

- [ ] **Step 1: Verify git status**

Run:

```bash
git status --short
```

Expected: only known pre-existing untracked files remain, or a clean working tree if they have been intentionally handled.

- [ ] **Step 2: Verify full checks**

Run:

```bash
npm run test
npm run typecheck
npm run build
```

Expected: all pass.

- [ ] **Step 3: Verify MVP endpoints manually**

Run:

```bash
npm run dev:api
```

Then in another terminal:

```bash
curl -s http://localhost:4000/health
```

Expected:

```json
{"status":"ok"}
```

- [ ] **Step 4: Run final code review**

Review for:

- Scope matches Iteration 0 through Iteration 3.
- No Git/MR, CI, diff, lint, lifecycle approval, Contract Test, or RBAC implementation slipped in.
- OpenAPI is the single source for docs, endpoint indexes, and mock inputs.
- Tests prove parser, storage, API, mock manager, and web flows.

- [ ] **Step 5: Commit final cleanup if needed**

If final review produces code or documentation changes:

```bash
git add <changed-files>
git commit -m "chore: polish carta mvp"
```

If no changes are needed, do not create an empty commit.

---

## Task Review Passes

### Review Pass 1: Spec Coverage

- Product Registry is covered by Task 2 and Task 4.
- Platform-managed OpenAPI upload/edit is covered by Task 3, Task 4, and Task 6.
- Source Revision is covered by Task 2 and Task 4.
- Parse validation is covered by Task 3 and Task 4.
- Catalog and docs are covered by Task 4 and Task 6.
- Prism-derived mock management is covered by Task 5.
- Sample-driven local validation is covered by Task 7 and Task 8.

### Review Pass 2: Task Dependency and Granularity

- Task 1 creates the workspace and contains no product behavior.
- Task 2 creates persistence before API routes depend on it.
- Task 3 creates OpenAPI parsing before revisions call it.
- Task 4 exposes backend routes before web consumes them.
- Task 5 adds mock behavior after revisions exist.
- Task 6 adds the web UI after API contracts are available.
- Task 7 adds operator documentation and sample data after behavior exists.
- Task 8 verifies the complete slice.

### Review Pass 3: Naming and Scope Consistency

- Source modes use `standalone`, `uploaded`, `git_connected`, and `git_imported`.
- API version status uses `draft`, `review`, `approved`, `released`, `deprecated`, and `archived`.
- Mock status uses `running`, `stopped`, `failed`, and `needs_reload`.
- Project IDs use `prj_`, version IDs use `ver_`, revision IDs use `rev_`, endpoint IDs use `end_`, and mock IDs use `mock_`.
- MVP explicitly avoids Git writeback, branch/MR workflow, diff, Spectral lint, lifecycle approval, Contract Test, and RBAC implementation.
