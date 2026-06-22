import { Button, Empty, Form, Input, Space, Typography } from "antd";
import type { Project } from "../api/client";

type CatalogFormValues = {
  name: string;
  code: string;
};

type CatalogPageProps = {
  projects: Project[];
  selectedProjectId?: string;
  loading?: boolean;
  creating?: boolean;
  onCreate: (values: CatalogFormValues) => Promise<void> | void;
  onSelect: (project: Project) => void;
};

export function CatalogPage({ projects, selectedProjectId, loading, creating, onCreate, onSelect }: CatalogPageProps) {
  const [form] = Form.useForm<CatalogFormValues>();

  async function handleCreate(values: CatalogFormValues) {
    await onCreate(values);
    form.resetFields();
  }

  return (
    <aside className="catalog-panel">
      <Space orientation="vertical" size={18} className="full-width">
        <div className="sidebar-heading">
          <div>
            <Typography.Text className="eyebrow">Workspace</Typography.Text>
            <Typography.Title level={5} className="panel-title">
              APIs
            </Typography.Title>
          </div>
          <span className="project-count">{projects.length}</span>
        </div>

        <Form className="create-project-form" form={form} layout="vertical" requiredMark={false} onFinish={handleCreate}>
          <Form.Item label="Project name" name="name" rules={[{ required: true, message: "Required" }]}>
            <Input aria-label="Project name" autoComplete="off" placeholder="Payments API" />
          </Form.Item>
          <Form.Item label="Project code" name="code" rules={[{ required: true, message: "Required" }]}>
            <Input aria-label="Project code" autoComplete="off" placeholder="payments" />
          </Form.Item>
          <Button type="primary" htmlType="submit" loading={creating} block>
            Create project
          </Button>
        </Form>

        <div className="project-list" aria-busy={loading}>
          {projects.length === 0 ? (
            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No APIs yet" />
          ) : (
            projects.map((project) => (
              <div
                key={project.id}
                className={project.id === selectedProjectId ? "project-list-item selected" : "project-list-item"}
              >
                <Button type="link" className="project-link" onClick={() => onSelect(project)}>
                  <span className="project-name">{project.name}</span>
                  <span className="project-code">{project.code}</span>
                </Button>
              </div>
            ))
          )}
        </div>
      </Space>
    </aside>
  );
}
