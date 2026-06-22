# Carta MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first usable Carta slice where a user can create an API project, upload or edit OpenAPI, browse indexed APIs, view Stoplight Elements documentation, and run a Prism-derived mock service from the same OpenAPI source.

**Architecture:** Use a TypeScript monorepo with NestJS as the modular backend framework, Fastify as the HTTP adapter, PostgreSQL as the durable metadata/report store, Kysely for type-safe SQL, React/Vite as the web console, Ant Design for internal-tool UI, Stoplight Elements for API documentation, Monaco for code authoring, and Prism as the OpenAPI-derived mock runtime. The backend is split into focused modules: project registry, OpenAPI workspace, catalog/docs, mock runtime, and platform database.

**Tech Stack:** Node.js 20+, npm workspaces, TypeScript, NestJS, `@nestjs/platform-fastify`, PostgreSQL, Kysely, `pg`, `node-pg-migrate`, Vitest, Supertest, React, Vite, Ant Design, TanStack Query, React Router, Monaco, Stoplight Elements, `@apidevtools/swagger-parser`, `yaml`, Prism CLI, Docker Compose.

---

## 1. Scope

This plan implements Iteration 0 through Iteration 3 from `docs/requirements/git-native-api-platform-product-design.md`:

- Project Registry.
- Platform-managed OpenAPI through upload and code edit.
- Source Revision.
- Parse validation.
- Catalog and API docs through Stoplight Elements.
- Prism mock start/stop/health/logs.

This plan deliberately does not implement Git writeback, branch/MR workflow, API diff, Spectral governance, lifecycle approval workflow, Contract Test, or project-level RBAC. The database schema reserves enough fields for those later stages.

---

## 2. Architecture Decisions

### 2.1 Backend Framework

Decision: use `NestJS + Fastify adapter`.

Rationale:

- NestJS gives stable module boundaries for a platform product that will grow into permissions, audit, Git sync, CI integration, workers, and governance.
- Fastify keeps the runtime efficient and modern without forcing the whole application into a minimalist route-only style.
- TypeScript keeps backend, frontend, OpenAPI tooling, Prism, Spectral, and Stoplight ecosystem integration in one language family.

Rejected alternatives:

- Plain Fastify: fast and simple, but weaker for long-lived platform modularity.
- Spring Boot/Kotlin: mature, but less direct integration with Stoplight/Prism/Spectral JavaScript ecosystem.
- Go: strong runtime profile, but more glue code for OpenAPI authoring and Stoplight-style UX.
- Python/FastAPI: excellent OpenAPI ergonomics for service APIs, less ideal for a TypeScript-heavy API design platform.

### 2.2 Database

Decision: use PostgreSQL as the primary store.

Rationale:

- Carta's core model is relational: projects, versions, revisions, endpoints, schemas, mock instances, reports, audit logs, future permissions.
- OpenAPI raw source and parse artifacts fit well as `TEXT` plus `JSONB`.
- PostgreSQL JSONB gives semi-structured flexibility without losing joins, constraints, transactions, migrations, and mature operations.

Rejected alternatives:

- MongoDB/NoSQL: good for document storage, but this product needs strong relationships, workflow state, reporting, audit, and future permissions.
- SQLite first: convenient for MVP, but it creates migration and concurrency assumptions that differ from the target deployment.

### 2.3 Data Access

Decision: use `Kysely + pg + node-pg-migrate`.

Rationale:

- Kysely provides typed SQL without hiding important SQL behavior.
- Migrations stay explicit and reviewable.
- The team can use PostgreSQL features such as JSONB, indexes, and transactions directly.

Rejected alternatives:

- Prisma: mature and productive, but less natural for report-heavy SQL and JSONB-specific queries.
- Raw SQL only: simple, but weaker type feedback and easier to drift.

### 2.4 API Documentation Renderer

Decision: use Stoplight Elements instead of Swagger UI.

Rationale:

- Stoplight Elements is designed as embeddable OpenAPI and Markdown documentation components.
- The product intentionally follows Stoplight-like behavior for internal API authoring and docs.
- Swagger UI is more focused on interactive request execution; Carta's first-class need is contract reading, design review, and docs generated from OpenAPI.

### 2.5 Mock Runtime

Decision: use Prism as a managed external process through a mock runtime service.

Rationale:

- Prism is purpose-built for OpenAPI-derived mock servers.
- Keeping it behind a process manager lets Carta later move mocks into containers or Kubernetes without rewriting API-facing behavior.
- Mock process lifecycle should not be embedded directly in controllers.

---

## 3. File Structure

Create or modify these files:

- `package.json`: root npm workspace scripts.
- `tsconfig.base.json`: shared TypeScript config.
- `.gitignore`: ignore dependencies, builds, generated files, `.DS_Store`, local database data, mock temp files, and worktrees.
- `docker-compose.yml`: local PostgreSQL for development.
- `apps/api/package.json`: NestJS API manifest.
- `apps/api/tsconfig.json`: API TypeScript config.
- `apps/api/src/main.ts`: Nest Fastify bootstrap.
- `apps/api/src/app.module.ts`: root module composition.
- `apps/api/src/config/env.ts`: environment parsing.
- `apps/api/src/database/database.module.ts`: database provider.
- `apps/api/src/database/database.ts`: Kysely database type and provider factory.
- `apps/api/src/projects/projects.module.ts`: project module.
- `apps/api/src/projects/projects.controller.ts`: project, revision, catalog, and docs HTTP routes.
- `apps/api/src/projects/projects.service.ts`: project application service.
- `apps/api/src/openapi/openapi.module.ts`: OpenAPI module.
- `apps/api/src/openapi/openapi.service.ts`: OpenAPI parse/validate/index service.
- `apps/api/src/mock/mock.module.ts`: mock module.
- `apps/api/src/mock/mock.controller.ts`: project-level mock HTTP routes.
- `apps/api/src/mock/mock.service.ts`: mock runtime manager.
- `apps/api/src/mock/prism-process.ts`: Prism process adapter.
- `apps/api/src/**/*.spec.ts`: backend tests.
- `migrations/001_initial_schema.cjs`: PostgreSQL schema migration.
- `apps/web/package.json`: web manifest.
- `apps/web/tsconfig.json`: web TypeScript config.
- `apps/web/vite.config.ts`: Vite config.
- `apps/web/index.html`: Vite entry HTML.
- `apps/web/src/main.tsx`: React mount.
- `apps/web/src/api/client.ts`: typed HTTP client.
- `apps/web/src/App.tsx`: route shell.
- `apps/web/src/pages/CatalogPage.tsx`: API catalog and project creation.
- `apps/web/src/pages/ProjectPage.tsx`: editor, docs, endpoint list, and mock controls.
- `apps/web/src/styles.css`: internal-platform styling.
- `apps/web/src/**/*.test.tsx`: web tests.
- `samples/todo-openapi.yaml`: sample OpenAPI document.
- `README.md`: local development workflow.

---

## 4. Task Breakdown

