import { createHash } from "node:crypto";
import { Inject, Injectable, NotFoundException, UnprocessableEntityException } from "@nestjs/common";
import type { Kysely, Transaction } from "kysely";
import { nanoid } from "nanoid";
import { DATABASE } from "../database/database.module.js";
import type { CartaDatabase } from "../database/database.js";
import { OpenApiService } from "../openapi/openapi.service.js";
import { defaultOpenApiSource } from "./default-openapi-source.js";

type CreateProjectInput = {
  name: string;
  code: string;
  ownerTeam: string;
  sourceMode: string;
};

type SaveRevisionInput = {
  sourceMode: string;
  rawContent: string;
};

@Injectable()
export class ProjectsService {
  constructor(
    @Inject(DATABASE) private readonly db: Kysely<CartaDatabase>,
    @Inject(OpenApiService) private readonly openapi: OpenApiService,
  ) {}

  async createProject(input: CreateProjectInput) {
    const now = new Date();
    const projectId = `prj_${nanoid(12)}`;
    const versionId = `ver_${nanoid(12)}`;
    const revisionId = `rev_${nanoid(12)}`;
    const rawContent = defaultOpenApiSource(input.name);
    const parsed = await this.openapi.parse(rawContent);

    if (parsed.status === "invalid") {
      throw new UnprocessableEntityException({ errors: parsed.errors });
    }

    await this.db.transaction().execute(async (trx) => {
      await trx
        .insertInto("api_projects")
        .values({
          id: projectId,
          name: input.name,
          code: input.code,
          owner_team: input.ownerTeam,
          source_mode: input.sourceMode,
          tags: JSON.stringify([]),
          created_at: now,
          updated_at: now,
        })
        .execute();

      await trx
        .insertInto("api_versions")
        .values({
          id: versionId,
          project_id: projectId,
          version: "0.1.0",
          status: "draft",
          created_at: now,
          updated_at: now,
        })
        .execute();

      await this.insertSourceRevision(trx, {
        versionId,
        revisionId,
        sourceMode: input.sourceMode,
        rawContent,
        parsedDocument: parsed.document,
        endpoints: parsed.endpoints,
        createdAt: now,
      });
    });

    return {
      id: projectId,
      name: input.name,
      code: input.code,
      ownerTeam: input.ownerTeam,
      sourceMode: input.sourceMode,
      currentVersion: {
        id: versionId,
        status: "draft",
      },
    };
  }

  async listProjects() {
    return this.db.selectFrom("api_projects").selectAll().orderBy("updated_at", "desc").execute();
  }

  async saveRevision(projectId: string, input: SaveRevisionInput) {
    const version = await this.findCurrentVersion(projectId);

    const parsed = await this.openapi.parse(input.rawContent);
    if (parsed.status === "invalid") {
      throw new UnprocessableEntityException({ errors: parsed.errors });
    }

    const revisionId = `rev_${nanoid(12)}`;
    const contentHash = createHash("sha256").update(input.rawContent).digest("hex");

    await this.db.transaction().execute(async (trx) => {
      await trx
        .selectFrom("api_versions")
        .select(["id"])
        .where("id", "=", version.id)
        .forUpdate()
        .executeTakeFirstOrThrow();

      let createdAt = new Date();
      const latestRevision = await trx
        .selectFrom("source_revisions")
        .select(["created_at"])
        .where("api_version_id", "=", version.id)
        .orderBy("created_at", "desc")
        .executeTakeFirst();

      if (latestRevision && latestRevision.created_at >= createdAt) {
        createdAt = new Date(latestRevision.created_at.getTime() + 1);
      }

      await trx.deleteFrom("api_endpoints").where("api_version_id", "=", version.id).execute();

      await this.insertSourceRevision(trx, {
        versionId: version.id,
        revisionId,
        sourceMode: input.sourceMode,
        rawContent: input.rawContent,
        parsedDocument: parsed.document,
        endpoints: parsed.endpoints,
        createdAt,
        contentHash,
      });
    });

    return {
      id: revisionId,
      parseStatus: "valid",
      title: parsed.title,
      version: parsed.version,
    };
  }

  async listEndpoints(projectId: string) {
    const version = await this.findCurrentVersion(projectId);

    let endpoints = await this.db
      .selectFrom("api_endpoints")
      .selectAll()
      .where("api_version_id", "=", version.id)
      .orderBy("path", "asc")
      .orderBy("method", "asc")
      .execute();

    if (endpoints.length === 0) {
      const revision = await this.db
        .selectFrom("source_revisions")
        .select(["id"])
        .where("api_version_id", "=", version.id)
        .executeTakeFirst();

      if (!revision) {
        await this.createDefaultRevision(projectId, version.id);
        endpoints = await this.db
          .selectFrom("api_endpoints")
          .selectAll()
          .where("api_version_id", "=", version.id)
          .orderBy("path", "asc")
          .orderBy("method", "asc")
          .execute();
      }
    }

    return endpoints;
  }

