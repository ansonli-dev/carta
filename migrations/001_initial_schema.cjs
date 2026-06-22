exports.up = (pgm) => {
  pgm.createTable("api_projects", {
    id: { type: "text", primaryKey: true },
    name: { type: "text", notNull: true },
    code: { type: "text", notNull: true, unique: true },
    owner_team: { type: "text", notNull: true },
    domain: { type: "text" },
    description: { type: "text" },
    source_mode: { type: "text", notNull: true },
    tags: { type: "jsonb", notNull: true, default: pgm.func("'[]'::jsonb") },
    created_at: { type: "timestamptz", notNull: true },
    updated_at: { type: "timestamptz", notNull: true },
  });

  pgm.createTable("api_versions", {
    id: { type: "text", primaryKey: true },
    project_id: {
      type: "text",
      notNull: true,
      references: "api_projects",
      onDelete: "CASCADE",
    },
    version: { type: "text", notNull: true },
    status: { type: "text", notNull: true },
    created_at: { type: "timestamptz", notNull: true },
    updated_at: { type: "timestamptz", notNull: true },
  });

  pgm.createTable("source_revisions", {
    id: { type: "text", primaryKey: true },
    api_version_id: {
      type: "text",
      notNull: true,
      references: "api_versions",
      onDelete: "CASCADE",
    },
    source_mode: { type: "text", notNull: true },
    raw_content: { type: "text", notNull: true },
    parsed_document: { type: "jsonb" },
    content_hash: { type: "text", notNull: true },
    parse_status: { type: "text", notNull: true },
    parse_errors: { type: "jsonb", notNull: true, default: pgm.func("'[]'::jsonb") },
    created_at: { type: "timestamptz", notNull: true },
  });

  pgm.createTable("api_endpoints", {
    id: { type: "text", primaryKey: true },
    api_version_id: {
      type: "text",
      notNull: true,
      references: "api_versions",
      onDelete: "CASCADE",
    },
    path: { type: "text", notNull: true },
    method: { type: "text", notNull: true },
    operation_id: { type: "text" },
    summary: { type: "text" },
    tags: { type: "jsonb", notNull: true, default: pgm.func("'[]'::jsonb") },
    deprecated: { type: "boolean", notNull: true, default: false },
  });

  pgm.createTable("mock_instances", {
    id: { type: "text", primaryKey: true },
    project_id: {
      type: "text",
      notNull: true,
      references: "api_projects",
      onDelete: "CASCADE",
    },
    api_version_id: {
      type: "text",
      notNull: true,
      references: "api_versions",
      onDelete: "CASCADE",
    },
    revision_id: {
      type: "text",
      notNull: true,
      references: "source_revisions",
      onDelete: "CASCADE",
    },
    status: { type: "text", notNull: true },
    base_url: { type: "text" },
    port: { type: "integer" },
    last_error: { type: "text" },
    started_at: { type: "timestamptz" },
    stopped_at: { type: "timestamptz" },
    created_at: { type: "timestamptz", notNull: true },
    updated_at: { type: "timestamptz", notNull: true },
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
