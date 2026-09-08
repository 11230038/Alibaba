import type { BusinessCard } from "@/types/cards";
import type {
  AssistantSuggestion,
  Conversation,
  ConversationAnalysis,
  ConversationAnalysisInput,
  ConversationDetail,
  CrmConversation,
  CrmMessage,
  CustomerStage,
  MessageRole,
  ReplySuggestionInput,
  ReplySuggestions,
  UserInfo,
} from "@/types/chat";
import type { SelfInfo } from "@/types/home";

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
      const header = [`客户：${conversation.customer.name}`, `公司：${conversation.customer.company}`, `阶段：${stageLabel(conversation.customer.stage)}`].join("\n");
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

export function toConversationSummary(conversation: CrmConversation, users: UserInfo[], selfInfo: SelfInfo | null): Conversation {
  const user = resolveUser(conversation.contact_ali_id, users);
  const messages = conversation.messages;
  const unreadCount = messages.filter((message) => isBuyerMessage(message, selfInfo) && !message.is_system).length;
  const stage = inferStage(user, messages);

  return {
    id: conversation.contact_ali_id,
    customer: {
      id: user?.ali_id ?? conversation.contact_ali_id,
      aliId: user?.ali_id ?? conversation.contact_ali_id,
      name: formatUserName(user),
      company: user?.company_name ?? "未知公司",
      country: user?.country_code ?? "未知",
      email: user?.email ?? "",
      phone: user?.mobile_number || user?.phone_number || "",
      stage,
      tags: buildCustomerTags(user, stage),
      availability: user?.available ? "当前可联系" : "暂未确认",
      behavior: buildBehavior(user),
    },
    latestMessage: conversation.last_content_label ?? latestMessage(messages)?.content_label ?? "暂无消息",
    updatedAt: formatCreatedAt(conversation.last_created_at),
    unreadCount,
    status: unreadCount > 0 ? "unread" : stage === "done" ? "closed" : "following",
    priority: priorityFromScore(user?.potential_score ?? 60),
  };
}

export function toConversationDetail(conversation: CrmConversation, users: UserInfo[], selfInfo: SelfInfo | null, cards: BusinessCard[] = []): ConversationDetail {
  const summary = toConversationSummary(conversation, users, selfInfo);
  const messages = conversation.messages.map((message) => toChatMessage(message, selfInfo, cards));
  const analysis = buildConversationAnalysis(summary, conversation, users);

  return {
    ...summary,
    messages,
    analysis,
    source: conversation,
  };
}

export function buildReplySuggestionInput({ conversation, selfInfo }: ReplySuggestionInput) {
  return JSON.stringify({ seller: selfInfo?.login_id ?? "mock-seller", conversation }, null, 2);
}

export function buildAnalysisInput({ task, conversation, selfInfo }: ConversationAnalysisInput) {
  return JSON.stringify({ task, seller: selfInfo?.login_id ?? "mock-seller", conversation }, null, 2);
}

export function replySuggestionsToAssistantSuggestions(suggestions: ReplySuggestions): AssistantSuggestion[] {
  const tones: AssistantSuggestion["tone"][] = ["formal", "friendly", "urgent"];
  return suggestions.items.map((item, index) => ({
    id: `sug-${index + 1}`,
    title: item.zh,
    content: item.reply,
    tone: tones[index] ?? "formal",
    zh: item.zh,
  }));
}

export function conversationToTuples(detail: ConversationDetail): Array<[string, string, string]> {
  return detail.messages
    .filter((message) => message.role === "buyer" || message.role === "seller")
    .map((message) => [message.createdAt, message.role === "seller" ? "我" : "买家", message.content]);
}

export function formatCreatedAt(value: unknown) {
  if (typeof value === "string") return value;
  if (typeof value === "number") {
    const timestamp = value > 10_000_000_000 ? value : value * 1000;
    return new Date(timestamp).toLocaleString("zh-CN", { hour12: false }).replaceAll("/", "-");
  }
  if (value instanceof Date) return value.toLocaleString("zh-CN", { hour12: false }).replaceAll("/", "-");
  return "未知时间";
}

