import { Kysely, PostgresDialect, type ColumnType, type Insertable, type Selectable } from "kysely";
import { Pool } from "pg";

type TimestampColumn = ColumnType<Date, Date | string, Date | string>;
type JsonColumn = ColumnType<unknown, unknown | string, unknown | string>;
type DefaultJsonColumn = ColumnType<unknown, unknown | string | undefined, unknown | string>;

export interface ApiProjectsTable {
  id: string;
  name: string;
  code: string;
  owner_team: string;
  domain: string | null;
  description: string | null;
  source_mode: string;
  tags: DefaultJsonColumn;
  created_at: TimestampColumn;
  updated_at: TimestampColumn;
}

export interface ApiVersionsTable {
  id: string;
  project_id: string;
  version: string;
  status: string;
  created_at: TimestampColumn;
  updated_at: TimestampColumn;
}

export interface SourceRevisionsTable {
  id: string;
  api_version_id: string;
  source_mode: string;
  raw_content: string;
  parsed_document: JsonColumn | null;
  content_hash: string;
  parse_status: string;
  parse_errors: DefaultJsonColumn;
  created_at: TimestampColumn;
}

export interface ApiEndpointsTable {
  id: string;
  api_version_id: string;
  path: string;
  method: string;
  operation_id: string | null;
  summary: string | null;
  tags: DefaultJsonColumn;
  deprecated: ColumnType<boolean, boolean | undefined, boolean>;
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
  started_at: TimestampColumn | null;
  stopped_at: TimestampColumn | null;
  created_at: TimestampColumn;
  updated_at: TimestampColumn;
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
      pool: new Pool({
        connectionString: databaseUrl,
      }),
    }),
  });
}

export async function createKyselyForTest(): Promise<Kysely<CartaDatabase>> {
  const databaseUrl = process.env.TEST_DATABASE_URL ?? process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("TEST_DATABASE_URL or DATABASE_URL is required for database tests");
  }

  return createKysely(databaseUrl);
}
