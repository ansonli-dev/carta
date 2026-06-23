import { FormEvent, useEffect, useMemo, useState } from "react";
import { api, type Project } from "./api/client";
import { StoplightDocsPanel } from "./pages/StoplightDocsPanel";

function defaultOpenApiSource(title = "Todo API") {
  return `openapi: 3.0.3
info:
  title: ${title}
  version: 1.0.0
  description: |-
    ## Overview

    This sample API is shaped to match the Stoplight Elements demo: rich overview copy,
    grouped endpoints, reusable schemas, request examples, response examples, shared
    parameters, and API key security.

    Use it as a starting point for a project API, then replace resources and schemas
    with your own OpenAPI document.
  contact:
    name: Carta Platform
    email: platform@example.com
  license:
    name: MIT
servers:
  - url: https://api.example.com
    description: Production
  - url: https://sandbox.example.com
    description: Sandbox
security:
  - ApiKeyAuth: []
tags:
  - name: Todos
    description: Task planning and status endpoints.
  - name: Users
    description: User profile endpoints used by the todo workflow.
paths:
  /todos:
    get:
      tags:
        - Todos
      summary: List Todos
      operationId: listTodos
      description: |-
        Returns a paginated list of todos.

        Markdown is supported in descriptions, so API teams can add usage notes,
        rollout guidance, and links to runbooks.
      parameters:
        - $ref: '#/components/parameters/Limit'
      responses:
        '200':
          description: Returns a list of todos.
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/Todo'
              examples:
                default:
                  $ref: '#/components/examples/TodoList'
        '401':
          $ref: '#/components/responses/Unauthorized'
    post:
      tags:
        - Todos
      summary: Create Todo
      operationId: createTodo
      description: Creates a todo item for the authenticated user.
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/TodoCreate'
            examples:
              default:
                $ref: '#/components/examples/TodoCreate'
      responses:
        '201':
          description: Todo created.
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Todo'
              examples:
                default:
                  $ref: '#/components/examples/Todo'
        '401':
          $ref: '#/components/responses/Unauthorized'
  /todos/{todoId}:
    parameters:
      - $ref: '#/components/parameters/TodoId'
    get:
      tags:
        - Todos
      summary: Get Todo
      operationId: getTodo
      description: Gets a single todo by ID.
      responses:
        '200':
          description: Returns the requested todo.
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Todo'
              examples:
                default:
                  $ref: '#/components/examples/Todo'
        '404':
          $ref: '#/components/responses/NotFound'
    put:
      tags:
        - Todos
      summary: Replace Todo
      operationId: replaceTodo
      description: Replaces every mutable field on a todo.
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/TodoCreate'
      responses:
        '200':
          description: Todo replaced.
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Todo'
        '404':
          $ref: '#/components/responses/NotFound'
    patch:
      tags:
        - Todos
      summary: Update Todo
      operationId: updateTodo
      deprecated: true
      description: Deprecated partial update endpoint kept for compatibility examples.
      requestBody:
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/TodoUpdate'
      responses:
        '200':
          description: Todo updated.
        '404':
          $ref: '#/components/responses/NotFound'
    delete:
      tags:
        - Todos
      summary: Delete Todo
      operationId: deleteTodo
      description: Deletes a todo by ID.
      responses:
        '204':
          description: Todo deleted.
        '404':
          $ref: '#/components/responses/NotFound'
  /users:
    get:
      tags:
        - Users
      summary: List Users
      operationId: listUsers
      description: Lists users who can own todos.
      security: []
      responses:
        '200':
          description: Returns users.
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/User'
    post:
      tags:
        - Users
      summary: Create User
      operationId: createUser
      description: Creates a user profile.
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/UserCreate'
            examples:
              default:
                $ref: '#/components/examples/UserCreate'
      responses:
        '201':
          description: User created.
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/User'
              examples:
                default:
                  $ref: '#/components/examples/User'
  /users/{userId}:
    parameters:
      - $ref: '#/components/parameters/UserId'
    get:
      tags:
        - Users
      summary: Get User
      operationId: getUser
      description: Gets a user by ID.
      responses:
        '200':
          description: Returns the requested user.
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/User'
        '404':
          $ref: '#/components/responses/NotFound'
    delete:
      tags:
        - Users
      summary: Delete User
      operationId: deleteUser
      description: Deletes a user profile.
      responses:
        '204':
          description: User deleted.
components:
  securitySchemes:
    ApiKeyAuth:
      type: apiKey
      in: header
      name: X-API-Key
      description: Use any demo value, for example \`123\`.
  parameters:
    Limit:
      name: limit
      in: query
      required: false
      description: Maximum number of records to return.
      schema:
        type: integer
        minimum: 1
        maximum: 100
        default: 20
    TodoId:
      name: todoId
      in: path
      required: true
      description: Unique todo identifier.
      schema:
        type: string
        example: todo_123
    UserId:
      name: userId
      in: path
      required: true
      description: Unique user identifier.
      schema:
        type: string
        example: usr_123
  schemas:
    Todo:
      type: object
      required:
        - id
        - title
        - completed
        - owner
        - createdAt
      properties:
        id:
          type: string
          example: todo_123
          readOnly: true
        title:
          type: string
          minLength: 1
          maxLength: 120
          example: Review API changelog
        completed:
          type: boolean
          default: false
        priority:
          type: string
          enum:
            - low
            - medium
            - high
          default: medium
        owner:
          $ref: '#/components/schemas/User'
        dueAt:
          type: string
          format: date-time
          nullable: true
        createdAt:
          type: string
          format: date-time
          readOnly: true
        updatedAt:
          type: string
          format: date-time
          readOnly: true
    TodoCreate:
      type: object
      required:
        - title
        - ownerId
      properties:
        title:
          type: string
          example: Review API changelog
        ownerId:
          type: string
          example: usr_123
        priority:
          type: string
          enum:
            - low
            - medium
            - high
        dueAt:
          type: string
          format: date-time
    TodoUpdate:
      type: object
      properties:
        title:
          type: string
        completed:
          type: boolean
        priority:
          type: string
          enum:
            - low
            - medium
            - high
    User:
      type: object
      required:
        - id
        - firstName
        - lastName
        - email
      properties:
        id:
          type: string
          readOnly: true
          example: usr_123
        firstName:
          type: string
          example: Avery
        lastName:
          type: string
          example: Stone
        email:
          type: string
          format: email
          example: avery@example.com
        phone:
          type: string
          example: '+1-555-0100'
    UserCreate:
      type: object
      required:
        - firstName
        - lastName
        - email
      properties:
        firstName:
          type: string
          example: Avery
        lastName:
          type: string
          example: Stone
        email:
          type: string
          format: email
          example: avery@example.com
        phone:
          type: string
    Error:
      type: object
      required:
        - code
        - message
      properties:
        code:
          type: string
        message:
          type: string
  responses:
    Unauthorized:
      description: API key is missing or invalid.
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/Error'
          examples:
            default:
              value:
                code: unauthorized
                message: Provide a valid API key.
    NotFound:
      description: Resource not found.
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/Error'
          examples:
            default:
              value:
                code: not_found
                message: Resource not found.
  examples:
    Todo:
      value:
        id: todo_123
        title: Review API changelog
        completed: false
        priority: high
        owner:
          id: usr_123
          firstName: Avery
          lastName: Stone
          email: avery@example.com
        dueAt: '2026-07-01T09:00:00Z'
        createdAt: '2026-06-23T09:00:00Z'
        updatedAt: '2026-06-23T09:00:00Z'
    TodoList:
      value:
        - id: todo_123
          title: Review API changelog
          completed: false
          priority: high
          owner:
            id: usr_123
            firstName: Avery
            lastName: Stone
            email: avery@example.com
          dueAt: '2026-07-01T09:00:00Z'
          createdAt: '2026-06-23T09:00:00Z'
          updatedAt: '2026-06-23T09:00:00Z'
        - id: todo_456
          title: Publish SDK guide
          completed: true
          priority: medium
          owner:
            id: usr_456
            firstName: Morgan
            lastName: Lee
            email: morgan@example.com
          dueAt: null
          createdAt: '2026-06-20T09:00:00Z'
          updatedAt: '2026-06-22T16:30:00Z'
    TodoCreate:
      value:
        title: Review API changelog
        ownerId: usr_123
        priority: high
        dueAt: '2026-07-01T09:00:00Z'
    User:
      value:
        id: usr_123
        firstName: Avery
        lastName: Stone
        email: avery@example.com
        phone: '+1-555-0100'
    UserCreate:
      value:
        firstName: Avery
        lastName: Stone
        email: avery@example.com
        phone: '+1-555-0100'
`;
}

