import type { AgentConfig, AgentTestSession } from "@/types/agent";

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
