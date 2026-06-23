# Stoplight Product Capability Matrix

Date: 2026-06-24

Source: synthesized from the hands-on exploration log in [`stoplight-studio-ux-exploration.md`](./stoplight-studio-ux-exploration.md), including screenshots `/tmp/stoplight-all-settings-01-...` through `/tmp/stoplight-all-settings-90-...`.

## Executive Summary

Stoplight is not organized as an endpoint CRUD tool. It is a project workspace for designing, editing, reviewing, publishing, and sharing OpenAPI-backed API documents. The product model is:

```text
Workspace
  -> Projects
    -> Branches / versions
      -> API sources / files
        -> OpenAPI nodes
          -> operations, schemas, examples, request bodies, responses, parameters
      -> Docs / files / styles
    -> Published docs
```

The most important implementation direction for Carta is to treat OpenAPI source revisions as the durable product artifact, then render structured editors from that artifact. Hard-coded TSX examples should only exist as bootstrapping fixtures.

## Product Domains

| Domain | Stoplight behavior observed | Carta implication | Suggested priority |
|---|---|---|---|
| Workspace admin | Workspace settings, members, teams, integrations, billing, governance, activity, automation. | Keep admin separate from API Studio. Model workspace/project roles early. | P2 |
| Project management | Project table, visibility filter, search, row actions, new project/group. | Project selection comes before API management. | P0 |
| Project sharing | Public/Internal/Private visibility, member roles, share dialog after publish. | Visibility and sharing belong at project level. | P1 |
| Branch/version | Main branch context, create version action, docs URL includes branch. | Reserve data model space for branches/versions. | P1 |
| API source editing | Source-backed Studio with Form/Code/Preview modes. | Store canonical OpenAPI source revisions; derive UI state from source. | P0 |
| Operation editing | General, Parameters, Request, Responses, Preview tabs. | Build operation editor around OpenAPI operation shape. | P0 |
| Component/schema editing | Models map to `components/schemas/*` with Form/Code/Preview. | Components need first-class routes and editors. | P0 |
| API metadata | API Overview edits info, servers, server variables, contact, license, extensions. | Add API document metadata editor. | P1 |
| Docs publishing | Publish pushes workspace content; docs URL becomes populated after publish. | Separate draft Studio preview from published docs. | P1 |
| Try It | Published/preview docs generate parameter inputs, body editor, cURL sample. | Build read-side docs renderer with runnable request samples. | P2 |
| Import/export | Create menu has import file/directory/style guide; docs has Export button. | Keep import/export on roadmap, not first editor slice. | P2 |
| Integrations | GitHub/GitLab/Bitbucket/Azure DevOps/SSO appear in workspace settings. | Platform integration layer is separate from API editor. | P3 |

## Feature Matrix

### 1. Project And Workspace

| Capability | Observed details | Data model notes |
|---|---|---|
| Workspace settings | Display name, identifier, public projects toggle, web projects toggle, daily digest, join requests. | `workspaces`, `workspace_settings`. |
| Look and feel | Theme, favicon, logo, landing page, branding toggle. | Store as workspace branding config. |
| Docs settings | Enable Try It, show mock servers, search engine indexing. | Workspace-level defaults with possible project override later. |
| Custom domain | Domain, analytics, redirects, hide sign-in button, localization. | Domain config can remain deferred. |
| Members | Owner/Admin/Viewer/Guest/Pending filtering, invite dialog, member limit. | `workspace_members`, `workspace_invitations`, role enum. |
| Teams | Team management exists but gated by Pro plan. | Defer team groups; keep schema extensible. |
| Project table | Name, owner, nodes, type, last edit, visibility, actions. | Project list needs denormalized summary fields. |

### 2. Resource Tree

| Capability | Observed details | Data model notes |
|---|---|---|
| Top-level areas | APIs, Components, Docs, Files, Styles. | Project resources should not be endpoint-only. |
| API tree | API Overview, Paths, Models, Request Bodies, Responses, Parameters, Examples. | Resource tree can be generated from OpenAPI AST. |
| Create resource | API, Endpoint, Model, Article, Stoplight Config, Image, Table of Contents, File, Directory, Import Style Guide/File/Directory. | Generic `project_resources` can coexist with OpenAPI-specific resources. |
| URL state | Studio URL includes `source` and sometimes encoded `symbol`. | Persist selected source/node in routing. |

### 3. API Document Metadata

| Capability | Observed details | Data model notes |
|---|---|---|
| API overview preview | API title, version, base URL, server variables, mock server. | Maps to OpenAPI `info`, `servers`, vendor/mock metadata. |
| Info editing | Version, name, summary, Markdown description. | OpenAPI `info.title`, `info.version`, description. |
| Servers | Add server, URL, server name, remove server. | OpenAPI `servers[]`. |
| Server variables | Name, description, default, allowed values. | OpenAPI `servers[].variables`. |
| Contact/license | Contact name/url/email, terms URL, license name, URL/identifier. | OpenAPI `info.contact`, `termsOfService`, `license`. |
| Extensions | New Extension under API overview. | Preserve arbitrary `x-*`. |

