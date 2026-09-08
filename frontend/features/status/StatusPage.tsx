"use client";

import { Button, Card, Col, Progress, Row, Space, Statistic, Table, Typography } from "antd";
import { healthScore } from "@/domain/status/statusModel";
import { StatusTag } from "@/components/StatusTag";
import { useStatusWorkbench } from "./hooks/useStatusWorkbench";

export function StatusPage() {
  const { snapshot, loading, refreshing, refresh, createTestTask } = useStatusWorkbench();

  return (
    <Space direction="vertical" size="large" className="w-full">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <Typography.Title level={2} className="!mb-1">系统状态</Typography.Title>
        </div>
        <Space>
          <Button onClick={createTestTask}>创建测试任务</Button>
          <Button type="primary" loading={refreshing} onClick={refresh}>刷新状态</Button>
        </Space>
      </div>

      <Card loading={loading} extra={<Typography.Text type="secondary">更新时间：{snapshot?.updatedAt}</Typography.Text>}>
        <Row gutter={[16, 16]}>
          {snapshot?.modules.map((module) => (
            <Col xs={24} md={8} key={module.id}>
              <Card size="small" title={module.name} extra={<StatusTag status={module.status} badge />}>
                <Space direction="vertical" className="w-full">
                  <Statistic title="延迟" value={module.latency} suffix="ms" />
                  <Progress percent={healthScore(module.status)} status={module.status === "offline" ? "exception" : module.status === "warning" ? "active" : "success"} />
                </Space>
              </Card>
            </Col>
          ))}
        </Row>
      </Card>

      <Card title="任务队列">
        <Table
          rowKey="id"
          dataSource={snapshot?.tasks ?? []}
          columns={[
            { title: "任务类型", dataIndex: "type" },
            { title: "状态", dataIndex: "status", render: (value) => <StatusTag status={value} /> },
            { title: "创建时间", dataIndex: "createdAt" },
            { title: "耗时", dataIndex: "duration" },
            { title: "负责人", dataIndex: "owner" },
            { title: "备注", dataIndex: "remark" },
          ]}
        />
      </Card>
    </Space>
  );
}
