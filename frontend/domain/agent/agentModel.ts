import type { AgentConfig, AgentPreset, AgentTestMessage, AgentTestSession, DbAgentPreset, DocumentLlmConfig, LlmConfig, LlmLevelConfig } from "@/types/agent";

export type AgentTestTurn = {
  user: AgentTestMessage;
  assistant: AgentTestMessage;
  startIndex: number;
  endIndex: number;
};

export const SYSTEM_AGENT_APIDS = {
  translation: "agent-1bad27aabaac439da678f31d53855b5d",
  replySuggestion: "agent-5a43bda9e1304108a1a78a3575a44e27",
  stageAnalysis: "agent-f6fb1e0ddff44d27bb3e19e243a70584",
  intentAnalysis: "agent-c9b80fdfad234392b55d84de93a186ae",
} as const;

const TOOL_LABELS: Record<string, string> = {
  crm_query: "CRM 查询",
  quote_template: "报价模板",
  order_summary: "订单摘要",
  logistics_calculator: "物流计算",
};

const TOOL_NAMES = Object.fromEntries(Object.entries(TOOL_LABELS).map(([name, label]) => [label, name]));

export function getLatestAgentTestTurn(session: AgentTestSession): AgentTestTurn | null {
  const endIndex = session.messages.length - 1;
  const assistant = session.messages[endIndex];
  const user = session.messages[endIndex - 1];
  if (!assistant || !user || user.role !== "user" || assistant.role !== "assistant") return null;
  return { user, assistant, startIndex: endIndex - 1, endIndex };
}

export function canUndoAgentTestTurn(session: AgentTestSession) {
  return getLatestAgentTestTurn(session) !== null;
}

export function canRegenerateAgentTestReply(session: AgentTestSession) {
  return getLatestAgentTestTurn(session) !== null;
}

export function removeLatestAgentTestTurn(session: AgentTestSession) {
  const turn = getLatestAgentTestTurn(session);
  if (!turn) return null;
  return { ...session, messages: session.messages.slice(0, turn.startIndex) };
}

export function replaceLatestAgentTestReply(session: AgentTestSession, reply: AgentTestMessage) {
  const turn = getLatestAgentTestTurn(session);
  if (!turn) return null;
  return { ...session, messages: session.messages.map((message, index) => index === turn.endIndex ? reply : message) };
}

export function agentCategoryLabel(category: AgentConfig["category"]) {
  return category === "system" ? "系统 Agent" : "普通 Agent";
}

export function filterAgentsByCategory(agents: AgentConfig[], category: AgentConfig["category"]) {
  return agents.filter((agent) => agent.category === category);
}

export function filterAgentTestSessionsByCategory(sessions: AgentTestSession[], agents: AgentConfig[], category: AgentConfig["category"]) {
  const agentIds = new Set(filterAgentsByCategory(agents, category).map((agent) => agent.id));
  return sessions.filter((session) => agentIds.has(session.agentId));
}

export function enabledLabel(enabled: boolean) {
  return enabled ? "已启用" : "已停用";
}

export function formatAgentSessionDate(createdAt: string) {
  return createdAt.slice(5, 16).replace("T", " ");
}

export function isAgentLevel(value: number) {
  return Number.isInteger(value) && value >= 0 && value <= 4;
}

export function normalizeAgentLevel(value: number) {
  if (!isAgentLevel(value)) throw new Error("Agent 等级必须是 0 到 4 的整数");
  return value;
}

export function agentToolToDisplayLabel(tool: string) {
  return TOOL_LABELS[tool] ?? tool;
}

export function agentToolToRegisteredName(tool: string) {
  return TOOL_NAMES[tool] ?? tool;
}

export function normalizeAgentTools(tools: string[] = []) {
  return tools.map((tool) => agentToolToRegisteredName(tool.trim())).filter(Boolean);
}

export function displayAgentTools(tools: string[] = []) {
  return tools.map(agentToolToDisplayLabel);
}

export function agentPresetApid(preset: Pick<AgentPreset, "id" | "apid">) {
  return preset.apid ?? String(preset.id);
}

export function agentPresetLevel(preset: Pick<AgentPreset, "level" | "intelevel">) {
  return normalizeAgentLevel(preset.intelevel ?? preset.level);
}