### 4. Operation Editor

| Tab | Observed details | Data model notes |
|---|---|---|
| General | Operation name, operationId, deprecated, internal, Markdown description, security, extensions. | OpenAPI operation fields plus vendor extensions. |
| Parameters | Path/query/header/cookie groups; name, type, required, description; advanced style, deprecated, allowEmptyValue, allowReserved, format, default, enum, example, pattern, min/max length. | OpenAPI `parameters[]` with schema and serialization fields. |
| Request | Body description, content types, schema, examples, Generate from JSON. | OpenAPI `requestBody.content[mediaType]`. |
| Responses | Status tabs, add response, description, headers, body content types, schema, examples, Generate from JSON. | OpenAPI `responses[status]`. |
| Preview | Documentation rendering plus Try It. | Derived read model from OpenAPI. |
| Code | Canonical OpenAPI YAML editor. | Source revision is canonical, form editor is projection. |

### 5. Schema And Components

| Capability | Observed details | Data model notes |
|---|---|---|
| Model route | `User` maps to `components/schemas/User`. | Components require first-class route and editor. |
| Schema editor | Object root, add property, required toggle, type, format, behavior, default, example, pattern, min/max length, deprecated. | Support common JSON Schema/OpenAPI Schema fields. |
| Formats | date-time, date, time, duration, email, hostname, ipv4, ipv6, uri, uuid, regex, binary, byte, password, etc. | Keep format enum broad but allow custom values. |
| Behavior | Read/Write, Read Only, Write Only. | Maps to `readOnly` / `writeOnly`. |
| Composition | allOf, oneOf, anyOf via Combine Schemas. | Defer full UI if needed, but preserve in source. |
| Component refs | Picker can select `User`; field becomes component reference. | `$ref` support is mandatory. |
| Examples | Component examples have New Example, copy, trash, JSON editor. | Examples are first-class under components/media types. |
| Extensions | Model-level `x-*` extensions tab. | Extension support should be generic. |

### 6. Publishing And Docs

| Capability | Observed details | Data model notes |
|---|---|---|
| Publish | Clicking Publish shows `Publishing...`; success message: `Project pushed to workspace`. | Need draft vs published revision. |
| Validation | Publish succeeded while Studio still showed `2+ Errors`. | Validation severity must be explicit; do not equate warnings/errors with publish blocking unless designed. |
| Post-publish share | Share dialog opens automatically, with project visibility and member roles. | Publish flow may include visibility review. |
| Published docs URL | `/docs/:project/branches/main/:sourcePage`. | Published route includes project, branch, page/source identifier. |
| Docs content | After publish, docs rendered title, version, live server, server variables, allowed values, mock server. | Published docs should read from published snapshot, not live draft. |
| Changelog/Export | Buttons visible; no clear menu/dialog observed during exploration. | Record as visible but unresolved behavior. |

## Carta MVP Recommendations

### P0: Build The Durable Core

- Projects page before API editing.
- API source/revision storage in the database.
- OpenAPI YAML/JSON as canonical source revision.
- Resource tree generated from OpenAPI source.
- Operation editor with General, Parameters, Request, Responses, Preview.
- Component/schema editor for `components/schemas`.
- Backend endpoints to load project docs and selected OpenAPI nodes from persisted data.

### P1: Make It Product-Shaped

- API Overview metadata editor.
- Draft vs published revision model.
- Publish action and published docs route.
- Project visibility model.
- Server variables and API server metadata.
- Examples as first-class editable data.
- Generic `x-*` extensions support.

### P2: Improve Professional Workflow

- Try It with generated cURL.
- Generate schema from JSON.
- Import/export.
- Role-aware sharing UI.
- Project/admin settings pages.
- Search and filtering in project/resource trees.

### P3: Platform Expansion

- Teams.
- Git provider integrations.
- SSO.
- Custom domains.
- Analytics, redirects, localization.
- Governance/activity/automation.

## Implementation Guardrails

- Avoid hard-coding API examples in React components. Seed examples through migrations/fixtures into the database.
- Keep Form and Code views consistent by using OpenAPI source as canonical truth.
- Preserve unknown OpenAPI fields and `x-*` extensions even before the UI can edit all of them.
- Store published docs as an immutable snapshot or revision pointer, not a live render of mutable draft state.
- Build PC-first dense layouts for Studio and admin; mobile can be responsive but should not drive the design.

## Open Decisions

- Canonical storage: source blob plus derived indexes, or fully normalized OpenAPI tables?
- Publish model: immutable copied snapshot or pointer to source revision?
- Validation model: which severities block publish?
- Schema composition: preserve-only for MVP or editable UI?
- Mock server: generate later or represent as external integration?
