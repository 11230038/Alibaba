"use client";

import { CopyOutlined, DeleteOutlined, ForkOutlined, PlayCircleOutlined } from "@ant-design/icons";
import { Button, Card, Form, Input, InputNumber, Popconfirm, Select, Space, Switch, Table, Tag, Typography } from "antd";
import { StatusTag } from "@/components/StatusTag";
import type { AgentConfig } from "@/types/agent";
import { AgentTestModal } from "./AgentTestModal";
import { useAgentWorkbench } from "./hooks/useAgentWorkbench";

export function AgentPage() {
  const workbench = useAgentWorkbench();
  const state = workbench.state;
  const activeAgent = state?.agents.find((agent) => agent.id === workbench.testAgentId);

  return (
    <Space direction="vertical" size="large" className="w-full">
      <div>
        <Typography.Title level={2} className="!mb-1">Agent 控制台</Typography.Title>
      </div>

      <Card title="LLM 层参数" loading={workbench.loading}>
        {state && (
          <Form layout="vertical" initialValues={state.llmConfig} onFinish={workbench.saveLlmConfig}>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <Form.Item name="model" label="模型" rules={[{ required: true }]}>
                <Select options={[{ label: "Claude Sonnet 5", value: "claude-sonnet-5" }, { label: "Claude Opus 5", value: "claude-opus-5" }, { label: "Mock Local", value: "mock-local" }]} />
              </Form.Item>
              <Form.Item name="temperature" label="Temperature" rules={[{ required: true }]}>
                <InputNumber min={0} max={2} step={0.1} className="w-full" />
              </Form.Item>
              <Form.Item name="maxTokens" label="Max Tokens" rules={[{ required: true }]}>
                <InputNumber min={256} max={8192} step={128} className="w-full" />
              </Form.Item>
            </div>
            <Form.Item name="systemPrompt" label="系统提示词" rules={[{ required: true }]}>
              <Input.TextArea rows={4} />
            </Form.Item>
            <Button type="primary" htmlType="submit">保存参数</Button>
          </Form>
        )}
      </Card>

      <Card title="Agent 列表">
        <Table
          rowKey="id"
          dataSource={state?.agents ?? []}
          columns={[
            { title: "名称", dataIndex: "name" },
            { title: "类型", dataIndex: "category", render: (value) => <StatusTag status={value} /> },
            { title: "能力", dataIndex: "capabilities", render: (items: string[]) => <Space wrap>{items.map((item) => <Tag key={item}>{item}</Tag>)}</Space> },
            { title: "描述", dataIndex: "description" },
            { title: "启用", dataIndex: "enabled", render: (enabled: boolean, record: AgentConfig) => <Switch checked={enabled} onChange={(checked) => workbench.toggleAgent(record, checked)} /> },
            { title: "操作", render: (_: unknown, record: AgentConfig) => <Button icon={<PlayCircleOutlined />} onClick={() => workbench.setTestAgentId(record.id)}>测试</Button> },
          ]}
        />
      </Card>

      <Card title="测试历史">
        <Table
          rowKey="id"
          dataSource={state?.history ?? []}
          expandable={{ expandedRowRender: (record) => <Space direction="vertical">{record.messages.map((item) => <Typography.Paragraph key={item.id} className="!mb-0"><Tag>{item.role}</Tag>{item.content}</Typography.Paragraph>)}</Space> }}
          columns={[
            { title: "标题", dataIndex: "title" },
            { title: "Agent", dataIndex: "agentId", render: (value) => state?.agents.find((agent) => agent.id === value)?.name ?? value },
            { title: "创建时间", dataIndex: "createdAt" },
            {
              title: "操作",
              render: (_: unknown, record) => (
                <Space>
                  <Button icon={<CopyOutlined />} onClick={() => workbench.copySession(record.id)}>复制</Button>
                  <Button icon={<ForkOutlined />} onClick={() => workbench.branchSession(record.id)}>分支</Button>
                  <Popconfirm title="确认删除这条测试历史？" onConfirm={() => workbench.deleteSession(record.id)}>
                    <Button danger icon={<DeleteOutlined />}>删除</Button>
                  </Popconfirm>
                </Space>
              ),
            },
          ]}
        />
      </Card>

      <AgentTestModal agent={activeAgent} open={Boolean(activeAgent)} testing={workbench.testing} onClose={() => workbench.setTestAgentId(undefined)} onRun={workbench.runTest} />
    </Space>
  );
}