## Task 1: Modern Monorepo Scaffold

**Files:**

- Create: `package.json`
- Create: `tsconfig.base.json`
- Create: `.gitignore`
- Create: `docker-compose.yml`
- Create: `apps/api/package.json`
- Create: `apps/api/tsconfig.json`
- Create: `apps/web/package.json`
- Create: `apps/web/tsconfig.json`
- Create: `apps/web/vite.config.ts`
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
    "apps/*"
  ],
  "scripts": {
    "build": "npm run build -ws",
    "test": "npm run test -ws",
    "typecheck": "npm run typecheck -ws",
    "dev:api": "npm run dev -w @carta/api",
    "dev:web": "npm run dev -w @carta/web",
    "db:up": "docker compose up -d postgres",
    "db:migrate": "npm run migrate -w @carta/api"
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
*.log
.env
.env.local
.DS_Store
```

Create `docker-compose.yml`:

```yaml
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: carta
      POSTGRES_PASSWORD: carta
      POSTGRES_DB: carta
    ports:
      - "5432:5432"
    volumes:
      - carta-postgres:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U carta -d carta"]
      interval: 5s
      timeout: 3s
      retries: 20

volumes:
  carta-postgres:
```

- [ ] **Step 2: Create API package manifest**

Create `apps/api/package.json`:

```json
{
  "name": "@carta/api",
  "version": "0.1.0",
  "type": "module",
  "main": "dist/main.js",
  "scripts": {
    "build": "tsc -p tsconfig.json",
    "dev": "tsx watch src/main.ts",
    "start": "node dist/main.js",
    "test": "vitest run",
    "typecheck": "tsc -p tsconfig.json --noEmit",
    "migrate": "node-pg-migrate up -m ../../migrations --database-url \"${DATABASE_URL:-postgres://carta:carta@localhost:5432/carta}\""
  },
  "dependencies": {
    "@apidevtools/swagger-parser": "^12.1.0",
    "@nestjs/common": "^11.1.27",
    "@nestjs/core": "^11.1.27",
    "@nestjs/platform-fastify": "^11.1.27",
    "@stoplight/prism-cli": "^5.15.11",
    "fastify": "^5.8.5",
    "kysely": "^0.29.2",
    "nanoid": "^5.1.15",
    "pg": "^8.22.0",
    "reflect-metadata": "^0.2.2",
    "rxjs": "^7.8.2",
    "yaml": "^2.9.0",
    "zod": "^4.4.3"
  },
  "devDependencies": {
    "@nestjs/testing": "^11.1.27",
    "@types/node": "^26.0.0",
    "@types/pg": "^8.20.0",
    "@types/supertest": "^7.2.0",
    "node-pg-migrate": "^8.0.4",
    "supertest": "^7.2.2",
    "tsx": "^4.19.2",
    "typescript": "^6.0.3",
    "vitest": "^4.1.9"
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
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
  },
  "include": ["src"]
}
```

- [ ] **Step 3: Create web package manifest**

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
    "@stoplight/elements": "^9.0.22",
    "@tanstack/react-query": "^5.101.0",
    "@vitejs/plugin-react": "^6.0.2",
    "antd": "^6.4.4",
    "react": "^19.2.7",
    "react-dom": "^19.2.7",
    "react-router-dom": "^7.1.5",
    "vite": "^8.0.16"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "^6.6.3",
    "@testing-library/react": "^16.2.0",
    "@testing-library/user-event": "^14.6.1",
    "@types/react": "^19.2.17",
    "@types/react-dom": "^19.2.3",
    "jsdom": "^29.1.1",
    "typescript": "^6.0.3",
    "vitest": "^4.1.9"
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
  "include": ["src", "vite.config.ts", "index.html"]
}
```

Create `apps/web/vite.config.ts`:

```ts
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": "http://localhost:4000",
      "/health": "http://localhost:4000"
    }
  }
});
```

- [ ] **Step 4: Create minimal runtime files**

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
  return <main className="app-shell">Carta</main>;
}
```

Create `apps/web/src/styles.css`:

```css
:root {
  background: #f5f7fb;
  color: #18202f;
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}

body {
  margin: 0;
}

.app-shell {
  min-height: 100vh;
  padding: 24px;
}
```

- [ ] **Step 5: Install and verify baseline**

Run:

```bash
npm install
npm run typecheck
npm run build
```

Expected: install succeeds, typecheck passes, build passes.

- [ ] **Step 6: Commit**

```bash
git add .gitignore docker-compose.yml package.json package-lock.json tsconfig.base.json apps
git commit -m "chore: scaffold modern carta stack"
```

---

## Task 2: PostgreSQL Schema and Kysely Database Layer

**Files:**

- Create: `migrations/001_initial_schema.cjs`
- Create: `apps/api/src/database/database.ts`
- Create: `apps/api/src/database/database.module.ts`
- Create: `apps/api/src/config/env.ts`
- Create: `apps/api/src/database/database.spec.ts`

- [ ] **Step 1: Write failing database tests**

Create `apps/api/src/database/database.spec.ts`:

```ts
import { describe, expect, test } from "vitest";
import { createKyselyForTest } from "./database";