function toChatMessage(message: CrmMessage, selfInfo: SelfInfo | null, cards: BusinessCard[]) {
  const role: MessageRole = message.is_system ? "system" : message.card_id ? "card" : isSellerMessage(message, selfInfo) ? "seller" : "buyer";
  const card = message.card_id ? cards.find((item) => item.id === message.card_id) : undefined;
  return {
    id: message.mid,
    role,
    content: message.content_label ?? message.content ?? (card ? "系统推荐卡片" : ""),
    createdAt: formatCreatedAt(message.created_at),
    card,
  };
}

function resolveUser(contactAliId: string, users: UserInfo[]) {
  return users.find((user) => user.ali_id === contactAliId || user.login_id === contactAliId || user.encrypt_account_id === contactAliId);
}

function latestMessage(messages: CrmMessage[]) {
  return [...messages].sort((a, b) => coerceEpoch(b.created_at) - coerceEpoch(a.created_at))[0];
}

function coerceEpoch(value: unknown) {
  if (typeof value === "number") return value > 10_000_000_000 ? value / 1000 : value;
  if (typeof value === "string") return Date.parse(value) / 1000 || 0;
  if (value instanceof Date) return value.getTime() / 1000;
  return 0;
}

function isSellerMessage(message: CrmMessage, selfInfo: SelfInfo | null) {
  return Boolean(selfInfo?.ali_id && message.sender_id === selfInfo.ali_id);
}

function isBuyerMessage(message: CrmMessage, selfInfo: SelfInfo | null) {
  return Boolean(message.sender_id && message.sender_id !== selfInfo?.ali_id);
}

function formatUserName(user?: UserInfo) {
  if (!user) return "未知客户";
  return [user.first_name, user.last_name].filter(Boolean).join(" ") || user.login_id || user.ali_id;
}

function buildCustomerTags(user: UserInfo | undefined, stage: CustomerStage) {
  if (!user) return [stageLabel(stage)];
  return [stageLabel(stage), user.high_quality_level_tag, user.growth_level, ...user.preferred_industries].filter(Boolean).slice(0, 5);
}

function buildBehavior(user?: UserInfo) {
  if (!user) return ["暂无行为数据"];
  return [
    `商品浏览 ${user.product_view_count} 次`,
    `有效询盘 ${user.valid_inquiry_count} 条`,
    `活跃 ${user.login_days} 天`,

    user.recent_contact ? "近期已联系" : "近期未联系",
  ];
}

function inferStage(user: UserInfo | undefined, messages: CrmMessage[]): CustomerStage {
  if ((user?.valid_inquiry_count ?? 0) >= 5) return "negotiating";
  if ((user?.potential_score ?? 0) >= 80) return "interested";
  if (messages.some((message) => message.content_label?.includes("风险"))) return "risk";
  return "new";
}

function priorityFromScore(score: number): Conversation["priority"] {
  if (score >= 80) return "high";
  if (score >= 60) return "medium";
  return "low";
}

function buildConversationAnalysis(summary: Conversation, conversation: CrmConversation, users: UserInfo[]): ConversationAnalysis {
  const user = resolveUser(conversation.contact_ali_id, users);
  const score = user?.potential_score ?? 60;
  const nextActions = score >= 80 ? ["确认采购数量", "发送报价与认证资料", "约定样品寄送时间"] : ["补充客户关注资料", "确认需求场景"];
  return {
    intent: conversation.last_content_label ?? "客户需求沟通",
    stage: summary.customer.stage,
    score,
    risks: user?.blacklisted_count ? ["客户存在历史拉黑记录"] : ["需持续跟进响应时效"],
    nextActions,
    summary: `${summary.customer.name} 当前处于${stageLabel(summary.customer.stage)}阶段，建议优先处理最近消息。`,
    rawText: "Mock Agent 已完成客户阶段与意图分析。",
    jsonPayload: { intent: conversation.last_content_label, stage: summary.customer.stage, confidence: score },
  };
}

function dateGroup(value: string) {
  const datePart = value.split(" ")[0];
  if (datePart === "2026-09-07") return "今天";
  if (datePart === "2026-09-06") return "昨天";
  return "更早";
}