type ViewState =
  | {
      name: "projects";
    }
  | {
      name: "api";
      project: Project;
    };

export function App() {
  const [view, setView] = useState<ViewState>({ name: "projects" });
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectName, setProjectName] = useState("");
  const [projectCode, setProjectCode] = useState("");
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [creatingProject, setCreatingProject] = useState(false);
  const [error, setError] = useState<string>();

  async function loadProjects() {
    setLoadingProjects(true);
    setError(undefined);
    try {
      setProjects(await api.listProjects());
    } catch (loadError) {
      setError(errorMessage(loadError, "Projects could not be loaded"));
    } finally {
      setLoadingProjects(false);
    }
  }

  useEffect(() => {
    void loadProjects();
  }, []);

  async function handleCreateProject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!projectName.trim() || !projectCode.trim()) {
      return;
    }

    setCreatingProject(true);
    setError(undefined);
    try {
      const project = await api.createProject({ name: projectName.trim(), code: projectCode.trim() });
      setProjects((current) => [project, ...current.filter((item) => item.id !== project.id)]);
      setProjectName("");
      setProjectCode("");
      setView({ name: "api", project });
    } catch (createError) {
      setError(errorMessage(createError, "Project could not be created"));
    } finally {
      setCreatingProject(false);
    }
  }

  if (view.name === "api") {
    return (
      <ApiManagementPage
        project={view.project}
        onBack={() => {
          setView({ name: "projects" });
          void loadProjects();
        }}
      />
    );
  }

  return (
    <main className="project-management-page">
      <header className="project-management-header">
        <div>
          <p className="eyebrow">Carta</p>
          <h1>Projects</h1>
        </div>
        <span>{projects.length} APIs</span>
      </header>

      {error ? <div className="inline-error">{error}</div> : null}

      <section className="project-management-grid">
        <form className="project-create-panel" onSubmit={handleCreateProject}>
          <p className="eyebrow">New project</p>
          <h2>Create an API project</h2>
          <label>
            Project name
            <input
              aria-label="Project name"
              value={projectName}
              placeholder="Payments API"
              onChange={(event) => setProjectName(event.currentTarget.value)}
            />
          </label>
          <label>
            Project code
            <input
              aria-label="Project code"
              value={projectCode}
              placeholder="payments"
              onChange={(event) => setProjectCode(event.currentTarget.value)}
            />
          </label>
          <button type="submit" disabled={creatingProject}>
            {creatingProject ? "Creating..." : "Create and manage API"}
          </button>
        </form>

        <section className="project-list-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Project management</p>
              <h2>Select a project</h2>
            </div>
            {loadingProjects ? <span>Loading</span> : null}
          </div>

          {projects.length === 0 && !loadingProjects ? (
            <div className="empty-projects">No projects yet.</div>
          ) : (
            <div className="project-cards">
              {projects.map((project) => (
                <article className="project-card" key={project.id}>
                  <div>
                    <h3>{project.name}</h3>
                    <p>{project.code}</p>
                  </div>
                  <button type="button" onClick={() => setView({ name: "api", project })}>
                    Manage API
                  </button>
                </article>
              ))}
            </div>
          )}
        </section>
      </section>
    </main>
  );
}