describe("database schema", () => {
  test("can insert an API project and draft version", async () => {
    const db = await createKyselyForTest();
    const project = await db
      .insertInto("api_projects")
      .values({
        id: "prj_test",
        name: "Todo API",
        code: "todo",
        owner_team: "platform",
        source_mode: "standalone",
        tags: JSON.stringify(["internal"]),
        created_at: new Date(),
        updated_at: new Date()
      })
      .returningAll()
      .executeTakeFirstOrThrow();

    await db
      .insertInto("api_versions")
      .values({
        id: "ver_test",
        project_id: project.id,
        version: "0.1.0",
        status: "draft",
        created_at: new Date(),
        updated_at: new Date()
      })
      .execute();

    const version = await db.selectFrom("api_versions").selectAll().where("project_id", "=", project.id).executeTakeFirstOrThrow();
    expect(version.status).toBe("draft");
    await db.destroy();
  });
});
```

- [ ] **Step 2: Run test to verify RED**

Run:

```bash
npm run test -w @carta/api -- database.spec.ts
```

Expected: FAIL because `./database` does not exist.

- [ ] **Step 3: Create initial migration**

Create `migrations/001_initial_schema.cjs`:

```js
exports.up = (pgm) => {
  pgm.createTable("api_projects", {
    id: { type: "text", primaryKey: true },
    name: { type: "text", notNull: true },
    code: { type: "text", notNull: true, unique: true },
    owner_team: { type: "text", notNull: true },
    domain: { type: "text" },
    description: { type: "text" },
    source_mode: { type: "text", notNull: true },
    tags: { type: "jsonb", notNull: true, default: "'[]'::jsonb" },
    created_at: { type: "timestamptz", notNull: true },
    updated_at: { type: "timestamptz", notNull: true }
  });

  pgm.createTable("api_versions", {
    id: { type: "text", primaryKey: true },
    project_id: { type: "text", notNull: true, references: "api_projects", onDelete: "cascade" },
    version: { type: "text", notNull: true },
    status: { type: "text", notNull: true },
    created_at: { type: "timestamptz", notNull: true },
    updated_at: { type: "timestamptz", notNull: true }
  });

  pgm.createTable("source_revisions", {
    id: { type: "text", primaryKey: true },
    api_version_id: { type: "text", notNull: true, references: "api_versions", onDelete: "cascade" },
    source_mode: { type: "text", notNull: true },
    raw_content: { type: "text", notNull: true },
    parsed_document: { type: "jsonb" },
    content_hash: { type: "text", notNull: true },
    parse_status: { type: "text", notNull: true },
    parse_errors: { type: "jsonb", notNull: true, default: "'[]'::jsonb" },
    created_at: { type: "timestamptz", notNull: true }
  });

  pgm.createTable("api_endpoints", {
    id: { type: "text", primaryKey: true },
    api_version_id: { type: "text", notNull: true, references: "api_versions", onDelete: "cascade" },
    path: { type: "text", notNull: true },
    method: { type: "text", notNull: true },
    operation_id: { type: "text" },
    summary: { type: "text" },
    tags: { type: "jsonb", notNull: true, default: "'[]'::jsonb" },
    deprecated: { type: "boolean", notNull: true, default: false }
  });

  pgm.createTable("mock_instances", {
    id: { type: "text", primaryKey: true },
    project_id: { type: "text", notNull: true, references: "api_projects", onDelete: "cascade" },
    api_version_id: { type: "text", notNull: true, references: "api_versions", onDelete: "cascade" },
    revision_id: { type: "text", notNull: true, references: "source_revisions", onDelete: "cascade" },
    status: { type: "text", notNull: true },
    base_url: { type: "text" },
    port: { type: "integer" },
    last_error: { type: "text" },
    started_at: { type: "timestamptz" },
    stopped_at: { type: "timestamptz" },
    created_at: { type: "timestamptz", notNull: true },
    updated_at: { type: "timestamptz", notNull: true }
  });

  pgm.createIndex("api_projects", "code");
  pgm.createIndex("api_endpoints", ["path", "method"]);
  pgm.createIndex("source_revisions", ["api_version_id", "created_at"]);
};

exports.down = (pgm) => {
  pgm.dropTable("mock_instances");
  pgm.dropTable("api_endpoints");
  pgm.dropTable("source_revisions");
  pgm.dropTable("api_versions");
  pgm.dropTable("api_projects");
};
```

- [ ] **Step 4: Create Kysely database provider**

Create `apps/api/src/database/database.ts`:

```ts
import { Kysely, PostgresDialect, type Generated, type Insertable, type Selectable } from "kysely";
import { Pool } from "pg";

export interface ApiProjectsTable {
  id: string;
  name: string;
  code: string;
  owner_team: string;
  domain: string | null;
  description: string | null;
  source_mode: string;
  tags: unknown;
  created_at: Date;
  updated_at: Date;
}

export interface ApiVersionsTable {
  id: string;
  project_id: string;
  version: string;
  status: string;
  created_at: Date;
  updated_at: Date;
}

export interface SourceRevisionsTable {
  id: string;
  api_version_id: string;
  source_mode: string;
  raw_content: string;
  parsed_document: unknown | null;
  content_hash: string;
  parse_status: string;
  parse_errors: unknown;
  created_at: Date;
}

export interface ApiEndpointsTable {
  id: string;
  api_version_id: string;
  path: string;
  method: string;
  operation_id: string | null;
  summary: string | null;
  tags: unknown;
  deprecated: boolean;
}

export interface MockInstancesTable {
  id: string;
  project_id: string;
  api_version_id: string;
  revision_id: string;
  status: string;
  base_url: string | null;
  port: number | null;
  last_error: string | null;
  started_at: Date | null;
  stopped_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

export interface CartaDatabase {
  api_projects: ApiProjectsTable;
  api_versions: ApiVersionsTable;
  source_revisions: SourceRevisionsTable;
  api_endpoints: ApiEndpointsTable;
  mock_instances: MockInstancesTable;
}

export type ApiProjectRow = Selectable<ApiProjectsTable>;
export type NewApiProjectRow = Insertable<ApiProjectsTable>;

export function createKysely(databaseUrl: string): Kysely<CartaDatabase> {
  return new Kysely<CartaDatabase>({
    dialect: new PostgresDialect({
      pool: new Pool({ connectionString: databaseUrl })
    })
  });
}

export async function createKyselyForTest(): Promise<Kysely<CartaDatabase>> {
  const databaseUrl = process.env.TEST_DATABASE_URL ?? process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("TEST_DATABASE_URL or DATABASE_URL is required for database tests");
  }
  return createKysely(databaseUrl);
}
```

Create `apps/api/src/database/database.module.ts`:

```ts
import { Module } from "@nestjs/common";
import { createKysely } from "./database";
import { readEnv } from "../config/env";

export const DATABASE = Symbol("DATABASE");

@Module({
  providers: [
    {
      provide: DATABASE,
      useFactory: () => createKysely(readEnv().databaseUrl)
    }
  ],
  exports: [DATABASE]
})
export class DatabaseModule {}
```

Create `apps/api/src/config/env.ts`:

```ts
export interface CartaEnv {
  port: number;
  databaseUrl: string;
}

export function readEnv(): CartaEnv {
  return {
    port: Number(process.env.PORT ?? 4000),
    databaseUrl: process.env.DATABASE_URL ?? "postgres://carta:carta@localhost:5432/carta"
  };
}
```

- [ ] **Step 5: Run migration and database test**

Run:

```bash
npm run db:up
npm run db:migrate
npm run test -w @carta/api -- database.spec.ts
```

Expected: PostgreSQL starts, migration succeeds, database test passes.

- [ ] **Step 6: Commit**

```bash
git add docker-compose.yml migrations apps/api/src/database apps/api/src/config package-lock.json
git commit -m "feat: add postgres database foundation"
```

---

## Task 3: OpenAPI Workspace Service

**Files:**

- Create: `apps/api/src/openapi/openapi.module.ts`
- Create: `apps/api/src/openapi/openapi.service.ts`
- Create: `apps/api/src/openapi/openapi.service.spec.ts`

- [ ] **Step 1: Write failing parser tests**

Create `apps/api/src/openapi/openapi.service.spec.ts`:

```ts
import { describe, expect, test } from "vitest";
import { OpenApiService } from "./openapi.service";

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
components:
  schemas:
    Todo:
      type: object
`;

describe("OpenApiService", () => {
  test("parses a valid OpenAPI document and indexes endpoints", async () => {
    const service = new OpenApiService();
    const result = await service.parse(validSpec);

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
  });

  test("returns normalized errors when required metadata is missing", async () => {
    const service = new OpenApiService();
    const result = await service.parse("openapi: 3.0.3\ninfo:\n  title: Missing Version\npaths: {}\n");

    expect(result.status).toBe("invalid");
    expect(result.errors[0].message).toContain("info.version");
  });
});
```