  async getLatestOpenApiSource(projectId: string) {
    const version = await this.findCurrentVersion(projectId);
    const revision = await this.db
      .selectFrom("source_revisions")
      .select(["raw_content"])
      .where("api_version_id", "=", version.id)
      .orderBy("created_at", "desc")
      .orderBy("id", "desc")
      .executeTakeFirst();

    if (!revision) {
      return (await this.createDefaultRevision(projectId, version.id)).rawContent;
    }

    return revision.raw_content;
  }

  async getLatestMockInput(projectId: string) {
    const version = await this.findCurrentVersion(projectId);
    let revision = await this.db
      .selectFrom("source_revisions")
      .select(["id", "raw_content"])
      .where("api_version_id", "=", version.id)
      .orderBy("created_at", "desc")
      .orderBy("id", "desc")
      .executeTakeFirst();

    if (!revision) {
      const backfilled = await this.createDefaultRevision(projectId, version.id);
      revision = {
        id: backfilled.revisionId,
        raw_content: backfilled.rawContent,
      };
    }

    return {
      projectId,
      apiVersionId: version.id,
      revisionId: revision.id,
      rawContent: revision.raw_content,
    };
  }

  private async createDefaultRevision(projectId: string, versionId: string) {
    const project = await this.db
      .selectFrom("api_projects")
      .select(["name", "source_mode"])
      .where("id", "=", projectId)
      .executeTakeFirst();

    if (!project) {
      throw new NotFoundException("Project not found");
    }

    const rawContent = defaultOpenApiSource(project.name);
    const parsed = await this.openapi.parse(rawContent);

    if (parsed.status === "invalid") {
      throw new UnprocessableEntityException({ errors: parsed.errors });
    }

    const revisionId = `rev_${nanoid(12)}`;
    await this.db.transaction().execute(async (trx) => {
      const existingRevision = await trx
        .selectFrom("source_revisions")
        .select(["id"])
        .where("api_version_id", "=", versionId)
        .forUpdate()
        .executeTakeFirst();

      if (existingRevision) {
        return;
      }

      await this.insertSourceRevision(trx, {
        versionId,
        revisionId,
        sourceMode: project.source_mode,
        rawContent,
        parsedDocument: parsed.document,
        endpoints: parsed.endpoints,
        createdAt: new Date(),
      });
    });

    return {
      revisionId,
      rawContent,
    };
  }

  private async insertSourceRevision(
    db: Kysely<CartaDatabase> | Transaction<CartaDatabase>,
    input: {
      versionId: string;
      revisionId: string;
      sourceMode: string;
      rawContent: string;
      parsedDocument: unknown;
      endpoints: Array<{
        path: string;
        method: string;
        operationId: string | null;
        summary: string | null;
        tags: string[];
        deprecated: boolean;
      }>;
      createdAt: Date;
      contentHash?: string;
    },
  ) {
    await db
      .insertInto("source_revisions")
      .values({
        id: input.revisionId,
        api_version_id: input.versionId,
        source_mode: input.sourceMode,
        raw_content: input.rawContent,
        parsed_document: input.parsedDocument,
        content_hash: input.contentHash ?? createHash("sha256").update(input.rawContent).digest("hex"),
        parse_status: "valid",
        parse_errors: JSON.stringify([]),
        created_at: input.createdAt,
      })
      .execute();

    if (input.endpoints.length > 0) {
      await db
        .insertInto("api_endpoints")
        .values(
          input.endpoints.map((endpoint) => ({
            id: `end_${nanoid(12)}`,
            api_version_id: input.versionId,
            path: endpoint.path,
            method: endpoint.method,
            operation_id: endpoint.operationId,
            summary: endpoint.summary,
            tags: JSON.stringify(endpoint.tags),
            deprecated: endpoint.deprecated,
          })),
        )
        .execute();
    }
  }

  private async findCurrentVersion(projectId: string) {
    const version = await this.db
      .selectFrom("api_versions")
      .select(["id"])
      .where("project_id", "=", projectId)
      .orderBy("created_at", "desc")
      .orderBy("id", "desc")
      .executeTakeFirst();

    if (!version) {
      throw new NotFoundException("Project not found");
    }

    return version;
  }
}
