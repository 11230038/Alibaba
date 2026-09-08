import type { AgentConsoleState, AgentPreset, DocumentLlmConfig, SystemAgentDefinition } from "@/types/agent";

export const documentLlmConfig: DocumentLlmConfig = {
  base_url: "http://127.0.0.1:8787/mock-llm",
  api_key: "mock-api-key",
  model_name: "mock-local",
  system_prompt: "你是外贸运营助理，负责根据客户意图生成专业、礼貌、可执行的跟进建议。",
  context: 16000,
  max_tool_rounds: 4,
};

export const systemAgents: SystemAgentDefinition[] = [
  { display_name: "客户意图分析 Agent", apid: "customer-analysis", description: "分析客户消息、行为和交易阶段。" },
  { display_name: "智能回复 Agent", apid: "reply-suggestion", description: "根据上下文生成可直接发送的客户回复。" },
];

export const agentPresets: AgentPreset[] = [
  {
    id: "agent-analysis",
    name: "客户意图分析 Agent",
    category: "system",
    enabled: true,
    description: "分析客户消息、行为和交易阶段，生成下一步动作。",
    prompt: "基于会话上下文输出客户意图、阶段、证据、顾虑和下一步动作。",
    level: 3,
    tools: ["crm_lookup", "conversation_reader"],
    updated_at: "2026-09-07 09:40",
    apid: "customer-analysis",
  },
  {
    id: "agent-reply",
    name: "智能回复 Agent",
    category: "system",
    enabled: true,
    description: "根据上下文生成可直接发送的客户回复。",
    prompt: "生成最多 3 条中文说明和买家语言回复。",
    level: 3,
    tools: ["translation_cache", "card_lookup"],
    updated_at: "2026-09-07 09:38",
    apid: "reply-suggestion",
  },
  {
    id: "agent-card",
    name: "卡片推荐 Agent",
    category: "regular",
    enabled: true,
    description: "从业务卡片中匹配最适合当前会话的卡片。",
    prompt: "按客户意图和商品关键词推荐卡片。",
    level: 2,
    tools: ["card_lookup"],
    updated_at: "2026-09-06 17:10",
  },
  {
    id: "agent-quality",
    name: "回复质检 Agent",
    category: "regular",
    enabled: false,
    description: "发送前检查回复内容是否存在风险。",
    prompt: "检查回复中的承诺、价格、交期和敏感表达。",
    level: 2,
    tools: ["policy_check"],
    updated_at: "2026-09-05 15:22",
  },
];

export const agentConsole: AgentConsoleState = {
  documentLlmConfig,
  llmConfig: {
    model: documentLlmConfig.model_name,
    temperature: 0.4,
    maxTokens: 1600,
    systemPrompt: documentLlmConfig.system_prompt ?? "",
    baseUrl: documentLlmConfig.base_url,
    apiKey: documentLlmConfig.api_key,
    context: documentLlmConfig.context,
    maxToolRounds: documentLlmConfig.max_tool_rounds,
  },
  agents: agentPresets.map((preset) => ({
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
  agentPresets,
  systemAgents,
  history: [
    {
      id: "session-001",
      title: "太阳能灯样品报价测试",
      agentId: "agent-reply",
      createdAt: "2026-09-07 09:55",
      messages: [
        { id: "hist-001", role: "user", content: "客户询问 CE 证书和样品费用，帮我回复。", createdAt: "2026-09-07 09:55" },
        { id: "hist-002", role: "assistant", content: "建议先确认目标数量，并同步发送 CE 证书与样品费用明细。", createdAt: "2026-09-07 09:56" },
      ],
    },
  ],
};
