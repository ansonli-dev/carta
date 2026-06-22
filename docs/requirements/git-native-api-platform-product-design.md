# Git-native API Platform Product Design

> Version: v0.1
> Source PRD: `docs/requirements/git-native-api-platform-requirements.md`
> Purpose: refine the full product design, extract Epic/Feature/Story requirements, and define an agile iteration plan.

---

## 1. Product Vision

Carta is an internal API lifecycle platform for teams that want API contracts to be managed like code.

The platform should make OpenAPI the center of API collaboration:

- API design is authored as OpenAPI.
- API documentation is rendered from OpenAPI.
- Mock servers are derived from OpenAPI.
- API changes are reviewed through OpenAPI diff and lint results.
- CI/CD can validate OpenAPI quality and compatibility.
- Git can become the source of truth when a project is connected to a repository.

The platform is not an API Gateway, not a production traffic proxy, and not a public developer portal. It is a control plane for API contracts, collaboration, validation, mocking, and governance.

---

## 2. Design Principles

### 2.1 OpenAPI-first

OpenAPI is the primary contract format. Documentation, mock behavior, endpoint catalog, schema views, lint reports, diff reports, and contract-test inputs are derived from OpenAPI.

### 2.2 Source-mode Aware

The platform must support both early design workflows and mature Git-based workflows.

Before Git integration, users may create, edit, upload, and manage OpenAPI files inside the platform. After Git integration is enabled for a project, Git becomes the source of truth for all OpenAPI files in that project.

### 2.3 Git-native When Connected

For Git-connected projects:

- The platform reads OpenAPI files from Git.
- Page edits must be synchronized back to Git.
- The database stores metadata, parse results, indexes, reports, mock state, and audit records.
- The database must not silently become the source of truth for OpenAPI content.

### 2.4 Derived Mock and Docs

Mock servers and API documentation must be generated from OpenAPI. The platform should not introduce a separate mock DSL that can drift away from the contract.

### 2.5 Complete Design, Incremental Delivery

The product design should cover the full platform capability map. MVP is a delivery decision made during iteration planning, not a reason to omit long-term architecture.

### 2.6 Local-first and Self-hosted

The platform must support local and internal-network deployment. External SaaS dependencies must be optional, not required.

---

## 3. Personas and Jobs

The platform uses four simplified internal personas.

### 3.1 API Consumer

Represents BA, frontend developers, QA, downstream service developers, and anyone who consumes an API contract.

Jobs:

- Find an API by service, domain, tag, endpoint, or schema.
- Read API documentation and examples.
- Use a mock base URL during development or testing.
- Understand what changed between versions.
- See whether an API is draft, approved, released, deprecated, or archived.

### 3.2 API Maintainer

Represents backend developers and service owners who maintain API contracts.

Jobs:

- Create or import an API project.
- Edit OpenAPI in code mode or form mode.
- Upload OpenAPI YAML/JSON.
- Connect an API project to Git.
- Fix validation and lint issues.
- Start, stop, restart, and inspect mock servers.
- Prepare an API version for review or release.

### 3.3 API Reviewer

Represents TLs, architects, and technical reviewers.

Jobs:

- Review API design before release.
- Inspect diff and breaking-change reports.
- Approve, reject, release, deprecate, or archive API versions.
- Enforce API style and compatibility expectations.
- Review exceptions for breaking changes when needed.

### 3.4 Platform Admin

Represents the platform operator or DevOps owner.

Jobs:

- Configure Git providers and credentials.
- Configure lint rules and governance policies.
- Manage project access policy.
- Operate platform deployment, storage, logs, metrics, and health checks.
- Maintain integration settings for CI/CD and mock runtime.

---

## 4. System Context

```text
                 +---------------------------+
                 |         Git Repo          |
                 | OpenAPI / Markdown / Docs |
                 +-------------+-------------+
                               |
                  optional Git sync / writeback
                               |
                               v
+------------------+   +--------------------+   +-------------------+
| Web Console      |   | Platform Backend   |   | Worker Runtime    |
| Catalog / Editor |-->| Metadata / API     |-->| Parse / Lint/Diff |
| Docs / Reports   |   | Source Management  |   | Mock Process Mgmt |
+------------------+   +---------+----------+   +---------+---------+
                                 |                        |
                                 v                        v
                         +---------------+        +----------------+
                         | PostgreSQL    |        | Prism Mock     |
                         | Metadata      |        | Runtime        |
                         +---------------+        +----------------+
```

The platform backend owns project metadata, source mode, parse indexes, validation reports, lifecycle state, mock instance state, permissions, and audit logs.

The OpenAPI source content is owned by either the platform-managed source store or Git, depending on source mode.

---

## 5. Source and Authoring Model

### 5.1 Source Modes

