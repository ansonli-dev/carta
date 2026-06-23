# Stoplight Studio UX Exploration

Date: 2026-06-23

Synthesis: see [`stoplight-product-capability-matrix.md`](./stoplight-product-capability-matrix.md) for the consolidated product capability matrix, Carta implementation priorities, and data-model implications.

Context: explored the Stoplight workspace `techfield.stoplight.io`, project `Carta UX Project`, API `Manual API Flow`, focused on the manual API operation editor for `GET`.

Working principle: record observations continuously while exploring so later implementation work is based on product behavior, not memory.

## Screenshot Log

Screenshots are stored under `/tmp` during exploration.

| # | File | Area |
|---|---|---|
| 01 | `/tmp/stoplight-all-settings-01-start-current-state.png` | Starting point on Responses tab |
| 02 | `/tmp/stoplight-all-settings-02-general-tab-before-settings.png` | General tab before edits |
| 03 | `/tmp/stoplight-all-settings-03-general-name-flags-set.png` | Operation name, ID, deprecated/internal/security flags |
| 04 | `/tmp/stoplight-all-settings-04-general-description-extension-created.png` | Description and extension creation |
| 05 | `/tmp/stoplight-all-settings-05-general-extension-filled.png` | Extension name/value filled |
| 06 | `/tmp/stoplight-all-settings-06-parameters-before-full-settings.png` | Parameters tab before edits |
| 07 | `/tmp/stoplight-all-settings-07-header-cookie-params-added.png` | Header and cookie parameters added |
| 08 | `/tmp/stoplight-all-settings-08-parameters-names-descriptions-filled.png` | Parameter names, descriptions, basic types |
| 09 | `/tmp/stoplight-all-settings-09-parameters-required-advanced-open.png` | Parameter advanced panel open |
| 10 | `/tmp/stoplight-all-settings-10-parameter-advanced-filled.png` | Parameter advanced validation values filled |
| 11 | `/tmp/stoplight-all-settings-11-request-before-full-settings.png` | Request tab before edits |
| 12 | `/tmp/stoplight-all-settings-12-request-schema-type-panel-open.png` | Request body description and schema type panel |
| 13 | `/tmp/stoplight-all-settings-13-request-schema-type-fields-filled.png` | Request schema validation fields filled |
| 14 | `/tmp/stoplight-all-settings-14-schema-format-dropdown.png` | Schema format dropdown options |
| 15 | `/tmp/stoplight-all-settings-15-schema-behavior-dropdown.png` | Schema behavior dropdown options |
| 16 | `/tmp/stoplight-all-settings-16-request-schema-components-options.png` | Components picker |
| 17 | `/tmp/stoplight-all-settings-17-request-schema-component-user-selected.png` | Component reference selected |
| 18 | `/tmp/stoplight-all-settings-18-combine-state-after-click.png` | Combine schemas tab |
| 19 | `/tmp/stoplight-all-settings-19-request-examples-configured.png` | Request examples created |
| 20 | `/tmp/stoplight-all-settings-20-request-example-filled.png` | Request example edited |
| 21 | `/tmp/stoplight-all-settings-21-responses-before-full-settings.png` | Responses tab before full response edits |
| 22 | `/tmp/stoplight-all-settings-22-response-description-filled.png` | Response description filled |
| 23 | `/tmp/stoplight-all-settings-23-response-header-added.png` | Response header row added |
| 24 | `/tmp/stoplight-all-settings-24-response-header-filled.png` | Response header name and description filled |
| 25 | `/tmp/stoplight-all-settings-25-response-orderid-type-panel-open.png` | Response `orderId` type panel open |
| 26 | `/tmp/stoplight-all-settings-26-response-orderid-validation-filled.png` | Response `orderId` default, example, and pattern filled |
| 27 | `/tmp/stoplight-all-settings-27-response-orderid-length-filled.png` | Response `orderId` length constraints filled |
| 28 | `/tmp/stoplight-all-settings-28-response-orderid-deprecated-on.png` | Response `orderId` deprecated switch enabled |
| 29 | `/tmp/stoplight-all-settings-29-response-status-property-added.png` | Response `status` schema property added |
| 30 | `/tmp/stoplight-all-settings-30-response-status-named-required.png` | Response `status` named and marked required |
| 31 | `/tmp/stoplight-all-settings-31-response-status-type-panel-open.png` | Response `status` type panel open |
| 32 | `/tmp/stoplight-all-settings-32-response-status-validation-filled.png` | Response `status` validation filled |
| 33 | `/tmp/stoplight-all-settings-33-response-status-after-scroll-check.png` | Response schema state checked after panel scroll |
| 34 | `/tmp/stoplight-all-settings-34-response-examples-tab-open.png` | Response examples tab open |
| 35 | `/tmp/stoplight-all-settings-35-response-example-filled.png` | Response example filled |
| 36 | `/tmp/stoplight-all-settings-36-response-second-example-created.png` | Attempted second response example creation |
| 37 | `/tmp/stoplight-all-settings-37-response-generate-from-json-open.png` | Response Generate from JSON mode open |
| 38 | `/tmp/stoplight-all-settings-38-response-generate-json-filled.png` | Response Generate from JSON input filled |
| 39 | `/tmp/stoplight-all-settings-39-response-generate-json-applied.png` | Response schema generated from JSON |
| 40 | `/tmp/stoplight-all-settings-40-response-status-added.png` | Add Response status menu open |
| 41 | `/tmp/stoplight-all-settings-41-response-404-selected.png` | `404` response selected |
| 42 | `/tmp/stoplight-all-settings-42-response-404-description-filled.png` | `404` response description filled |
| 43 | `/tmp/stoplight-all-settings-43-response-404-body-add-menu.png` | `404` response body media type menu |
| 44 | `/tmp/stoplight-all-settings-44-response-404-json-body-added.png` | `404` JSON body added |
| 45 | `/tmp/stoplight-all-settings-45-response-404-generate-json-filled.png` | `404` Generate from JSON input filled |
| 46 | `/tmp/stoplight-all-settings-46-response-404-schema-generated.png` | `404` schema generated from JSON |
| 47 | `/tmp/stoplight-all-settings-47-operation-preview-after-settings.png` | Operation Preview after settings |
| 48 | `/tmp/stoplight-all-settings-48-operation-preview-404-response.png` | Operation Preview with `404` response selected |
| 49 | `/tmp/stoplight-all-settings-49-operation-try-it-after-settings.png` | Try It tab after settings |
| 50 | `/tmp/stoplight-all-settings-50-operation-try-it-inputs-filled.png` | Try It inputs filled and cURL updated |
| 51 | `/tmp/stoplight-all-settings-51-operation-code-view-after-settings.png` | Code view after settings |
| 52 | `/tmp/stoplight-all-settings-52-continue-entry.png` | Continued exploration entry point |
| 53 | `/tmp/stoplight-all-settings-53-continue-loaded-check.png` | Studio loaded in Code view |
| 54 | `/tmp/stoplight-all-settings-54-publish-menu-open.png` | Publish menu open |
| 55 | `/tmp/stoplight-all-settings-55-project-actions-menu-open.png` | Project actions menu open |
| 56 | `/tmp/stoplight-all-settings-56-share-dialog-open.png` | Share project dialog open |
| 57 | `/tmp/stoplight-all-settings-57-global-create-resource-menu-open.png` | Global create resource menu open |
| 58 | `/tmp/stoplight-all-settings-58-tree-create-resource-menu-open.png` | Resource-tree create menu open |
| 59 | `/tmp/stoplight-all-settings-59-create-model-dialog-open.png` | New Model dialog open |
| 60 | `/tmp/stoplight-all-settings-60-create-model-advanced-open.png` | New Model advanced options open |
| 61 | `/tmp/stoplight-all-settings-61-user-model-open.png` | Existing `User` model opened |
| 62 | `/tmp/stoplight-all-settings-62-user-model-form-view.png` | `User` model Form view |
| 63 | `/tmp/stoplight-all-settings-63-user-model-examples-tab.png` | `User` model Examples tab |
| 64 | `/tmp/stoplight-all-settings-64-user-model-extensions-tab.png` | `User` model Extensions tab |
| 65 | `/tmp/stoplight-all-settings-65-user-model-preview.png` | `User` model Preview |
| 66 | `/tmp/stoplight-all-settings-66-api-overview-open.png` | API Overview opened |
| 67 | `/tmp/stoplight-all-settings-67-api-overview-form-view.png` | API Overview Form view |
| 68 | `/tmp/stoplight-all-settings-68-api-overview-server-variables-open.png` | Server Variables opened |
| 69 | `/tmp/stoplight-all-settings-69-api-overview-server-variable-added.png` | Server variable row added |
| 70 | `/tmp/stoplight-all-settings-70-api-overview-server-variable-filled.png` | Server variable fields filled |
| 71 | `/tmp/stoplight-all-settings-71-api-overview-server-variable-allowed-values-open.png` | Server variable allowed-values popover open |
| 72 | `/tmp/stoplight-all-settings-72-api-overview-server-variable-allowed-value-added.png` | Allowed value row added |
| 73 | `/tmp/stoplight-all-settings-73-api-overview-server-variable-allowed-values-filled.png` | Allowed values filled |
| 74 | `/tmp/stoplight-all-settings-74-api-overview-server-variable-final.png` | Server variable final state |
| 75 | `/tmp/stoplight-all-settings-75-docs-site-opened.png` | Published docs URL opened |
| 76 | `/tmp/stoplight-all-settings-76-docs-site-loaded-check.png` | Published docs URL loaded check |
| 77 | `/tmp/stoplight-all-settings-77-admin-projects-open.png` | Admin Projects page |
| 78 | `/tmp/stoplight-all-settings-78-admin-project-more-actions-open.png` | Admin project row actions menu |
| 79 | `/tmp/stoplight-all-settings-79-admin-settings-open.png` | Admin Settings page |
| 80 | `/tmp/stoplight-all-settings-80-admin-members-open.png` | Admin Members page |
| 81 | `/tmp/stoplight-all-settings-81-admin-members-invite-dialog.png` | Invite Members dialog |
| 82 | `/tmp/stoplight-all-settings-82-admin-teams-open.png` | Admin Teams page |
| 83 | `/tmp/stoplight-all-settings-83-publish-attempt-studio-entry.png` | Publish attempt: Studio entry loading |
| 84 | `/tmp/stoplight-all-settings-84-publish-attempt-studio-loaded.png` | Publish attempt: Studio loaded |
| 85 | `/tmp/stoplight-all-settings-85-publish-click-result.png` | Publish clicked, `Publishing...` state |
| 86 | `/tmp/stoplight-all-settings-86-publish-after-wait.png` | Publish completed and Share Project dialog opened |
| 87 | `/tmp/stoplight-all-settings-87-publish-share-dialog-dismissed.png` | Publish share dialog dismissed |
| 88 | `/tmp/stoplight-all-settings-88-docs-after-publish-loaded.png` | Docs page after publish |
| 89 | `/tmp/stoplight-all-settings-89-docs-changelog-open.png` | Docs Changelog clicked |
| 90 | `/tmp/stoplight-all-settings-90-docs-export-menu-open.png` | Docs Export clicked |

