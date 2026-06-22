import { lazy, Suspense } from "react";
import Editor from "@monaco-editor/react";
import { Alert, Button, Empty, Space, Table, Tag, Typography } from "antd";
import type { ColumnsType } from "antd/es/table";
import type { Endpoint, Project } from "../api/client";

const StoplightApi = lazy(() => import("@stoplight/elements").then((module) => ({ default: module.API })));

type ProjectPageProps = {
  project?: Project;
  source: string;
  endpoints: Endpoint[];
  status?: string;
  mockUrl?: string;
  saving?: boolean;
  startingMock?: boolean;
  canStartMock?: boolean;
  workspaceLoading?: boolean;
  onSourceChange: (source: string) => void;
  onSaveOpenApi: () => void;
  onStartMock: () => void;
};

const endpointColumns: ColumnsType<Endpoint> = [
  {
    title: "Method",
    dataIndex: "method",
    width: 96,
    render: (method: string) => <Tag color="blue">{method}</Tag>
  },
  {
    title: "Path",
    dataIndex: "path",
    ellipsis: true
  },
  {
    title: "Operation",
    dataIndex: "operation_id",
    ellipsis: true,
    render: (operationId?: string | null) => operationId || "-"
  }
];

export function ProjectPage({
  project,
  source,
  endpoints,
  status,
  mockUrl,
  saving,
  startingMock,
  canStartMock,
  workspaceLoading,
  onSourceChange,
  onSaveOpenApi,
  onStartMock
}: ProjectPageProps) {
  if (!project) {
    return (
      <main className="project-empty">
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />
      </main>
    );
  }

  return (
    <main className="project-workspace">
      <header className="project-header">
        <div className="project-heading">
          <Typography.Title level={4}>{project.name}</Typography.Title>
          <Space size={8} wrap>
            <Tag>{project.code}</Tag>
            {project.currentVersion ? <Tag color="processing">{project.currentVersion.status}</Tag> : null}
          </Space>
        </div>
        <Space wrap>
          <Button type="primary" loading={saving} disabled={startingMock || workspaceLoading} onClick={onSaveOpenApi}>
            Save OpenAPI
          </Button>
          <Button loading={startingMock} disabled={saving || workspaceLoading || !canStartMock} onClick={onStartMock}>
            Start mock
          </Button>
        </Space>
      </header>

      {status ? (
        <Alert className="status-alert" type="success" showIcon message={status} />
      ) : null}
      {mockUrl ? (
        <Alert className="status-alert" type="info" showIcon message={<a href={mockUrl}>{mockUrl}</a>} />
      ) : null}

      <section className="project-grid">
        <div className="editor-pane">
          <Editor
            height="100%"
            defaultLanguage="yaml"
            language="yaml"
            value={source}
            theme="vs"
            options={{
              minimap: { enabled: false },
              fontSize: 13,
              lineNumbersMinChars: 3,
              scrollBeyondLastLine: false,
              wordWrap: "on"
            }}
            onChange={(value) => onSourceChange(value ?? "")}
          />
        </div>
        <div className="docs-pane">
          {status && import.meta.env.MODE !== "test" ? (
            <Suspense fallback={<Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />}>
              <StoplightApi
                apiDescriptionUrl={`/api/projects/${project.id}/docs/openapi.yaml`}
                router="hash"
                layout="sidebar"
                hideTryItPanel
              />
            </Suspense>
          ) : (
            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />
          )}
        </div>
      </section>

      <section className="endpoints-section">
        <Table
          size="small"
          rowKey={(endpoint) => endpoint.id ?? `${endpoint.method}:${endpoint.path}`}
          columns={endpointColumns}
          dataSource={endpoints}
          pagination={false}
        />
      </section>
    </main>
  );
}
