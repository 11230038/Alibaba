"use client";

import { Card, Descriptions, Drawer, Space, Tag } from "antd";
import { stageLabel } from "@/domain/chat/chatModel";
import type { ConversationDetail } from "@/types/chatCanonical";
import type { SelfInfo } from "@/types/home";

export function CustomerInfo({ conversation, selfInfo, open, onClose }: { conversation?: ConversationDetail; selfInfo?: SelfInfo; open: boolean; onClose: () => void }) {
  return (
    <Drawer title={conversation ? "客户详情" : "个人信息"} size={520} open={open} onClose={onClose} destroyOnHidden>
      {conversation ? <CustomerInfoContent conversation={conversation} /> : selfInfo ? <SelfInfoContent selfInfo={selfInfo} /> : null}
    </Drawer>
  );
}

function SelfInfoContent({ selfInfo }: { selfInfo: SelfInfo }) {
  return (
    <Space orientation="vertical" className="w-full" size="middle">
      <Card title="个人信息">
        <Descriptions size="small" column={1} items={[
          { key: "name", label: "姓名", children: "测试用户" },
          { key: "loginId", label: "登录账号", children: selfInfo.login_id },
          { key: "aliId", label: "账号 ID", children: selfInfo.ali_id },
          { key: "company", label: "公司", children: selfInfo.company_name },
          { key: "country", label: "国家", children: selfInfo.country },
          { key: "status", label: "账号状态", children: selfInfo.account_status },
        ]} />
        <div className="mt-3">
          <Tag color={selfInfo.account_status === "active" ? "green" : "default"}>{selfInfo.account_status}</Tag>
        </div>
      </Card>
    </Space>
  );
}

function CustomerInfoContent({ conversation }: { conversation: ConversationDetail }) {
  const { customer } = conversation;

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
    </Space>
  );
}