## Project And API Flow

- Stoplight separates project selection/administration from API editing.
- The natural flow is: workspace/projects area -> select project -> enter project API/studio area -> select API document/source -> edit endpoints.
- Manual API creation produces a source/document and endpoint tree. The operation editor is source-oriented, not just a form over a database row.
- The Studio URL encodes both `source` and `symbol`, which means the selected document/source and selected OpenAPI node are first-class navigation state.

## Operation Editor Structure

The endpoint editor uses a tabbed structure:

- General
- Parameters
- Request
- Responses
- Preview

This is the core structure Carta should follow for the API management screen. It is denser and more operational than the current simple page.

## General Tab

Observed configurable areas:

- Operation name.
- Deprecated switch.
- Internal switch.
- Operation ID.
- Markdown-capable operation description.
- Security area:
  - edit global security.
  - operation-level security add action, disabled when operation security is disabled.
  - "disable security for operation" toggle.
- X-Extensions area:
  - add extension.
  - extension key.
  - extension value.

Values set during exploration:

- Operation name: `Get order by ID`.
- Operation ID: `getOrderById`.
- Deprecated: on.
- Internal: on.
- Disable security for operation: on.
- Description:
  - `Retrieve a single order by its identifier.`
  - `Use this operation when rendering an order detail page or synchronizing downstream fulfillment state.`