| Source Mode | Description | OpenAPI Source of Truth | Typical Use |
|---|---|---|---|
| `standalone` | OpenAPI is created and edited inside the platform | Platform source store | Early design, internal discussion, quick mock |
| `uploaded` | OpenAPI is uploaded as YAML/JSON and managed as a platform version | Platform source store | Import existing spec without Git |
| `git_connected` | OpenAPI is read from and written back to Git | Git repository | Team collaboration and engineering governance |
| `git_imported` | OpenAPI is imported from Git and then detached | Platform source store after detach | Migration, experiments, temporary fork |

### 5.2 Source Ownership Rules

- `standalone` and `uploaded` projects may be edited and saved directly in the platform.
- `git_connected` projects must write OpenAPI changes back to Git.
- A `git_connected` project may maintain local unsaved or pending changes, but those changes must be clearly marked as not yet synchronized.
- If Git synchronization fails, the project must show `sync_failed` and preserve enough information for retry or manual recovery.
- A project may be disconnected from Git only through an explicit detach operation that creates a platform-owned snapshot.

### 5.3 Editor Modes

The full design follows a Stoplight-like authoring model:

| Editor Mode | Description | Primary User |
|---|---|---|
| Design/Form | Visual editing for endpoints, parameters, request bodies, responses, schemas, examples, and security | API Maintainer, API Reviewer |
| Code | Monaco-based YAML/JSON editing with validation feedback | API Maintainer |
| Preview | Read-only API reference view rendered from OpenAPI | API Consumer, API Reviewer |

MVP may initially deliver Code and Preview first, but the domain model must not prevent Design/Form editing later.

### 5.4 Save and Validation Behavior

On every save:

1. Parse OpenAPI.
2. Validate syntax and required OpenAPI fields.
3. Update endpoint and schema indexes if valid.
4. Refresh documentation view.
5. Mark affected mock instances as `needs_reload` or reload them automatically if configured.
6. For Git-connected projects, execute the configured Git writeback policy.

Validation levels:

- `parse_error`: OpenAPI cannot be parsed.
- `schema_error`: OpenAPI structure is invalid.
- `lint_warning`: style or governance issue.
- `lint_error`: governance issue that may block review or release.

---

## 6. Git Collaboration Model

### 6.1 Git Providers

The design should support provider abstraction for:

- GitHub
- GitLab
- Bitbucket
- Azure DevOps
- generic Git over SSH/HTTPS

Provider-specific MR/PR operations are optional adapters. Basic clone, fetch, branch, commit, and push behavior should work through standard Git where possible.

### 6.2 Git Writeback Policies

| Policy | Description | When to Use |
|---|---|---|
| Direct Commit | Commit changes directly to the configured branch | Small teams, low ceremony, internal prototypes |
| Branch Commit | Create or update a working branch, but do not create MR/PR automatically | Teams that want manual review |
| Merge Request / Pull Request | Commit to a branch and create or update MR/PR | Governed team collaboration |

Projects should configure one default writeback policy. Users with sufficient permission may override it when allowed.

### 6.3 Git Sync States

| State | Meaning |
|---|---|
| `not_connected` | Project has no Git integration |
| `connected` | Git config exists and last sync succeeded |
| `dirty` | Platform has unsynchronized edits |
| `syncing` | Sync is in progress |
| `sync_failed` | Last sync failed |
| `conflict` | Git has conflicting changes that require resolution |
| `detached` | Project was imported from Git but now uses platform source store |

### 6.4 Conflict Handling

When Git has changed since the editor loaded:

- The platform must not overwrite remote changes without detection.
- The user should see local version, remote version, and conflict reason.
- Initial implementation may require the user to reload or manually resolve in code mode.
- Later implementation may provide a visual three-way diff and merge.

---

## 7. API Lifecycle Model

### 7.1 States

```text
Draft -> Review -> Approved -> Released -> Deprecated -> Archived
   ^        |          |            |
   |        v          v            v
   +----- Rework <-----+        Superseded
```

| State | Meaning |
|---|---|
| Draft | API is being designed and may change freely |
| Review | API is ready for reviewer evaluation |
| Approved | API design has been approved but not released |
| Released | API version is published for consumers |
| Deprecated | API version remains visible but should not be used for new integrations |
| Archived | API version is no longer active |

### 7.2 Lifecycle Rules

- Released versions are immutable from the consumer perspective.
- Changing a Released API requires creating a new version or revision.
- Deprecated versions must include replacement version or deprecation reason.
- Review requires a valid OpenAPI parse result.
- Approved and Released states may require lint and diff gates depending on policy.
- All state transitions must be auditable.

---

## 8. Core Domain Model

### 8.1 Entities

