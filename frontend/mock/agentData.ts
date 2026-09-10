import { SYSTEM_AGENT_APIDS, agentPresetToConfig } from "@/domain/agent/agentModel";
import type { AgentConsoleState, AgentPreset, DocumentLlmConfig, LlmLevelConfig, SystemAgentDefinition } from "@/types/agent";

const systemAgentSources = [
  { apid: SYSTEM_AGENT_APIDS.translation, name: "翻译 Agent", level: 1, prompt: "将买家消息翻译成自然中文，保留贸易术语。" },
  { apid: SYSTEM_AGENT_APIDS.replySuggestion, name: "回复建议 Agent", level: 2, prompt: "根据会话上下文生成不超过三条可发送英文回复。" },
  { apid: SYSTEM_AGENT_APIDS.intentAnalysis, name: "客户意图分析 Agent", level: 3, prompt: "判断客户采购意图、关注点、风险和下一步行动。" },
  { apid: SYSTEM_AGENT_APIDS.stageAnalysis, name: "客户阶段分析 Agent", level: 3, prompt: "识别客户所处阶段并给出推进策略。" },
] as const;

const regularAgentSources = [
  {
    apid: "agent-quote",
    name: "报价跟进助手",
    description: "根据产品、MOQ 和客户历史生成报价跟进话术。",
    prompt: "你是报价跟进助手，需要用英文生成清晰、专业、可直接发送的回复。",
    level: 2,
    tools: ["crm_query", "quote_template"],
    updatedAt: "2026-08-11T09:25:00+08:00",
  },
  {
    apid: "agent-risk",
    name: "订单风险审阅",
    description: "审阅客户需求中的履约、价格、付款风险。",
    prompt: "识别潜在订单风险并给出卖家可执行建议。",
    level: 3,
    tools: ["crm_query", "order_summary", "logistics_calculator"],
    updatedAt: "2026-08-11T09:25:00+08:00",
  },
] as const;

const defaultUpdatedAt = "2026-09-09T00:00:00+08:00";

export const llmLevels: LlmLevelConfig[] = Array.from({ length: 5 }, (_, level) => ({
  level,
  baseUrl: "https://api.mock-llm.example/v1",
  apiKey: `sk-mock-level-${level}-placeholder`,
  modelName: level >= 3 ? "claude-sonnet-5" : "claude-haiku-4-5-20251001",
  systemPrompt: `Level ${level} agent prompt for Alibaba seller workflow.`,
  context: 12000 + level * 4000,
  contextLimitOutputText: "上下文超过限制",
  toolRoundLimitOutputText: "调用超过次数限制",
  maxToolRounds: 3 + level,
}));

const llmLevel = llmLevels[3];

export const documentLlmConfig: DocumentLlmConfig = {
  level: llmLevel.level,
  base_url: llmLevel.baseUrl,
  api_key: llmLevel.apiKey,
  model_name: llmLevel.modelName,
  system_prompt: "你是阿里国际站卖家助手，回答必须准确、礼貌、商业化，并保留客户上下文。",
  context: llmLevel.context,
  context_limit_output_text: llmLevel.contextLimitOutputText,
  tool_round_limit_output_text: llmLevel.toolRoundLimitOutputText,
  max_tool_rounds: llmLevel.maxToolRounds,
};

export const systemAgents: SystemAgentDefinition[] = systemAgentSources.map((agent) => ({
  display_name: agent.name,
  apid: agent.apid,
  description: agent.prompt,
}));

export const agentPresets: AgentPreset[] = [
  ...systemAgentSources.map((agent) => ({
    id: agent.apid,
    apid: agent.apid,
    name: agent.name,
    category: "system" as const,
    enabled: true,
    description: agent.prompt,
    prompt: agent.prompt,
    level: agent.level,
    intelevel: agent.level,
    tools: [],
    updated_at: defaultUpdatedAt,
  })),
  ...regularAgentSources.map((agent) => ({
    id: agent.apid,
    apid: agent.apid,
    name: agent.name,
    category: "regular" as const,
    enabled: true,
    description: agent.description,
    prompt: agent.prompt,
    level: agent.level,
    intelevel: agent.level,
    tools: [...agent.tools],
    updated_at: agent.updatedAt,
  })),
];

export const agentConsole: AgentConsoleState = {
  documentLlmConfig,
  llmLevels,
  llmConfig: {
    level: llmLevel.level,
    model: llmLevel.modelName,
    temperature: 0.4,
    maxTokens: 4096,
    systemPrompt: documentLlmConfig.system_prompt ?? "",
    baseUrl: documentLlmConfig.base_url,
    apiKey: documentLlmConfig.api_key,
    context: documentLlmConfig.context,
    contextLimitOutputText: documentLlmConfig.context_limit_output_text,
    toolRoundLimitOutputText: documentLlmConfig.tool_round_limit_output_text,
    maxToolRounds: documentLlmConfig.max_tool_rounds ?? null,
  },
  agents: agentPresets.map(agentPresetToConfig),
  agentPresets,
  systemAgents,
  history: [
    {
      id: "hist-001",
      title: "Nordic Home 彩盒报价",
      agentId: "agent-quote",
      createdAt: "2026-08-11T09:25:00+08:00",
      messages: [
        { id: "h1-m1", role: "user", content: "客户询问彩盒成本和交期，如何回复？", createdAt: "2026-08-11T09:23:00+08:00" },
      ],
    },
    {
      id: "hist-002",
      title: "GreenMart MOQ 跟进",
      agentId: "agent-quote",
      createdAt: "2026-09-08T14:36:00+08:00",
      messages: [
        { id: "h2-m1", role: "user", content: "客户认为 500 件的 MOQ 太高，请给一条兼顾利润和成交率的英文回复。", createdAt: "2026-09-08T14:36:00+08:00" },
        { id: "h2-m2", role: "assistant", content: "Thank you for your feedback. We can offer a trial order of 300 units at a slightly adjusted unit price, and apply the standard price once the order reaches 500 units.", createdAt: "2026-09-08T14:36:08+08:00" },
      ],
    },
    {
      id: "hist-003",
      title: "Ocean Retail 付款风险审阅",
      agentId: "agent-risk",
      createdAt: "2026-09-09T10:18:00+08:00",
      messages: [
        { id: "h3-m1", role: "user", content: "客户要求先发货、收货后 60 天付款，请评估风险并给出建议。", createdAt: "2026-09-09T10:18:00+08:00" },
        { id: "h3-m2", role: "assistant", content: "该账期会显著增加回款与拒付风险。建议先核验客户资信，并采用 30% 预付款、余款见提单副本支付；若必须提供账期，应配置出口信用保险和明确的授信额度。", createdAt: "2026-09-09T10:18:09+08:00" },
      ],
    },
  ],
};
