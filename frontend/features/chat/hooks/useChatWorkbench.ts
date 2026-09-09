"use client";

import { App } from "antd";
import { useCallback, useEffect, useMemo, useState } from "react";
import { backend } from "@/services/client";
import type { AssistantSuggestion, ChatMessage, ConversationDetail } from "@/types/chat";
import { useConversationSummaries } from "./useConversationSummaries";

export function useChatWorkbench() {
  const { message, modal } = App.useApp();
  const { conversations, loading, reload } = useConversationSummaries();
  const [activeConversation, setActiveConversation] = useState<ConversationDetail>();
  const [detailLoading, setDetailLoading] = useState(false);
  const [draft, setDraft] = useState("");
  const [suggestions, setSuggestions] = useState<AssistantSuggestion[]>([]);
  const [suggestionOpen, setSuggestionOpen] = useState(false);
  const [analysisOpen, setAnalysisOpen] = useState(false);
  const [translationVisible, setTranslationVisible] = useState(false);
  const [groupMode, setGroupMode] = useState<"time" | "status">("time");
  const [activeCardId, setActiveCardId] = useState<string>();

  const selectConversation = useCallback(async (id: string) => {
    setDetailLoading(true);
    const detail = await backend.getConversation(id);
    setActiveConversation(detail);
    setTranslationVisible(false);
    setDetailLoading(false);
  }, []);

  useEffect(() => {
    async function loadInitialConversation() {
      if (!activeConversation && conversations[0]) {
        await selectConversation(conversations[0].id);
      }
    }

    void loadInitialConversation();
  }, [activeConversation, conversations, selectConversation]);

  async function translate(messageItem: ChatMessage, regenerate = false) {
    if (!activeConversation) return;
    const result = regenerate
      ? await backend.regenerateTranslation({ conversationId: activeConversation.id, messageId: messageItem.id, targetLanguage: "zh-CN" })
      : await backend.translateMessage({ conversationId: activeConversation.id, messageId: messageItem.id, targetLanguage: "zh-CN" });
    setActiveConversation({
      ...activeConversation,
      messages: activeConversation.messages.map((item) => (item.id === result.messageId ? { ...item, translatedContent: result.translatedContent } : item)),
    });
    setTranslationVisible(true);
    message.success(regenerate ? "已重新翻译" : "已翻译消息");
  }

  async function translateConversation() {
    if (!activeConversation) return;
    const buyerMessages = activeConversation.messages.filter((item) => item.role === "buyer");
    const translatedMessages = await Promise.all(
      buyerMessages.map(async (item) => {
        const result = await backend.translateMessage({ conversationId: activeConversation.id, messageId: item.id, targetLanguage: "zh-CN" });
        return { messageId: result.messageId, translatedContent: result.translatedContent };
      }),
    );
    setActiveConversation({
      ...activeConversation,
      messages: activeConversation.messages.map((item) => {
        const translated = translatedMessages.find((result) => result.messageId === item.id);
        return translated ? { ...item, translatedContent: translated.translatedContent } : item;
      }),
    });
    setTranslationVisible(true);
    message.success("已翻译当前会话");
  }

  function toggleTranslation() {
    if (translationVisible) {
      setTranslationVisible(false);
      return;
    }
    void translateConversation();
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
        await reload();
        message.success("回复已发送（Mock）");
      },
    });
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
    translationVisible,
    toggleTranslation,
    suggestions,
    suggestionOpen,
    setSuggestionOpen,
    openSuggestions,
    insertSuggestion,
    analysisOpen,
    setAnalysisOpen,
    confirmSend,
    groupMode,
    setGroupMode,
    activeCard,
    setActiveCardId,
  };
}
