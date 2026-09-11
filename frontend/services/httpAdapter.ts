import type { DbAgentPreset, DocumentLlmConfig } from "@/types/agent";
import type { ApiResponse } from "@/types/common";
import { adaptConversationDetail, adaptConversationSummary, adaptSendMessageResult } from "@/services/chatAdapter";
import type { ConversationAggregateDto, ConversationSendResultDto } from "@/types/chatTransport";
import type { OperationsBackend } from "./interfaces";

function isApiResponse<T>(value: unknown): value is ApiResponse<T> {
  return Boolean(value && typeof value === "object" && "code" in value && "msg" in value && "data" in value);
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    ...init,
  });

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status} ${response.statusText}`);
  }

  const text = await response.text();
  if (!text.trim()) return undefined as T;
  const payload = JSON.parse(text) as T | ApiResponse<T>;
  if (isApiResponse<T>(payload)) {
    if (payload.code !== 0) throw new Error(payload.msg);
    return payload.data;
  }
  return payload;
}

export const httpBackend: OperationsBackend = {
  getSelfInfo: () => request("/api/self-info"),
  resetCache: () => request("/api/cache/reset", { method: "POST" }),
  getHomeDashboard: () => request("/api/dashboard"),

  requestTranslations: (input) => request("/api/messages/translations", { method: "POST", body: JSON.stringify(input) }),
  getTranslation: (text) => request(`/api/messages/translations/${encodeURIComponent(text)}`),

  listConversations: async () => {
    const aggregates = await request<ConversationAggregateDto[]>("/api/conversations");
    return aggregates.map(adaptConversationSummary);
  },
  getConversation: async (id) => {
    const aggregate = await request<ConversationAggregateDto>(`/api/conversations/${encodeURIComponent(id)}`);
    return adaptConversationDetail(aggregate);
  },
  translateMessage: (input) => request("/api/messages/translate", { method: "POST", body: JSON.stringify(input) }),
  regenerateTranslation: (input) => request("/api/messages/retranslate", { method: "POST", body: JSON.stringify(input) }),
  getAssistantSuggestions: (conversationId) => request(`/api/conversations/${encodeURIComponent(conversationId)}/suggestions`),
  analyzeConversation: (conversationId) => request(`/api/conversations/${encodeURIComponent(conversationId)}/analysis`),
  sendMessage: async (input) => {
    const result = await request<ConversationSendResultDto>(`/api/conversations/${encodeURIComponent(input.conversationId)}/messages`, { method: "POST", body: JSON.stringify(input) });
    return adaptSendMessageResult(result);
  },
  exportConversations: (input) => request("/api/conversations/export", { method: "POST", body: JSON.stringify(input) }),

  checkUserStatus: () => request("/api/status/user"),
  checkMitmProxy: () => request("/api/status/mitm-proxy"),
  checkMitmReceiver: () => request("/api/status/mitm-receiver"),
  runNodeTest: () => request("/api/status/node-test", { method: "POST" }),
  listTaskSnapshots: () => request("/api/status/tasks"),
  getSystemStatus: () => request("/api/status"),
  refreshSystemStatus: () => request("/api/status/refresh", { method: "POST" }),
  createTestTask: (input) => request("/api/status/test-tasks", { method: "POST", body: JSON.stringify(input) }),
  deleteTask: (id) => request(`/api/status/tasks/${encodeURIComponent(id)}`, { method: "DELETE" }),

  getAgentConsole: () => request("/api/agent/console"),
  saveLlmConfig: (input: DocumentLlmConfig) => request("/api/agent/llm-config", { method: "PUT", body: JSON.stringify(input) }),
  saveAgentPreset: (input: DbAgentPreset) => request("/api/agent/presets", { method: "POST", body: JSON.stringify(input) }),
  deleteAgentPreset: (id) => request(`/api/agent/presets/${encodeURIComponent(id)}`, { method: "DELETE" }),
  restoreSystemAgentDefault: (apid) => request(`/api/agent/system/${encodeURIComponent(apid)}/restore`, { method: "POST" }),
  listSystemAgentDefinitions: () => request("/api/agent/system"),
  runAgentTest: (input) => request("/api/agent/test", { method: "POST", body: JSON.stringify(input) }),
  listAgentTestHistory: () => request("/api/agent/test-history"),
  undoAgentTestSession: (id) => request(`/api/agent/test-history/${encodeURIComponent(id)}/undo`, { method: "POST" }),
  regenerateAgentTestSessionReply: (id) => request(`/api/agent/test-history/${encodeURIComponent(id)}/regenerate`, { method: "POST" }),
  deleteAgentTestSession: (id) => request(`/api/agent/test-history/${encodeURIComponent(id)}`, { method: "DELETE" }),
  branchAgentTestSession: (id) => request(`/api/agent/test-history/${encodeURIComponent(id)}/branch`, { method: "POST" }),
};
