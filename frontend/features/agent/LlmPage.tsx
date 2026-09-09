"use client";

import { EditOutlined, SaveOutlined } from "@ant-design/icons";
import { Button, Card, Descriptions, Form, Input, InputNumber, Modal, Space, Table, Tag, Typography } from "antd";
import { useEffect, useMemo, useState } from "react";
import type { LlmLevelConfig } from "@/types/agent";
import { useAgentWorkbench } from "./hooks/useAgentWorkbench";

type LlmLevelFormValues = Omit<LlmLevelConfig, "level">;
type GlobalPromptFormValues = { systemPrompt: string };

export function LlmPage() {
  const workbench = useAgentWorkbench();
  const [editingLevel, setEditingLevel] = useState<LlmLevelConfig>();
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm<LlmLevelFormValues>();
  const [globalPromptForm] = Form.useForm<GlobalPromptFormValues>();
  const [savingGlobalPrompt, setSavingGlobalPrompt] = useState(false);

  const levels = useMemo(() => {
    if (workbench.state?.llmLevels?.length) return workbench.state.llmLevels;
    const current = workbench.state?.documentLlmConfig;
    return current ? [{
      level: 3,
      baseUrl: current.base_url,
      apiKey: current.api_key,
      modelName: current.model_name,
      systemPrompt: current.system_prompt ?? "",
      context: current.context,
      maxToolRounds: current.max_tool_rounds ?? 0,
    }] : [];
  }, [workbench.state?.documentLlmConfig, workbench.state?.llmLevels]);

  useEffect(() => {
    if (editingLevel) form.setFieldsValue(editingLevel);
  }, [editingLevel, form]);

  useEffect(() => {
    const prompt = workbench.state?.documentLlmConfig?.system_prompt ?? workbench.state?.llmConfig.systemPrompt;
    if (prompt !== undefined) globalPromptForm.setFieldsValue({ systemPrompt: prompt });
  }, [globalPromptForm, workbench.state?.documentLlmConfig?.system_prompt, workbench.state?.llmConfig.systemPrompt]);

  function openEditor(level: LlmLevelConfig) {
    setEditingLevel(level);
  }

  function closeEditor() {
    setEditingLevel(undefined);
    form.resetFields();
  }

  async function save(values: LlmLevelFormValues) {
    if (!editingLevel) return;
    setSaving(true);
    try {
      await workbench.saveLlmLevel({ ...values, level: editingLevel.level });
      closeEditor();
    } finally {
      setSaving(false);
    }
  }

  async function saveGlobalPrompt({ systemPrompt }: GlobalPromptFormValues) {
    const current = workbench.state?.llmConfig;
    if (!current) return;
    setSavingGlobalPrompt(true);
    try {
      await workbench.saveLlmConfig({ ...current, systemPrompt });
    } finally {
      setSavingGlobalPrompt(false);
    }
  }

  return (
    <Space orientation="vertical" size="large" className="w-full">
      <div>
        <Typography.Title level={2} className="!mb-1">LLM</Typography.Title>
        <Typography.Text type="secondary">按 Level 管理模型、上下文和工具调用参数</Typography.Text>
      </div>
      <Card title="全局 SYSTEM_PROMPT">
        <Form form={globalPromptForm} layout="vertical" onFinish={saveGlobalPrompt}>
          <Form.Item name="systemPrompt" rules={[{ required: true, message: "请输入全局系统提示词" }]} className="!mb-3">
            <Input.TextArea rows={3} placeholder="所有 Agent 默认使用的系统提示词" />
          </Form.Item>
          <Button type="primary" icon={<SaveOutlined />} htmlType="submit" loading={savingGlobalPrompt}>保存全局提示词</Button>
        </Form>
      </Card>
      <Card title={<span>LLM Level 配置 <Tag color="blue">{levels.length} 个层级</Tag></span>} loading={workbench.loading}>
        <Table
          rowKey="level"
          dataSource={levels}
          scroll={{ x: 980 }}
          expandable={{
            expandedRowRender: (record) => (
              <Descriptions column={{ xs: 1, sm: 2, md: 3 }} size="small" bordered>
                <Descriptions.Item label="API Key"><Typography.Text code>{record.apiKey}</Typography.Text></Descriptions.Item>
                <Descriptions.Item label="System Prompt" span={2}>{record.systemPrompt}</Descriptions.Item>
              </Descriptions>
            ),
          }}
          columns={[
            {
              title: "Level",
              dataIndex: "level",
              width: 100,
              render: (value: number) => <Tag color={value >= 3 ? "blue" : "default"}>L{value}</Tag>,
            },
            { title: "模型", dataIndex: "modelName", width: 240, ellipsis: true },
            { title: "服务地址", dataIndex: "baseUrl", width: 280, ellipsis: true },
            {
              title: "上下文",
              dataIndex: "context",
              width: 150,
              align: "right" as const,
              render: (value: number) => `${value.toLocaleString()} tokens`,
            },
            { title: "最大工具轮数", dataIndex: "maxToolRounds", width: 150, align: "right" as const },
            { title: "操作", width: 110, fixed: "right" as const, render: (_: unknown, record: LlmLevelConfig) => <Button icon={<EditOutlined />} onClick={() => openEditor(record)}>编辑</Button> },
          ]}
          locale={{ emptyText: "暂无 LLM 配置" }}
        />
      </Card>

      <Modal
        title={`编辑 Level ${editingLevel?.level ?? ""}`}
        open={Boolean(editingLevel)}
        onCancel={closeEditor}
        onOk={() => form.submit()}
        confirmLoading={saving}
        destroyOnHidden
      >
        <Form form={form} layout="vertical" onFinish={save}>
          <Form.Item name="modelName" label="模型" rules={[{ required: true, message: "请输入模型名称" }]}>
            <Input />
          </Form.Item>
          <Form.Item name="baseUrl" label="服务地址" rules={[{ required: true, type: "url", message: "请输入有效的服务地址" }]}>
            <Input />
          </Form.Item>
          <Form.Item name="apiKey" label="API Key" rules={[{ required: true, message: "请输入 API Key" }]}>
            <Input.Password />
          </Form.Item>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Form.Item name="context" label="上下文长度" rules={[{ required: true }]}>
              <InputNumber min={1} step={1000} className="w-full" />
            </Form.Item>
            <Form.Item name="maxToolRounds" label="最大工具轮数" rules={[{ required: true }]}>
              <InputNumber min={0} max={32} className="w-full" />
            </Form.Item>
          </div>
          <Form.Item name="systemPrompt" label="系统提示词" rules={[{ required: true, message: "请输入系统提示词" }]}>
            <Input.TextArea rows={4} />
          </Form.Item>
        </Form>
      </Modal>
    </Space>
  );
}
