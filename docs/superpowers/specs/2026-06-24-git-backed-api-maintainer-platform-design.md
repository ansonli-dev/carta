# Carta Git-backed API Maintainer Platform Design

Date: 2026-06-24

## Product Positioning

Carta MVP is a Git-backed API contract maintainer platform for backend API owners and API maintainers. It is not a generic project CRUD tool and it is not a full Stoplight clone. The product helps a team create, edit, publish, and mock OpenAPI contracts while keeping the OpenAPI file in the code repository as the final source of truth.

The core loop is:

```text
Account and workspace
-> Project
-> Create or connect OpenAPI source
-> Edit in API Studio
-> Commit OpenAPI file to Git
-> Publish docs
-> Refresh mock server
```

## Primary User

The primary user is an API maintainer: usually a backend engineer, platform engineer, or technical owner of a service API. This user needs to maintain OpenAPI contracts with enough structure that request and response design is reliable, while still fitting normal code repository workflows.

Secondary users are reviewers and consumers who need to read published docs or call a mock server. They are supported through workspace access and published docs visibility, but they are not the main editing audience for MVP.

## Goals

- Support creating an API directly in Carta and syncing the generated OpenAPI file into a code repository.
- Support connecting an existing OpenAPI file from Git and maintaining it through Carta.
- Make request and response design a first-class workflow, not an afterthought.
- Keep Git as the final source of truth for OpenAPI files.
- Publish docs and mock servers from stable published revisions, not from unsaved drafts.
- Provide a real account, workspace, invitation, and role model so access control is meaningful.
- Keep the MVP focused enough to implement cleanly while preserving data model extension points for future source modes.

## Non-goals

- Full Stoplight feature parity.
- PR or merge request workflow in MVP.
- Real-time collaborative editing.
- Enterprise SSO, SCIM, domain allowlists, or custom RBAC policies.
- Project-level custom roles.
- Full style guide governance.
- Consumer portal, API keys for external developers, or monetized API access.
- Multi-file documentation sites beyond the OpenAPI-backed API docs surface.

## Information Architecture

Carta has five main product areas:

```text
Login / Register
Workspace
Projects
Project Overview
API Studio / Published Docs / Mock Server / Git Sync / Settings
```

The user enters through authentication, lands in a workspace, selects or creates a project, then manages one or more API sources inside that project. MVP can expose one API source per project in the UI, but the data model must not prevent multiple sources later.

## Account And Access Model

Carta uses workspaces as the access boundary.

```text
users
- id
- email
- name
- avatar_url
- created_at
- updated_at

workspaces
- id
- name
- slug
- created_by
- created_at
- updated_at

workspace_members
- workspace_id
- user_id
- role: owner | maintainer | viewer
- created_at
- updated_at

workspace_invitations
- id
- workspace_id
- email
- role: owner | maintainer | viewer
- token_hash
- status: pending | accepted | expired | revoked
- invited_by
- expires_at
- created_at
- accepted_at

git_connections
- id
- user_id
- provider: github
- provider_account
- access_token_ref
- scopes
- created_at
- updated_at
```

New users get a personal workspace automatically. Team access is managed through workspace invitations. The owner invites a member by email and assigns a role. The recipient follows the invite link, signs in or registers, then joins the workspace.

Roles:

- `owner`: manage workspace settings, members, invitations, Git connections, projects, publishing, and deletion.
- `maintainer`: create and edit APIs, sync Git, publish docs, and manage mock servers.
- `viewer`: view projects, API definitions, published docs, and mock server information. Viewers cannot change OpenAPI files or push to Git.

MVP uses workspace-level permissions for every project in that workspace. Project-level permissions can be added later with `project_members` and `project_roles`, but they are out of scope for this design.

Carta permissions and Git permissions are separate. Carta controls whether the user can start an action. The Git provider controls whether the push can succeed. Before creating or syncing an API source, Carta should run a repository permission preflight when possible and show a clear error if the current user lacks write access.

## Project And Source Model

Projects belong to workspaces. API sources belong to projects.

```text
projects
- id
- workspace_id
- name
- slug
- description
- default_api_source_id
- created_by
- created_at
- updated_at

api_sources
- id
- project_id
- name
- source_mode: git_created | git_imported | hosted | upload | cli_push
- openapi_version
- git_provider
- git_repo_owner
- git_repo_name
- git_branch
- git_file_path
- base_commit_sha
- remote_commit_sha
- file_hash
- sync_status: synced | dirty | pushing | blocked | failed
- created_by
- last_synced_at
- created_at
- updated_at

api_source_revisions
- id
- api_source_id
- commit_sha
- file_hash
- raw_openapi
- parsed_summary
- created_by
- created_at

openapi_indexes
- id
- api_source_id
- revision_id
- kind: operation | schema | parameter | response | security_scheme | server
- key
- path
- method
- title
- summary
- search_text
- created_at
```

`source_mode` supports the confirmed MVP modes and keeps room for future modes:

