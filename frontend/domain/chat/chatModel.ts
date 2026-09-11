import type { Conversation, ConversationDetail } from "@/types/chatCanonical";

export type ConversationGroupMode = "time" | "status";

export function sortConversations(conversations: Conversation[]) {
  return [...conversations].sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt));
}

export function groupConversations(conversations: Conversation[], mode: ConversationGroupMode) {
  const groups = new Map<string, Conversation[]>();

  for (const conversation of conversations) {
    const key = mode === "status" ? statusLabel(conversation.status) : dateGroup(conversation.updatedAt);
    groups.set(key, [...(groups.get(key) ?? []), conversation]);
  }

  return Array.from(groups.entries()).map(([label, items]) => ({ label, items }));
}

export function statusLabel(status: Conversation["status"]) {
  return {
    unread: "未读待回",
    following: "跟进中",
    waiting: "等待客户",
    closed: "已关闭",
  }[status];
}

export function stageLabel(stage: ConversationDetail["customer"]["stage"]) {
  return {
    new: "新线索",
    interested: "高意向",
    negotiating: "谈判中",
    risk: "风险客户",
    done: "已成交",
  }[stage];
}

export function buildConversationExport(details: ConversationDetail[]) {
  const content = details
    .map((conversation) => {
      const header = [
        `客户：${conversation.customer.name}`,
        `公司：${conversation.customer.company}`,
        `阶段：${stageLabel(conversation.customer.stage)}`,
      ].join("\n");
      const messages = conversation.messages
        .map((message) => `[${message.createdAt}] ${message.role}: ${message.content}${message.translatedContent ? `\n译文：${message.translatedContent}` : ""}`)
        .join("\n");
      return `${header}\n${messages}`;
    })
    .join("\n\n---\n\n");

  return {
    fileName: `conversation-export-${Date.now()}.txt`,
    archiveName: `conversation-export-${Date.now()}.zip`,
    content,
  };
}

function dateGroup(value: string) {
  const datePart = value.split(" ")[0];
  if (datePart === "2026-09-07") return "今天";
  if (datePart === "2026-09-06") return "昨天";
  return "更早";
}
