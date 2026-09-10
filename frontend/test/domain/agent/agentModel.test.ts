import { describe, expect, it } from "vitest";
import { agentCategoryLabel, canRegenerateAgentTestReply, canUndoAgentTestTurn, filterAgentTestSessionsByCategory, filterAgentsByCategory, formatAgentSessionDate, removeLatestAgentTestTurn, replaceLatestAgentTestReply } from "@/domain/agent/agentModel";
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

  it("formats session dates without the year, seconds, or timezone", () => {
    expect(formatAgentSessionDate("2026-09-07T10:21:00+08:00")).toBe("09-07 10:21");
  });

  it("identifies and removes the latest complete turn", () => {
    const session = {
      id: "session-1",
      title: "测试",
      agentId: "regular-1",
      createdAt: "",
      messages: [
        { id: "u1", role: "user" as const, content: "第一问", createdAt: "" },
        { id: "a1", role: "assistant" as const, content: "第一答", createdAt: "" },
        { id: "u2", role: "user" as const, content: "第二问", createdAt: "" },
        { id: "a2", role: "assistant" as const, content: "第二答", createdAt: "" },
      ],
    };
    expect(canUndoAgentTestTurn(session)).toBe(true);
    expect(canRegenerateAgentTestReply(session)).toBe(true);
    expect(removeLatestAgentTestTurn(session)?.messages.map((item) => item.id)).toEqual(["u1", "a1"]);
    expect(replaceLatestAgentTestReply(session, { id: "a3", role: "assistant", content: "新答", createdAt: "" })?.messages.map((item) => item.id)).toEqual(["u1", "a1", "u2", "a3"]);
  });

  it("does not operate on an incomplete latest turn", () => {
    const session = { ...sessions[1], messages: [{ id: "u1", role: "user" as const, content: "未完成", createdAt: "" }] };
    expect(canUndoAgentTestTurn(session)).toBe(false);
    expect(canRegenerateAgentTestReply(session)).toBe(false);
    expect(removeLatestAgentTestTurn(session)).toBeNull();
  });
});
