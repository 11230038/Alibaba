"use client";

import { DeleteOutlined, EditOutlined, ReloadOutlined, CopyOutlined, ForkOutlined } from "@ant-design/icons";
import { Button, Card, Popconfirm, Space, Switch, Table, Tag, Typography } from "antd";
import { useState } from "react";
import { StatusTag } from "@/components/StatusTag";
import { agentCategoryLabel, filterAgentTestSessionsByCategory, filterAgentsByCategory } from "@/domain/agent/agentModel";
import type { AgentConfig, AgentTestSession } from "@/types/agent";
import { AgentEditModal, type AgentEditValues } from "./AgentEditModal";
import { AgentTestModal } from "./AgentTestModal";
import { useAgentWorkbench } from "./hooks/useAgentWorkbench";

type AgentCategory = AgentConfig["category"];

type AgentPageProps = {
  category?: AgentCategory;
};

export function AgentPage({ category }: AgentPageProps) {
  const workbench = useAgentWorkbench();
  const agents = workbench.state?.agents ?? [];
  const visibleAgents = category ? filterAgentsByCategory(agents, category) : agents;
  const visibleHistory = category
    ? filterAgentTestSessionsByCategory(workbench.state?.history ?? [], agents, category)
    : workbench.state?.history ?? [];
  const [editingAgent, setEditingAgent] = useState<AgentConfig>();
  const activeAgent = agents.find((agent) => agent.id === workbench.testAgentId);
  const title = category ? agentCategoryLabel(category) : "Agent";

  async function handleSave(values: AgentEditValues) {
    if (!editingAgent) return;
    await workbench.saveAgent(editingAgent, values);
    setEditingAgent(undefined);
  }

  return (
    <Space orientation="vertical" size="large" className="w-full">
      <Typography.Title level={2} className="!mb-1">{title}</Typography.Title>
      {category ? (
        <AgentGroupTable title={title} category={category} agents={visibleAgents} loading={workbench.loading} mutationId={workbench.agentMutationId} onToggle={workbench.toggleAgent} onEdit={setEditingAgent} onDelete={workbench.deleteAgent} onReset={workbench.resetSystemAgent} />
      ) : (
        <>
          <AgentGroupTable title="系统 Agent" category="system" agents={filterAgentsByCategory(agents, "system")} loading={workbench.loading} mutationId={workbench.agentMutationId} onToggle={workbench.toggleAgent} onEdit={setEditingAgent} onDelete={workbench.deleteAgent} onReset={workbench.resetSystemAgent} />
          <AgentGroupTable title="普通 Agent" category="regular" agents={filterAgentsByCategory(agents, "regular")} loading={workbench.loading} mutationId={workbench.agentMutationId} onToggle={workbench.toggleAgent} onEdit={setEditingAgent} onDelete={workbench.deleteAgent} onReset={workbench.resetSystemAgent} />
        </>
      )}

      <Card title="测试历史">
        <Table
          rowKey="id"
          dataSource={visibleHistory}
          loading={workbench.loading}
          expandable={{ expandedRowRender: (record) => <Space orientation="vertical">{record.messages.map((item) => <Typography.Paragraph key={item.id} className="!mb-0"><Tag>{item.role}</Tag>{item.content}</Typography.Paragraph>)}</Space> }}
          columns={[
            { title: "标题", dataIndex: "title" },
            { title: "Agent", dataIndex: "agentId", render: (value) => agents.find((agent) => agent.id === value)?.name ?? value },
            { title: "创建时间", dataIndex: "createdAt" },
            {
              title: "操作",
              render: (_: unknown, record: AgentTestSession) => (
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

      <AgentEditModal agent={editingAgent} open={Boolean(editingAgent)} saving={Boolean(editingAgent && workbench.agentMutationId === editingAgent.id)} onClose={() => setEditingAgent(undefined)} onSave={handleSave} />
      <AgentTestModal agent={activeAgent} open={Boolean(activeAgent && workbench.testAgentId)} testing={workbench.testing} onClose={() => workbench.setTestAgentId(undefined)} onRun={workbench.runTest} />
    </Space>
  );
}

function AgentGroupTable({ title, category, agents, loading, mutationId, onToggle, onEdit, onDelete, onReset }: { title: string; category: AgentCategory; agents: AgentConfig[]; loading: boolean; mutationId?: string; onToggle: (agent: AgentConfig, enabled: boolean) => void; onEdit: (agent: AgentConfig) => void; onDelete: (agent: AgentConfig) => Promise<void>; onReset: (agent: AgentConfig) => Promise<void> }) {
  return (
    <Card title={title}>
      <Table
        rowKey="id"
        dataSource={agents}
        loading={loading}
        columns={[
          { title: "名称", dataIndex: "name" },
          { title: "类型", dataIndex: "category", render: (value: AgentCategory) => <StatusTag status={value} /> },
          ...(category === "regular" ? [{ title: "能力", dataIndex: "capabilities", render: (items: string[]) => <Space wrap>{items.map((item) => <Tag key={item}>{item}</Tag>)}</Space> }] : []),
          { title: "启用", dataIndex: "enabled", render: (enabled: boolean, record: AgentConfig) => <Switch checked={enabled} onChange={(checked) => onToggle(record, checked)} /> },
          {
            title: "操作",
            render: (_: unknown, record: AgentConfig) => (
              <Space>
                <Button icon={<EditOutlined />} onClick={() => onEdit(record)}>编辑</Button>
                {category === "system" ? (
                  <Popconfirm title="确认将此系统 Agent 恢复为默认配置？" onConfirm={() => onReset(record)}>
                    <Button icon={<ReloadOutlined />} loading={mutationId === record.id}>重置</Button>
                  </Popconfirm>
                ) : (
                  <Popconfirm title="确认删除此普通 Agent？" onConfirm={() => onDelete(record)}>
                    <Button danger icon={<DeleteOutlined />} loading={mutationId === record.id}>删除</Button>
                  </Popconfirm>
                )}
              </Space>
            ),
          },
        ]}
      />
    </Card>
  );
}
