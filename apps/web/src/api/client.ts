export interface Project {
  id: string;
  name: string;
  code: string;
  ownerTeam: string;
  sourceMode?: string;
  currentVersion?: {
    id: string;
    status: string;
  };
}

export interface Endpoint {
  id?: string;
  path: string;
  method: string;
  operation_id?: string | null;
  summary?: string | null;
  tags?: string[] | null;
  deprecated?: boolean | null;
}

export interface Revision {
  id: string;
  parseStatus: string;
  title?: string;
  version?: string;
}

export interface MockInstance {
  id: string;
  status: string;
  baseUrl: string;
  port: number;
}

type RawProject = Project & {
  owner_team?: string;
  source_mode?: string;
};

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(path, { ...init, headers });
  if (!response.ok) {
    throw new Error(await response.text());
  }

  return response.json() as Promise<T>;
}

function normalizeProject(project: RawProject): Project {
  return {
    ...project,
    ownerTeam: project.ownerTeam ?? project.owner_team ?? "",
    sourceMode: project.sourceMode ?? project.source_mode
  };
}

export const api = {
  async listProjects() {
    const projects = await request<RawProject[]>("/api/projects");
    return projects.map(normalizeProject);
  },

  async createProject(input: { name: string; code: string }) {
    const project = await request<RawProject>("/api/projects", {
      method: "POST",
      body: JSON.stringify({ ...input, ownerTeam: "platform", sourceMode: "openapi_yaml" })
    });
    return normalizeProject(project);
  },

  saveOpenApi(projectId: string, rawContent: string) {
    return request<Revision>(`/api/projects/${projectId}/revisions`, {
      method: "POST",
      body: JSON.stringify({ sourceMode: "openapi_yaml", rawContent })
    });
  },

  listEndpoints(projectId: string) {
    return request<Endpoint[]>(`/api/projects/${projectId}/endpoints`);
  },

  async getOpenApiSource(projectId: string) {
    const response = await fetch(`/api/projects/${projectId}/docs/openapi.yaml`);
    if (!response.ok) {
      throw new Error(await response.text());
    }
    return response.text();
  },

  startMock(projectId: string) {
    return request<MockInstance>(`/api/projects/${projectId}/mock/start`, { method: "POST" });
  }
};
