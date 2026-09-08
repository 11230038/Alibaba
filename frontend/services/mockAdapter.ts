import { agentConsole, agentPresets, documentLlmConfig, systemAgents } from "@/mock/agentData";
import { businessCards } from "@/mock/cardData";
import { crmConversations, replySuggestions, userInfos } from "@/mock/conversationData";
import { homeDashboard } from "@/mock/homeData";
import { mockSelfInfo } from "@/mock/selfData";
import { keyStatus, nodeResult, proxyStatus, receiverStatus, systemStatus, taskSnapshots } from "@/mock/statusData";
import { buildConversationExport, conversationToTuples, replySuggestionsToAssistantSuggestions, toConversationDetail, toConversationSummary } from "@/domain/chat/chatModel";
import { buildSystemStatusSnapshot, taskSnapshotToTaskItem } from "@/domain/status/statusModel";
import type { AgentConfig, AgentConsoleState, AgentPreset, AgentTestSession, DocumentLlmConfig, LlmConfig } from "@/types/agent";
import type { BusinessCard } from "@/types/cards";
import type { ConversationDetail, CrmConversation, CrmMessage, SendChatMessageInput, UserInfo } from "@/types/chat";
import type { HomeDashboard, SelfInfo } from "@/types/home";
import type { KeyStatus, NetworkStatus, NodeTestResult, SystemStatusSnapshot, TaskSnapshot } from "@/types/status";
import type { OperationsBackend } from "./interfaces";

const delay = <T,>(value: T, ms = 280) => new Promise<T>((resolve) => setTimeout(() => resolve(value), ms));

const initialState = {
  selfInfo: mockSelfInfo,
  users: userInfos,
  crmConversations,
  cards: businessCards,
  status: systemStatus,
  keyStatus,
  proxyStatus,
  receiverStatus,
  nodeResult,
  taskSnapshots,
  console: agentConsole,
  llmConfig: documentLlmConfig,
  agentPresets,
};

let selfInfoStore: SelfInfo | null = structuredClone(initialState.selfInfo);
let userStore: UserInfo[] = structuredClone(initialState.users);
let crmConversationStore: CrmConversation[] = structuredClone(initialState.crmConversations);
let businessCardStore: BusinessCard[] = structuredClone(initialState.cards);
let statusStore: SystemStatusSnapshot = structuredClone(initialState.status);
const keyStatusStore: KeyStatus = structuredClone(initialState.keyStatus);
let proxyStatusStore: NetworkStatus = structuredClone(initialState.proxyStatus);
let receiverStatusStore: NetworkStatus = structuredClone(initialState.receiverStatus);
const nodeResultStore: NodeTestResult = structuredClone(initialState.nodeResult);
let taskSnapshotStore: TaskSnapshot[] = structuredClone(initialState.taskSnapshots);
let consoleStore: AgentConsoleState = structuredClone(initialState.console);
let documentLlmConfigStore: DocumentLlmConfig = structuredClone(initialState.llmConfig);
let agentPresetStore: AgentPreset[] = structuredClone(initialState.agentPresets);
const translationStore = new Map<string, string>();

