import { FormEvent, useEffect, useMemo, useState } from "react";
import { api, type Project } from "./api/client";
import { StoplightDocsPanel } from "./pages/StoplightDocsPanel";

function defaultOpenApiSource(title = "Todo API") {
  return `openapi: 3.0.3
info:
  title: ${title}
  version: 1.0.0
paths:
  /todos:
    get:
      operationId: listTodos
      responses:
        '200':
          description: OK
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