| Entity | Purpose |
|---|---|
| Workspace | Optional grouping for internal teams or organizations |
| API Project | A product/service-level API container |
| API Version | A versioned OpenAPI contract and lifecycle state |
| Source Revision | A concrete OpenAPI content snapshot or Git commit |
| API Endpoint | Parsed endpoint index from OpenAPI |
| API Schema | Parsed schema/model index from OpenAPI |
| Mock Instance | Runtime mock process bound to an API version/revision |
| Validation Report | Parse, lint, diff, mock boot, or contract report |
| Git Connection | Repository, branch, path, credentials reference, and sync state |
| Review | API review decision and comments |
| Audit Log | User and system operation record |

### 8.2 Important Relationships

- One API Project has many API Versions.
- One API Version has one active Source Revision.
- One Source Revision belongs to either platform source store or Git commit.
- One Source Revision produces many API Endpoints and API Schemas.
- One API Version may have zero or more Mock Instances.
- One API Version may have many Validation Reports.
- One API Project may have zero or one active Git Connection.

### 8.3 Source Revision Fields

Source Revision should exist even for platform-managed sources. This prevents later Git integration from requiring a model rewrite.

Recommended fields:

- `id`
- `api_version_id`
- `source_mode`
- `content_hash`
- `storage_uri`
- `git_commit`
- `git_branch`
- `git_path`
- `author`
- `message`
- `created_at`

---

## 9. Capability Map

| Capability | Full Product Scope |
|---|---|
| API Project Management | project creation, ownership, domain, tags, visibility, source mode |
| OpenAPI Authoring | upload, code edit, visual edit, preview, validation |
| API Catalog | search and browse by service, domain, tag, endpoint, schema, status |
| API Documentation | rendered API reference, examples, curl snippets, version switch |
| Mock Server | Prism-based mock, strategy selection, logs, health, reload |
| API Diff | compare versions, commits, branches, draft vs released |
| Breaking Change Detection | classify compatible and incompatible changes |
| Lint and Governance | Spectral rules, org rules, project overrides, severity |
| Git Collaboration | clone/import, branch, commit, push, MR/PR, conflict handling |
| CI/CD Integration | CLI/API validation, reports, pipeline gates, MR comments |
| Lifecycle Governance | review, approval, release, deprecation, archive |
| Permissions | persona-based permissions, project access, operation guards |
| Audit | source changes, lifecycle transitions, mock actions, settings changes |
| Contract Test | Pact integration, provider verification, report, gate |
| Operations | Docker Compose, Kubernetes, logs, metrics, health checks |

---

## 10. Epic / Feature / Story Breakdown

### Epic 1: API Workspace and Project Management

Goal: let teams organize API contracts by project, service, domain, owner, tags, and lifecycle state.

#### Feature 1.1 Project Registry

Stories:

- As an API Maintainer, I want to create an API project so that I can manage contracts for one service or product area.
- As an API Consumer, I want to see project metadata so that I can identify the owning team and current API status.
- As a Platform Admin, I want to archive inactive projects so that the catalog stays clean.

Acceptance criteria:

- Project requires name, code, owner, and source mode.
- Project may include domain, description, tags, visibility, and repository metadata.
- Archived projects remain searchable only when archived items are included.

#### Feature 1.2 Project Ownership

Stories:

- As an API Reviewer, I want each project to have an owner so that review and release responsibility is clear.
- As an API Consumer, I want to see owner contact information so that I can ask API questions.

Acceptance criteria:

- Owner can be a team, person, or both.
- Owner is visible in catalog and detail pages.
- Project cannot enter Released state without an owner.

---

### Epic 2: OpenAPI Authoring and Source Management

Goal: support OpenAPI creation, editing, upload, import, and source-of-truth management.

#### Feature 2.1 Platform-managed OpenAPI

Stories:

- As an API Maintainer, I want to create an OpenAPI file in the platform so that I can start API design before a repo exists.
- As an API Maintainer, I want to upload a YAML/JSON OpenAPI file so that I can import an existing contract.
- As an API Maintainer, I want to save platform-managed versions so that I can track design history.

Acceptance criteria:

- Platform accepts YAML and JSON.
- OpenAPI 3.x must be supported.
- Invalid files show parse errors and do not update endpoint indexes.
- Valid files create a Source Revision.

#### Feature 2.2 Code Editor

Stories:

- As an API Maintainer, I want to edit OpenAPI in YAML/JSON code mode so that I can make precise contract changes.
- As an API Maintainer, I want validation errors linked to editor locations so that I can fix issues quickly.

Acceptance criteria:

- Code editor supports YAML/JSON highlighting.
- Save triggers parse and validation.
- Parse errors show line/column when available.
- Editor can switch to preview when current content is valid.

#### Feature 2.3 Design/Form Editor

Stories:

- As an API Maintainer, I want to edit endpoints through forms so that I do not need to remember every OpenAPI syntax detail.
- As an API Reviewer, I want to inspect operations, schemas, examples, and error responses visually so that review is faster.