- `git_created`: the user creates an API in Carta and Carta creates the OpenAPI file in Git.
- `git_imported`: the user connects an existing OpenAPI file from Git.
- `hosted`: future mode where Carta is the source of truth.
- `upload`: future mode where users upload files manually.
- `cli_push`: future mode where a CLI updates Carta from a repository or build pipeline.

For MVP, only `git_created` and `git_imported` are implemented.

## Main User Journeys

### 1. Workspace Invitation

```text
Owner opens Workspace Settings
-> Members
-> Invite member
-> Enters email and role
-> Carta sends invitation link
-> Recipient opens link
-> Recipient signs in or registers
-> Recipient accepts invitation
-> Recipient becomes a workspace member
```

Invitations can expire or be revoked. Re-sending an invitation should reuse or replace the pending invite for the same email and workspace rather than creating confusing duplicates.

### 2. Create API From Carta

```text
User opens Projects
-> Create Project
-> Select "Create from Carta"
-> Enter project name and API name
-> Connect or choose GitHub account
-> Choose repo and branch
-> Enter OpenAPI file path, for example openapi/orders.yaml
-> Carta validates that the file path does not already exist
-> Carta creates an initial OpenAPI scaffold
-> Carta commits and pushes the file
-> Carta parses the committed file
-> Carta opens Project Overview or API Studio
```

If the target path already exists, Carta blocks creation and suggests connecting the existing OpenAPI file instead. Carta must not overwrite an existing repository file by default.

### 3. Connect Existing OpenAPI

```text
User opens Projects
-> Create Project
-> Select "Connect Existing OpenAPI"
-> Connect or choose GitHub account
-> Choose repo, branch, and OpenAPI file path
-> Carta reads the file
-> Carta validates and parses OpenAPI
-> Carta creates project and API source
-> Carta builds indexes for Studio and docs
```

Invalid OpenAPI files should not create a fully active project. The user sees validation errors and can either choose another file or cancel.

### 4. Edit API And Sync To Git

```text
User opens API Studio
-> Edits operation, schema, request, response, examples, or servers
-> Carta updates local draft state
-> User saves
-> Carta generates OpenAPI YAML or JSON
-> Carta validates the generated OpenAPI
-> Carta checks remote commit against base commit
-> Carta commits directly to the configured branch
-> Carta records revision and sync event
-> Carta automatically publishes docs
-> Carta refreshes mock server
```

MVP uses direct commit to the configured branch. PR and MR flows are deferred.

Default commit messages:

```text
Create OpenAPI: <project>/<api-source>
Update OpenAPI: <project>/<api-source>
```

The Git commit should identify the Carta user in audit records even if the Git provider records the provider account as the committer.

### 5. Publish Docs And Mock Server

Publishing runs after a successful Git write. It produces a stable published revision and a mock server instance.

```text
git push succeeds
-> source revision is recorded
-> docs snapshot is published
-> mock server is built from the published snapshot
```

Published docs and mock servers support two visibility modes in MVP:

- `private`: only workspace members can access.
- `public`: anyone with the link can access.

Default visibility is `private`.

## Key Screens

### Login And Workspace Selection

Users can sign in, register, accept pending invitations, and enter a default workspace. If the user belongs to multiple workspaces, Carta shows a workspace switcher.

### Projects

The Projects page lists projects in the selected workspace. Prefer a dense table for desktop use, with columns for project name, API source, Git repo, branch, OpenAPI path, last sync, published status, mock status, and updated time.

Primary actions:

- Create Project
- Open Project
- Workspace Settings

### Create Project Wizard

The wizard has two starting choices:

- Create from Carta
- Connect Existing OpenAPI

Shared fields:

- Project name
- API source name
- Git provider
- Repository
- Branch
- OpenAPI file path

Create-from-Carta adds an initial OpenAPI scaffold step. Connect-existing adds file validation and parse preview.

### Project Overview

Project Overview is not the editor. It summarizes the selected project:

- API source name
- Git repository, branch, and OpenAPI path
- Last sync status
- Last published revision
- Docs visibility and URL
- Mock server status and URL
- Recent sync events

### API Studio

API Studio is the main editing surface.

Layout:

```text
Left: API tree
Center: structured editor
Right: Preview / OpenAPI / Git Sync
```

Left tree:

- Overview
- Servers
- Paths
- Schemas
- Security

Operation editor tabs:

- General
- Parameters
- Request
- Responses
- Examples
- Extensions

Request and response design must be structured. The user should be able to define status codes, content types, headers, schema references, inline schemas, descriptions, and examples without hand-editing YAML.

The right-side OpenAPI panel shows generated YAML for the selected object or entire source. It is a transparency aid, not the primary editing method.

### Git Sync

Git Sync appears both as a project page and as a side panel in Studio.

It shows:

- provider, repo, branch, and file path
- base commit
- remote commit
- local dirty state
- last push result
- validation errors
- conflict/blocking state

Actions:

- Sync from remote
- Save and push
- View latest sync event
- Open repository file