export const mockBackend: OperationsBackend = {
  getSelfInfo: () => delay(structuredClone(selfInfoStore)),

  resetCache: async () => {
    selfInfoStore = structuredClone(initialState.selfInfo);
    userStore = structuredClone(initialState.users);
    crmConversationStore = structuredClone(initialState.crmConversations);
    businessCardStore = structuredClone(initialState.cards);
    taskSnapshotStore = structuredClone(initialState.taskSnapshots);
    statusStore = buildStatusSnapshot();
    translationStore.clear();
    return delay(undefined);
  },

  getHomeDashboard: () => delay(buildHomeDashboard()),

  refreshChatData: (wait = false) => delay({ ready: Boolean(selfInfoStore), self_ali_id: selfInfoStore?.ali_id ?? "", reason: selfInfoStore ? "ready" : "self_info_missing" }, wait ? 520 : 180),

  listCrmConversations: (selfAliId) => delay(selfAliId ? structuredClone(crmConversationStore) : []),

  getUserInfo: (identifier) => delay(structuredClone(resolveUser(identifier) ?? null)),

  requestTranslations: async ({ texts, force = false }) => {
    const targets = texts.map((text) => text.trim()).filter(Boolean);
    let savedCount = 0;

    for (const text of targets) {
      if (force || !translationStore.has(text)) {
        translationStore.set(text, mockTranslate(text));
        savedCount += 1;
      }
    }

    return delay({ saved_count: savedCount, translated_text: targets[0] ? translationStore.get(targets[0]) ?? null : null, cached: Boolean(targets[0] && savedCount === 0) });
  },

  getTranslation: (text) => delay(translationStore.get(text) ?? null),

  sendChatMessage: async (input) => delay(executeSendChatMessage(input), 420),


  generateReplySuggestions: () => delay(structuredClone(replySuggestions)),

  analyzeConversationInput: async ({ task, conversation }) =>
    delay({
      raw_text: `Mock Agent 已执行：${task}`,
      json_payload: {
        intent: conversation.at(-1)?.[2] ?? "客户需求沟通",
        stage: "interested",
        confidence: 0.86,
        evidence: conversation.slice(-2).map((item) => item[2]),
        concerns: ["价格", "交期"],
        next_actions: ["确认数量", "发送资料"],
      },
    }),

  listConversations: () => delay(crmConversationStore.map((conversation) => toConversationSummary(conversation, userStore, selfInfoStore))),

  getConversation: async (id) => delay(buildConversationDetail(id)),

  translateMessage: async ({ conversationId, messageId, targetLanguage }) => {
    const detail = buildConversationDetail(conversationId);
    const message = detail.messages.find((item) => item.id === messageId);
    const translatedContent = targetLanguage === "zh-CN" ? mockTranslate(message?.content ?? "") : `Mock translation: ${message?.content ?? ""}`;
    if (message?.content) translationStore.set(message.content, translatedContent);
    return delay({ messageId, translatedContent });
  },

  regenerateTranslation: async ({ conversationId, messageId, targetLanguage }) => {
    const detail = buildConversationDetail(conversationId);
    const message = detail.messages.find((item) => item.id === messageId);
    const translatedContent = targetLanguage === "zh-CN" ? `重新翻译：${mockTranslate(message?.content ?? "")}` : `Regenerated mock translation: ${message?.content ?? ""}`;
    if (message?.content) translationStore.set(message.content, translatedContent);
    return delay({ messageId, translatedContent });
  },

  getAssistantSuggestions: async (conversationId) => {
    const detail = buildConversationDetail(conversationId);
    const suggestions = await mockBackend.generateReplySuggestions({ conversation: conversationToTuples(detail), selfInfo: selfInfoStore });
    return delay(replySuggestionsToAssistantSuggestions(suggestions));
  },

  analyzeConversation: async (conversationId) => {
    const detail = buildConversationDetail(conversationId);
    const result = await mockBackend.analyzeConversationInput({ task: "客户阶段与意图分析", conversation: conversationToTuples(detail) });
    return delay({ ...detail.analysis, rawText: result.raw_text, jsonPayload: result.json_payload });
  },

  sendMessage: async ({ conversationId, content, action = "send", contact, login_id }) => {
    const detail = buildConversationDetail(conversationId);
    const execution = executeSendChatMessage({
      conversationId,
      contact: contact ?? detail.customer.aliId ?? conversationId,
      login_id: login_id ?? "",
      text: content,
      action,
    });
    const conversation = buildConversationDetail(conversationId);
    const message = conversation.messages.at(-1) ?? { id: `msg-${Date.now()}`, role: "seller" as const, content, createdAt: nowText() };
    return delay({ message, conversation, execution });
  },

  exportConversations: async ({ conversationIds }) => {
    const selected = conversationIds.map((id) => buildConversationDetail(id));
    return delay(buildConversationExport(selected));
  },

  checkUserStatus: () => delay(structuredClone(keyStatusStore)),

  checkMitmProxy: () => delay(structuredClone(proxyStatusStore)),

  checkMitmReceiver: () => delay(structuredClone(receiverStatusStore)),

  runNodeTest: () => delay(structuredClone(nodeResultStore), 360),

  listTaskSnapshots: () => delay(structuredClone(taskSnapshotStore)),

  getSystemStatus: () => delay(structuredClone(statusStore)),

  refreshSystemStatus: async () => {
    proxyStatusStore = { ...proxyStatusStore, latency_ms: Math.max(48, (proxyStatusStore.latency_ms ?? 180) - 12) };
    receiverStatusStore = { ...receiverStatusStore, latency_ms: Math.max(48, (receiverStatusStore.latency_ms ?? 90) + 7) };
    statusStore = buildStatusSnapshot();
    return delay(structuredClone(statusStore), 420);
  },

  createTestTask: async ({ type, owner }) => {
    const timestamp = Math.floor(Date.now() / 1000);
    const snapshot: TaskSnapshot = {
      task_id: `task-${Date.now()}`,
      description: type,
      status: "pending",
      message: `由 ${owner} 创建的前端 mock 任务`,
      result: null,
      created_at: timestamp,
      started_at: null,
      completed_at: null,
    };
    taskSnapshotStore = [snapshot, ...taskSnapshotStore];
    statusStore = buildStatusSnapshot();
    return delay(taskSnapshotToTaskItem(snapshot));
  },

  getAgentConsole: () => delay(structuredClone(consoleStore)),

  saveLlmConfig: async (input) => {
    documentLlmConfigStore = input;
    consoleStore = { ...consoleStore, documentLlmConfig: input, llmConfig: documentToUiLlmConfig(input, consoleStore.llmConfig) };
    return delay(input);
  },

  saveAgentPreset: async (input) => {
    agentPresetStore = agentPresetStore.some((preset) => preset.id === input.id) ? agentPresetStore.map((preset) => (preset.id === input.id ? input : preset)) : [input, ...agentPresetStore];
    syncConsoleAgents();
    return delay(input);
  },

  deleteAgentPreset: async (id) => {
    const exists = agentPresetStore.some((preset) => preset.id === id);
    agentPresetStore = agentPresetStore.filter((preset) => preset.id !== id || preset.category === "system");
    syncConsoleAgents();
    return delay(exists);
  },

  restoreSystemAgentDefault: async (apid) => {
    const source = initialState.agentPresets.find((preset) => preset.apid === apid) ?? initialState.agentPresets[0];
    agentPresetStore = agentPresetStore.map((preset) => (preset.apid === apid ? structuredClone(source) : preset));
    syncConsoleAgents();
    return delay(structuredClone(source));
  },

  listSystemAgentDefinitions: () => delay(structuredClone(systemAgents)),

  updateLlmConfig: async (input: LlmConfig) => {
    consoleStore = { ...consoleStore, llmConfig: input };
    documentLlmConfigStore = uiToDocumentLlmConfig(input, documentLlmConfigStore);
    consoleStore.documentLlmConfig = documentLlmConfigStore;
    return delay(input);
  },

  updateAgentConfig: async (input: AgentConfig) => {
    consoleStore = {
      ...consoleStore,
      agents: consoleStore.agents.map((agent) => (agent.id === input.id ? input : agent)),
    };
    agentPresetStore = agentPresetStore.map((preset) => (preset.id === input.id ? { ...preset, enabled: input.enabled, description: input.description, updated_at: input.updatedAt } : preset));
    consoleStore.agentPresets = agentPresetStore;
    return delay(input);
  },

  runAgentTest: async ({ agentId, content }) => {
    const agent = consoleStore.agents.find((item) => item.id === agentId) ?? consoleStore.agents[0];
    const now = nowText();
    const session: AgentTestSession = {
      id: `session-${Date.now()}`,
      title: `${agent.name} 测试`,
      agentId,
      createdAt: now,
      messages: [
        { id: `user-${Date.now()}`, role: "user", content, createdAt: now },
        {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          content: `模拟回复：${agent.name} 已根据接口文档约定返回处理建议。`,
          createdAt: now,
        },
      ],
    };
    consoleStore = { ...consoleStore, history: [session, ...consoleStore.history] };
    return delay({ session, reply: session.messages[1] }, 520);
  },

  listAgentTestHistory: () => delay(structuredClone(consoleStore.history)),

  deleteAgentTestSession: async (id) => {
    consoleStore = { ...consoleStore, history: consoleStore.history.filter((session) => session.id !== id) };
    return delay(undefined);
  },

  branchAgentTestSession: async (id) => {
    const source = consoleStore.history.find((session) => session.id === id) ?? consoleStore.history[0];
    const branch = { ...structuredClone(source), id: `session-${Date.now()}`, title: `${source.title} - 分支`, createdAt: nowText() };
    consoleStore = { ...consoleStore, history: [branch, ...consoleStore.history] };
    return delay(branch);
  },
};

