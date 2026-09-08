"use client";

import { App, Button, Card, Col, Row, Space, Spin, Typography } from "antd";
import { CardDetailDrawer } from "@/components/CardDetailDrawer";
import { BatchManagement } from "./batch/BatchManagement";
import { ConversationList } from "./conversation/ConversationList";
import { CustomerInfo } from "./conversation/CustomerInfo";
import { MessageTimeline } from "./conversation/MessageTimeline";
import { useChatWorkbench } from "./hooks/useChatWorkbench";
import { AssistantSuggestionModal } from "./modals/AssistantSuggestionModal";
import { ChatAnalysisModal } from "./modals/ChatAnalysisModal";
import { ChatComposer } from "./workspace/ChatComposer";

export function ChatPage() {
  const { message } = App.useApp();
  const workbench = useChatWorkbench();
  const active = workbench.activeConversation;

  return (
    <Space direction="vertical" size="large" className="w-full">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <Typography.Title level={2} className="!mb-1">聊天工作台</Typography.Title>
        </div>
        <Space>
          <Button onClick={() => workbench.setAnalysisOpen(true)} disabled={!active}>客户分析</Button>
          <Button type="primary" onClick={workbench.openSuggestions} disabled={!active}>生成建议回复</Button>
        </Space>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} xl={6}>
          <Card title="会话列表" loading={workbench.loading} className="min-h-[720px]">
            <ConversationList
              conversations={workbench.conversations}
              activeId={active?.id}
              selectedIds={workbench.selectedIds}
              groupMode={workbench.groupMode}
              onGroupModeChange={workbench.setGroupMode}
              onSelect={workbench.selectConversation}
              onToggleSelected={workbench.toggleSelected}
            />
          </Card>
          <div className="mt-4">
            <BatchManagement
              selectedCount={workbench.selectedIds.length}
              onSelectAll={workbench.selectAll}
              onInvert={workbench.invertSelection}
              onClear={workbench.clearSelection}
              onExport={workbench.exportSelected}
              onMassSend={() => message.info("群发接口已预留，待后端接入")}
            />
          </div>
        </Col>

        <Col xs={24} xl={11}>
          <Card
            title={active ? `${active.customer.name} · ${active.customer.company}` : "消息时间线"}
            className="min-h-[720px]"
          >
            {workbench.detailLoading ? (
              <div className="flex h-[520px] items-center justify-center"><Spin /></div>
            ) : active ? (
              <Space direction="vertical" className="w-full" size="large">
                <div className="max-h-[500px] overflow-y-auto pr-2">
                  <MessageTimeline
                    messages={active.messages}
                    onTranslate={(item) => workbench.translate(item)}
                    onRegenerate={(item) => workbench.translate(item, true)}
                    onOpenCard={workbench.setActiveCardId}
                  />
                </div>
                <ChatComposer value={workbench.draft} onChange={workbench.setDraft} onOpenSuggestions={workbench.openSuggestions} onSend={workbench.confirmSend} />
              </Space>
            ) : (
              <Typography.Text type="secondary">请选择一个会话</Typography.Text>
            )}
          </Card>
        </Col>

        <Col xs={24} xl={7}>
          <CustomerInfo conversation={active} />
        </Col>
      </Row>

      <AssistantSuggestionModal open={workbench.suggestionOpen} suggestions={workbench.suggestions} onClose={() => workbench.setSuggestionOpen(false)} onInsert={workbench.insertSuggestion} />
      <ChatAnalysisModal open={workbench.analysisOpen} analysis={active?.analysis} onClose={() => workbench.setAnalysisOpen(false)} />
      <CardDetailDrawer card={workbench.activeCard} open={Boolean(workbench.activeCard)} onClose={() => workbench.setActiveCardId(undefined)} />
    </Space>
  );
}
