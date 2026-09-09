"use client";

import { Listy, Modal, Progress, Space, Tag, Typography } from "antd";
import { stageLabel } from "@/domain/chat/chatModel";
import type { ConversationAnalysis } from "@/types/chat";

export function ChatAnalysisModal({ open, analysis, focus = "intent", onClose }: { open: boolean; analysis?: ConversationAnalysis; focus?: "intent" | "stage"; onClose: () => void }) {
  const title = focus === "intent" ? "客户意图分析" : "客户所处阶段分析";

  return (
    <Modal title={title} open={open} onCancel={onClose} footer={null} width={680}>
      {analysis ? (
        <Space orientation="vertical" className="w-full">
          {focus === "intent" ? (
            <>
              <Typography.Text strong>当前客户意图</Typography.Text>
              <Tag color="blue">{analysis.intent}</Tag>
              <Typography.Text strong>评分</Typography.Text>
              <Progress percent={analysis.score} status={analysis.score > 80 ? "success" : "active"} />
              <Typography.Text strong>意图相关待关注事项</Typography.Text>
              <AnalysisList items={analysis.risks} />
              <Typography.Text strong>意图跟进动作</Typography.Text>
              <AnalysisList items={analysis.nextActions} />
            </>
          ) : (
            <>
              <Typography.Text strong>当前客户阶段</Typography.Text>
              <Tag color="purple">{stageLabel(analysis.stage)}</Tag>
              <Typography.Text strong>评分</Typography.Text>
              <Progress percent={analysis.score} status={analysis.score > 80 ? "success" : "active"} />
              <Typography.Text strong>阶段相关待关注事项</Typography.Text>
              <AnalysisList items={analysis.risks} />
              <Typography.Text strong>阶段推进动作</Typography.Text>
              <AnalysisList items={analysis.nextActions} />
            </>
          )}
        </Space>
      ) : null}
    </Modal>
  );
}

function AnalysisList({ items }: { items: string[] }) {
  return (
    <Listy
      items={items.map((text, index) => ({ id: `${index}-${text}`, text }))}
      rowKey="id"
      virtual={false}
      itemRender={(item) => <div className="py-2">{item.text}</div>}
    />
  );
}
