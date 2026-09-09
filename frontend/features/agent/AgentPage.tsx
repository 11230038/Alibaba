"use client";

import { DeleteOutlined, EditOutlined, PlusOutlined, ReloadOutlined } from "@ant-design/icons";
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
  const [createOpen, setCreateOpen] = useState(false);
  const title = category ? agentCategoryLabel(category) : "Agent";

  async function handleSave(values: AgentEditValues) {
    if (editingAgent) {
      await workbench.saveAgent(editingAgent, values);
      setEditingAgent(undefined);
      return;
    }
    if (createOpen) {
      await workbench.createAgent(values);
      setCreateOpen(false);
    }
  }

  return (
    <Space orientation="vertical" size="large" className="w-full">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <Typography.Title level={2} className="!mb-1">{title}</Typography.Title>
      </div>
      {category ? (
        <AgentGroupTable title={title} category={category} agents={visibleAgents} loading={workbench.loading} mutationId={workbench.agentMutationId} onToggle={workbench.toggleAgent} onEdit={setEditingAgent} onCreate={category === "regular" ? () => setCreateOpen(true) : undefined} onDelete={workbench.deleteAgent} onReset={workbench.resetSystemAgent} />
      ) : (
        <>
          <AgentGroupTable title="系统 Agent" category="system" agents={filterAgentsByCategory(agents, "system")} loading={workbench.loading} mutationId={workbench.agentMutationId} onToggle={workbench.toggleAgent} onEdit={setEditingAgent} onDelete={workbench.deleteAgent} onReset={workbench.resetSystemAgent} />
          <AgentGroupTable title="普通 Agent" category="regular" agents={filterAgentsByCategory(agents, "regular")} loading={workbench.loading} mutationId={workbench.agentMutationId} onToggle={workbench.toggleAgent} onEdit={setEditingAgent} onDelete={workbench.deleteAgent} onReset={workbench.resetSystemAgent} />
        </>
      )}

      <AgentEditModal agent={editingAgent} category={category} title={createOpen ? "新增普通 Agent" : undefined} open={Boolean(editingAgent) || createOpen} saving={Boolean(workbench.agentMutationId)} onClose={() => { setEditingAgent(undefined); setCreateOpen(false); }} onSave={handleSave} />
    </Space>
  );
}

function AgentGroupTable({ title, category, agents, loading, mutationId, onToggle, onEdit, onCreate, onDelete, onReset }: { title: string; category: AgentCategory; agents: AgentConfig[]; loading: boolean; mutationId?: string; onToggle: (agent: AgentConfig, enabled: boolean) => void; onEdit: (agent: AgentConfig) => void; onCreate?: () => void; onDelete: (agent: AgentConfig) => Promise<void>; onReset: (agent: AgentConfig) => Promise<void> }) {
  return (
    <Card title={title} extra={onCreate ? <Button size="small" type="primary" icon={<PlusOutlined />} onClick={onCreate}>新增 Agent</Button> : undefined}>
      <Table
        rowKey="id"
        dataSource={agents}
        loading={loading}
        components={{ table: HydrationSafeTable }}
        columns={[
          { title: "名称", dataIndex: "name" },
          { title: "类型", dataIndex: "category", render: (value: AgentCategory) => <StatusTag status={value} /> },
          ...(category === "regular" ? [{ title: "能力", dataIndex: "capabilities", render: (items: string[]) => <Space wrap>{items.map((item) => <Tag key={item}>{item}</Tag>)}</Space> }] : []),
          { title: "提示词", dataIndex: "prompt", width: 360, ellipsis: true },
          { title: "启用", dataIndex: "enabled", render: (enabled: boolean, record: AgentConfig) => <Switch checked={enabled} onChange={(checked) => onToggle(record, checked)} /> },
          {
            title: "操作",
            render: (_: unknown, record: AgentConfig) => (
              <Space size="small">
                <Button size="small" icon={<EditOutlined />} onClick={() => onEdit(record)}>编辑</Button>
                {category === "system" ? (
                  <Popconfirm title="确认将此系统 Agent 恢复为默认配置？" onConfirm={() => onReset(record)}>
                    <Button size="small" icon={<ReloadOutlined />} loading={mutationId === record.id}>重置</Button>
                  </Popconfirm>
                ) : (
                  <Popconfirm title="确认删除此普通 Agent？" onConfirm={() => onDelete(record)}>
                    <Button size="small" danger icon={<DeleteOutlined />} loading={mutationId === record.id}>删除</Button>
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
