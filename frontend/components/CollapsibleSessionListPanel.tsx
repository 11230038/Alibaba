"use client";

import { MenuFoldOutlined, MenuUnfoldOutlined } from "@ant-design/icons";
import { Button, Card, Grid, Space, Tooltip } from "antd";
import { useState, type ReactNode } from "react";

type CollapsibleSessionListPanelProps = {
  title: ReactNode;
  loading?: boolean;
  children: ReactNode;
  minHeightClassName: string;
  extra?: ReactNode;
};

export function CollapsibleSessionListPanel({ title, loading, children, minHeightClassName, extra }: CollapsibleSessionListPanelProps) {
  const screens = Grid.useBreakpoint();
  const [manualCollapse, setManualCollapse] = useState<{ breakpoint: boolean | undefined; value: boolean }>();
  const collapsed = manualCollapse !== undefined && manualCollapse.breakpoint === screens.xl
    ? manualCollapse.value
    : screens.xl === false;
  const showToggle = screens.xl === false;

  const cardTitle = (
    <div className="flex items-center justify-between gap-2">
      <span>{title}</span>
      <Space size="small">
        {extra}
        {showToggle ? (
          <Tooltip title={collapsed ? "展开会话列表" : "折叠会话列表"}>
            <Button
              type="text"
              size="small"
              aria-label={collapsed ? "展开会话列表" : "折叠会话列表"}
              aria-expanded={!collapsed}
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setManualCollapse({ breakpoint: screens.xl, value: !collapsed })}
            />
          </Tooltip>
        ) : null}
      </Space>
    </div>
  );

  return (
    <Card title={cardTitle} loading={loading} className={collapsed ? undefined : minHeightClassName}>
      {collapsed ? null : children}
    </Card>
  );
}
