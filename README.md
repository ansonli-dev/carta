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
