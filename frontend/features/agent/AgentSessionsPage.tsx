"use client";

import { PlusOutlined, UserOutlined } from "@ant-design/icons";
import { Avatar, Button, Card, Col, Empty, Form, Listy, Modal, Row, Select, Space, Tag, Typography } from "antd";
import { MessageComposer } from "@/components/MessageComposer";
import { useState } from "react";
import type { AgentTestSession } from "@/types/agent";
import { useAgentSessionWorkbench } from "./hooks/useAgentSessionWorkbench";

type CreateSessionValues = {
  agentId: string;
};

export function AgentSessionsPage() {
  const workbench = useAgentSessionWorkbench();
  const [createOpen, setCreateOpen] = useState(false);
  const [form] = Form.useForm<CreateSessionValues>();
  const agentNames = new Map(workbench.agents.map((agent) => [agent.id, agent.name]));

  async function handleCreate(values: CreateSessionValues) {
    await workbench.createSession(values.agentId);
    form.resetFields();
    setCreateOpen(false);
  }

  return (
    <Space orientation="vertical" size="large" className="w-full">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <Typography.Title level={2} className="!mb-1">Agent会话</Typography.Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateOpen(true)}>新建会话</Button>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} xl={6}>
          <Card title="会话列表" loading={workbench.loading} className="min-h-[640px]">
            {workbench.sessions.length ? (
              <Listy
                items={workbench.sessions}
                rowKey="id"
                virtual={false}
                itemRender={(session) => (
                  <SessionListItem
                    session={session}
                    agentName={agentNames.get(session.agentId) ?? session.agentId}
                    active={session.id === workbench.activeSessionId}
                    onClick={() => workbench.selectSession(session.id)}
                  />
                )}
              />
            ) : (
              <Empty description="暂无 Agent 会话" />
            )}
          </Card>
        </Col>

        <Col xs={24} xl={18}>
          <Card
            title={workbench.activeSession ? `${agentNames.get(workbench.activeSession.agentId) ?? workbench.activeSession.agentId} · ${workbench.activeSession.title}` : "会话详情"}
            className="min-h-[640px]"
          >
            {workbench.activeSession ? (
              <Space orientation="vertical" className="w-full" size="large">
                <div className="max-h-[500px] overflow-y-auto pr-2">
                  <SessionMessages session={workbench.activeSession} />
                </div>
                <MessageComposer
                  value={workbench.draft}
                  onChange={workbench.setDraft}
                  tools={[{ key: "new-session", label: "新建会话" }]}
                  onToolClick={(key) => {
                    if (key === "new-session") setCreateOpen(true);
                  }}
                  placeholder="输入要交给 Agent 处理的问题或任务..."
                  loading={workbench.sending}
                  onSend={workbench.sendMessage}
                />
              </Space>
            ) : (
              <Empty description="请选择会话或新建会话" />
            )}
          </Card>
        </Col>
      </Row>

      <Modal
        title="新建 Agent 会话"
        open={createOpen}
        onCancel={() => setCreateOpen(false)}
        footer={null}
        destroyOnHidden
      >
        <Form form={form} layout="vertical" onFinish={handleCreate}>
          <Form.Item name="agentId" label="普通 Agent" rules={[{ required: true, message: "请选择普通 Agent" }]}>
            <Select placeholder="选择要对话的普通 Agent" options={workbench.agents.map((agent) => ({ label: agent.name, value: agent.id, disabled: !agent.enabled }))} />
          </Form.Item>
          <div className="flex justify-end gap-2">
            <Button onClick={() => setCreateOpen(false)}>取消</Button>
            <Button type="primary" htmlType="submit" loading={workbench.creating}>创建会话</Button>
          </div>
        </Form>
      </Modal>
    </Space>
  );
}

function SessionListItem({ session, agentName, active, onClick }: { session: AgentTestSession; agentName: string; active: boolean; onClick: () => void }) {
  const latestMessage = session.messages[session.messages.length - 1];
  return (
    <div className={`cursor-pointer rounded-lg px-3 py-3 ${active ? "bg-blue-50" : "hover:bg-slate-50"}`} onClick={onClick}>
      <div className="flex items-center justify-between gap-2">
        <Typography.Text strong ellipsis>{session.title}</Typography.Text>
        <Typography.Text type="secondary" className="text-xs">{session.createdAt.slice(5)}</Typography.Text>
      </div>
      <div className="mt-1 flex items-center gap-2">
        <Tag color="blue">{agentName}</Tag>
        <Typography.Text type="secondary" ellipsis className="text-xs">{latestMessage?.content ?? "暂无消息"}</Typography.Text>
      </div>
    </div>
  );
}

function SessionMessages({ session }: { session: AgentTestSession }) {
  return (
    <Space orientation="vertical" size="middle" className="w-full">
      {session.messages.map((item) => {
        const isAssistant = item.role === "assistant";
        return (
          <div key={item.id} className={`flex ${isAssistant ? "justify-start" : "justify-end"}`}>
            <div className={`flex max-w-[78%] gap-3 ${isAssistant ? "" : "flex-row-reverse"}`}>
              <Avatar icon={isAssistant ? <UserOutlined /> : undefined} style={{ backgroundColor: isAssistant ? "#64748b" : "#1677ff" }}>{isAssistant ? undefined : "我"}</Avatar>
              <Card size="small" className={isAssistant ? "bg-slate-50" : "bg-blue-50"}>
                <Typography.Text type="secondary" className="text-xs">{item.createdAt}</Typography.Text>
                <Typography.Paragraph className="!mb-0 mt-2 whitespace-pre-wrap">{item.content}</Typography.Paragraph>
              </Card>
            </div>
          </div>
        );
      })}
    </Space>
  );
}