Acceptance criteria:

- Users can manage path, method, summary, tags, parameters, request body, responses, schemas, examples, and security.
- Form edits update the underlying OpenAPI document.
- Code mode and form mode stay consistent.

#### Feature 2.4 Source Mode Conversion

Stories:

- As an API Maintainer, I want to connect a standalone project to Git so that future changes are source-controlled.
- As an API Maintainer, I want to detach a Git-imported project so that I can experiment without writing back to Git.

Acceptance criteria:

- Connecting to Git requires repo, branch, path, and credentials.
- Detaching from Git creates an explicit platform-owned Source Revision.
- Source mode changes are audited.

---

### Epic 3: Git Integration and Collaboration

Goal: allow OpenAPI files to live in Git and support Stoplight-like browser editing with Git synchronization.

#### Feature 3.1 Git Connection

Stories:

- As an API Maintainer, I want to connect an API project to a Git repository so that OpenAPI changes are versioned with code.
- As a Platform Admin, I want Git credentials stored securely so that repository access is controlled.

Acceptance criteria:

- Supports repo URL, provider type, default branch, OpenAPI path, and credentials reference.
- Connection test verifies repository access and file path.
- Last sync status is visible.

#### Feature 3.2 Git Writeback

Stories:

- As an API Maintainer, I want editor changes committed back to Git so that Git remains the source of truth.
- As an API Reviewer, I want changes proposed through branch or MR when policy requires review.

Acceptance criteria:

- Supports direct commit, branch commit, and MR/PR policy in design.
- Each writeback records commit hash when available.
- Sync failure leaves the project in `sync_failed` with retry details.

#### Feature 3.3 Branch and Conflict Handling

Stories:

- As an API Maintainer, I want to select or create a branch so that I can work safely on API changes.
- As an API Maintainer, I want conflict detection so that my edits do not overwrite remote changes.

Acceptance criteria:

- Platform detects when remote source changed after editor load.
- Conflict state prevents blind overwrite.
- Initial conflict resolution may require manual reload or code-mode resolution.

---

### Epic 4: API Catalog and Discovery

Goal: provide a single searchable API inventory for internal users.

#### Feature 4.1 Catalog Browse and Filter

Stories:

- As an API Consumer, I want to browse APIs by service, domain, tag, version, and status so that I can find the contract I need.
- As an API Reviewer, I want to find APIs in Review or Released state so that I can focus on governance work.

Acceptance criteria:

- Catalog supports filters for domain, tag, status, owner, and source mode.
- Catalog rows show project name, service/domain, owner, current version, status, docs link, mock link, and updated time.

#### Feature 4.2 Search

Stories:

- As an API Consumer, I want to search endpoint paths and operation IDs so that I can quickly locate an interface.
- As an API Maintainer, I want to search schemas so that I can reuse existing models.

Acceptance criteria:

- Search covers project name, endpoint path, operationId, tags, and schema names.
- Search results link to API detail, operation detail, or schema detail.

---

### Epic 5: API Documentation

Goal: render usable API documentation directly from OpenAPI.

#### Feature 5.1 API Reference

Stories:

- As an API Consumer, I want to view endpoint documentation so that I can integrate with the API.
- As an API Consumer, I want to see request and response schemas so that I understand data shape.

Acceptance criteria:

- Documentation includes endpoint list, parameters, request body, response body, status codes, examples, and security.
- Documentation supports version switching.
- Documentation updates after a valid OpenAPI save.

#### Feature 5.2 Developer Convenience

Stories:

- As an API Consumer, I want to copy curl examples so that I can try requests quickly.
- As an API Consumer, I want to open the mock URL from docs so that I can test against mock data.

Acceptance criteria:

- Curl example generation uses operation metadata.
- Mock link is visible when a mock instance exists.

---

### Epic 6: Mock Server Management

Goal: provide OpenAPI-derived mock servers for frontend development, QA, demos, and contract discussion.

#### Feature 6.1 Prism Mock Runtime

Stories:

- As an API Maintainer, I want to start a mock server for an API version so that consumers can develop before implementation.
- As an API Consumer, I want a stable mock base URL so that I can configure my app environment.

Acceptance criteria:

- Mock instance is bound to an API version and Source Revision.
- Mock uses OpenAPI examples first when available.
- Mock can fall back to schema-generated data.
- Mock start failure shows error details.

#### Feature 6.2 Mock Operations

Stories:

- As an API Maintainer, I want to stop, restart, and health-check mock instances so that I can manage runtime behavior.
- As an API Consumer, I want to know whether a mock is healthy so that I can trust the mock URL.

Acceptance criteria:

- Mock instance supports running, stopped, failed, and needs_reload states.
- Health status and last error are visible.
- OpenAPI changes mark existing mock as needing reload or trigger automatic reload.

