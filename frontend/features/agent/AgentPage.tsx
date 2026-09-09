"use client";

import { DeleteOutlined, EditOutlined, ReloadOutlined } from "@ant-design/icons";
import { Button, Card, Popconfirm, Space, Switch, Table, Tag, Typography } from "antd";
import { useState } from "react";
import { StatusTag } from "@/components/StatusTag";
import { HydrationSafeTable } from "@/components/HydrationSafeTable";
import { agentCategoryLabel, filterAgentsByCategory } from "@/domain/agent/agentModel";
import type { AgentConfig } from "@/types/agent";
import { AgentEditModal, type AgentEditValues } from "./AgentEditModal";
import { useAgentWorkbench } from "./hooks/useAgentWorkbench";

type AgentCategory = AgentConfig["category"];

type AgentPageProps = {
  category?: AgentCategory;
};

export function AgentPage({ category }: AgentPageProps) {
  const workbench = useAgentWorkbench();
  const agents = workbench.state?.agents ?? [];
  const visibleAgents = category ? filterAgentsByCategory(agents, category) : agents;
  const [editingAgent, setEditingAgent] = useState<AgentConfig>();
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

      <AgentEditModal agent={editingAgent} open={Boolean(editingAgent)} saving={Boolean(editingAgent && workbench.agentMutationId === editingAgent.id)} onClose={() => setEditingAgent(undefined)} onSave={handleSave} />
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
        components={{ table: HydrationSafeTable }}
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
