"use client";

import { Card, Descriptions, List, Progress, Space, Tag, Typography } from "antd";
import { stageLabel } from "@/domain/chat/chatModel";
import type { ConversationDetail } from "@/types/chat";

export function CustomerInfo({ conversation }: { conversation?: ConversationDetail }) {
  if (!conversation) return <Card loading />;
  const { customer, analysis } = conversation;

  return (
    <Space orientation="vertical" className="w-full" size="middle">
      <Card title="客户信息">
        <Descriptions size="small" column={1} items={[
          { key: "name", label: "姓名", children: customer.name },
          { key: "company", label: "公司", children: customer.company },
          { key: "country", label: "国家", children: customer.country },
          { key: "email", label: "邮箱", children: customer.email },
          { key: "phone", label: "电话", children: customer.phone },
          { key: "stage", label: "阶段", children: stageLabel(customer.stage) },
          { key: "availability", label: "在线时间", children: customer.availability },
        ]} />
        <div className="mt-3">
          {customer.tags.map((tag) => <Tag key={tag} color="blue">{tag}</Tag>)}
        </div>
      </Card>
      <Card title="行为与意图">
        <Space orientation="vertical" className="w-full">
          <div>
            <Typography.Text type="secondary">成交意向分</Typography.Text>
            <Progress percent={analysis.score} status={analysis.score > 80 ? "success" : "active"} />
          </div>
          <Typography.Paragraph>{analysis.summary}</Typography.Paragraph>
          <List size="small" header="近期行为" dataSource={customer.behavior} renderItem={(item) => <List.Item>{item}</List.Item>} />
          <List size="small" header="下一步动作" dataSource={analysis.nextActions} renderItem={(item) => <List.Item>{item}</List.Item>} />
        </Space>
      </Card>
    </Space>
  );
}