function buildHomeDashboard(): HomeDashboard {
  const summaries = crmConversationStore.map((conversation) => toConversationSummary(conversation, userStore, selfInfoStore));
  return {
    ...structuredClone(homeDashboard),
    info: structuredClone(selfInfoStore),
    metrics: homeDashboard.metrics.map((metric) => {
      if (metric.key === "conversations") return { ...metric, value: crmConversationStore.length };
      if (metric.key === "unread") return { ...metric, value: summaries.reduce((total, item) => total + item.unreadCount, 0) };
      if (metric.key === "cards") return { ...metric, value: businessCardStore.length };
      return metric;
    }),
    customerSummaries: summaries.slice(0, 3).map((conversation) => ({
      key: conversation.id,
      name: conversation.customer.name,
      stage: conversation.customer.tags[0] ?? "新线索",
      nextAction: conversation.latestMessage,
      priority: conversation.priority,
    })),
    tasks: taskSnapshotStore.map(taskSnapshotToTaskItem),
  };
}

function buildConversationDetail(id: string): ConversationDetail {
  const conversation = crmConversationStore.find((item) => item.contact_ali_id === id) ?? crmConversationStore[0];
  return toConversationDetail(conversation, userStore, selfInfoStore, businessCardStore);
}

function executeSendChatMessage(input: SendChatMessageInput) {
  const timestamp = Math.floor(Date.now() / 1000);
  const task: TaskSnapshot = {
    task_id: `task-${Date.now()}`,
    description: input.action === "send" ? "发送聊天消息" : "输入聊天草稿",
    status: "succeeded",
    message: input.action === "send" ? "消息已发送（Mock）" : "消息已输入但未发送（Mock）",
    result: [true, input.action === "send" ? "发送完成" : "输入完成"],
    created_at: timestamp,
    started_at: timestamp,
    completed_at: timestamp + 1,
  };
  taskSnapshotStore = [task, ...taskSnapshotStore];

  if (input.action === "send") {
    const index = crmConversationStore.findIndex((item) => item.contact_ali_id === input.contact || item.contact_ali_id === input.conversationId);
    const target = crmConversationStore[index] ?? crmConversationStore[0];
    const message: CrmMessage = {
      table_name: "message_mock",
      cid: target.contact_ali_id,
      mid: `msg-${Date.now()}`,
      sender_id: selfInfoStore?.ali_id ?? null,
      created_at: nowText(),
      user_content_type: 1,
      content_label: input.text,
      content: input.text,
      is_system: false,
      is_auto_reply: false,
    };
    const next = { ...target, messages: [...target.messages, message], last_created_at: message.created_at, last_content_label: input.text };
    crmConversationStore[index >= 0 ? index : 0] = next;
  }

  statusStore = buildStatusSnapshot();
  return { success: true, message: task.message, task_snapshot: task };
}

