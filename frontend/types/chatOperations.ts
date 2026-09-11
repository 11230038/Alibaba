import type { AssistantSuggestion, ChatMessage, ConversationAnalysis, ConversationDetail } from "./chatCanonical";
import type { TaskSnapshot } from "@/types/status";

export interface SuggestionItem {
  zh: string;
  reply: string;
}

export interface ReplySuggestions {
  buyer_language: string;
  items: SuggestionItem[];
}

export interface TranslateMessageInput {
  conversationId: string;
  messageId: string;
  targetLanguage: "zh-CN" | "en-US";
}

export interface TranslateMessageResult {
  messageId: string;
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
  conversationId: string;
  content: string;
  action?: "test" | "send";
}

export interface MessageExecution {
  success: boolean;
  message: string;
  task_snapshot: TaskSnapshot | null;
}

export interface SendMessageResult {
  message: ChatMessage;
  conversation: ConversationDetail;
  execution: MessageExecution;
}

export interface ExportConversationsInput {
  conversationIds: string[];
}

export interface ExportConversationsResult {
  fileName: string;
  content: string;
  archiveName?: string;
}

export type ChatTuple = [string, string, string];

export interface ChatPromptContext {
  conversation: ChatTuple[];
}

export type ConversationAnalysisResult = ConversationAnalysis;

export type AssistantSuggestions = AssistantSuggestion[];
