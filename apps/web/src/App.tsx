import { useEffect, useMemo, useRef, useState } from "react";
import { QueryClient, QueryClientProvider, useMutation, useQuery } from "@tanstack/react-query";
import { App as AntApp, ConfigProvider, Layout, message } from "antd";
import { api, type Endpoint, type Project } from "./api/client";
import { CatalogPage } from "./pages/CatalogPage";
import { ProjectPage } from "./pages/ProjectPage";

function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false
      }
    }
  });
}

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

export function App() {
  const [queryClient] = useState(createQueryClient);

  return (
    <QueryClientProvider client={queryClient}>
      <ConfigProvider
        theme={{
          token: {
            borderRadius: 6,
            colorPrimary: "#1668dc",
            fontFamily:
              'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
          }
        }}
      >
        <AntApp>
          <ConsoleApp />
        </AntApp>
      </ConfigProvider>
    </QueryClientProvider>
  );
}

function ConsoleApp() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>();
  const [source, setSource] = useState(defaultOpenApiSource());
  const [endpoints, setEndpoints] = useState<Endpoint[]>([]);
  const [status, setStatus] = useState<string>();
  const [mockUrl, setMockUrl] = useState<string>();
  const [canStartMock, setCanStartMock] = useState(false);
  const [workspaceLoading, setWorkspaceLoading] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();
  const skipProjectLoadRef = useRef<string | undefined>(undefined);

  const projectsQuery = useQuery({
    queryKey: ["projects"],
    queryFn: api.listProjects
  });

  useEffect(() => {
    if (!projectsQuery.data) {
      return;
    }

    setProjects(projectsQuery.data);
    setSelectedProjectId((currentId) => currentId ?? projectsQuery.data[0]?.id);
  }, [projectsQuery.data]);

  const selectedProject = useMemo(
    () => projects.find((project) => project.id === selectedProjectId),
    [projects, selectedProjectId]
  );

  useEffect(() => {
    if (!selectedProject) {
      setSource(defaultOpenApiSource());
      setEndpoints([]);
      setCanStartMock(false);
      setWorkspaceLoading(false);
      return;
    }

    if (skipProjectLoadRef.current === selectedProject.id) {
      skipProjectLoadRef.current = undefined;
      setWorkspaceLoading(false);
      return;
    }

    let cancelled = false;

    async function loadProjectWorkspace(project: Project) {
      setStatus(undefined);
      setMockUrl(undefined);
      setCanStartMock(false);
      setWorkspaceLoading(true);
      setSource(defaultOpenApiSource(project.name));
      setEndpoints([]);

      try {
        const [nextSource, nextEndpoints] = await Promise.all([
          api.getOpenApiSource(project.id),
          api.listEndpoints(project.id)
        ]);

        if (!cancelled) {
          setSource(nextSource);
          setEndpoints(nextEndpoints);
          setCanStartMock(true);
          setWorkspaceLoading(false);
        }
      } catch {
        if (!cancelled) {
          setSource(defaultOpenApiSource(project.name));
          setEndpoints([]);
          setCanStartMock(false);
          setWorkspaceLoading(false);
        }
      }
    }

    void loadProjectWorkspace(selectedProject);

    return () => {
      cancelled = true;
    };
  }, [selectedProject]);

  const createProject = useMutation({
    mutationFn: api.createProject,
    onSuccess(project) {
      setProjects((current) => [project, ...current.filter((item) => item.id !== project.id)]);
      skipProjectLoadRef.current = project.id;
      setSelectedProjectId(project.id);
      setEndpoints([]);
      setStatus(undefined);
      setMockUrl(undefined);
      setCanStartMock(false);
      setWorkspaceLoading(false);
      setSource(defaultOpenApiSource(project.name));
    },
    onError(error) {
      messageApi.error(error instanceof Error ? error.message : "Project could not be created");
    }
  });

  const saveOpenApi = useMutation({
    mutationFn: async () => {
      if (!selectedProject) {
        throw new Error("Select a project first");
      }

      const projectId = selectedProject.id;
      const revision = await api.saveOpenApi(projectId, source);
      const nextEndpoints = await api.listEndpoints(projectId);
      return { projectId, revision, endpoints: nextEndpoints };
    },
    onSuccess(result) {
      if (result.projectId !== selectedProjectId) {
        return;
      }

      setEndpoints(result.endpoints);
      setStatus(`Saved revision ${result.revision.id}`);
      setCanStartMock(true);
    },
    onError(error) {
      messageApi.error(error instanceof Error ? error.message : "OpenAPI could not be saved");
    }
  });

  const startMock = useMutation({
    mutationFn: async () => {
      if (!selectedProject) {
        throw new Error("Select a project first");
      }

      const projectId = selectedProject.id;
      const mock = await api.startMock(projectId);
      return { projectId, mock };
    },
    onSuccess(result) {
      if (result.projectId !== selectedProjectId) {
        return;
      }

      setMockUrl(result.mock.baseUrl);
    },
    onError(error) {
      messageApi.error(error instanceof Error ? error.message : "Mock could not be started");
    }
  });

  return (
    <Layout className="app-shell">
      {contextHolder}
      <Layout.Header className="topbar">
        <div className="brand">Carta</div>
      </Layout.Header>
      <Layout className="console-layout">
        <CatalogPage
          projects={projects}
          selectedProjectId={selectedProjectId}
          loading={projectsQuery.isLoading}
          creating={createProject.isPending}
          onCreate={async (values) => {
            await createProject.mutateAsync(values);
          }}
          onSelect={(project) => {
            if (project.id === selectedProjectId) {
              return;
            }
            setSelectedProjectId(project.id);
          }}
        />
        <ProjectPage
          project={selectedProject}
          source={source}
          endpoints={endpoints}
          status={status}
          mockUrl={mockUrl}
          saving={saveOpenApi.isPending}
          startingMock={startMock.isPending}
          canStartMock={canStartMock}
          workspaceLoading={workspaceLoading}
          onSourceChange={setSource}
          onSaveOpenApi={() => saveOpenApi.mutate()}
          onStartMock={() => startMock.mutate()}
        />
      </Layout>
    </Layout>
  );
}
