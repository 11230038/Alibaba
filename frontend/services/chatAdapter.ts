import type { BusinessCard } from "@/types/cards";
import type { TaskSnapshot } from "@/types/status";
import type { ConversationAnalysis, ConversationDetail, Conversation, ChatMessage, CustomerProfile, CustomerStage, MessageRole } from "@/types/chatCanonical";
import type { ConversationAggregateDto, ConversationAnalysisDto, ConversationMessageDto, CustomerViewDto } from "@/types/chatTransport";

interface ChatAdapterOptions {
  cards?: BusinessCard[];
}

export function adaptConversationSummary(aggregate: ConversationAggregateDto): Conversation {
  const customer = adaptCustomer(aggregate);
  return {
    id: String(aggregate.sid),
    customer,
    latestMessage: aggregate.latest?.content ?? "",
    updatedAt: formatAggregateTime(aggregate.latest?.updated_at ?? null),
    unreadCount: aggregate.unread_count ?? 0,
    status: aggregate.status ?? "following",
    priority: aggregate.priority ?? "medium",
  };
}

export function adaptConversationDetail(aggregate: ConversationAggregateDto | undefined, options: ChatAdapterOptions = {}): ConversationDetail {
  if (!aggregate) throw new Error("会话聚合数据为空");
  const summary = adaptConversationSummary(aggregate);
  const messages = (aggregate.messages ?? []).map((item) => adaptMessage(item, options.cards ?? []));
  return {
    ...summary,
    messages,
    analysis: adaptAnalysis(aggregate.analysis, summary),
  };
}

export function adaptSendMessageResult(input: {
  message: ConversationMessageDto;
  conversation: ConversationAggregateDto;
  execution: ConversationExecutionDto;
}, options: ChatAdapterOptions = {}) {
  const conversation = adaptConversationDetail(input.conversation, options);
  const message = adaptMessage(input.message, options.cards ?? []);
  return { message, conversation, execution: adaptExecution(input.execution) };
}

export interface ConversationExecutionDto {
  success: boolean;
  message: string;
  task_snapshot: ConversationExecutionTaskDto | null;
}

export interface ConversationExecutionTaskDto {
  task_id: string;
  description: string;
  status: "queued" | "running" | "succeeded" | "failed";
  message: string;
  result: unknown;
  created_at: number;
  started_at: number | null;
  completed_at: number | null;
}

function adaptCustomer(aggregate: ConversationAggregateDto): CustomerProfile {
  const view = aggregate.customer_view ?? deriveCustomerView(aggregate);
  return {
    id: view.id,
    aliId: view.ali_id ?? undefined,
    name: view.name,
    company: view.company,
    country: view.country,
    email: view.email,
    phone: view.phone,
    stage: view.stage,
    tags: view.tags,
    availability: view.availability,
    behavior: view.behavior,
  };
}

function deriveCustomerView(aggregate: ConversationAggregateDto): CustomerViewDto {
  const accounts = aggregate.accounts ?? [];
  const customers = aggregate.customers ?? [];
  const participantIds = new Set(aggregate.participants ?? []);
  const participantAccounts = accounts.filter((account) => participantIds.has(account.aid));
  const buyerAid = (aggregate.messages ?? []).find((item) => item.role === "buyer")?.message.sender;
  const account = participantAccounts.find((item) => item.aid === buyerAid)
    ?? participantAccounts[0]
    ?? accounts.find((item) => item.aid === buyerAid);
  const customer = account ? customers.find((item) => item.cid === account.cid) : undefined;
  const extra = customer?.extra ?? {};
  const accountExtra = account?.extra ?? {};
  return {
    id: String(customer?.cid ?? account?.cid ?? aggregate.sid),
    ali_id: account?.account ?? null,
    name: customer?.name ?? account?.nickname ?? account?.account ?? "未知客户",
    company: stringValue(extra.company) ?? "未知公司",
    country: customer?.region ?? "未知",
    email: stringValue(accountExtra.email) ?? "",
    phone: stringValue(accountExtra.phone) ?? "",
    stage: "new",
    tags: [],
    availability: "暂未确认",
    behavior: [],
  };
}

function adaptMessage(item: ConversationMessageDto, cards: BusinessCard[]): ChatMessage {
  const message = item.message;
  const cardId = contentCardId(message.content);
  const card = cardId ? cards.find((candidate) => candidate.id === cardId) : undefined;
  const role = messageRole(item.role, message.type, card);
  return {
    id: message.external_mid,
    role,
    content: displayContent(message.content, card),
    createdAt: formatAggregateTime(item.created_at),
    sid: message.sid,
    externalMid: message.external_mid,
    senderAid: message.sender,
    read: message.read,
    type: message.type,
    rawContent: message.content,
    card,
  };
}

function adaptAnalysis(input: ConversationAnalysisDto | undefined, summary: Conversation): ConversationAnalysis {
  if (!input) {
    return {
      intent: summary.latestMessage || "客户需求沟通",
      stage: summary.customer.stage,
      score: 0,
      risks: [],
      nextActions: [],
      summary: `${summary.customer.name} 当前处于${stageLabel(summary.customer.stage)}阶段。`,
    };
  }
  return {
    intent: input.intent,
    stage: input.stage,
    score: input.score,
    risks: input.risks,
    nextActions: input.next_actions,
    summary: input.summary,
    rawText: input.raw_text,
    jsonPayload: input.json_payload,
  };
}

function adaptExecution(input: ConversationExecutionDto): { success: boolean; message: string; task_snapshot: TaskSnapshot | null } {
  return {
    success: input.success,
    message: input.message,
    task_snapshot: input.task_snapshot ? {
      ...input.task_snapshot,
      status: input.task_snapshot.status === "queued" ? "pending" : input.task_snapshot.status,
      result: Array.isArray(input.task_snapshot.result) && input.task_snapshot.result.length === 2
        ? [Boolean(input.task_snapshot.result[0]), String(input.task_snapshot.result[1])]
        : null,
    } : null,
  };
}

function messageRole(role: ConversationMessageDto["role"], type: string, card?: BusinessCard): MessageRole {
  if (role) return role;
  if (card || type === "card") return "card";
  if (type === "system") return "system";
  return "buyer";
}

function contentCardId(content: unknown) {
  if (!content || typeof content !== "object" || !("card_id" in content)) return undefined;
  return typeof content.card_id === "string" ? content.card_id : undefined;
}

function displayContent(content: unknown, card?: BusinessCard) {
  if (typeof content === "string") return content;
  if (content && typeof content === "object") {
    if ("label" in content && typeof content.label === "string") return content.label;
    if ("text" in content && typeof content.text === "string") return content.text;
  }
  if (content === null || content === undefined) return card ? "系统推荐卡片" : "";
  try {
    return JSON.stringify(content);
  } catch {
    return card ? "系统推荐卡片" : "";
  }
}

function formatAggregateTime(value: string | number | null) {
  if (typeof value === "string") return value;
  if (typeof value === "number") {
    const timestamp = value > 10_000_000_000 ? value : value * 1000;
    return new Date(timestamp).toLocaleString("zh-CN", { hour12: false }).replaceAll("/", "-");
  }
  return "未知时间";
}

function stringValue(value: unknown) {
  return typeof value === "string" && value.trim() ? value : undefined;
}

function stageLabel(stage: CustomerStage) {
  return { new: "新线索", interested: "高意向", negotiating: "谈判中", risk: "风险客户", done: "已成交" }[stage];
}