- [ ] **Step 2: Run test to verify RED**

Run:

```bash
npm run test -w @carta/api -- openapi.service.spec.ts
```

Expected: FAIL because `openapi.service` does not exist.

- [ ] **Step 3: Implement OpenAPI service**

Create `apps/api/src/openapi/openapi.service.ts`:

```ts
import { Injectable } from "@nestjs/common";
import SwaggerParser from "@apidevtools/swagger-parser";
import YAML from "yaml";

export interface ParsedEndpoint {
  path: string;
  method: string;
  operationId: string | null;
  summary: string | null;
  tags: string[];
  deprecated: boolean;
}

export interface ParseError {
  message: string;
  path?: string;
}

export type ParseResult =
  | {
      status: "valid";
      title: string;
      version: string;
      document: unknown;
      endpoints: ParsedEndpoint[];
      errors: [];
    }
  | {
      status: "invalid";
      document: unknown | null;
      endpoints: [];
      errors: ParseError[];
    };

const HTTP_METHODS = new Set(["get", "put", "post", "delete", "patch", "options", "head", "trace"]);

@Injectable()
export class OpenApiService {
  async parse(rawContent: string): Promise<ParseResult> {
    let document: unknown;
    try {
      document = YAML.parse(rawContent);
    } catch (error) {
      return { status: "invalid", document: null, endpoints: [], errors: [this.normalizeError(error)] };
    }

    const metadataErrors = this.validateRequiredFields(document);
    if (metadataErrors.length > 0) {
      return { status: "invalid", document, endpoints: [], errors: metadataErrors };
    }

    try {
      await SwaggerParser.validate(document as object);
    } catch (error) {
      return { status: "invalid", document, endpoints: [], errors: [this.normalizeError(error)] };
    }

    const root = document as Record<string, any>;
    return {
      status: "valid",
      title: root.info.title,
      version: root.info.version,
      document,
      endpoints: this.indexEndpoints(root),
      errors: []
    };
  }

  private validateRequiredFields(document: unknown): ParseError[] {
    if (!document || typeof document !== "object") return [{ message: "OpenAPI document must be an object" }];
    const root = document as Record<string, any>;
    const errors: ParseError[] = [];
    if (!root.openapi) errors.push({ message: "openapi version is required", path: "openapi" });
    if (!root.info?.title) errors.push({ message: "info.title is required", path: "info.title" });
    if (!root.info?.version) errors.push({ message: "info.version is required", path: "info.version" });
    if (!root.paths || typeof root.paths !== "object") errors.push({ message: "paths object is required", path: "paths" });
    return errors;
  }

  private indexEndpoints(root: Record<string, any>): ParsedEndpoint[] {
    const endpoints: ParsedEndpoint[] = [];
    for (const [path, pathItem] of Object.entries(root.paths ?? {})) {
      if (!pathItem || typeof pathItem !== "object") continue;
      for (const [method, operation] of Object.entries(pathItem as Record<string, any>)) {
        if (!HTTP_METHODS.has(method) || !operation || typeof operation !== "object") continue;
        const operationObject = operation as Record<string, any>;
        endpoints.push({
          path,
          method: method.toUpperCase(),
          operationId: operationObject.operationId ?? null,
          summary: operationObject.summary ?? null,
          tags: Array.isArray(operationObject.tags) ? operationObject.tags : [],
          deprecated: Boolean(operationObject.deprecated)
        });
      }
    }
    return endpoints.sort((left, right) => `${left.path} ${left.method}`.localeCompare(`${right.path} ${right.method}`));
  }

  private normalizeError(error: unknown): ParseError {
    return error instanceof Error ? { message: error.message } : { message: String(error) };
  }
}
```

Create `apps/api/src/openapi/openapi.module.ts`:

```ts
import { Module } from "@nestjs/common";
import { OpenApiService } from "./openapi.service";

@Module({
  providers: [OpenApiService],
  exports: [OpenApiService]
})
export class OpenApiModule {}
```

- [ ] **Step 4: Run parser tests**

Run:

```bash
npm run test -w @carta/api -- openapi.service.spec.ts
npm run typecheck -w @carta/api
```

Expected: tests and typecheck pass.

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/openapi
git commit -m "feat: add openapi workspace parser"
```

---

## Task 4: Project Registry and Revision API

**Files:**

- Create: `apps/api/src/app.module.ts`
- Create: `apps/api/src/main.ts`
- Create: `apps/api/src/projects/projects.module.ts`
- Create: `apps/api/src/projects/projects.service.ts`
- Create: `apps/api/src/projects/projects.controller.ts`
- Create: `apps/api/src/projects/projects.controller.spec.ts`

- [ ] **Step 1: Write failing HTTP tests**

Create `apps/api/src/projects/projects.controller.spec.ts`:

```ts
import { Test } from "@nestjs/testing";
import { FastifyAdapter, NestFastifyApplication } from "@nestjs/platform-fastify";
import request from "supertest";
import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { AppModule } from "../app.module";

describe("Projects API", () => {
  let app: NestFastifyApplication;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication<NestFastifyApplication>(new FastifyAdapter());
    await app.init();
    await app.getHttpAdapter().getInstance().ready();
  });

  afterEach(async () => {
    await app.close();
  });

  test("creates a project and saves a valid OpenAPI revision", async () => {
    const projectResponse = await request(app.getHttpServer())
      .post("/api/projects")
      .send({ name: "Todo API", code: "todo", ownerTeam: "platform", sourceMode: "standalone" })
      .expect(201);

    const revisionResponse = await request(app.getHttpServer())
      .post(`/api/projects/${projectResponse.body.id}/revisions`)
      .send({
        sourceMode: "standalone",
        rawContent: "openapi: 3.0.3\ninfo:\n  title: Todo API\n  version: 1.0.0\npaths: {}\n"
      })
      .expect(201);

    expect(revisionResponse.body.parseStatus).toBe("valid");
  });
});
```

- [ ] **Step 2: Run test to verify RED**

Run:

```bash
npm run test -w @carta/api -- projects.controller.spec.ts
```

Expected: FAIL because `AppModule` and project routes do not exist.

- [ ] **Step 3: Implement project service**

Create `apps/api/src/projects/projects.service.ts` with methods:

```ts
import { Inject, Injectable, NotFoundException, UnprocessableEntityException } from "@nestjs/common";
import { createHash } from "node:crypto";
import { nanoid } from "nanoid";
import type { Kysely } from "kysely";
import { DATABASE } from "../database/database.module";
import type { CartaDatabase } from "../database/database";
import { OpenApiService } from "../openapi/openapi.service";

@Injectable()
export class ProjectsService {
  constructor(
    @Inject(DATABASE) private readonly db: Kysely<CartaDatabase>,
    private readonly openapi: OpenApiService
  ) {}

