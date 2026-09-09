"use client";

import { Button, Card, Form, Input, InputNumber, Select, Space, Typography } from "antd";
import { useEffect } from "react";
import type { LlmConfig } from "@/types/agent";
import { useAgentWorkbench } from "./hooks/useAgentWorkbench";

export function LlmPage() {
  const workbench = useAgentWorkbench();
  const [form] = Form.useForm<LlmConfig>();

  useEffect(() => {
    if (workbench.state?.llmConfig) {
      form.setFieldsValue(workbench.state.llmConfig);
    }
  }, [form, workbench.state?.llmConfig]);

  return (
    <Space orientation="vertical" size="large" className="w-full">
      <Typography.Title level={2} className="!mb-1">LLM</Typography.Title>
      <Card title="LLM 参数" loading={workbench.loading}>
        <Form form={form} layout="vertical" onFinish={workbench.saveLlmConfig}>
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
      </Card>
    </Space>
  );
}
