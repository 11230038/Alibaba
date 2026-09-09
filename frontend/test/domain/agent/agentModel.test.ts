import { describe, expect, it } from "vitest";
import { agentCategoryLabel, filterAgentTestSessionsByCategory, filterAgentsByCategory } from "@/domain/agent/agentModel";
import type { AgentConfig, AgentTestSession } from "@/types/agent";

const agents: AgentConfig[] = [
  { id: "regular-1", name: "普通 Agent 1", category: "regular", enabled: true, capabilities: [], description: "", updatedAt: "" },
  { id: "system-1", name: "系统 Agent 1", category: "system", enabled: true, capabilities: [], description: "", updatedAt: "" },
  { id: "regular-2", name: "普通 Agent 2", category: "regular", enabled: false, capabilities: [], description: "", updatedAt: "" },
];

const sessions: AgentTestSession[] = [
  { id: "session-system", title: "系统测试", agentId: "system-1", createdAt: "", messages: [] },
  { id: "session-regular", title: "普通测试", agentId: "regular-1", createdAt: "", messages: [] },
];

describe("agent model", () => {
  it("returns category labels", () => {
    expect(agentCategoryLabel("system")).toBe("系统 Agent");
    expect(agentCategoryLabel("regular")).toBe("普通 Agent");
  });

  it("filters agents by category while preserving order", () => {
    expect(filterAgentsByCategory(agents, "system").map((agent) => agent.id)).toEqual(["system-1"]);
    expect(filterAgentsByCategory(agents, "regular").map((agent) => agent.id)).toEqual(["regular-1", "regular-2"]);
  });

  it("filters test sessions by the agents in a category", () => {
    expect(filterAgentTestSessionsByCategory(sessions, agents, "system").map((session) => session.id)).toEqual(["session-system"]);
    expect(filterAgentTestSessionsByCategory(sessions, agents, "regular").map((session) => session.id)).toEqual(["session-regular"]);
    expect(filterAgentTestSessionsByCategory(sessions, [], "system")).toEqual([]);
  });
});
