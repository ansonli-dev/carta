import { createHash } from "node:crypto";
import { Inject, Injectable, NotFoundException, UnprocessableEntityException } from "@nestjs/common";
import type { Kysely } from "kysely";
import { nanoid } from "nanoid";
import { DATABASE } from "../database/database.module.js";
import type { CartaDatabase } from "../database/database.js";
import { OpenApiService } from "../openapi/openapi.service.js";

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
    private readonly openapi: OpenApiService,
  ) {}

  async createProject(input: CreateProjectInput) {
    const now = new Date();
    const projectId = `prj_${nanoid(12)}`;
    const versionId = `ver_${nanoid(12)}`;

    await this.db.transaction().execute(async (trx) => {
      await trx
        .insertInto("api_projects")
        .values({
          id: projectId,
          name: input.name,
          code: input.code,
          owner_team: input.ownerTeam,
          source_mode: input.sourceMode,
          tags: [],
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
    const version = await this.db
      .selectFrom("api_versions")
      .innerJoin("api_projects", "api_projects.id", "api_versions.project_id")
      .select(["api_versions.id"])
      .where("api_projects.id", "=", projectId)
      .orderBy("api_versions.created_at", "desc")
      .executeTakeFirst();

    if (!version) {
      throw new NotFoundException("Project not found");
    }

    const parsed = await this.openapi.parse(input.rawContent);
    if (parsed.status === "invalid") {
      throw new UnprocessableEntityException({ errors: parsed.errors });
    }

    const now = new Date();
    const revisionId = `rev_${nanoid(12)}`;
    const contentHash = createHash("sha256").update(input.rawContent).digest("hex");

    await this.db.transaction().execute(async (trx) => {
      await trx
        .insertInto("source_revisions")
        .values({
          id: revisionId,
          api_version_id: version.id,
          source_mode: input.sourceMode,
          raw_content: input.rawContent,
          parsed_document: parsed.document,
          content_hash: contentHash,
          parse_status: "valid",
          parse_errors: [],
          created_at: now,
        })
        .execute();

      await trx.deleteFrom("api_endpoints").where("api_version_id", "=", version.id).execute();

      if (parsed.endpoints.length > 0) {
        await trx
          .insertInto("api_endpoints")
          .values(
            parsed.endpoints.map((endpoint) => ({
              id: `end_${nanoid(12)}`,
              api_version_id: version.id,
              path: endpoint.path,
              method: endpoint.method,
              operation_id: endpoint.operationId,
              summary: endpoint.summary,
              tags: endpoint.tags,
              deprecated: endpoint.deprecated,
            })),
          )
          .execute();
      }
    });

    return {
      id: revisionId,
      parseStatus: "valid",
      title: parsed.title,
      version: parsed.version,
    };
  }
}
