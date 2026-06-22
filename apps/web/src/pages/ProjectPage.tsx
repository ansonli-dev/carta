import Editor from "@monaco-editor/react";
import { Alert, Button, Empty, Space, Statistic, Table, Tag, Typography } from "antd";
import type { ColumnsType } from "antd/es/table";
import type { Endpoint, Project } from "../api/client";

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
        <div className="empty-state">
          <Typography.Text className="eyebrow">Carta API Console</Typography.Text>
          <Typography.Title level={3}>Select or create an API</Typography.Title>
          <Typography.Paragraph>
            Manage OpenAPI source, generated docs, endpoint catalogs, and mock runtimes from one workspace.
          </Typography.Paragraph>
        </div>
      </main>
    );
  }

  const specState = canStartMock ? "Saved" : "Draft";
  const mockState = mockUrl ? "Running" : "Stopped";

  return (
    <main className="project-workspace">
      <header className="project-header">
        <div className="project-heading">
          <Typography.Text className="eyebrow">API workspace</Typography.Text>
          <Typography.Title level={3}>{project.name}</Typography.Title>
          <Space size={8} wrap>
            <Tag>{project.code}</Tag>
            {project.currentVersion ? <Tag color="processing">{project.currentVersion.status}</Tag> : null}
            <Tag color={canStartMock ? "success" : "default"}>{specState}</Tag>
            <Tag color={mockUrl ? "green" : "default"}>{mockState}</Tag>
          </Space>
        </div>
        <Space wrap className="primary-actions">
          <Button type="primary" loading={saving} disabled={startingMock || workspaceLoading} onClick={onSaveOpenApi}>
            Save OpenAPI
          </Button>
          <Button loading={startingMock} disabled={saving || workspaceLoading || !canStartMock} onClick={onStartMock}>
            Start mock
          </Button>
        </Space>
      </header>

      {status ? (
        <Alert className="status-alert" type="success" showIcon title={status} />
      ) : null}
      {mockUrl ? (
        <Alert className="status-alert" type="info" showIcon title={<a href={mockUrl}>{mockUrl}</a>} />
      ) : null}

      <section className="workspace-grid">
        <div className="workspace-main">
          <section className="source-panel">
            <div className="panel-bar">
              <div>
                <Typography.Text className="panel-kicker">Source</Typography.Text>
                <Typography.Title level={5}>OpenAPI document</Typography.Title>
              </div>
              <Tag>{workspaceLoading ? "Loading" : "YAML"}</Tag>
            </div>
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
          </section>

          <section className="endpoints-section">
            <div className="panel-bar compact">
              <div>
                <Typography.Text className="panel-kicker">Catalog</Typography.Text>
                <Typography.Title level={5}>Endpoints</Typography.Title>
              </div>
              <Tag>{endpoints.length}</Tag>
            </div>
            <Table
              size="small"
              rowKey={(endpoint) => endpoint.id ?? `${endpoint.method}:${endpoint.path}`}
              columns={endpointColumns}
              dataSource={endpoints}
              pagination={false}
            />
          </section>
        </div>

        <aside className="workspace-side">
          <section className="runtime-panel">
            <div className="panel-bar">
              <div>
                <Typography.Text className="panel-kicker">Runtime</Typography.Text>
                <Typography.Title level={5}>Mock server</Typography.Title>
              </div>
              <Tag color={mockUrl ? "green" : "default"}>{mockState}</Tag>
            </div>
            <Space orientation="vertical" size={14} className="full-width">
              <Statistic title="Indexed endpoints" value={endpoints.length} />
              {mockUrl ? (
                <a className="mock-link" href={mockUrl}>
                  {mockUrl}
                </a>
              ) : (
                <Typography.Text type="secondary">Save a valid OpenAPI revision to enable the mock runtime.</Typography.Text>
              )}
            </Space>
          </section>

          <section className="docs-pane">
            <div className="panel-bar">
              <div>
                <Typography.Text className="panel-kicker">Reference</Typography.Text>
                <Typography.Title level={5}>Documentation</Typography.Title>
              </div>
            </div>
            <div className="docs-body">
              {canStartMock ? (
                <div className="reference-preview">
                  <div className="reference-hero">
                    <Typography.Title level={4}>{project.name}</Typography.Title>
                    <Typography.Text type="secondary">v1.0.0</Typography.Text>
                  </div>
                  <div className="reference-section">
                    <Typography.Text className="panel-kicker">API Base URL</Typography.Text>
                    <code>{mockUrl ?? "http://127.0.0.1:5100"}</code>
                  </div>
                  <div className="reference-section">
                    <Typography.Text className="panel-kicker">Endpoints</Typography.Text>
                    <div className="reference-endpoints">
                      {endpoints.length > 0 ? (
                        endpoints.map((endpoint) => (
                          <div className="reference-endpoint" key={endpoint.id ?? `${endpoint.method}:${endpoint.path}`}>
                            <Tag color="blue">{endpoint.method}</Tag>
                            <span>{endpoint.path}</span>
                            <Typography.Text type="secondary">{endpoint.operation_id || "operation"}</Typography.Text>
                          </div>
                        ))
                      ) : (
                        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No saved reference" />
              )}
            </div>
          </section>
        </aside>
      </section>
    </main>
  );
}