- Extension:
  - key: `x-carta-owner`
  - value: `orders-platform`

Implementation implications for Carta:

- Do not hard-code operation metadata in TSX.
- Store operation metadata as OpenAPI-backed structured data.
- Support arbitrary `x-*` extensions.
- Security must be modeled at both global and operation levels.

## Parameters Tab

Observed parameter groups:

- Path.
- Query.
- Header.
- Cookie.

Each parameter row supports:

- Name.
- Schema type summary.
- Required toggle.
- Description.
- Delete/action icons.
- Advanced settings panel.

Advanced parameter settings observed:

- Parameter properties:
  - style.
  - deprecated.
  - allow empty value.
  - allow reserved.
- Schema properties:
  - format.
  - default.
  - enum.
  - example.
  - pattern.
  - minLength.
  - maxLength.

Values set during exploration:

- Query parameter:
  - name: `includeItems`
  - description: `Include line items in the order response.`
  - advanced default: `false`
  - advanced enum input: `true`
  - example: `true`
  - pattern: `^(true|false)$`
  - minLength: `4`
  - maxLength: `5`
  - deprecated: on
  - allowEmptyValue: on
  - allowReserved: on
- Header parameter:
  - name: `X-Request-ID`
  - description: `Client supplied request correlation ID.`
- Cookie parameter:
  - name: `cart_session`
  - description: `Session cookie used to personalize order lookups.`