  async createProject(input: { name: string; code: string; ownerTeam: string; sourceMode: string }) {
    const now = new Date();
    const projectId = `prj_${nanoid(12)}`;
    const versionId = `ver_${nanoid(12)}`;
    await this.db.transaction().execute(async (trx) => {
      await trx.insertInto("api_projects").values({
        id: projectId,
        name: input.name,
        code: input.code,
        owner_team: input.ownerTeam,
        source_mode: input.sourceMode,
        tags: JSON.stringify([]),
        created_at: now,
        updated_at: now
      }).execute();
      await trx.insertInto("api_versions").values({
        id: versionId,
        project_id: projectId,
        version: "0.1.0",
        status: "draft",
        created_at: now,
        updated_at: now
      }).execute();
    });
    return { id: projectId, name: input.name, code: input.code, ownerTeam: input.ownerTeam, sourceMode: input.sourceMode, currentVersion: { id: versionId, status: "draft" } };
  }

  async listProjects() {
    return this.db.selectFrom("api_projects").selectAll().orderBy("updated_at", "desc").execute();
  }

  async saveRevision(projectId: string, input: { sourceMode: string; rawContent: string }) {
    const version = await this.db
      .selectFrom("api_versions")
      .innerJoin("api_projects", "api_projects.id", "api_versions.project_id")
      .select(["api_versions.id"])
      .where("api_projects.id", "=", projectId)
      .orderBy("api_versions.created_at", "desc")
      .executeTakeFirst();
    if (!version) throw new NotFoundException("Project not found");

    const parsed = await this.openapi.parse(input.rawContent);
    if (parsed.status === "invalid") throw new UnprocessableEntityException({ errors: parsed.errors });

    const revisionId = `rev_${nanoid(12)}`;
    const now = new Date();
    await this.db.transaction().execute(async (trx) => {
      await trx.insertInto("source_revisions").values({
        id: revisionId,
        api_version_id: version.id,
        source_mode: input.sourceMode,
        raw_content: input.rawContent,
        parsed_document: JSON.stringify(parsed.document),
        content_hash: createHash("sha256").update(input.rawContent).digest("hex"),
        parse_status: "valid",
        parse_errors: JSON.stringify([]),
        created_at: now
      }).execute();
      await trx.deleteFrom("api_endpoints").where("api_version_id", "=", version.id).execute();
      for (const endpoint of parsed.endpoints) {
        await trx.insertInto("api_endpoints").values({
          id: `end_${nanoid(12)}`,
          api_version_id: version.id,
          path: endpoint.path,
          method: endpoint.method,
          operation_id: endpoint.operationId,
          summary: endpoint.summary,
          tags: JSON.stringify(endpoint.tags),
          deprecated: endpoint.deprecated
        }).execute();
      }
    });
    return { id: revisionId, parseStatus: "valid", title: parsed.title, version: parsed.version };
  }
}
```

- [ ] **Step 4: Implement controller and modules**

Create `apps/api/src/projects/projects.controller.ts`:

```ts
import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { ProjectsService } from "./projects.service";

@Controller("/api/projects")
export class ProjectsController {
  constructor(private readonly projects: ProjectsService) {}

  @Get()
  listProjects() {
    return this.projects.listProjects();
  }

  @Post()
  createProject(@Body() body: { name: string; code: string; ownerTeam: string; sourceMode: string }) {
    return this.projects.createProject(body);
  }

  @Post(":projectId/revisions")
  saveRevision(@Param("projectId") projectId: string, @Body() body: { sourceMode: string; rawContent: string }) {
    return this.projects.saveRevision(projectId, body);
  }
}
```

Create `apps/api/src/projects/projects.module.ts`:

```ts
import { Module } from "@nestjs/common";
import { DatabaseModule } from "../database/database.module";
import { OpenApiModule } from "../openapi/openapi.module";
import { ProjectsController } from "./projects.controller";
import { ProjectsService } from "./projects.service";

@Module({
  imports: [DatabaseModule, OpenApiModule],
  controllers: [ProjectsController],
  providers: [ProjectsService],
  exports: [ProjectsService]
})
export class ProjectsModule {}
```

Create `apps/api/src/app.module.ts`:

```ts
import { Module } from "@nestjs/common";
import { ProjectsModule } from "./projects/projects.module";

@Module({
  imports: [ProjectsModule]
})
export class AppModule {}
```

Create `apps/api/src/main.ts`:

```ts
import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { FastifyAdapter, NestFastifyApplication } from "@nestjs/platform-fastify";
import { AppModule } from "./app.module";
import { readEnv } from "./config/env";

const env = readEnv();
const app = await NestFactory.create<NestFastifyApplication>(AppModule, new FastifyAdapter());
app.enableCors();
app.getHttpAdapter().getInstance().get("/health", async () => ({ status: "ok" }));
await app.listen(env.port, "0.0.0.0");
console.log(`Carta API listening on http://localhost:${env.port}`);
```

- [ ] **Step 5: Run tests and checks**

Run:

```bash
npm run test -w @carta/api -- projects.controller.spec.ts
npm run typecheck -w @carta/api
```

Expected: tests and typecheck pass.

- [ ] **Step 6: Commit**

```bash
git add apps/api/src package-lock.json
git commit -m "feat: add project revision api"
```

---

## Task 5: Catalog, Docs Source, and Stoplight Elements Contract

**Files:**

- Modify: `apps/api/src/projects/projects.service.ts`
- Modify: `apps/api/src/projects/projects.controller.ts`
- Modify: `apps/api/src/projects/projects.controller.spec.ts`

- [ ] **Step 1: Write failing catalog/docs tests**

Append to `apps/api/src/projects/projects.controller.spec.ts`:

```ts
test("returns endpoint catalog and latest OpenAPI source for docs", async () => {
  const projectResponse = await request(app.getHttpServer())
    .post("/api/projects")
    .send({ name: "Todo API", code: "todo-docs", ownerTeam: "platform", sourceMode: "standalone" })
    .expect(201);

  await request(app.getHttpServer())
    .post(`/api/projects/${projectResponse.body.id}/revisions`)
    .send({
      sourceMode: "standalone",
      rawContent: "openapi: 3.0.3\ninfo:\n  title: Todo API\n  version: 1.0.0\npaths:\n  /todos:\n    get:\n      operationId: listTodos\n      responses:\n        '200':\n          description: OK\n"
    })
    .expect(201);

  const endpoints = await request(app.getHttpServer()).get(`/api/projects/${projectResponse.body.id}/endpoints`).expect(200);
  expect(endpoints.body[0]).toMatchObject({ path: "/todos", method: "GET", operation_id: "listTodos" });

  const source = await request(app.getHttpServer()).get(`/api/projects/${projectResponse.body.id}/docs/openapi.yaml`).expect(200);
  expect(source.text).toContain("title: Todo API");
});
```

- [ ] **Step 2: Run test to verify RED**

Run:

```bash
npm run test -w @carta/api -- projects.controller.spec.ts
```

Expected: FAIL because endpoint and docs routes do not exist.

- [ ] **Step 3: Add service methods**

Add to `ProjectsService`:

```ts
  async listEndpoints(projectId: string) {
    const version = await this.findCurrentVersion(projectId);
    return this.db.selectFrom("api_endpoints").selectAll().where("api_version_id", "=", version.id).orderBy("path").execute();
  }

  async getLatestOpenApiSource(projectId: string) {
    const version = await this.findCurrentVersion(projectId);
    const revision = await this.db
      .selectFrom("source_revisions")
      .selectAll()
      .where("api_version_id", "=", version.id)
      .orderBy("created_at", "desc")
      .executeTakeFirst();
    if (!revision) throw new NotFoundException("No source revision found");
    return revision.raw_content;
  }

  private async findCurrentVersion(projectId: string) {
    const version = await this.db
      .selectFrom("api_versions")
      .selectAll()
      .where("project_id", "=", projectId)
      .orderBy("created_at", "desc")
      .executeTakeFirst();
    if (!version) throw new NotFoundException("Project not found");
    return version;
  }