#### Feature 6.3 Mock Logs

Stories:

- As an API Maintainer, I want to view mock request logs so that I can debug consumer calls.
- As a QA user acting as API Consumer, I want to inspect mock responses so that I can understand test behavior.

Acceptance criteria:

- Logs include timestamp, method, path, status, response strategy, and validation errors.
- Logs can be filtered by endpoint and time range.

---

### Epic 7: API Diff and Change Review

Goal: make API changes visible and classify compatibility impact.

#### Feature 7.1 Version and Revision Diff

Stories:

- As an API Reviewer, I want to compare two API versions so that I can review changes before release.
- As an API Maintainer, I want to compare a draft against a released version so that I can understand impact.

Acceptance criteria:

- Diff supports endpoint-level and schema-level changes.
- Diff report identifies added, removed, and modified operations and fields.
- Diff report can be exported as Markdown.

#### Feature 7.2 Breaking Change Detection

Stories:

- As an API Reviewer, I want breaking changes highlighted so that I can prevent accidental consumer impact.
- As an API Maintainer, I want clear breaking-change reasons so that I can fix or justify them.

Acceptance criteria:

- Deleting endpoints, deleting response fields, changing field types, requiredness changes, enum removals, path parameter changes, and auth changes are classified as breaking.
- Compatible changes are separated from breaking changes.

---

### Epic 8: Lint and Governance

Goal: enforce API design quality through configurable rules.

#### Feature 8.1 OpenAPI Lint

Stories:

- As an API Maintainer, I want lint feedback while editing so that I can fix design issues early.
- As an API Reviewer, I want lint results available during review so that API quality is consistent.

Acceptance criteria:

- Spectral rules can run against OpenAPI files.
- Results include severity, rule ID, message, location, and help link when available.
- Lint reports are stored by Source Revision.

#### Feature 8.2 Rule Management

Stories:

- As a Platform Admin, I want organization-level rules so that all teams follow common API standards.
- As an API Reviewer, I want project-level overrides so that exceptions are explicit.

Acceptance criteria:

- Supports org default ruleset.
- Supports project override or extension.
- Rule changes are audited.

---

### Epic 9: CI/CD Integration

Goal: allow pipelines to validate API changes and publish reports.

#### Feature 9.1 Validation CLI/API

Stories:

- As a Platform Admin, I want a CLI or API for validation so that CI pipelines can call platform checks.
- As an API Maintainer, I want pipeline failures to explain which API rule failed so that I can fix changes.

Acceptance criteria:

- CI can run validate, lint, diff, breaking-change check, and mock boot test.
- CI receives machine-readable status and human-readable report.

#### Feature 9.2 MR/PR Feedback

Stories:

- As an API Reviewer, I want validation reports posted back to MR/PR so that review happens where code review already occurs.

Acceptance criteria:

- Reports can be linked or posted as comments.
- Report includes summary, failure reasons, and platform report URL.

---

### Epic 10: Lifecycle, Permission, and Audit

Goal: support controlled API review and release without overcomplicating early product use.

#### Feature 10.1 Lifecycle Workflow

Stories:

- As an API Maintainer, I want to submit an API version for review so that reviewers can approve it.
- As an API Reviewer, I want to approve and release an API version so that consumers know it is stable.
- As an API Reviewer, I want to deprecate an API version so that consumers know migration is needed.

Acceptance criteria:

- Supports Draft, Review, Approved, Released, Deprecated, and Archived.
- Released versions cannot be directly mutated.
- State transitions are audited.

#### Feature 10.2 Permissions

Stories:

- As a Platform Admin, I want persona-based permissions so that users only perform appropriate actions.
- As an API Reviewer, I want release actions limited to reviewers so that release governance is reliable.

Acceptance criteria:

- Supports API Consumer, API Maintainer, API Reviewer, and Platform Admin.
- Supports project-level access in full design.
- Permission failures produce clear messages.

#### Feature 10.3 Audit

Stories:

- As a Platform Admin, I want audit logs for critical operations so that changes are traceable.
- As an API Reviewer, I want source changes tied to Git commit or Source Revision so that review history is reliable.

Acceptance criteria:

- Audit covers source edits, uploads, Git sync, lifecycle transitions, mock actions, rule changes, and permission changes.

---

### Epic 11: Contract Test Integration

Goal: optionally add consumer-driven contract verification for high-value APIs.

#### Feature 11.1 Pact Contract Registry Link

Stories:

- As an API Reviewer, I want consumer/provider relationships visible so that release risk is clearer.
- As an API Maintainer, I want provider verification results linked to API versions so that release readiness is visible.

Acceptance criteria:

- Contract reports can be associated with API versions.
- Consumer and provider metadata is visible.

#### Feature 11.2 Contract Verification Gate

Stories:

- As an API Reviewer, I want contract verification to block risky releases for selected APIs.