Implementation implications for Carta:

- Parameter editing needs group-aware UI, not one flat list.
- Schema editing and parameter transport settings are separate concepts.
- The API data model should preserve OpenAPI semantics such as `style`, `allowReserved`, `allowEmptyValue`, `deprecated`, and schema validation fields.

## Request Tab

Observed request areas:

- Body description.
- Body content type tabs such as `application/json`.
- Content-type actions menu.
- Schema editor.
- Examples editor.
- Generate from JSON workflow.

Request schema editor supports:

- Object root row with property count.
- Add new property.
- Required toggle at property level.
- Property type panel.
- Component reference selection.
- Combine schemas area.

Schema type panel supports:

- Type dropdown.
- Properties dropdown.
- Format.
- Behavior.
- Default.
- Example.
- Pattern.
- minLength.
- maxLength.
- Deprecated.

Format options observed:

- date-time.
- date.
- time.
- duration.
- email.
- idn-email.
- hostname.
- idn-hostname.
- ipv4.
- ipv6.
- uri.
- uri-reference.
- iri.
- iri-reference.
- uuid.
- uri-template.
- json-pointer.
- relative-json-pointer.
- regex.
- binary.
- byte.
- password.

Behavior options observed:

- Read/Write.
- Read Only.
- Write Only.

Components picker observed:

- Search.
- Filter: All / This file.
- Component option: `User`.

Combine schemas area observed:

- AND maps to `allOf`.
- XOR maps to `oneOf`.
- OR maps to `anyOf`.
- The UI presents schema composition as a first-class choice instead of requiring raw YAML editing.

Values set during exploration:

- Body description:
  - `Request payload for resolving an order lookup. Include the customer context when the order is scoped to an account.`
- Existing property `customerId`:
  - marked required.
  - default: `cus_default`
  - example: `cus_12345`
  - pattern: `^cus_[0-9]+$`
  - minLength: `5`
  - maxLength: `20`
  - deprecated: on.
  - format selected: `uuid`.
  - behavior selected: `Write Only`.
  - component reference selected: `User`.

Request examples:

- Created a second request example.
- Renamed it to `Lookup with customer context`.
- Edited JSON to:

```json
{
  "customerId": {
    "id": 142,
    "firstName": "Alice",
    "lastName": "Smith",
    "email": "alice.smith@gmail.com",
    "emailVerified": true
  }
}
```

Implementation implications for Carta:

- Request body editing must support multiple media types.
- Schema editing must support inline schemas, component refs, validation fields, and composition.
- Examples are separate first-class records under a media type.
- "Generate from JSON" is an important productivity shortcut and should be considered for MVP-plus.

## Responses Tab

Observed response areas:

- Response status tabs such as `200`, each with an actions menu.
- Add Response action.
- Markdown-capable response description editor.
- Headers section with Add action.
- Body section with media type tabs such as `application/json`.
- Body media type actions menu.
- Schema tab.
- Examples tab.
- Generate from JSON workflow.

Values set during exploration:

- `200` response description:
  - `Order lookup succeeded. Returns the order summary, fulfillment state, and any requested line items.`
- Response header:
  - name: `X-RateLimit-Remaining`
  - type: `string`
  - description: `Number of requests remaining in the current rate limit window.`
  - the response header `Required` control is present but disabled.
- Response body schema property `orderId`:
  - marked required.
  - type: `string`.
  - default: `ord_default`.
  - example: `ord_10001`.
  - pattern: `^ord_[0-9]+$`.
  - minLength: `5`.
  - maxLength: `24`.
  - deprecated: on.
- Response body schema property `status`:
  - added as a second property.
  - marked required.
  - type: `string`.
  - default: `pending`.
  - example: `fulfilled`.
  - pattern: `^(pending|paid|fulfilled|cancelled)$`.
  - minLength: `4`.
  - maxLength: `16`.
- Response example:
  - renamed to `Successful order lookup`.
  - JSON:

```json
{
  "orderId": "ord_10001",
  "status": "fulfilled",
  "total": 128.5,
  "currency": "USD",
  "lineItems": [
    {
      "sku": "SKU-RED-001",
      "quantity": 2
    }
  ]
}
```