```

- [ ] **Step 4: Add controller routes**

Add to `ProjectsController`:

```ts
  @Get(":projectId/endpoints")
  listEndpoints(@Param("projectId") projectId: string) {
    return this.projects.listEndpoints(projectId);
  }

  @Get(":projectId/docs/openapi.yaml")
  async getDocsSource(@Param("projectId") projectId: string) {
    return await this.projects.getLatestOpenApiSource(projectId);
  }
```

- [ ] **Step 5: Run tests and checks**

Run:

```bash
npm run test -w @carta/api -- projects.controller.spec.ts
npm run typecheck -w @carta/api
```

Expected: tests and typecheck pass.

- [ ] **Step 6: Commit**

```bash
git add apps/api/src/projects
git commit -m "feat: expose catalog and docs source"
```

---

## Task 6: Prism Mock Runtime

**Files:**

- Create: `apps/api/src/mock/mock.module.ts`
- Create: `apps/api/src/mock/mock.controller.ts`
- Create: `apps/api/src/mock/mock.service.ts`
- Create: `apps/api/src/mock/prism-process.ts`
- Create: `apps/api/src/mock/mock.service.spec.ts`
- Modify: `apps/api/src/app.module.ts`
- Modify: `apps/api/src/projects/projects.service.ts`

- [ ] **Step 1: Write failing mock service tests**

Create `apps/api/src/mock/mock.service.spec.ts`:

```ts
import { describe, expect, test } from "vitest";
import { MockService } from "./mock.service";

describe("MockService", () => {
  test("starts and stops an OpenAPI-derived mock instance through an adapter", async () => {
    const service = new MockService({
      start: async ({ port }) => ({
        baseUrl: `http://127.0.0.1:${port}`,
        stop: async () => undefined
      })
    });

    const instance = await service.start({
      projectId: "prj_1",
      apiVersionId: "ver_1",
      revisionId: "rev_1",
      rawContent: "openapi: 3.0.3\ninfo:\n  title: Todo\n  version: 1.0.0\npaths: {}\n"
    });

    expect(instance.status).toBe("running");
    expect(instance.baseUrl).toContain("http://127.0.0.1:");

    const stopped = await service.stop(instance.id);
    expect(stopped.status).toBe("stopped");
  });
});
```

- [ ] **Step 2: Run test to verify RED**

Run:

```bash
npm run test -w @carta/api -- mock.service.spec.ts
```

Expected: FAIL because mock service does not exist.

- [ ] **Step 3: Implement mock service and Prism adapter**

Create `apps/api/src/mock/mock.service.ts`:

```ts
import { Injectable, NotFoundException } from "@nestjs/common";
import { nanoid } from "nanoid";

export interface StartMockInput {
  projectId: string;
  apiVersionId: string;
  revisionId: string;
  rawContent: string;
}

export interface MockInstance {
  id: string;
  projectId: string;
  apiVersionId: string;
  revisionId: string;
  baseUrl: string;
  status: "running" | "stopped" | "failed" | "needs_reload";
  port: number;
  startedAt: string | null;
  stoppedAt: string | null;
  lastError: string | null;
}

export interface MockProcessAdapter {
  start(input: StartMockInput & { port: number }): Promise<{ baseUrl: string; stop: () => Promise<void> }>;
}

@Injectable()
export class MockService {
  private readonly instances = new Map<string, MockInstance>();
  private readonly stops = new Map<string, () => Promise<void>>();
  private nextPort = 5100;

  constructor(private readonly adapter: MockProcessAdapter) {}

  list(): MockInstance[] {
    return [...this.instances.values()];
  }

  async start(input: StartMockInput): Promise<MockInstance> {
    const port = this.nextPort++;
    const process = await this.adapter.start({ ...input, port });
    const instance: MockInstance = {
      id: `mock_${nanoid(12)}`,
      projectId: input.projectId,
      apiVersionId: input.apiVersionId,
      revisionId: input.revisionId,
      baseUrl: process.baseUrl,
      status: "running",
      port,
      startedAt: new Date().toISOString(),
      stoppedAt: null,
      lastError: null
    };
    this.instances.set(instance.id, instance);
    this.stops.set(instance.id, process.stop);
    return instance;
  }

  async stop(id: string): Promise<MockInstance> {
    const instance = this.instances.get(id);
    if (!instance) throw new NotFoundException("Mock instance not found");
    await this.stops.get(id)?.();
    const stopped = { ...instance, status: "stopped" as const, stoppedAt: new Date().toISOString() };
    this.instances.set(id, stopped);
    this.stops.delete(id);
    return stopped;
  }
}
```

Create `apps/api/src/mock/prism-process.ts`:

```ts
import { spawn } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { MockProcessAdapter, StartMockInput } from "./mock.service";

export class PrismProcessAdapter implements MockProcessAdapter {
  async start(input: StartMockInput & { port: number }) {
    const dir = mkdtempSync(join(tmpdir(), "carta-prism-"));
    const specPath = join(dir, "openapi.yaml");
    writeFileSync(specPath, input.rawContent);
    const child = spawn("npx", ["prism", "mock", specPath, "--host", "127.0.0.1", "--port", String(input.port)], {
      stdio: "pipe"
    });
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error("Timed out starting Prism mock")), 5000);
      child.once("error", reject);
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
```

Create `apps/api/src/mock/mock.module.ts`:

```ts
import { Module } from "@nestjs/common";
import { MockController } from "./mock.controller";
import { MockService } from "./mock.service";
import { PrismProcessAdapter } from "./prism-process";
import { ProjectsModule } from "../projects/projects.module";

@Module({
  imports: [ProjectsModule],
  controllers: [MockController],
  providers: [
    {
      provide: MockService,
      useFactory: () => new MockService(new PrismProcessAdapter())
    }
  ],
  exports: [MockService]
})
export class MockModule {}
```

- [ ] **Step 4: Wire mock routes**

Create `apps/api/src/mock/mock.controller.ts`:

```ts
import { Controller, Get, Param, Post } from "@nestjs/common";
import { MockService } from "./mock.service";
import { ProjectsService } from "../projects/projects.service";

