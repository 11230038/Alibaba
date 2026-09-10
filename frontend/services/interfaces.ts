import type { AgentConfig, AgentConsoleState, AgentPreset, AgentTestInput, AgentTestResult, AgentTestSession, DocumentLlmConfig, LlmConfig, SystemAgentDefinition } from "@/types/agent";
import type {
  AgentAnalysisResult,
  AssistantSuggestion,
  Conversation,
  ConversationAnalysis,
  ConversationDetail,
  CrmConversation,
  ExportConversationsInput,
  ExportConversationsResult,
  ReplySuggestionInput,
  ReplySuggestions,
  RequestTranslationsInput,
  RequestTranslationsResult,
  SendChatMessageInput,
  SendChatMessageResult,
  SendMessageInput,
  SendMessageResult,
  TranslateMessageInput,
  TranslateMessageResult,
  UserInfo,
} from "@/types/chat";
import type { HomeDashboard, SelfInfo } from "@/types/home";
import type { CreateTestTaskInput, KeyStatus, NetworkStatus, NodeTestResult, SystemStatusSnapshot, TaskItem, TaskSnapshot } from "@/types/status";

export interface OperationsBackend {
  getSelfInfo(): Promise<SelfInfo | null>;
  resetCache(): Promise<void>;
  getHomeDashboard(): Promise<HomeDashboard>;

  refreshChatData(wait?: boolean): Promise<{ ready: boolean; self_ali_id: string; reason: string }>;
  listCrmConversations(selfAliId: string): Promise<CrmConversation[]>;
  getUserInfo(identifier: string): Promise<UserInfo | null>;
  requestTranslations(input: RequestTranslationsInput): Promise<RequestTranslationsResult>;
  getTranslation(text: string): Promise<string | null>;
  sendChatMessage(input: SendChatMessageInput): Promise<SendChatMessageResult>;
  generateReplySuggestions(input: ReplySuggestionInput): Promise<ReplySuggestions>;
  analyzeConversationInput(input: { task: string; conversation: Array<[string, string, string]> }): Promise<AgentAnalysisResult>;

  listConversations(): Promise<Conversation[]>;
  getConversation(id: string): Promise<ConversationDetail>;
  translateMessage(input: TranslateMessageInput): Promise<TranslateMessageResult>;
  regenerateTranslation(input: TranslateMessageInput): Promise<TranslateMessageResult>;
  getAssistantSuggestions(conversationId: string): Promise<AssistantSuggestion[]>;
  analyzeConversation(conversationId: string): Promise<ConversationAnalysis>;
  sendMessage(input: SendMessageInput): Promise<SendMessageResult>;
  exportConversations(input: ExportConversationsInput): Promise<ExportConversationsResult>;

  checkUserStatus(): Promise<KeyStatus>;
  checkMitmProxy(): Promise<NetworkStatus>;
  checkMitmReceiver(): Promise<NetworkStatus>;
  runNodeTest(): Promise<NodeTestResult>;
  listTaskSnapshots(): Promise<TaskSnapshot[]>;
  getSystemStatus(): Promise<SystemStatusSnapshot>;
  refreshSystemStatus(): Promise<SystemStatusSnapshot>;
  createTestTask(input: CreateTestTaskInput): Promise<TaskItem>;
  deleteTask(id: string): Promise<void>;

  getAgentConsole(): Promise<AgentConsoleState>;
  saveLlmConfig(input: DocumentLlmConfig): Promise<DocumentLlmConfig>;
  saveAgentPreset(input: AgentPreset): Promise<AgentPreset>;
  deleteAgentPreset(id: string): Promise<boolean>;
  restoreSystemAgentDefault(apid: string): Promise<AgentPreset>;
  listSystemAgentDefinitions(): Promise<SystemAgentDefinition[]>;
  updateLlmConfig(input: LlmConfig): Promise<LlmConfig>;
  updateAgentConfig(input: AgentConfig): Promise<AgentConfig>;
  runAgentTest(input: AgentTestInput): Promise<AgentTestResult>;
  listAgentTestHistory(): Promise<AgentTestSession[]>;
  undoAgentTestSession(id: string): Promise<AgentTestSession>;
  regenerateAgentTestSessionReply(id: string): Promise<AgentTestSession>;
  deleteAgentTestSession(id: string): Promise<void>;
  branchAgentTestSession(id: string): Promise<AgentTestSession>;
}