- Attempted to create a second response example with `New Example`; the visible UI still showed only the current `Successful order lookup` tab after the click.
- Generate from JSON:
  - the workflow replaces the schema/examples subpanel with a JSON editor plus `Generate` and `Cancel` actions.
  - `Generate` is disabled for the default `{ }` state and becomes enabled after meaningful JSON is entered.
  - input used:

```json
{
  "orderId": "ord_10001",
  "status": "fulfilled",
  "total": 128.5,
  "currency": "USD",
  "paid": true,
  "lineItems": [
    {
      "sku": "SKU-RED-001",
      "quantity": 2,
      "unitPrice": 64.25
    }
  ],
  "fulfillment": {
    "carrier": "UPS",
    "trackingNumber": "1Z999AA10123456784"
  }
}
```

  - generated schema fields included:
    - `orderId`: string.
    - `status`: string.
    - `total`: number.
    - `currency`: string.
    - `paid`: boolean.
    - `lineItems`: array[object].
    - nested `lineItems` fields: `sku`, `quantity`, `unitPrice`.
    - `fulfillment`: object.
    - nested `fulfillment` fields: `carrier`, `trackingNumber`.
- Additional response status:
  - `Add Response` opens a searchable status-code menu.
  - observed options included `default`, `201: Created`, `207: Multi-Status (WebDAV)`, `404: Not Found`, and `444: No Response (Nginx)`.
  - selected `404: Not Found`.
  - `404` becomes a separate response tab with its own actions menu.
  - `404` description:
    - `Order was not found for the supplied identifier or the caller does not have access to it.`
  - adding a body opens a media type menu with many built-in content types, including `application/json`, `application/xml`, `multipart/form-data`, `text/html`, `text/plain`, `application/pdf`, `application/zip`, and `application/x-www-form-urlencoded`.
  - selected `application/json`.
  - generated `404` schema from:

```json
{
  "code": "ORDER_NOT_FOUND",
  "message": "Order ord_99999 was not found.",
  "requestId": "req_7f3f9c",
  "retryable": false
}
```

  - generated `404` schema fields:
    - `code`: string.
    - `message`: string.
    - `requestId`: string.
    - `retryable`: boolean.

Preview observations:

- Preview renders the configured operation as documentation, not as an edit form.
- The operation title `Get order by ID` is shown as the main heading.
- Deprecated and Internal badges are visible.
- The route is still shown as `/Orders`, confirming the earlier route/path mismatch observed during manual endpoint creation.
- Query parameters, request body description, request examples, response headers, response tabs, and schema fields appear in the generated documentation.
- `404` is available as a response tab.
- Selecting `404` shows the error response description, response body content type selector, and generated fields `code`, `message`, `requestId`, and `retryable`.

Try It observations:

- Try It is a separate tab in Preview mode.
- Required parameters become runnable input fields.
- Visible inputs included:
  - `includeItems`.
  - `X-Request-ID`.
  - request body JSON editor.
- Filling `includeItems=true` and `X-Request-ID=req_7f3f9c` updated the generated cURL sample immediately.
- Filled body:

```json
{
  "customerId": {
    "id": 142,
    "email": "alice.smith@gmail.com"
  }
}
```

- Generated cURL included:
  - `http://localhost:3000/Orders?includeItems=true`
  - `Accept: application/json`
  - `X-Request-ID: req_7f3f9c`
- Did not click `Send API Request`.

Code view observations:

- Code view shows the canonical OpenAPI YAML.
- The document is OpenAPI `3.1.0`.
- The generated code view includes `paths`, `responses`, `schema`, component `$ref`, and the `404` response.
- This confirms that the form editor is a structured editor over OpenAPI, not a separate proprietary operation model.
- On returning to Studio later, the page reopened in Code view and displayed line-numbered OpenAPI YAML.
- The left resource tree exposed top-level areas:
  - APIs.
  - Components.
  - Docs.
  - Files.
  - Styles.
- The API resource tree exposed:
  - `reference`.
  - `Manual-API-Flow.yaml`.
  - `Orders-API.yaml`.
  - `API Overview`.
  - `Paths`.
  - `Models`.
  - `Request Bodies`.
  - `Responses`.
  - `Parameters`.
  - `Examples`.

Next to explore:

- Component/model editing.
- Docs, files, and style areas.
- Inspect publish/save behavior only if needed; do not publish the demo project unless explicitly requested.

## Project-Level Actions

Publish observations:

- `Publish` and `Publish menu` are separate controls.
- Opening `Publish menu` showed `Discard changes since last publish`.
- This confirms Stoplight has a distinct unpublished working state and a last-published state.
- Did not click `Discard changes since last publish`.

Publish update attempt:

- Returned to Studio URL `https://techfield.stoplight.io/studio/carta-ux-project?source=uajwu5rv`.
- Studio showed `2+ Errors`, but the `Publish` button was still available.
- Clicking `Publish` changed the primary publish control to `Publishing...` and disabled it while the operation ran.
- After waiting, the page showed `Project pushed to workspace`.
- A `Share Project: Carta UX Project` dialog opened automatically after publish.
- The share dialog showed:
  - Project Visibility.
  - current state: publicly accessible to logged-out users.
  - visibility options: Public, Internal, Private.
  - member list with Anson Li as Owner.
- Dismissed the share dialog.
- Did not change visibility, invite users, or alter member roles.

Published docs verification after publish:

- Opened `Go to Docs` after publishing.
- Docs URL changed to `https://techfield.stoplight.io/docs/carta-ux-project/branches/main/aa459r05qv1ek-manual-api-flow`.
- Page title became `Manual API Flow | Carta UX Project`.
- Unlike the pre-publish check, the docs page rendered API content.
- Visible docs content included:
  - `Manual API Flow`.
  - `v1.0`.
  - API Base URL.
  - Live Server: `http://localhost:3000`.
  - server variable `environment`.
  - allowed values `prod` and `staging`.
  - default `prod`.
  - Mock Server URL: `https://stoplight.io/mocks/techfield/carta-ux-project/1875523908`.
- Docs page exposed buttons:
  - Changelog.
  - Export.
- Clicking `Changelog` did not reveal a clearly visible dialog or page change in this check.
- Clicking `Export` did not reveal a clearly visible menu in this check.

Implementation implications for Carta:

- Publishing can succeed even when the editor still shows validation errors, so publish gating and validation severity should be explicit.
- A successful publish should produce a clear status message and optionally prompt sharing/visibility review.
- The published docs route should include enough identity to target a specific API source/page, not only the project.
- Publish verification should check the live docs URL, because Studio Preview and published Docs can diverge.

Project actions observations:

- The project-level action menu showed `Create New Version`.
- A `main` item appeared disabled under that action.
- This suggests a version/branch model around project content, with `main` as the active branch/version context.

Share observations:

- Share opens a dialog titled `Share Project: Carta UX Project`.
- The dialog supports inviting by member name.
- The workspace currently shows a max Members limit of `1`.
- Visibility can be `Public` or `Private`.
- Current state shown: `Project is publicly accessible to logged-out users`.
- Member roles exposed:
  - Viewer.
  - Editor.
  - Admin.
  - Remove Member.
- The role button was disabled for the visible current member row.
- Did not invite anyone or change visibility/roles.

Implementation implications for Carta:

- Project-level publishing state should be separate from draft editing state.
- Sharing/visibility belongs at project level, not inside API endpoint editing.
- Role and access concepts should be modeled even if the MVP UI starts read-only.
- Version/branch concepts need room in the data model if Carta wants Stoplight parity.

## Resource Creation

Create resource observations:

- There are two `Create new resource` controls:
  - a global/top-level control.
  - a resource-tree/local control.
- Both exposed the same broad menu during this exploration.
- Resource types shown:
  - API.
  - Endpoint.
  - Model.
  - Article.
  - Stoplight Config.
  - Image.
  - Table of Contents.
  - File.
  - Directory.
  - Import Style Guide.
  - Import File.
  - Import Directory.

New Model dialog observations:

- Creating a model opens a dialog titled `New Model`.
- Fields/actions shown:
  - Name.
  - Tags (Recommended), with placeholder `Which tag best represents this model?`.
  - helper text: `Used to organize your models`.
  - category toggle: `Common`.
  - category toggle: `Single API`.
  - `Show Advanced`.
  - `Create + Add More`, disabled until required fields are present.
  - `Create`, disabled until required fields are present.
- Advanced options exposed model format choices:
  - YAML.
  - JSON.
- Did not create a model.

Implementation implications for Carta:

- Carta should not treat an API project as only endpoints. The project tree should support multiple resource kinds.
- Model/schema creation needs tags and scope/type concepts.
- The create dialogs should support "create and add more" for batch authoring.

## Model Editing

Existing model observations:

- Opening `User` changed the URL symbol to `components/schemas/User`.
- This confirms Models are OpenAPI component schemas.
- The model editor uses the same top-level modes:
  - Form.
  - Code.
  - Preview.