Acceptance criteria:

- Contract Test gate is configurable per project.
- Verification failure can block release or CI depending on policy.

---

### Epic 12: Platform Operations and Observability

Goal: make the platform deployable and operable in internal environments.

#### Feature 12.1 Deployment

Stories:

- As a Platform Admin, I want Docker Compose deployment so that teams can run the platform locally.
- As a Platform Admin, I want Kubernetes deployment so that the platform can run in shared internal environments.

Acceptance criteria:

- Supports PostgreSQL.
- Supports local file cache or object storage.
- Does not require external SaaS.

#### Feature 12.2 Observability

Stories:

- As a Platform Admin, I want logs and health checks so that I can operate the service.
- As a Platform Admin, I want metrics so that I can monitor parse, sync, validation, and mock runtime behavior.

Acceptance criteria:

- Exposes health endpoint.
- Captures platform API logs, Git sync logs, parse logs, validation logs, and mock logs.
- Exposes basic metrics.

---

## 11. Agile Iteration Plan

The iteration plan is derived after the full product design. MVP is defined from the earliest coherent slice, not from a reduced design.

### Iteration 0: Foundation and Technical Spikes

Goals:

- Establish project architecture.
- Validate OpenAPI parsing, docs rendering, and Prism mock feasibility.
- Define initial database schema with future Git and lifecycle fields.

Candidate scope:

- Backend and frontend skeleton.
- PostgreSQL schema baseline.
- OpenAPI parser spike.
- Prism mock spike.
- API documentation rendering spike.

Exit criteria:

- Team can parse a sample OpenAPI file.
- Team can render docs from sample OpenAPI.
- Team can start Prism mock from sample OpenAPI.

### Iteration 1: Project Registry and Platform-managed OpenAPI

Goals:

- Allow users to create projects and manage OpenAPI without Git.

Candidate scope:

- API Project CRUD.
- Standalone/uploaded source mode.
- YAML/JSON upload.
- Code editor save.
- Parse validation and Source Revision creation.

Exit criteria:

- Maintainer can create a project, upload or edit OpenAPI, and save a valid revision.

### Iteration 2: Catalog and Documentation

Goals:

- Make API contracts discoverable and readable.

Candidate scope:

- Endpoint and schema indexing.
- Catalog filters and search.
- API detail page.
- Documentation preview.
- Version/revision switch.

Exit criteria:

- Consumer can find an API and read docs generated from OpenAPI.

### Iteration 3: Mock Runtime

Goals:

- Make OpenAPI immediately useful for frontend and QA workflows.

Candidate scope:

- Start/stop/restart Prism mock.
- Mock base URL.
- Mock health status.
- Mock logs.
- Reload or needs_reload on OpenAPI change.

Exit criteria:

- Consumer can call a mock URL and receive responses derived from OpenAPI examples or schemas.

### Iteration 4: Git-connected Source Management

Goals:

- Introduce Git as source of truth for connected projects.

Candidate scope:

- Git connection settings.
- Clone/fetch/read OpenAPI.
- Direct commit writeback.
- Git sync status.
- Basic conflict detection.

Exit criteria:

- Maintainer can connect a project to Git, edit OpenAPI in the platform, and write changes back to Git.

### Iteration 5: Git Collaboration Policies

Goals:

- Add branch and MR/PR collaboration on top of Git-connected source.

Candidate scope:

- Branch commit policy.
- MR/PR policy adapter for first provider.
- Git sync panel.
- Conflict handling UX.

Exit criteria:

- Reviewer can review OpenAPI changes through branch or MR/PR workflow.

### Iteration 6: Lint and Validation Reports

Goals:

- Add governance feedback using Spectral.

Candidate scope:

- Spectral integration.
- Lint report storage.
- Inline lint feedback.
- Organization and project ruleset design.

Exit criteria:

- Maintainer can see lint issues and Reviewer can inspect lint reports.

### Iteration 7: Diff and Breaking Change Detection

Goals:

- Make version changes reviewable.

Candidate scope:

- Version/revision diff.
- Breaking change classification.
- Markdown report export.
- Draft vs Released comparison.

Exit criteria:

- Reviewer can identify breaking changes before release.

### Iteration 8: Lifecycle, Permissions, and Audit

Goals:

- Support controlled internal release governance.

Candidate scope:

- Draft/Review/Approved/Released/Deprecated/Archived workflow.
- Persona-based permissions.
- Audit logs.
- Release immutability.

Exit criteria:

- Reviewer can approve/release/deprecate versions and all critical operations are audited.

### Iteration 9: CI/CD Integration

Goals:

- Move governance checks into pipelines.

Candidate scope:

- Validation CLI/API.
- CI report generation.
- Pipeline pass/fail contract.
- MR/PR comment integration.

Exit criteria:

- CI can validate OpenAPI, lint, diff, and mock boot results and return a clear pass/fail status.

### Iteration 10: Contract Test Integration

Goals:

- Add optional consumer-driven contract verification for selected APIs.

Candidate scope:

- Pact report association.
- Consumer/provider relationship view.
- Verification gate.

Exit criteria:

- Selected APIs can show contract verification status and use it as a release or CI gate.

---

## 12. MVP Definition

MVP is the first coherent product slice that proves the platform's main value:

> API contract can be authored or imported, rendered as docs, and served as mock from the same OpenAPI source.

Recommended MVP scope:

- Iteration 0 to Iteration 3.
- Project Registry.
- Platform-managed OpenAPI through upload and code edit.
- Source Revision.
- Parse validation.
- Catalog and API docs.
- Prism mock start/stop/health/logs.

Explicitly not required for MVP:

- Git writeback.
- Branch/MR workflow.
- API diff.
- Spectral governance.
- lifecycle approval workflow.
- Contract Test.
- complex project-level permissions.

Important: These are not removed from the design. They are deferred delivery items.

---

## 13. Resolved Product Decisions

This section resolves the original open questions and turns them into design decisions.

### 13.1 OpenAPI Version Support

Decision:

- OpenAPI 3.0 and 3.1 are first-class supported versions.
- OpenAPI 3.0 is the minimum required target for authoring, validation, documentation, mock, diff, and lint.
- OpenAPI 3.1 must be accepted by the source model, parser, editor, docs renderer, and validation pipeline.
- When an external component has partial 3.1 support, the platform must show the degraded capability clearly instead of silently treating 3.1 as 3.0.

Rationale:

OpenAPI 3.0 remains widely used, while 3.1 is the correct forward-looking target. Supporting both avoids forcing teams into unnecessary migration while keeping the platform future-proof.

### 13.2 Swagger / OpenAPI 2.0 Support

Decision:

- Swagger/OpenAPI 2.0 is supported for import and migration only.
- New authoring should not create Swagger 2.0 documents.
- Imported Swagger 2.0 files should be converted to OpenAPI 3.x before becoming an editable platform source.
- The original 2.0 file may be retained as an import artifact for traceability.

Rationale:

This keeps legacy migration practical without allowing the platform to split its authoring, mock, diff, and governance model across old and new contract formats.

### 13.3 First Git Provider for MR/PR Integration

Decision:

- The Git abstraction must support generic Git operations first: clone, fetch, checkout, branch, commit, and push over SSH/HTTPS.
- GitLab should be the first provider-specific MR integration.
- GitHub should be the second provider-specific PR integration.
- Other providers can be added through provider adapters.

Rationale:

Internal self-hosted environments commonly use GitLab, and GitLab MR integration usually delivers the highest value for enterprise/internal deployment. Generic Git support comes first so source-of-truth behavior does not depend on one vendor API.

### 13.4 First Git Writeback Implementation

Decision:

- The first Git writeback implementation should support both Direct Commit and Branch Commit.
- Merge Request / Pull Request creation is part of the full design but should be implemented after basic Git synchronization is stable.

Writeback behavior:

| Policy | First Git Implementation | Notes |
|---|---:|---|
| Direct Commit | Yes | Best for small internal teams and low-ceremony projects |
| Branch Commit | Yes | Safer default for team collaboration |
| MR/PR | Later | Requires provider-specific integration and review-state mapping |

Recommended default:

- New Git-connected projects should default to Branch Commit.
- Direct Commit may be enabled per project by Platform Admin or API Reviewer.

Rationale:

Branch Commit provides a safer collaboration path without requiring MR/PR APIs immediately. Direct Commit remains useful for internal prototypes and low-risk projects.

### 13.5 Multi-file OpenAPI and `$ref`

Decision:

- The product model must support multi-file OpenAPI projects and relative `$ref` across files.
- Git-connected projects should preserve the repository file layout.
- Standalone/uploaded projects should support both single-file upload and archive upload, such as `.zip`, for multi-file specs.
- The platform should maintain one root OpenAPI entry file per API Version.

Implementation guidance:

- MVP may start with a single root file plus local relative `$ref` resolution.
- Full authoring should add a project file tree, file-level editor, rename/move support, and broken-reference detection.
- Remote HTTP `$ref` may be read-only or disabled by policy in internal deployments.

Rationale:

Real OpenAPI projects often split schemas and paths across files. The source model should support this early to avoid later migration pain.

### 13.6 Markdown Guide Pages

Decision:

- Markdown guide pages are part of the full platform design.
- API reference documentation remains generated from OpenAPI.
- Markdown pages are optional companion content for guides, onboarding, changelog notes, migration instructions, and domain explanations.
- Markdown content should be stored in the same source mode as the API project:
  - platform source store for standalone/uploaded projects;
  - Git repository for Git-connected projects.

