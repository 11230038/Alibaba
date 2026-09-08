"use client";

import { Button, List, Modal, Space, Tag, Typography } from "antd";
import type { AssistantSuggestion } from "@/types/chat";

export function AssistantSuggestionModal({ open, suggestions, onClose, onInsert }: { open: boolean; suggestions: AssistantSuggestion[]; onClose: () => void; onInsert: (content: string) => void }) {
  return (
    <Modal title="AI 建议回复" open={open} onCancel={onClose} footer={null} width={760}>
      <List
        dataSource={suggestions}
        renderItem={(item) => (
          <List.Item actions={[<Button key="insert" type="primary" onClick={() => onInsert(item.content)}>插入</Button>]}>
            <Space direction="vertical" className="w-full">
              <Space><Typography.Text strong>{item.title}</Typography.Text><Tag>{item.tone}</Tag></Space>
              <Typography.Paragraph className="!mb-0">{item.content}</Typography.Paragraph>
            </Space>
          </List.Item>
        )}
      />
    </Modal>
  );
}