Model Form observations:

- Model-level fields:
  - title textbox, populated with `User`.
  - `Model description...` textbox.
- Model tabs:
  - Schema.
  - Examples.
  - Extensions.
- Schema tab includes:
  - `Generate from JSON`.
  - root object row.
  - `Add new property`.
  - property name fields.
  - property type/format buttons.
  - property required toggles.
- Existing `User` properties included:
  - `id`: integer, required.
  - `firstName`: string, required.
  - `lastName`: string, required.
  - `email`: string<email>, required.
  - `dateOfBirth`: string<date>.
  - `emailVerified`: boolean, required.
  - `createDate` or related date field: string<date>.

Model Examples observations:

- Model examples are managed in a separate tab.
- Default example tab: `Example 1`.
- Example actions include copy and trash.
- Example is edited as JSON.
- Existing example value included `id`, `firstName`, `lastName`, `email`, `dateOfBirth`, `emailVerified`, and `signUpDate`.

Model Extensions observations:

- Model extensions are a separate tab.
- Empty state: `No Extension. Click '+ New Extension' to get started.`
- Action: `New Extension`.

Model Preview observations:

- Preview renders the model as documentation with heading `User`.
- Fields display name, type/format, required marker, and descriptions.
- Example is shown as a formatted JSON block.

Implementation implications for Carta:

- Schema components need their own editor and route, not just inline endpoint schema editing.
- Endpoint request/response schema editors should be able to reference these component schemas.
- Examples and extensions should be modeled consistently across operations, bodies, responses, and components.

## API Overview Editing

API Overview observations:

- Clicking `API Overview` opened the API source overview, not a generic article page.
- The preview showed:
  - `Manual API Flow`.
  - version `v1.0`.
  - API Base URL.
  - live server `http://localhost:3000`.
- The URL kept the API `source` and did not include an operation/model `symbol`.

API Overview Form observations:

- Editable API metadata fields:
  - Version.
  - Name.
  - Summary.
  - Description with rich Markdown editor controls.
- Server section:
  - Add server.
  - Server URL.
  - Server name.
  - Server Variables.
  - Remove server.
- Contact section:
  - Contact Name.
  - Contact Url.
  - Contact Email.
  - Terms of Service URL.
- License section:
  - License Name.
  - license identifier mode selector, observed as `URL`.
  - license URL field.
- Extensions section:
  - Add.
  - New Extension.

Server Variables observations:

- Expanding `Server Variables` reveals a variables area.
- `Add server variable` creates a row with:
  - Name (Required), defaulted to `var1`.
  - Description.
  - Default Value (Required).
  - Edit allowed values.
  - Remove server variable.
- Values set during exploration:
  - Name: `environment`.
  - Description: `Runtime environment segment used by the server URL.`
  - Default Value: `prod`.
- Editing allowed values opens a popover with:
  - Allowed Values heading.
  - Add action.
  - required value textboxes.
  - remove value buttons.
- Allowed values set during exploration:
  - `prod`.
  - `staging`.

Implementation implications for Carta:

- API document metadata needs a dedicated editor separate from endpoint editing.
- Servers and server variables are first-class OpenAPI data and should be persisted.
- Contact, terms, license, and extensions belong to the API document metadata model.

## Published Docs View

Docs URL observations:

- `Go to Docs` navigated to `https://techfield.stoplight.io/docs/carta-ux-project/branches/main`.
- The page title was `Carta UX Project`.
- The visible page did not render the API documentation content during this check.
- Visible elements included:
  - Stoplight free workspace banner.
  - workspace link `techfield`.
  - `Invite to Workspace`.
  - powered-by Stoplight footer/link.
- Inference: the docs shell is distinct from Studio, but this project's docs content may require publish state or additional configuration before it appears.
- Did not publish or change docs settings.

Implementation implications for Carta:

- Carta needs a clear distinction between Studio/editing preview and published docs URL.
- Empty/unpublished docs states should be explicit, not confusingly blank.

## Admin Projects

Admin Projects observations:

- URL: `/admin/projects`.
- Workspace admin sidebar includes:
  - Home.
  - Projects.
  - Teams.
  - Members.
  - Settings.
  - Governance.
  - Activity.
  - Automation.
  - Billing.
- Actions:
  - New Group.
  - New Project.
- Project table includes:
  - selection checkbox.
  - Name.
  - Owner.
  - Nodes.
  - Type.
  - Last Edit.
  - Visibility.
  - Actions.
