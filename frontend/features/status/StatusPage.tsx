"use client";

import { ExperimentOutlined, ReloadOutlined } from "@ant-design/icons";
import { Button, Card, Col, Empty, Row, Space, Table, Tag, Typography } from "antd";
import { HydrationSafeTable } from "@/components/HydrationSafeTable";
import { StatusTag } from "@/components/StatusTag";
import type { HealthModule, TaskItem } from "@/types/status";
import { useStatusWorkbench } from "./hooks/useStatusWorkbench";

const healthModuleIds = ["health-identity", "health-proxy", "health-receiver"] as const;

export function StatusPage() {
  const { snapshot, loading, refreshing, refresh, createTestTask } = useStatusWorkbench();
  const modules = healthModuleIds.map((id) => snapshot?.modules.find((module) => module.id === id)).filter((module): module is HealthModule => Boolean(module));

  return (
    <Space orientation="vertical" size="large" className="w-full">
      <div>
        <Typography.Title level={2} className="!mb-1">系统状态</Typography.Title>
      </div>

      <Card title="系统状态" loading={loading}>
        <Row gutter={[16, 16]}>
          {modules.map((module) => <Col xs={24} md={8} key={module.id}><HealthModulePanel module={module} /></Col>)}
          {!loading && !modules.length ? <Col span={24}><Empty description="暂无状态数据" /></Col> : null}
        </Row>
      </Card>

      <Card title="快捷测试动作">
        <Space wrap>
          <Button icon={<ReloadOutlined />} loading={refreshing} onClick={refresh}>刷新运行状态</Button>
          <Button type="primary" icon={<ExperimentOutlined />} onClick={createTestTask}>创建 mock 测试任务</Button>
        </Space>
      </Card>

      <Card title="任务队列">
        <Table
          rowKey="id"
          dataSource={snapshot?.tasks ?? []}
          loading={loading}
          scroll={{ x: 900 }}
          components={{ table: HydrationSafeTable }}
          columns={[
            { title: "任务 ID", dataIndex: "id", width: 150 },
            { title: "操作类型", dataIndex: "type", width: 180 },
            { title: "目标", dataIndex: "owner", width: 180 },
            { title: "创建时间", dataIndex: "createdAt", width: 180 },
            { title: "状态", dataIndex: "status", width: 120, render: (value: TaskItem["status"]) => <StatusTag status={value} /> },
            { title: "结果", dataIndex: "remark", minWidth: 280 },
            { title: "操作", key: "action", width: 80, render: () => <Tag>详情</Tag> },
          ]}
          locale={{ emptyText: "暂无任务" }}
        />
      </Card>
    </Space>
  );
}

function HealthModulePanel({ module }: { module: HealthModule }) {
  const title = module.id === "health-identity" ? "用户状态" : module.id === "health-proxy" ? "MITM 代理" : "MITM Receiver";
  const description = module.id === "health-identity" && module.status === "healthy"
    ? "卖家身份已捕获，CRM 会话可读取"
    : module.id === "health-receiver" && module.status === "warning"
      ? "最近 5 分钟捕获量偏低，等待新消息进入"
      : module.description;

  return (
    <div className="h-full rounded-lg border border-slate-200 bg-white p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <Typography.Text strong>{title}</Typography.Text>
        <StatusTag status={module.status} />
      </div>
      <Typography.Title level={4} className="!mb-2">{module.status === "healthy" ? "在线" : module.status === "warning" ? "注意" : "离线"}</Typography.Title>
      <Typography.Paragraph type="secondary" className="!mb-4 min-h-12">{description}</Typography.Paragraph>
      <Typography.Text type="secondary" className="text-xs">最近检查：{module.lastCheckedAt}</Typography.Text>
    </div>
  );
}
