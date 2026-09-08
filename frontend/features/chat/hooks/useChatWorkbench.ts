"use client";

import { App } from "antd";
import { useEffect, useMemo, useState } from "react";
import { backend } from "@/services/client";
import type { AssistantSuggestion, ChatMessage, Conversation, ConversationDetail } from "@/types/chat";

export function useChatWorkbench() {
  const { message, modal } = App.useApp();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<ConversationDetail>();
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [draft, setDraft] = useState("");
  const [suggestions, setSuggestions] = useState<AssistantSuggestion[]>([]);
  const [suggestionOpen, setSuggestionOpen] = useState(false);
  const [analysisOpen, setAnalysisOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [groupMode, setGroupMode] = useState<"time" | "status">("time");
  const [activeCardId, setActiveCardId] = useState<string>();

  useEffect(() => {
    async function load() {
      const syncState = await backend.refreshChatData(false);
      if (!syncState.ready) {
        message.warning(syncState.reason || "聊天数据未就绪");
        setLoading(false);
        return;
      }
      const items = await backend.listConversations();
      setConversations(items);
      setLoading(false);
      if (items[0]) void selectConversation(items[0].id);
    }

    void load();
  }, [message]);

  async function selectConversation(id: string) {
    setDetailLoading(true);
    const detail = await backend.getConversation(id);
    setActiveConversation(detail);
    setDetailLoading(false);
  }

  async function translate(messageItem: ChatMessage, regenerate = false) {
    if (!activeConversation) return;
    const result = regenerate
      ? await backend.regenerateTranslation({ conversationId: activeConversation.id, messageId: messageItem.id, targetLanguage: "zh-CN" })
      : await backend.translateMessage({ conversationId: activeConversation.id, messageId: messageItem.id, targetLanguage: "zh-CN" });
    setActiveConversation({
      ...activeConversation,
      messages: activeConversation.messages.map((item) => (item.id === result.messageId ? { ...item, translatedContent: result.translatedContent } : item)),
    });
    message.success(regenerate ? "已重新翻译" : "已翻译消息");
  }

  async function openSuggestions() {
    if (!activeConversation) return;
    setSuggestions(await backend.getAssistantSuggestions(activeConversation.id));
    setSuggestionOpen(true);
  }

  function insertSuggestion(content: string) {
    setDraft(content);
    setSuggestionOpen(false);
    message.success("已插入到回复框");
  }

  function confirmSend() {
    if (!activeConversation || !draft.trim()) return;
    modal.confirm({
      title: "确认发送回复？",
      content: "当前为 mock 发送，真实 CRM/聊天接口已通过 sendMessage 预留。",
      okText: "确认发送",
      cancelText: "再编辑一下",
      onOk: async () => {
        const result = await backend.sendMessage({
          conversationId: activeConversation.id,
          content: draft.trim(),
          contact: activeConversation.customer.aliId,
          action: "send",
        });
        setActiveConversation(result.conversation);
        setDraft("");
        setConversations(await backend.listConversations());
        message.success("回复已发送（Mock）");
      },
    });
  }

  function toggleSelected(id: string) {
    setSelectedIds((ids) => (ids.includes(id) ? ids.filter((item) => item !== id) : [...ids, id]));
  }

  function selectAll() {
    setSelectedIds(conversations.map((item) => item.id));
  }

  function invertSelection() {
    setSelectedIds((ids) => conversations.map((item) => item.id).filter((id) => !ids.includes(id)));
  }

  async function exportSelected() {
    if (!selectedIds.length) {
      message.warning("请先选择要导出的会话");
      return;
    }
    const result = await backend.exportConversations({ conversationIds: selectedIds });
    const blob = new Blob([result.content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = result.fileName;
    link.click();
    URL.revokeObjectURL(url);
    message.success("已导出 TXT 文件");
  }

  const activeCard = useMemo(() => activeConversation?.messages.find((item) => item.card?.id === activeCardId)?.card, [activeCardId, activeConversation]);

  return {
    conversations,
    activeConversation,
    loading,
    detailLoading,
    draft,
    setDraft,
    selectConversation,
    translate,
    suggestions,
    suggestionOpen,
    setSuggestionOpen,
    openSuggestions,
    insertSuggestion,
    analysisOpen,
    setAnalysisOpen,
    confirmSend,
    selectedIds,
    toggleSelected,
    selectAll,
    invertSelection,
    clearSelection: () => setSelectedIds([]),
    exportSelected,
    groupMode,
    setGroupMode,
    activeCard,
    setActiveCardId,
  };
}
