import type { ID } from "@/types/common";
import type { BusinessCard } from "@/types/cards";
import type { SelfInfo } from "@/types/home";
import type { TaskSnapshot } from "@/types/status";

export type ConversationStatus = "unread" | "following" | "waiting" | "closed";
export type CustomerStage = "new" | "interested" | "negotiating" | "risk" | "done";
export type MessageRole = "buyer" | "seller" | "system" | "card";

export interface UserInfo {
  ali_id: string;
  ali_member_id: string;
  login_id: string;
  encrypt_account_id: string;
  first_name: string;
  last_name: string;
  country_code: string;
  company_name: string;
  register_date: number;
  email: string;
  mobile_number: string;
  phone_number: string;
  product_view_count: number;
  valid_inquiry_count: number;
  replied_inquiry_count: number;
  valid_rfq_count: number;
  login_days: number;
  spam_inquiry_count: number;
  blacklisted_count: number;
  high_quality_level_tag: string;
  growth_level: string;
  preferred_industries: string[];
  available: boolean;
  joining_years: number;
  potential_score: number;
  recent_contact: boolean;
  email_validated: boolean;
}

export interface DbSessionMeta {
  sid: number;
  name: string | null;
  participants: number[];
}

export interface DbMessage {
  external_mid: string;
  sid: number;
  sender: number;
  read: boolean | null;
  content: unknown;
  type: string;
}

export interface CrmMessage {
  table_name: string;
  cid: string;
  mid: string;
  sender_id: string | null;
  created_at: unknown;
  user_content_type: number | null;
  content_label: string | null;
  content: unknown;
  is_system: boolean;
  is_auto_reply: boolean;
  card_id?: string;
  external_mid?: string;
  extrenal_mid?: string;
  sid?: number;
  sender?: number;
  read?: boolean | null;
  type?: string;
}

export interface CrmConversation {
  contact_ali_id: string;
  messages: CrmMessage[];
  last_created_at: unknown;
  last_content_label: string | null;
  sid?: number;
  name?: string | null;
  participants?: number[];
}

export interface DbConversation extends DbSessionMeta {
  messages: DbMessage[];
}

export type ConversationRecord = CrmConversation | DbConversation;

export interface ChatSyncState {
  ready: boolean;
  self_ali_id: string;
  reason: string;
}

export interface ConversationGroup {
  label: string;
  conversations: CrmConversation[];
  expanded: boolean;
}

export interface SuggestionItem {
  zh: string;
  reply: string;
}

export interface ReplySuggestions {
  buyer_language: string;
  items: SuggestionItem[];
}

export interface AgentAnalysisResult {
  raw_text: string;
  json_payload: Record<string, unknown> | null;
}

export interface CustomerProfile {
  id: ID;
  aliId?: string;
  name: string;
  company: string;
  country: string;
  email: string;
  phone: string;
  stage: CustomerStage;
  tags: string[];
  availability: string;
  behavior: string[];
}

export interface ChatMessage {
  id: ID;
  role: MessageRole;
  content: string;
  createdAt: string;
  sid?: number;
  externalMid?: string;
  senderAid?: number;
  read?: boolean | null;
  type?: string;
  rawContent?: unknown;
  translatedContent?: string;
  card?: BusinessCard;
}

export interface Conversation {
  id: ID;
  customer: CustomerProfile;
  latestMessage: string;
  updatedAt: string;
  unreadCount: number;
  status: ConversationStatus;
  priority: "high" | "medium" | "low";
}

export interface ConversationAnalysis {
  intent: string;
  stage: CustomerStage;
  score: number;
  risks: string[];
  nextActions: string[];
  summary: string;
  rawText?: string;
  jsonPayload?: Record<string, unknown> | null;
}

export interface ConversationDetail extends Conversation {
  messages: ChatMessage[];
  analysis: ConversationAnalysis;
  source?: ConversationRecord;
}

export interface AssistantSuggestion {
  id: ID;
  title: string;
  content: string;
  tone: "formal" | "friendly" | "urgent";
  zh?: string;
}

export interface TranslateMessageInput {
  conversationId: ID;
  messageId: ID;
  targetLanguage: "zh-CN" | "en-US";
}

export interface TranslateMessageResult {
  messageId: ID;
  translatedContent: string;
}

export interface RequestTranslationsInput {
  texts: string[];
  force?: boolean;
}

export interface RequestTranslationsResult {
  saved_count: number;
  translated_text: string | null;
  cached: boolean;
}

export interface SendMessageInput {
  conversationId: ID;
  content: string;
  contact?: string;
  login_id?: string;
  action?: "test" | "send";
}

export interface SendChatMessageInput {
  contact: string;
  login_id: string;
  text: string;
  action: "test" | "send";
  conversationId?: ID;
}

export interface SendChatMessageResult {
  success: boolean;
  message: string;
  task_snapshot: TaskSnapshot | null;
}

export interface SendMessageResult {
  message: ChatMessage;
  conversation: ConversationDetail;
  execution: SendChatMessageResult;
}

export interface ExportConversationsInput {
  conversationIds: ID[];
}

export interface ExportConversationsResult {
  fileName: string;
  content: string;
  archiveName?: string;
}

export interface ReplySuggestionInput {
  conversation: Array<[string, string, string]>;
  selfInfo?: SelfInfo | null;
}

export interface ConversationAnalysisInput extends ReplySuggestionInput {
  task: string;
}