function ApiManagementPage({ project, onBack }: { project: Project; onBack: () => void }) {
  const [source, setSource] = useState(defaultOpenApiSource(project.name));
  const [status, setStatus] = useState("Draft");
  const [sourcePanelOpen, setSourcePanelOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [startingMock, setStartingMock] = useState(false);
  const [mockUrl, setMockUrl] = useState<string>();
  const [error, setError] = useState<string>();

  const title = useMemo(() => project.name || "API", [project.name]);

  useEffect(() => {
    let cancelled = false;

    async function loadSource() {
      setError(undefined);
      setStatus("Loading");
      try {
        const nextSource = await api.getOpenApiSource(project.id);
        if (!cancelled) {
          setSource(nextSource);
          setStatus("Saved");
        }
      } catch {
        if (!cancelled) {
          setSource(defaultOpenApiSource(project.name));
          setStatus("Draft");
        }
      }
    }

    void loadSource();

    return () => {
      cancelled = true;
    };
  }, [project.id, project.name]);

  async function saveOpenApi() {
    setSaving(true);
    setError(undefined);
    try {
      await api.saveOpenApi(project.id, source);
      setStatus("Saved");
    } catch (saveError) {
      setError(errorMessage(saveError, "OpenAPI could not be saved"));
    } finally {
      setSaving(false);
    }
  }

  async function startMock() {
    setStartingMock(true);
    setError(undefined);
    try {
      const mock = await api.startMock(project.id);
      setMockUrl(mock.baseUrl);
    } catch (mockError) {
      setError(errorMessage(mockError, "Mock could not be started"));
    } finally {
      setStartingMock(false);
    }
  }

  return (
    <div className="api-management-shell">
      <header className="demo-navbar project-api-navbar api-demo-navbar">
        <div className="demo-navbar-third demo-title">
          <button className="back-button" type="button" onClick={onBack}>
            Projects
          </button>
          <span>Carta Elements Demo</span>
        </div>

        <div className="demo-navbar-third demo-spec-controls api-spec-controls">
          <div className="api-spec-input" title={`${title} / ${project.code}`}>
            <span>{title}</span>
            <small>{project.code}</small>
          </div>
          <button type="button" onClick={saveOpenApi} disabled={saving}>
            {saving ? "Saving..." : "Save"}
          </button>
          <span className="demo-or">or</span>
          <button
            className={sourcePanelOpen ? "active" : undefined}
            type="button"
            aria-expanded={sourcePanelOpen}
            onClick={() => setSourcePanelOpen((open) => !open)}
          >
            OpenAPI source
          </button>
        </div>

        <div className="demo-navbar-third demo-link">
          <span className="api-status-pill">{status}</span>
          <button type="button" onClick={startMock} disabled={startingMock || status !== "Saved"}>
            {startingMock ? "Starting..." : "Start mock"}
          </button>
          {mockUrl ? <a href={mockUrl}>{mockUrl}</a> : null}
        </div>
      </header>

      {sourcePanelOpen ? (
        <aside className="source-editor-drawer" aria-label="OpenAPI source editor">
          <div className="source-editor-heading">
            <div>
              <p className="eyebrow">OpenAPI source</p>
              <h2>Document source</h2>
            </div>
            <button type="button" onClick={() => setSourcePanelOpen(false)}>
              Close
            </button>
          </div>
          <textarea
            aria-label="OpenAPI source"
            spellCheck={false}
            value={source}
            onChange={(event) => {
              setSource(event.currentTarget.value);
              setStatus("Draft");
            }}
          />
        </aside>
      ) : null}

      <main className="api-management-main api-demo-main">
        <section className="project-docs-panel api-demo-docs" aria-label="API documentation">
          <StoplightDocsPanel source={source} layout="sidebar" router="memory" />
        </section>
      </main>

      {sourcePanelOpen ? (
        <div className="source-editor-backdrop" onClick={() => setSourcePanelOpen(false)}>
          <span />
        </div>
      ) : null}

      {error ? <div className="api-error">{error}</div> : null}
    </div>
  );
}

function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}
