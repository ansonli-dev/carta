import { FormEvent, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, type Project } from "../api/client";
import { errorMessage } from "../utils/errorMessage";

export function ProjectsPage() {
  const navigate = useNavigate();
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
      navigate(`/projects/${project.id}/apis`, { state: { project } });
    } catch (createError) {
      setError(errorMessage(createError, "Project could not be created"));
    } finally {
      setCreatingProject(false);
    }
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
                  <button type="button" onClick={() => navigate(`/projects/${project.id}/apis`, { state: { project } })}>
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
