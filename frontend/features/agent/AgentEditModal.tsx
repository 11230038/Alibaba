"use client";

import { Button, Form, Input, InputNumber, Modal, Select, Space } from "antd";
import { useEffect } from "react";
import type { AgentConfig } from "@/types/agent";

export type AgentEditValues = {
  name: string;
  description: string;
  prompt: string;
  level: number;
  capabilities: string[];
};

type AgentEditModalProps = {
  agent?: AgentConfig;
  category?: AgentConfig["category"];
  title?: string;
  open: boolean;
  saving: boolean;
  onClose: () => void;
  onSave: (values: AgentEditValues) => void;
};

export function AgentEditModal({ agent, category, title, open, saving, onClose, onSave }: AgentEditModalProps) {
  const [form] = Form.useForm<AgentEditValues>();

  useEffect(() => {
    if (!agent) {
      form.resetFields();
      return;
    }
    form.setFieldsValue({
      name: agent.name,
      description: agent.description,
      prompt: agent.prompt ?? "",
      level: agent.level ?? 0,
      capabilities: agent.capabilities,
    });
  }, [agent, form]);

  return (
    <Modal
      title={title ?? `编辑 ${agent?.name ?? "Agent"}`}
      open={open}
      onCancel={onClose}
      footer={null}
      destroyOnHidden
    >
      <Form form={form} layout="vertical" onFinish={onSave}>
        <Form.Item name="name" label="名称" rules={[{ required: true, message: "请输入名称" }]}>
          <Input />
        </Form.Item>
        <Form.Item name="description" label="描述">
          <Input.TextArea rows={2} />
        </Form.Item>
        <Form.Item name="prompt" label="提示词" rules={[{ required: true, message: "请输入提示词" }]}>
          <Input.TextArea rows={4} />
        </Form.Item>
        <Form.Item name="level" label="等级" rules={[{ required: true, message: "请输入等级" }]}>
          <InputNumber min={0} max={4} className="w-full" />
        </Form.Item>
        {(agent?.category ?? category) === "regular" && (
          <Form.Item name="capabilities" label="能力">
            <Select mode="tags" tokenSeparators={[",", "，"]} placeholder="输入能力后回车" />
          </Form.Item>
        )}
        <div className="flex justify-end gap-2">
          <Space>
            <Button onClick={onClose}>取消</Button>
            <Button type="primary" loading={saving} htmlType="submit">保存</Button>
          </Space>
        </div>
      </Form>
    </Modal>
  );
}
