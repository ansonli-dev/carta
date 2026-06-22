import { describe, expect, test } from "vitest";
import { createKyselyForTest } from "./database.js";

describe("database schema", () => {
  test("can insert an API project and draft version", async () => {
    const db = await createKyselyForTest();
    const suffix = Date.now().toString(36);
    const projectId = `prj_test_${suffix}`;
    const versionId = `ver_test_${suffix}`;

    try {
      const project = await db
        .insertInto("api_projects")
        .values({
          id: projectId,
          name: "Todo API",
          code: `todo-${suffix}`,
          owner_team: "platform",
          source_mode: "standalone",
          tags: JSON.stringify(["internal"]),
          created_at: new Date(),
          updated_at: new Date(),
        })
        .returningAll()
        .executeTakeFirstOrThrow();

      await db
        .insertInto("api_versions")
        .values({
          id: versionId,
          project_id: project.id,
          version: "0.1.0",
          status: "draft",
          created_at: new Date(),
          updated_at: new Date(),
        })
        .execute();

      const version = await db
        .selectFrom("api_versions")
        .selectAll()
        .where("project_id", "=", project.id)
        .executeTakeFirstOrThrow();
      expect(version.status).toBe("draft");
    } finally {
      try {
        await db.deleteFrom("api_projects").where("id", "=", projectId).execute();
      } finally {
        await db.destroy();
      }
    }
  });
});
