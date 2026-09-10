import type { BusinessCard } from "@/types/cards";
import type {
  AssistantSuggestion,
  Conversation,
  ConversationAnalysis,
  ConversationAnalysisInput,
  ConversationDetail,
  ConversationRecord,
  CrmConversation,
  CrmMessage,
  DbAccount,
  DbConversation,
  DbCustomer,
  DbMessage,
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

export function toConversationSummary(conversation: ConversationRecord, users: UserInfo[], selfInfo: SelfInfo | null): Conversation {
  const legacyConversation = isLegacyConversation(conversation) ? conversation : undefined;
  const dbConversation = isDbConversationRecord(conversation) ? conversation : undefined;
  const contactId = legacyConversation?.contact_ali_id ?? String(conversation.sid);
  const user = legacyConversation ? resolveUser(contactId, users) : undefined;
  const dbContact = dbConversation ? resolveDbContact(dbConversation, selfInfo) : undefined;
  const messages: Array<CrmMessage | DbMessage> = conversation.messages;
  const unreadCount = messages.filter((message) => isUnreadBuyerMessage(message, selfInfo) && !isSystemMessage(message)).length;
  const stage = inferStage(user, messages);
  const customerName = dbContact?.customer.name || dbContact?.account.nickname || dbContact?.account.account;

  return {
    id: contactId,
    customer: {
      id: dbContact ? String(dbContact.customer.cid) : user?.ali_id ?? contactId,
      aliId: dbContact?.account.account ?? user?.ali_id ?? contactId,
      name: customerName ?? formatUserName(user),
      company: user?.company_name ?? "未知公司",
      country: dbContact?.customer.region ?? user?.country_code ?? "未知",
      email: typeof dbContact?.account.extra?.email === "string" ? dbContact.account.extra.email : user?.email ?? "",
      phone: typeof dbContact?.account.extra?.phone === "string" ? dbContact.account.extra.phone : user?.mobile_number || user?.phone_number || "",
      stage,
      tags: buildCustomerTags(user, stage),
      availability: user?.available ? "当前可联系" : "暂未确认",
      behavior: buildBehavior(user),
    },
    latestMessage: latestMessageText(conversation),
    updatedAt: formatCreatedAt(legacyConversation?.last_created_at ?? dbConversation?.display_updated_at ?? getMessageCreatedAt(latestMessage(messages))),
    unreadCount,
    status: unreadCount > 0 ? "unread" : stage === "done" ? "closed" : "following",
    priority: priorityFromScore(user?.potential_score ?? 60),
  };
}

export function toConversationDetail(conversation: ConversationRecord, users: UserInfo[], selfInfo: SelfInfo | null, cards: BusinessCard[] = []): ConversationDetail {
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

function toChatMessage(message: CrmMessage | DbMessage, selfInfo: SelfInfo | null, cards: BusinessCard[]) {
  const legacyMessage = isLegacyMessage(message) ? message : undefined;
  const cardId = legacyMessage?.card_id ?? contentCardId(message.content);
  const card = cardId ? cards.find((item) => item.id === cardId) : undefined;
  const rawContent = message.content;
  const role: MessageRole = isSystemMessage(message) ? "system" : card || message.type === "card" ? "card" : isSellerMessage(message, selfInfo) ? "seller" : "buyer";
  return {
    id: messageId(message),
    role,
    content: displayMessageContent(legacyMessage?.content_label, rawContent, card),
    createdAt: formatCreatedAt(legacyMessage?.created_at),
    sid: message.sid,
    externalMid: isDbMessage(message) ? message.external_mid : message.external_mid ?? message.extrenal_mid ?? message.mid,
    senderAid: message.sender,
    read: message.read,
    type: message.type,
    rawContent,
    card,
  };
}

function resolveUser(contactAliId: string, users: UserInfo[]) {
  return users.find((user) => user.ali_id === contactAliId || user.login_id === contactAliId || user.encrypt_account_id === contactAliId);
}

function resolveDbContact(conversation: DbConversation, selfInfo: SelfInfo | null): { account: DbAccount; customer: DbCustomer } | undefined {
  const accounts = conversation.accounts ?? [];
  const customers = conversation.customers ?? [];
  const selfAid = selfInfo?.aid;
  const buyerAccount = accounts.find((account) => conversation.participants.includes(account.aid) && account.aid !== selfAid) ?? accounts.find((account) => conversation.participants.includes(account.aid));
  if (!buyerAccount) return undefined;
  const customer = customers.find((item) => item.cid === buyerAccount.cid);
  return customer ? { account: buyerAccount, customer } : undefined;
}

function latestMessage(messages: Array<CrmMessage | DbMessage>) {
  return [...messages].sort((a, b) => coerceEpoch(getMessageCreatedAt(b)) - coerceEpoch(getMessageCreatedAt(a)))[0];
}

function coerceEpoch(value: unknown) {
  if (typeof value === "number") return value > 10_000_000_000 ? value / 1000 : value;
  if (typeof value === "string") return Date.parse(value) / 1000 || 0;
  if (value instanceof Date) return value.getTime() / 1000;
  return 0;
}

function isSellerMessage(message: CrmMessage | DbMessage, selfInfo: SelfInfo | null) {
  if (isDbMessage(message)) return selfInfo?.aid !== undefined && message.sender === selfInfo.aid;
  return Boolean(selfInfo?.ali_id && message.sender_id === selfInfo.ali_id);
}

function isBuyerMessage(message: CrmMessage | DbMessage, selfInfo: SelfInfo | null) {
  if (isDbMessage(message)) return selfInfo?.aid === undefined || message.sender !== selfInfo.aid;
  return Boolean(message.sender_id && message.sender_id !== selfInfo?.ali_id);
}

function isUnreadBuyerMessage(message: CrmMessage | DbMessage, selfInfo: SelfInfo | null) {
  return isBuyerMessage(message, selfInfo) && (message.read === undefined || message.read === false);
}

function isSystemMessage(message: CrmMessage | DbMessage) {
  return isLegacyMessage(message) ? message.is_system : message.type === "system";
}

function isDbMessage(message: CrmMessage | DbMessage): message is DbMessage {
  return "external_mid" in message && typeof message.sid === "number" && typeof message.sender === "number";
}

function isLegacyMessage(message: CrmMessage | DbMessage): message is CrmMessage {
  return "mid" in message || "sender_id" in message;
}

function messageId(message: CrmMessage | DbMessage) {
  if (isDbMessage(message)) return message.external_mid;
  return message.external_mid ?? message.extrenal_mid ?? message.mid;
}

function getMessageCreatedAt(message: CrmMessage | DbMessage) {
  return isLegacyMessage(message) ? message.created_at : undefined;
}

function displayMessageContent(label: string | null | undefined, content: unknown, card?: BusinessCard) {
  if (label) return label;
  if (typeof content === "string") return content;
  if (content && typeof content === "object" && "label" in content && typeof content.label === "string") return content.label;
  if (content && typeof content === "object" && "text" in content && typeof content.text === "string") return content.text;
  if (content === null || content === undefined) return card ? "系统推荐卡片" : "";
  try {
    return JSON.stringify(content);
  } catch {
    return card ? "系统推荐卡片" : "";
  }
}

function contentCardId(content: unknown) {
  if (!content || typeof content !== "object" || !("card_id" in content)) return undefined;
  return typeof content.card_id === "string" ? content.card_id : undefined;
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

function inferStage(user: UserInfo | undefined, messages: Array<CrmMessage | DbMessage>): CustomerStage {
  if ((user?.valid_inquiry_count ?? 0) >= 5) return "negotiating";
  if ((user?.potential_score ?? 0) >= 80) return "interested";
  if (messages.some((message) => displayMessageContent(isLegacyMessage(message) ? message.content_label : undefined, message.content).includes("风险"))) return "risk";
  return "new";
}

function priorityFromScore(score: number): Conversation["priority"] {
  if (score >= 80) return "high";
  if (score >= 60) return "medium";
  return "low";
}

function buildConversationAnalysis(summary: Conversation, conversation: ConversationRecord, users: UserInfo[]): ConversationAnalysis {
  const contactId = isLegacyConversation(conversation) ? conversation.contact_ali_id : summary.customer.aliId ?? String(conversation.sid);
  const user = resolveUser(contactId, users);
  const score = user?.potential_score ?? 60;
  const nextActions = score >= 80 ? ["确认采购数量", "发送报价与认证资料", "约定样品寄送时间"] : ["补充客户关注资料", "确认需求场景"];
  return {
    intent: latestMessageText(conversation) || "客户需求沟通",
    stage: summary.customer.stage,
    score,
    risks: user?.blacklisted_count ? ["客户存在历史拉黑记录"] : ["需持续跟进响应时效"],
    nextActions,
    summary: `${summary.customer.name} 当前处于${stageLabel(summary.customer.stage)}阶段，建议优先处理最近消息。`,
    rawText: "Mock Agent 已完成客户阶段与意图分析。",
    jsonPayload: { intent: latestMessageText(conversation), stage: summary.customer.stage, confidence: score },
  };
}

function latestMessageText(conversation: ConversationRecord) {
  if (isLegacyConversation(conversation) && conversation.last_content_label) return conversation.last_content_label;
  if (isDbConversationRecord(conversation) && conversation.display_latest_content) return conversation.display_latest_content;
  const latest = latestMessage(conversation.messages);
  return latest ? displayMessageContent(isLegacyMessage(latest) ? latest.content_label : undefined, latest.content) : "暂无消息";
}

function isLegacyConversation(conversation: ConversationRecord): conversation is CrmConversation {
  return "contact_ali_id" in conversation;
}

function isDbConversationRecord(conversation: ConversationRecord): conversation is DbConversation {
  return "participants" in conversation && Array.isArray(conversation.participants);
}

function dateGroup(value: string) {
  const datePart = value.split(" ")[0];
  if (datePart === "2026-09-07") return "今天";
  if (datePart === "2026-09-06") return "昨天";
  return "更早";
}
