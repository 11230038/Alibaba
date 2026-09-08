import type { AgentConfig } from "@/types/agent";

export function agentCategoryLabel(category: AgentConfig["category"]) {
  return category === "system" ? "系统 Agent" : "普通 Agent";
}

export function enabledLabel(enabled: boolean) {
  return enabled ? "已启用" : "已停用";
}
