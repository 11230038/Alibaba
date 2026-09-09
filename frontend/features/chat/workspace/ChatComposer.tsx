"use client";

import { SendOutlined, ToolOutlined } from "@ant-design/icons";
import { Button, Dropdown, Input, Space } from "antd";
import type { MenuProps } from "antd";

type ChatComposerProps = {
  value: string;
  onChange: (value: string) => void;
  translationVisible: boolean;
  onToggleTranslation: () => void;
  onOpenSuggestions: () => void;
  onOpenIntentAnalysis: () => void;
  onOpenStageAnalysis: () => void;
  onSend: () => void;
};

export function ChatComposer({
  value,
  onChange,
  translationVisible,
  onToggleTranslation,
  onOpenSuggestions,
  onOpenIntentAnalysis,
  onOpenStageAnalysis,
  onSend,
}: ChatComposerProps) {
  const menuItems: MenuProps["items"] = [
    { key: "translation", label: translationVisible ? "关闭翻译" : "翻译" },
    { key: "suggestions", label: "AI 回复建议" },
    { key: "intent-analysis", label: "客户意图分析" },
    { key: "stage-analysis", label: "客户所处阶段分析" },
  ];

  const handleToolClick: MenuProps["onClick"] = ({ key }) => {
    if (key === "translation") onToggleTranslation();
    if (key === "suggestions") onOpenSuggestions();
    if (key === "intent-analysis") onOpenIntentAnalysis();
    if (key === "stage-analysis") onOpenStageAnalysis();
  };

  return (
    <Space.Compact className="w-full" orientation="vertical">
      <Input.TextArea rows={4} value={value} onChange={(event) => onChange(event.target.value)} placeholder="输入卖家回复，或插入 AI 建议话术..." />
      <div className="flex justify-between rounded-b-lg border border-t-0 border-slate-200 bg-slate-50 p-3">
        <Dropdown menu={{ items: menuItems, onClick: handleToolClick }} trigger={["click"]}>
          <Button icon={<ToolOutlined />}>工具栏</Button>
        </Dropdown>
        <Button type="primary" icon={<SendOutlined />} onClick={onSend} disabled={!value.trim()}>发送前确认</Button>
      </div>
    </Space.Compact>
  );
}