@Controller("/api")
export class MockController {
  constructor(
    private readonly mock: MockService,
    private readonly projects: ProjectsService
  ) {}

  @Post("projects/:projectId/mock/start")
  async startMock(@Param("projectId") projectId: string) {
    const input = await this.projects.getLatestMockInput(projectId);
    return this.mock.start(input);
  }

  @Get("mock")
  listMocks() {
    return this.mock.list();
  }

  @Post("mock/:mockId/stop")
  async stopMock(@Param("mockId") mockId: string) {
    return this.mock.stop(mockId);
  }
}
```

Add `getLatestMockInput(projectId)` to `ProjectsService`:

```ts
  async getLatestMockInput(projectId: string) {
    const version = await this.findCurrentVersion(projectId);
    const revision = await this.db
      .selectFrom("source_revisions")
      .selectAll()
      .where("api_version_id", "=", version.id)
      .orderBy("created_at", "desc")
      .executeTakeFirst();
    if (!revision) throw new NotFoundException("No source revision found");
    return {
      projectId,
      apiVersionId: version.id,
      revisionId: revision.id,
      rawContent: revision.raw_content
    };
  }
```

Import `MockModule` in `AppModule`:

```ts
import { Module } from "@nestjs/common";
import { MockModule } from "./mock/mock.module";
import { ProjectsModule } from "./projects/projects.module";

@Module({
  imports: [ProjectsModule, MockModule]
})
export class AppModule {}
```

- [ ] **Step 5: Run tests and checks**

Run:

```bash
npm run test -w @carta/api -- mock.service.spec.ts
npm run typecheck -w @carta/api
```

Expected: tests and typecheck pass.

- [ ] **Step 6: Commit**

```bash
git add apps/api/src/mock apps/api/src/app.module.ts apps/api/src/projects
git commit -m "feat: add prism mock runtime"
```

---

## Task 7: React Web Console with Ant Design and Stoplight Elements

**Files:**

- Create: `apps/web/src/api/client.ts`
- Create: `apps/web/src/pages/CatalogPage.tsx`
- Create: `apps/web/src/pages/ProjectPage.tsx`
- Create: `apps/web/src/App.test.tsx`
- Modify: `apps/web/src/App.tsx`
- Modify: `apps/web/src/main.tsx`
- Modify: `apps/web/src/styles.css`

- [ ] **Step 1: Write failing web flow test**

Create `apps/web/src/App.test.tsx`:

```tsx
import "@testing-library/jest-dom/vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test, vi } from "vitest";
import { App } from "./App";

describe("Carta web console", () => {
  test("creates a project and saves OpenAPI", async () => {
    vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(json([]))
      .mockResolvedValueOnce(json({ id: "prj_1", name: "Todo API", code: "todo", ownerTeam: "platform", currentVersion: { id: "ver_1", status: "draft" } }))
      .mockResolvedValueOnce(json({ id: "rev_1", parseStatus: "valid" }))
      .mockResolvedValueOnce(json([{ path: "/todos", method: "GET", operation_id: "listTodos" }]));

    render(<App />);
    await userEvent.type(screen.getByLabelText("Project name"), "Todo API");
    await userEvent.type(screen.getByLabelText("Project code"), "todo");
    await userEvent.click(screen.getByRole("button", { name: "Create project" }));
    await userEvent.click(screen.getByRole("button", { name: "Save OpenAPI" }));

    await waitFor(() => expect(screen.getByText("Saved revision rev_1")).toBeInTheDocument());
  });
});

function json(body: unknown) {
  return Promise.resolve(new Response(JSON.stringify(body), { status: 200, headers: { "Content-Type": "application/json" } }));
}
```

- [ ] **Step 2: Run test to verify RED**

Run:

```bash
npm run test -w @carta/web -- App.test.tsx
```

Expected: FAIL because the web console has no forms or API client.

- [ ] **Step 3: Implement API client**

Create `apps/web/src/api/client.ts`:

```ts
export interface Project {
  id: string;
  name: string;
  code: string;
  ownerTeam?: string;
  currentVersion?: { id: string; status: string };
}

export interface Endpoint {
  path: string;
  method: string;
  operation_id?: string | null;
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init.headers ?? {})
    }
  });
  if (!response.ok) throw new Error(await response.text());
  return response.json() as Promise<T>;
}

export const api = {
  listProjects: () => request<Project[]>("/api/projects"),
  createProject: (input: { name: string; code: string; ownerTeam: string; sourceMode: string }) =>
    request<Project>("/api/projects", { method: "POST", body: JSON.stringify(input) }),
  saveOpenApi: (projectId: string, rawContent: string) =>
    request<{ id: string; parseStatus: string }>(`/api/projects/${projectId}/revisions`, {
      method: "POST",
      body: JSON.stringify({ sourceMode: "standalone", rawContent })
    }),
  listEndpoints: (projectId: string) => request<Endpoint[]>(`/api/projects/${projectId}/endpoints`),
  startMock: (projectId: string) => request<{ baseUrl: string; status: string }>(`/api/projects/${projectId}/mock/start`, { method: "POST" })
};
```

- [ ] **Step 4: Implement pages**

Create `apps/web/src/pages/CatalogPage.tsx`:

```tsx
import { Button, Form, Input, List } from "antd";
import type { Project } from "../api/client";

export function CatalogPage(props: {
  projects: Project[];
  onCreate: (input: { name: string; code: string }) => void;
  onSelect: (project: Project) => void;
}) {
  return (
    <aside className="catalog-panel">
      <Form layout="vertical" onFinish={(values) => props.onCreate(values as { name: string; code: string })}>
        <Form.Item label="Project name" name="name" rules={[{ required: true }]}>
          <Input />
        </Form.Item>
        <Form.Item label="Project code" name="code" rules={[{ required: true }]}>
          <Input />
        </Form.Item>
        <Button htmlType="submit" type="primary">Create project</Button>
      </Form>
      <List
        dataSource={props.projects}
        renderItem={(project) => (
          <List.Item>
            <Button type="link" onClick={() => props.onSelect(project)}>{project.name}</Button>
          </List.Item>
        )}
      />
    </aside>
  );
}
```

Create `apps/web/src/pages/ProjectPage.tsx`:

```tsx
import { Button, Space, Table, Typography } from "antd";
import Editor from "@monaco-editor/react";
import { API } from "@stoplight/elements";
import "@stoplight/elements/styles.min.css";
import type { Endpoint, Project } from "../api/client";

const starterSpec = `openapi: 3.0.3
info:
  title: New API
  version: 0.1.0
paths: {}
`;

