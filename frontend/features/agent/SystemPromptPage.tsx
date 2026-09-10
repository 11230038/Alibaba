"use client";

import { SaveOutlined } from "@ant-design/icons";
import { Button, Card, Form, Input, Space, Typography } from "antd";
import { useEffect, useState } from "react";
import { useAgentWorkbench } from "./hooks/useAgentWorkbench";

type LevelPromptFormValues = {
  systemPrompt: string;
};

export function SystemPromptPage() {
  const workbench = useAgentWorkbench();
  const [form] = Form.useForm<LevelPromptFormValues>();
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const prompt = workbench.state?.documentLlmConfig?.system_prompt ?? workbench.state?.llmConfig.systemPrompt;
    if (prompt !== undefined) form.setFieldsValue({ systemPrompt: prompt });
  }, [form, workbench.state?.documentLlmConfig?.system_prompt, workbench.state?.llmConfig.systemPrompt]);

  async function save({ systemPrompt }: LevelPromptFormValues) {
    const current = workbench.state?.llmConfig;
    const level = current?.level ?? workbench.state?.documentLlmConfig?.level;
    if (!current || level === undefined) return;
    setSaving(true);
    try {
      await workbench.saveLlmConfig({ ...current, systemPrompt, level });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Space orientation="vertical" size="large" className="w-full">
      <div>
        <Typography.Title level={2} className="!mb-1">Level 系统提示词</Typography.Title>
      </div>
      <Card title="Level 系统提示词" loading={workbench.loading}>
        <Form form={form} layout="vertical" onFinish={save}>
          <Form.Item name="systemPrompt" label="系统提示词" rules={[{ required: true, message: "请输入全局系统提示词" }]}>
            <Input.TextArea autoSize={{ minRows: 1, maxRows: 6 }} placeholder="所有 Agent 默认使用的系统提示词" />
          </Form.Item>
          <Button type="primary" icon={<SaveOutlined />} htmlType="submit" loading={saving}>
            保存全局提示词
          </Button>
        </Form>
      </Card>
    </Space>
  );
}
