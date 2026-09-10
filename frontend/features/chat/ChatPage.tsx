"use client";

import { SettingOutlined } from "@ant-design/icons";
import { useState } from "react";
import { Button, Card, Col, Row, Space, Spin, Typography } from "antd";
import { useRouter } from "next/navigation";
import { CardDetailDrawer } from "@/components/CardDetailDrawer";
import { CollapsibleSessionListPanel } from "@/components/CollapsibleSessionListPanel";
import { ConversationList } from "./conversation/ConversationList";
import { CustomerInfo } from "./conversation/CustomerInfo";
import { MessageTimeline } from "./conversation/MessageTimeline";
import { useChatWorkbench } from "./hooks/useChatWorkbench";
import { AssistantSuggestionModal } from "./modals/AssistantSuggestionModal";
import { ChatAnalysisModal } from "./modals/ChatAnalysisModal";
import { ChatComposer } from "./workspace/ChatComposer";

type AnalysisFocus = "intent" | "stage";

export function ChatPage() {
  const router = useRouter();
  const workbench = useChatWorkbench();
  const active = workbench.activeConversation;
  const [customerInfoOpen, setCustomerInfoOpen] = useState(false);
  const [analysisFocus, setAnalysisFocus] = useState<AnalysisFocus>("intent");

  async function openAnalysis(focus: AnalysisFocus) {
    setAnalysisFocus(focus);
    workbench.setAnalysisOpen(true);
    try {
      await workbench.analyzeConversation();
    } catch {
      workbench.setAnalysisOpen(false);
    }
  }

  return (
    <Space orientation="vertical" size="large" className="w-full">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <Typography.Title level={2} className="!mb-1">聊天工作台</Typography.Title>
        </div>
        <Button type="primary" onClick={() => setCustomerInfoOpen(true)} disabled={!active}>客户信息</Button>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} xl={6}>
          <CollapsibleSessionListPanel
            title="会话列表"
            loading={workbench.loading}
            minHeightClassName="min-h-[720px]"
            extra={<Button type="link" size="small" icon={<SettingOutlined />} onClick={() => router.push("/batch")}>管理会话</Button>}
          >
            <ConversationList
              conversations={workbench.conversations}
              activeId={active?.id}
              groupMode={workbench.groupMode}
              onGroupModeChange={workbench.setGroupMode}
              onSelect={workbench.selectConversation}
            />
          </CollapsibleSessionListPanel>
        </Col>

        <Col xs={24} xl={18} className="flex">
          <Card
            title={active ? `${active.customer.name} · ${active.customer.company}` : "消息时间线"}
            className="flex min-h-[720px] w-full flex-col"
            classNames={{ body: "flex min-h-0 flex-1 flex-col" }}
          >
            {workbench.detailLoading ? (
              <div className="flex flex-1 items-center justify-center"><Spin /></div>
            ) : active ? (
              <div className="flex min-h-0 flex-1 flex-col gap-6">
                <div className="min-h-0 flex-1 overflow-y-auto pr-2">
                  <MessageTimeline
                    messages={active.messages}
                    buyerId={active.customer.id}
                    showTranslations={workbench.translationVisible}
                    onRegenerate={(item) => workbench.translate(item, true)}
                    onOpenCard={workbench.setActiveCardId}
                  />
                </div>
                <div className="shrink-0">
                  <ChatComposer
                    value={workbench.draft}
                    onChange={workbench.setDraft}
                    translationVisible={workbench.translationVisible}
                    onToggleTranslation={workbench.toggleTranslation}
                    onOpenSuggestions={workbench.openSuggestions}
                    onOpenIntentAnalysis={() => void openAnalysis("intent")}
                    onOpenStageAnalysis={() => void openAnalysis("stage")}
                    loading={workbench.sending}
                    onSend={workbench.sendMessage}
                  />
                </div>
              </div>
            ) : (
              <Typography.Text type="secondary">请选择一个会话</Typography.Text>
            )}
          </Card>
        </Col>
      </Row>

      <AssistantSuggestionModal open={workbench.suggestionOpen} suggestions={workbench.suggestions} onClose={() => workbench.setSuggestionOpen(false)} onInsert={workbench.insertSuggestion} />
      <ChatAnalysisModal open={workbench.analysisOpen} analysis={active?.analysis} focus={analysisFocus} onClose={() => workbench.setAnalysisOpen(false)} />
      <CustomerInfo conversation={active} open={customerInfoOpen} onClose={() => setCustomerInfoOpen(false)} />
      <CardDetailDrawer card={workbench.activeCard} open={Boolean(workbench.activeCard)} onClose={() => workbench.setActiveCardId(undefined)} />
    </Space>
  );
}
