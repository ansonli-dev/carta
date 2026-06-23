import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { api, type Project } from "../api/client";
import { errorMessage } from "../utils/errorMessage";
import { StoplightDocsPanel } from "./StoplightDocsPanel";

export function ProjectApiPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { projectId } = useParams();
  const stateProject = (location.state as { project?: Project } | null)?.project;
  const [project, setProject] = useState<Project | undefined>(
    stateProject?.id === projectId ? stateProject : undefined,
  );
  const [loadingProject, setLoadingProject] = useState(!project);
  const [error, setError] = useState<string>();

  useEffect(() => {
    let cancelled = false;

    async function loadProject() {
      if (project || !projectId) {
        setLoadingProject(false);
        return;
      }

      setLoadingProject(true);
      setError(undefined);
      try {
        const projects = await api.listProjects();
        const nextProject = projects.find((item) => item.id === projectId);
        if (!cancelled) {
          if (nextProject) {
            setProject(nextProject);
          } else {
            setError("Project could not be found");
          }
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(errorMessage(loadError, "Project could not be loaded"));
        }
      } finally {
        if (!cancelled) {
          setLoadingProject(false);
        }
      }
    }

    void loadProject();

    return () => {
      cancelled = true;
    };
  }, [project, projectId]);

  if (loadingProject) {
    return (
      <main className="project-management-page">
        <div className="empty-projects">Loading project...</div>
      </main>
    );
  }

  if (!project) {
    return (
      <main className="project-management-page">
        <div className="empty-projects">{error ?? "Project could not be found"}</div>
        <button className="project-route-back" type="button" onClick={() => navigate("/projects")}>
          Projects
        </button>
      </main>
    );
  }

  return <ApiManagementView project={project} onBack={() => navigate("/projects")} />;
}

function ApiManagementView({ project, onBack }: { project: Project; onBack: () => void }) {
  const [source, setSource] = useState("");
  const [status, setStatus] = useState("Loading");
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
          setSource("");
          setStatus("Unavailable");
          setError("OpenAPI source could not be loaded");
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
          <StoplightDocsPanel source={source || undefined} layout="sidebar" router="memory" />
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
