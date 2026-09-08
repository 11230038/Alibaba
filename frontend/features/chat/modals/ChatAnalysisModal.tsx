"use client";

import { List, Modal, Progress, Space, Tag, Typography } from "antd";
import { stageLabel } from "@/domain/chat/chatModel";
import type { ConversationAnalysis } from "@/types/chat";

export function ChatAnalysisModal({ open, analysis, onClose }: { open: boolean; analysis?: ConversationAnalysis; onClose: () => void }) {
  return (
    <Modal title="客户意图与阶段分析" open={open} onCancel={onClose} footer={null} width={680}>
      {analysis ? (
        <Space direction="vertical" className="w-full">
          <Typography.Paragraph>{analysis.summary}</Typography.Paragraph>
          <Space><Tag color="blue">{analysis.intent}</Tag><Tag color="purple">{stageLabel(analysis.stage)}</Tag></Space>
          <Progress percent={analysis.score} status={analysis.score > 80 ? "success" : "active"} />
          <List size="small" header="风险提示" dataSource={analysis.risks} renderItem={(item) => <List.Item>{item}</List.Item>} />
          <List size="small" header="推荐动作" dataSource={analysis.nextActions} renderItem={(item) => <List.Item>{item}</List.Item>} />
        </Space>
      ) : null}
    </Modal>
  );
}