Documentation structure:

```text
API Docs
  Overview / Guide pages      optional Markdown
  API Reference               generated from OpenAPI
  Schemas                     generated from OpenAPI
  Changelog / Migration notes optional Markdown or generated diff summary
```

Rationale:

Generated API reference is necessary but not sufficient for internal consumers. Guide pages help explain workflows, business context, migration steps, and usage conventions without turning the platform into a public developer portal.

### 13.7 Mock Instance Ownership Model

Decision:

- Mock instances are project-level managed services by default.
- A mock instance is bound to API Project, API Version, Source Revision, and environment.
- Per-user mock instances are not the default model.
- Per-branch or per-revision mock instances are supported by the design for Git-connected workflows.

Recommended environments:

| Environment | Purpose |
|---|---|
| `draft` | Maintainer preview while editing |
| `review` | Stable mock for reviewers and consumers during API review |
| `released` | Stable mock for a released API version |

Rationale:

Project-level mocks are easier for frontend, QA, and BA users to share. Per-user mocks create more operational complexity and make URLs less predictable.

### 13.8 Expected OpenAPI Size and Scale

Decision:

The platform should optimize for medium-to-large internal service APIs.

Performance targets:

| Size Class | Raw Spec Size | Operation Count | Schema Count | Expected Behavior |
|---|---:|---:|---:|---|
| Small | <= 1 MB | <= 100 | <= 100 | synchronous parse and preview |
| Medium | <= 5 MB | <= 500 | <= 500 | synchronous or near-sync parse under normal load |
| Large | <= 10 MB | <= 1,000 | <= 1,000 | async parse allowed; UI shows progress |
| Extra Large | > 10 MB | > 1,000 | > 1,000 | supported by configuration; may require async-only processing |

Default limits:

- Soft warning: 10 MB raw source or 1,000 operations.
- Default hard limit: 25 MB raw source or 2,500 operations.
- Hard limits must be configurable by Platform Admin.

Rationale:

The platform should comfortably handle normal service-level APIs and avoid pretending that very large monolithic specs behave like small files.

### 13.9 Authentication Mechanism

Decision:

- OIDC should be the primary authentication mechanism for the internal web console.
- Local username/password should exist only for bootstrap, local development, or emergency admin access.
- SAML and LDAP can be supported later through the same identity-provider abstraction if needed.

Authorization:

- Persona-based RBAC uses API Consumer, API Maintainer, API Reviewer, and Platform Admin.
- Project-level access control is part of the full design.
- MVP may start with a simplified authenticated user model if the deployment is trusted, but the permission model must not require redesign later.

Rationale:

OIDC fits most modern internal identity systems and avoids building a custom identity platform. Local login is useful for development and break-glass operations, but should not be the main enterprise auth path.

### 13.10 First Organization-level Spectral Ruleset

Decision:

The first organization-level ruleset should be strict enough to improve contract quality but not so strict that teams cannot migrate existing APIs.

Initial rule severities:

| Rule | Severity | Notes |
|---|---|---|
| `info.title` is required | error | Required for catalog display |
| `info.version` is required | error | Required for version tracking |
| Every operation has `operationId` | error | Required for search, SDK, and diff readability |
| Every operation has `tags` | warning | Helps catalog grouping |
| Every operation has `summary` | warning | Helps docs readability |
| Every operation defines success response schema when response has body | error | Required for docs and mock |
| Request body must define schema when body exists | error | Required for validation and mock |
| `$ref` targets must resolve | error | Prevents broken docs, mock, and diff |
| Standard error response shape is used for 4xx/5xx | warning initially, error later | Migration-friendly |
| Pagination uses standard pagination model | warning initially, error by project policy | Applies only to list endpoints |
| Time fields use `date-time` format | warning | Can be promoted later |
| Response must not be a naked top-level array | warning | Encourages extensible response envelopes |
| Ambiguous property names such as `data`, `info`, `obj` are discouraged | info initially | Needs local naming guidance before becoming strict |
| Sensitive-looking examples are flagged | warning | Prevents tokens, passwords, secrets in examples |

Promotion policy:

- Start migration-heavy rules as `info` or `warning`.
- Promote to `error` after teams have cleanup time and an exception process.
- Project-level overrides must be explicit and auditable.

Rationale:

The first ruleset should protect the platform's generated docs, mock, search, and diff features while still allowing existing teams to onboard without a large up-front cleanup project.

---

## 14. References

- Stoplight Studio public README: supports OpenAPI v2/v3, graphical API design, code/write mode, read mode, Spectral validation, Prism mocking, local file workflows, and browser Git workflows.
- Stoplight Platform documentation: Git projects support repository-based collaboration and branch-oriented project settings.
- Original PRD: `docs/requirements/git-native-api-platform-requirements.md`.