### Published Docs

Published Docs shows the rendered OpenAPI documentation for the latest published revision. It should resemble the Stoplight Elements style: endpoint navigation, operation details, schemas, examples, and Try It affordances where available.

### Mock Server

Mock Server shows:

- base URL
- visibility
- backing published revision
- last build time
- sample curl command
- recent validation errors or request logs when available

MVP does not need a full analytics product, but basic request logs are useful if they are cheap to add.

### Workspace Settings

Workspace Settings includes:

- General workspace details
- Members
- Invitations
- Git connections

Only owners can manage members and invitations.

## Git Synchronization Rules

OpenAPI files in Git are the final source of truth. Carta stores drafts, indexes, revisions, and published snapshots to power the product, but the canonical authored artifact is the OpenAPI file in the configured repository path.

Save uses optimistic concurrency:

```text
base_commit_sha from last sync
remote_commit_sha from provider
if remote_commit_sha == base_commit_sha:
  validate generated OpenAPI
  commit and push
else:
  block save and require sync
```

Conflict behavior:

- Carta does not overwrite remote changes.
- Carta does not attempt automatic merge in MVP.
- The user can view a diff, sync remote changes, or discard the local draft.
- If sync succeeds, Carta reparses the remote file and refreshes Studio.

Validation behavior:

- Generated OpenAPI must pass syntax and semantic validation before push.
- Invalid request or response structures block save.
- Risky designs such as GET request bodies should show warnings in Studio before publish.

## Mock Server Behavior

Mock servers are generated from `published_revisions`, not unsaved drafts.

```text
published_revisions
- id
- api_source_id
- source_revision_id
- public_slug
- visibility: private | public
- status: active | building | failed
- published_at
- created_at
- updated_at

mock_instances
- id
- published_revision_id
- base_url
- visibility: private | public
- status: active | building | failed
- last_built_at
- created_at
- updated_at
```

Request behavior:

- Match path and method against the published OpenAPI snapshot.
- Validate path, query, header, and body inputs.
- Prefer explicit response examples.
- If no example exists, generate a response from the schema.
- Return structured validation errors for invalid requests.
- Respect docs/mock visibility.

Example URL shape:

```text
https://carta.example.com/mocks/:workspaceSlug/:projectSlug/:apiSlug
```

## Error Handling

Account and access errors:

- unauthenticated users are redirected to login
- non-members cannot access private workspace resources
- viewers cannot save, sync, publish, or manage mock settings
- expired or revoked invitations show a clear recovery path

Git errors:

- missing Git connection prompts the user to connect GitHub
- insufficient repo permission blocks create or sync
- existing target file blocks Create from Carta
- remote commit mismatch blocks save
- provider outage records a failed sync event and preserves local draft

OpenAPI errors:

- invalid imported file blocks project activation
- invalid generated OpenAPI blocks push
- parser warnings are shown in Studio where possible

Publish and mock errors:

- Git save can succeed even if publish or mock build fails
- failed publish or mock build marks the project as degraded
- users can retry publish or mock build from Project Overview or Mock Server

## Audit And Events

Important actions should produce audit or event records:

- invitation created, accepted, revoked, expired
- role changed
- project created
- API source created or connected
- Git sync pull or push
- published revision created
- mock server built or failed

```text
git_sync_events
- id
- api_source_id
- direction: pull | push
- status: success | failed | blocked
- from_commit_sha
- to_commit_sha
- message
- error_detail
- created_by
- created_at

audit_events
- id
- workspace_id
- project_id
- actor_user_id
- action
- target_type
- target_id
- metadata
- created_at
```

## MVP Acceptance Criteria

- A user can register or log in and land in a personal workspace.
- An owner can invite a user by email with owner, maintainer, or viewer role.
- Invited users can accept invitations and access the workspace.
- Workspace role checks prevent viewers from mutating API projects.
- A maintainer can create a project from Carta and push a new OpenAPI file to GitHub.
- A maintainer can connect an existing OpenAPI file from GitHub.
- Carta parses the OpenAPI file and shows a structured API tree.
- A maintainer can edit an operation's request and response through structured forms.
- Saving validates the generated OpenAPI before pushing to Git.
- Saving is blocked when the remote file changed since the last sync.
- A successful save records a revision and sync event.
- A successful save automatically publishes docs and refreshes the mock server.
- Published docs render from the published revision.
- Mock server responses come from the published revision and validate incoming requests.
- Private docs and mock URLs require workspace membership.
- Public docs and mock URLs are accessible by link.

## Open Questions For Implementation Planning

- Which auth provider should MVP use in this repository: local email/password, OAuth, or an existing framework adapter?
- Which Git provider SDK should be used first for GitHub integration?
- Should OpenAPI be stored as YAML, JSON, or preserve the original file format when imported?
- Should local drafts be persisted continuously or only on explicit save?
- Should mock server be implemented in-process first or as a separate service?

These questions do not block the product design. They should be answered in the implementation plan after reviewing the existing codebase constraints.
