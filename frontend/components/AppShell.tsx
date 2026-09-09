"use client";

import { AppstoreOutlined, CommentOutlined, DashboardOutlined, RobotOutlined, SelectOutlined, SettingOutlined } from "@ant-design/icons";
import { Badge, Button, Layout, Menu, Space, Typography } from "antd";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import type { ReactNode } from "react";

const { Header, Sider, Content } = Layout;

const navItems = [
  { key: "/", icon: <DashboardOutlined />, label: <Link href="/">首页</Link> },
  {
    key: "/chat",
    icon: <CommentOutlined />,
    label: "聊天工作台",
    children: [
      { key: "/chat/customer-sessions", icon: <CommentOutlined />, label: <Link href="/chat/customer-sessions">客户会话</Link> },
      { key: "/chat/agent-sessions", icon: <RobotOutlined />, label: <Link href="/chat/agent-sessions">agent会话</Link> },
    ],
  },
  { key: "/batch", icon: <SelectOutlined />, label: <Link href="/batch">会话管理</Link> },
  {
    key: "/agent",
    icon: <RobotOutlined />,
    label: "自动化",
    children: [
      { key: "/agent/llm", icon: <SettingOutlined />, label: <Link href="/agent/llm">LLM</Link> },
      { key: "/agent/system-agents", icon: <RobotOutlined />, label: <Link href="/agent/system-agents">系统 Agent</Link> },
      { key: "/agent/regular-agents", icon: <RobotOutlined />, label: <Link href="/agent/regular-agents">普通 Agent</Link> },
    ],
  },
  {
    key: "/settings",
    icon: <SettingOutlined />,
    label: "设置",
    children: [
      { key: "/status", icon: <AppstoreOutlined />, label: <Link href="/status">系统状态</Link> },
    ],
  },
];

function NavigationMenu({ selectedKey, routeOpenKeys }: { selectedKey: string; routeOpenKeys: string[] }) {
  const [openKeys, setOpenKeys] = useState(routeOpenKeys);

  return (
    <Menu
      theme="dark"
      mode="inline"
      selectedKeys={[selectedKey]}
      openKeys={openKeys}
      onOpenChange={setOpenKeys}
      items={navItems}
      className="flex-1 border-0"
    />
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const selectedKey = pathname.startsWith("/chat/agent-sessions")
    ? "/chat/agent-sessions"
    : pathname.startsWith("/agent/system-agents")
    ? "/agent/system-agents"
    : pathname.startsWith("/agent/regular-agents")
      ? "/agent/regular-agents"
      : pathname.startsWith("/agent/llm")
        ? "/agent/llm"
        : pathname === "/chat" || pathname.startsWith("/chat/customer-sessions")
        ? "/chat/customer-sessions"
        : pathname.startsWith("/status")
          ? "/status"
          : pathname === "/"
            ? "/"
            : `/${pathname.split("/")[1]}`;
  const openKeys = pathname === "/chat" || pathname.startsWith("/chat/")
    ? ["/chat"]
    : pathname.startsWith("/agent/")
      ? ["/agent"]
      : pathname.startsWith("/status")
        ? ["/settings"]
        : [];
  return (
    <Layout className="fixed inset-0 items-stretch overflow-hidden">
      <Sider width={232} breakpoint="lg" collapsedWidth="0" className="h-full overflow-y-auto shadow-xl">
        <div className="flex h-full min-h-0 flex-col">
          <div className="flex h-16 items-center gap-3 px-5 text-white">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500 font-bold">AI</div>
            <Typography.Text className="!text-white" strong>
              外贸运营
            </Typography.Text>
          </div>
          <NavigationMenu key={openKeys.join("|") || "root"} selectedKey={selectedKey} routeOpenKeys={openKeys} />
        </div>
      </Sider>
      <Layout>
        <Header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-slate-100 px-6 shadow-sm">
          <Typography.Title level={4} className="!mb-0">
            阿里国际站运营助手
          </Typography.Title>
          <Space size="middle">
            <Badge status="processing" text="Receiver 在线" />
            <Button type="primary" ghost>
              创建测试任务
            </Button>
          </Space>
        </Header>
        <Content className="p-6">
          <div className="mx-auto max-w-[1480px]">{children}</div>
        </Content>
      </Layout>
    </Layout>
  );
}