export function ProjectPage(props: {
  project: Project | null;
  source: string;
  endpoints: Endpoint[];
  status: string;
  mockUrl: string;
  onSourceChange: (value: string) => void;
  onSave: () => void;
  onStartMock: () => void;
}) {
  if (!props.project) return <section className="empty-state">Create or select an API project.</section>;

  return (
    <section className="project-panel">
      <Space className="project-toolbar">
        <Typography.Title level={3}>{props.project.name}</Typography.Title>
        <Button type="primary" onClick={props.onSave}>Save OpenAPI</Button>
        <Button onClick={props.onStartMock}>Start mock</Button>
      </Space>
      {props.status && <Typography.Text>{props.status}</Typography.Text>}
      {props.mockUrl && <Typography.Paragraph>Mock URL: <code>{props.mockUrl}</code></Typography.Paragraph>}
      <div className="project-grid">
        <section>
          <Editor height="360px" language="yaml" value={props.source || starterSpec} onChange={(value) => props.onSourceChange(value ?? "")} />
          <Table
            rowKey={(row) => `${row.method}-${row.path}`}
            dataSource={props.endpoints}
            pagination={false}
            columns={[
              { title: "Method", dataIndex: "method" },
              { title: "Path", dataIndex: "path" },
              { title: "Operation", dataIndex: "operation_id" }
            ]}
          />
        </section>
        <section className="docs-panel">
          <API apiDescriptionUrl={`/api/projects/${props.project.id}/docs/openapi.yaml`} router="hash" />
        </section>
      </div>
    </section>
  );
}
```

- [ ] **Step 5: Wire application shell**

Modify `apps/web/src/App.tsx`:

```tsx
import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query";
import { Layout } from "antd";
import { useEffect, useState } from "react";
import { api, type Endpoint, type Project } from "./api/client";
import { CatalogPage } from "./pages/CatalogPage";
import { ProjectPage } from "./pages/ProjectPage";

const queryClient = new QueryClient();
const starterSpec = `openapi: 3.0.3
info:
  title: New API
  version: 0.1.0
paths: {}
`;

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <CartaShell />
    </QueryClientProvider>
  );
}

function CartaShell() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selected, setSelected] = useState<Project | null>(null);
  const [source, setSource] = useState(starterSpec);
  const [endpoints, setEndpoints] = useState<Endpoint[]>([]);
  const [status, setStatus] = useState("");
  const [mockUrl, setMockUrl] = useState("");

  const projectsQuery = useQuery({
    queryKey: ["projects"],
    queryFn: api.listProjects
  });

  useEffect(() => {
    if (projectsQuery.data) setProjects(projectsQuery.data);
  }, [projectsQuery.data]);

  async function createProject(input: { name: string; code: string }) {
    const project = await api.createProject({ ...input, ownerTeam: "platform", sourceMode: "standalone" });
    setProjects([project, ...projects]);
    setSelected(project);
    setStatus(`Created project ${project.name}`);
  }

  async function saveOpenApi() {
    if (!selected) return;
    const revision = await api.saveOpenApi(selected.id, source);
    setStatus(`Saved revision ${revision.id}`);
    setEndpoints(await api.listEndpoints(selected.id));
  }

  async function startMock() {
    if (!selected) return;
    const mock = await api.startMock(selected.id);
    setMockUrl(mock.baseUrl);
    setStatus(`Mock running at ${mock.baseUrl}`);
  }

  return (
    <Layout className="app-shell">
      <Layout.Header className="topbar">Carta</Layout.Header>
      <Layout>
        <CatalogPage projects={projects} onCreate={createProject} onSelect={setSelected} />
        <Layout.Content className="content">
          <ProjectPage
            project={selected}
            source={source}
            endpoints={endpoints}
            status={status}
            mockUrl={mockUrl}
            onSourceChange={setSource}
            onSave={saveOpenApi}
            onStartMock={startMock}
          />
        </Layout.Content>
      </Layout>
    </Layout>
  );
}
```

- [ ] **Step 6: Run tests and checks**

Run:

```bash
npm run test -w @carta/web -- App.test.tsx
npm run typecheck -w @carta/web
npm run build -w @carta/web
```

Expected: tests, typecheck, and build pass.

- [ ] **Step 7: Commit**

```bash
git add apps/web package-lock.json
git commit -m "feat: add stoplight-based web console"
```

---

## Task 8: Sample Spec, README, and Final Verification

**Files:**

- Create: `samples/todo-openapi.yaml`
- Modify: `README.md`

- [ ] **Step 1: Create sample OpenAPI**

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

## Stack

- Backend: NestJS with Fastify adapter.
- Database: PostgreSQL with Kysely and node-pg-migrate.
- Web: React, Vite, Ant Design, TanStack Query.
- API docs: Stoplight Elements.
- Mock: Stoplight Prism.

## Development

Install dependencies:

```bash
npm install
```

Start PostgreSQL and run migrations:

```bash
npm run db:up
npm run db:migrate
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
```

- [ ] **Step 3: Run full verification**

Run:

```bash
npm run db:up
npm run db:migrate
npm run test
npm run typecheck
npm run build
```

Expected: all pass.

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

- API listens on `http://localhost:4000`.
- Web console listens on `http://127.0.0.1:5173`.

- [ ] **Step 5: Commit**

```bash
git add README.md samples
git commit -m "docs: document modern carta mvp workflow"
```

---

## 5. Review Passes

### Review Pass 1: Product and Stack Fit

- NestJS gives long-term platform module boundaries.
- Fastify adapter keeps the HTTP runtime modern and efficient.
- PostgreSQL matches relational lifecycle, report, audit, and permission needs.
- JSONB covers OpenAPI parse artifacts without introducing a separate document database.
- Kysely keeps SQL explicit and typed.
- Stoplight Elements matches the desired Stoplight-like documentation experience better than Swagger UI.
- Prism stays the mock runtime because mocks must be derived from OpenAPI.

### Review Pass 2: MVP Coverage

- Project Registry is covered by Task 4.
- Platform-managed OpenAPI authoring is covered by Task 3, Task 4, and Task 7.
- Source Revision is covered by Task 2 and Task 4.
- Parse validation is covered by Task 3 and Task 4.
- Catalog and docs are covered by Task 5 and Task 7.
- Prism mock management is covered by Task 6 and Task 7.
- Local sample and developer workflow are covered by Task 8.

### Review Pass 3: Scope Discipline

- Git writeback is not implemented.
- Branch/MR workflow is not implemented.
- API diff is not implemented.
- Spectral lint is not implemented, but stack choice leaves it easy to add.
- Lifecycle approval workflow is not implemented.
- Contract Test is not implemented.
- RBAC is not implemented.

### Review Pass 4: SDD Readiness

- Each task has explicit files.
- Each behavior task starts with a failing test.
- Each implementation step names concrete modules and methods.
- Each task has clear verification commands.
- Each task ends with a small commit.

---

## 6. Reference Notes

- Stoplight Elements is used because it provides embeddable React and Web Components for OpenAPI-powered API documentation.
- Prism is used because it provides OpenAPI-derived HTTP mock servers.
- PostgreSQL is used because Carta needs relational workflow state plus JSONB for OpenAPI parse artifacts.
- NestJS is used because the platform needs durable module boundaries for future Git sync, CI integration, permissions, audit, and worker modules.