function resolveUser(identifier: string) {
  return userStore.find((user) => [user.ali_id, user.login_id, user.encrypt_account_id, user.ali_member_id].includes(identifier));
}

function buildStatusSnapshot() {
  return buildSystemStatusSnapshot({
    userStatus: keyStatusStore,
    proxyStatus: proxyStatusStore,
    receiverStatus: receiverStatusStore,
    nodeResult: nodeResultStore,
    taskSnapshots: taskSnapshotStore,
    updatedAt: nowText(),
  });
}

function syncConsoleAgents() {
  consoleStore = {
    ...consoleStore,
    agents: agentPresetStore.map((preset) => ({
      id: preset.id,
      name: preset.name,
      category: preset.category,
      enabled: preset.enabled,
      capabilities: preset.tools ?? [],
      description: preset.description,
      updatedAt: preset.updated_at,
      prompt: preset.prompt,
      level: preset.level,
      apid: preset.apid,
    })),
    agentPresets: agentPresetStore,
  };
}

function uiToDocumentLlmConfig(input: LlmConfig, current: DocumentLlmConfig): DocumentLlmConfig {
  return {
    base_url: input.baseUrl ?? current.base_url,
    api_key: input.apiKey ?? current.api_key,
    model_name: input.model,
    system_prompt: input.systemPrompt,
    context: input.context ?? current.context,
    max_tool_rounds: input.maxToolRounds ?? current.max_tool_rounds,
  };
}

function documentToUiLlmConfig(input: DocumentLlmConfig, current: LlmConfig): LlmConfig {
  return {
    ...current,
    model: input.model_name,
    systemPrompt: input.system_prompt ?? current.systemPrompt,
    baseUrl: input.base_url,
    apiKey: input.api_key,
    context: input.context,
    maxToolRounds: input.max_tool_rounds,
  };
}

function mockTranslate(text: string) {
  if (!text) return "";
  return `这是 mock 译文：${text}`;
}

function nowText() {
  return new Date().toLocaleString("zh-CN", { hour12: false }).replaceAll("/", "-");
}
