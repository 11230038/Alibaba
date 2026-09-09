"use client";

import { BulbOutlined, SendOutlined } from "@ant-design/icons";
import { Button, Input, Space } from "antd";

export function ChatComposer({ value, onChange, onOpenSuggestions, onSend }: { value: string; onChange: (value: string) => void; onOpenSuggestions: () => void; onSend: () => void }) {
  return (
    <Space.Compact className="w-full" orientation="vertical">
      <Input.TextArea rows={4} value={value} onChange={(event) => onChange(event.target.value)} placeholder="输入卖家回复，或插入 AI 建议话术..." />
      <div className="flex justify-between rounded-b-lg border border-t-0 border-slate-200 bg-slate-50 p-3">
        <Button icon={<BulbOutlined />} onClick={onOpenSuggestions}>AI 建议</Button>
        <Button type="primary" icon={<SendOutlined />} onClick={onSend} disabled={!value.trim()}>发送前确认</Button>
      </div>
    </Space.Compact>
  );
}
