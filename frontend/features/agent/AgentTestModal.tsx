"use client";

import { Button, Input, Modal, Space } from "antd";
import { useState } from "react";
import type { AgentConfig } from "@/types/agent";

export function AgentTestModal({ agent, open, testing, onClose, onRun }: { agent?: AgentConfig; open: boolean; testing: boolean; onClose: () => void; onRun: (content: string) => void }) {
  const [content, setContent] = useState("");

  return (
    <Modal title={`测试 ${agent?.name ?? "Agent"}`} open={open} onCancel={onClose} footer={null} width={720} destroyOnHidden>
      <Space direction="vertical" className="w-full">
        <Input.TextArea rows={5} value={content} onChange={(event) => setContent(event.target.value)} placeholder="例如：客户询问样品费用和 CE 证书，帮我生成英文回复。" />
        <div className="flex justify-end gap-2">
          <Button onClick={onClose}>取消</Button>
          <Button type="primary" loading={testing} disabled={!content.trim()} onClick={() => onRun(content)}>运行测试</Button>
        </div>
      </Space>
    </Modal>
  );
}