export function agentPresetToDbPreset(preset: AgentPreset): DbAgentPreset {
  return {
    apid: agentPresetApid(preset),
    name: preset.name,
    description: preset.description,
    prompt: preset.prompt,
    intelevel: agentPresetLevel(preset),
    tools: normalizeAgentTools(preset.tools),
  };
}

export function dbPresetToAgentPreset(input: DbAgentPreset, current?: AgentPreset, updatedAt = current?.updated_at ?? ""): AgentPreset {
  return {
    id: input.apid,
    apid: input.apid,
    name: input.name,
    category: current?.category ?? (isSystemAgentApid(input.apid) ? "system" : "regular"),
    enabled: current?.enabled ?? true,
    description: input.description,
    prompt: input.prompt,
    level: normalizeAgentLevel(input.intelevel),
    intelevel: normalizeAgentLevel(input.intelevel),
    tools: normalizeAgentTools(input.tools),
    updated_at: updatedAt,
  };
}

export function agentPresetToConfig(preset: AgentPreset): AgentConfig {
  const apid = agentPresetApid(preset);
  return {
    id: apid,
    name: preset.name,
    category: preset.category,
    enabled: preset.enabled,
    capabilities: displayAgentTools(normalizeAgentTools(preset.tools)),
    description: preset.description,
    updatedAt: preset.updated_at,
    prompt: preset.prompt,
    level: agentPresetLevel(preset),
    apid,
  };
}

export function isSystemAgentApid(apid: string) {
  return Object.values(SYSTEM_AGENT_APIDS).includes(apid as (typeof SYSTEM_AGENT_APIDS)[keyof typeof SYSTEM_AGENT_APIDS]);
}

export function agentConfigToPreset(agent: AgentConfig, values: { name: string; description?: string; prompt: string; level: number; capabilities?: string[] }, updatedAt: string): AgentPreset {
  const apid = agent.apid ?? agent.id;
  return {
    id: apid,
    apid,
    name: values.name.trim(),
    category: agent.category,
    enabled: agent.enabled,
    description: (values.description ?? "").trim(),
    prompt: values.prompt.trim(),
    level: normalizeAgentLevel(values.level),
    intelevel: normalizeAgentLevel(values.level),
    tools: normalizeAgentTools(values.capabilities),
    updated_at: updatedAt,
  };
}

export function createRegularAgentPreset(values: { name: string; description?: string; prompt: string; level: number; capabilities?: string[] }, updatedAt: string, apid = `agent-${Date.now()}`): AgentPreset {
  return {
    id: apid,
    apid,
    name: values.name.trim(),
    category: "regular",
    enabled: true,
    description: (values.description ?? "").trim(),
    prompt: values.prompt.trim(),
    level: normalizeAgentLevel(values.level),
    intelevel: normalizeAgentLevel(values.level),
    tools: normalizeAgentTools(values.capabilities),
    updated_at: updatedAt,
  };
}

export function isValidToolRoundLimit(value: number | null | undefined) {
  return value === null || value === undefined || (Number.isInteger(value) && value > 0);
}

export function normalizeToolRoundLimit(value: number | null | undefined) {
  if (!isValidToolRoundLimit(value)) throw new Error("最大工具轮数必须为空或正整数");
  return value ?? null;
}

export function documentToLlmLevelConfig(input: DocumentLlmConfig): LlmLevelConfig {
  return {
    level: normalizeAgentLevel(input.level),
    baseUrl: input.base_url,
    apiKey: input.api_key,
    modelName: input.model_name,
    systemPrompt: input.system_prompt,
    context: input.context,
    maxToolRounds: normalizeToolRoundLimit(input.max_tool_rounds),
  };
}

export function llmLevelToDocumentConfig(config: LlmLevelConfig): DocumentLlmConfig {
  return {
    level: normalizeAgentLevel(config.level),
    base_url: config.baseUrl,
    api_key: config.apiKey,
    model_name: config.modelName,
    system_prompt: config.systemPrompt,
    context: config.context,
    max_tool_rounds: normalizeToolRoundLimit(config.maxToolRounds),
  };
}

export function documentToUiLlmConfig(input: DocumentLlmConfig, current: LlmConfig): LlmConfig {
  return {
    ...current,
    level: input.level,
    model: input.model_name,
    systemPrompt: input.system_prompt,
    baseUrl: input.base_url,
    apiKey: input.api_key,
    context: input.context,
    maxToolRounds: normalizeToolRoundLimit(input.max_tool_rounds),
  };
}