- Filters:
  - Visibility: All, with Public/Private options.
  - Search.
- Project row observed:
  - `Carta UX Project`.
  - owner avatar/initial.
  - nodes: `0`.
  - type: `API`.
  - last edit: about `49 minutes ago`.
  - visibility: `public`.
- Row More actions menu exposed:
  - Delete From Workspace.
- Did not delete.

## Admin Settings

Workspace Settings observations:

- Display Name.
- Workspace Identifier.
- Allow Join Requests.
- Send Daily Digest to Guests.
- Approved Email Domains.
- Automatic Style Guide Conversion.
- Enable UserWay Accessibility Widget.
- Allow Public Projects.
- Allow Web Projects.

Look & Feel observations:

- Remove Stoplight Branding.
- Theme.
- Favicon.
- Logo.
- Landing Page.

Docs Settings observations:

- Enable Try It.
- Show Mock Servers.
- Allow Search Engine Indexing.

Custom Domain observations:

- Domain.
- Analytics.
- Redirects.
- Hide Sign In Button.
- Localize.

Stoplight API observations:

- Workspace Tokens.
- Workspace tokens provide API access for all workspace resources.

Integrations observed:

- Azure DevOps Services.
- Bitbucket Cloud.
- Email and Password.
- GitHub.
- GitLab.
- Azure DevOps Server.
- Bitbucket Data Center.
- LDAP.
- SAML.

Danger Zone observations:

- Remove Workspace.

Toggle states observed:

- Allow Join Requests: on.
- Guests Receive Daily Digest: on.
- Automatic Spectral to Style Guide conversion: on.
- UserWay Widget: on.
- Allow Public Projects: on.
- Allow Web Projects: on.
- Stoplight Branding removal: off.
- Enable Show Try It: on.
- Enable Show Mock Servers in Try It: on.
- Search Engine Indexing: on.
- Hide Sign In Button: off.

## Admin Members And Teams

Members observations:

- URL: `/admin/members`.
- Actions:
  - Invite Members.
- Filters:
  - Role: All, with Owner/Admin/Viewer/Guest/Pending options.
  - Search.
- Member table includes:
  - selection.
  - Name.
  - Last Active.
  - Role.
  - Notes.
  - More actions.
- Existing member row:
  - Anson Li.
  - email `ansonli.dev@gmail.com`.
  - last active `just now`.
  - role `owner`.

Invite Members dialog observations:

- Dialog title: `Add Workspace Members`.
- Invitation method: member name or email.
- Role selector options:
  - Owner.
  - Billing Admin.
  - Admin.
  - Viewer.
  - Guest.
- Members limit progress shown: `1 / 1 Members`.
- Explanation says the limit includes current members, pending invitations, and new workspace invitations.
- `Send Invites` was disabled.
- Did not send invitations.

Teams observations:

- URL: `/admin/teams`.
- `New Team` action exists.
- Main page describes Teams as a way to manage members and guests.
- Teams is gated by `Pro Team Plan`.
- Upgrade action shown: `Upgrade to Pro Team`.
- Secondary action shown: `More Features`.

Implementation implications for Carta:

- Admin should be a separate product area from API Studio.
- Project list needs table operations, visibility filtering, and actions.
- Workspace settings should own docs behavior such as Try It visibility and mock server visibility.
- Integrations and auth providers are platform-level concerns.
- Member roles and invitation limits should be accounted for even if initially stubbed.

## Product-Level Takeaways

- Stoplight treats OpenAPI as the product surface. The visual editor is a structured projection of OpenAPI, not an unrelated custom CRUD model.
- The editor is dense, PC-first, and optimized for repeated professional API editing.
- Data should be persisted in the database as project/source/revision-backed API documents, then rendered into editing surfaces.
- TSX hard-coded sample APIs are only acceptable as bootstrapping fixtures; long-term UI should load persisted API documents and revisions.
- Carta should separate:
  - project management.
  - source/document management.
  - operation editing.
  - schema/component management.
  - documentation preview.
- Carta should keep the API editor close to Stoplight's mental model: sidebar tree plus tabbed operation editor plus preview.

## Open Questions For Carta Implementation

- Should Carta store canonical OpenAPI as YAML/JSON in source revisions and derive queryable endpoint rows from it, or store normalized endpoint/schema tables and render OpenAPI from them?
- How much of schema composition (`allOf`, `oneOf`, `anyOf`) belongs in the first MVP implementation?
- Should examples be versioned independently, or only as part of source revisions?
- Should operation-level security editing be included in MVP, or read-only until auth/security modeling is ready?
