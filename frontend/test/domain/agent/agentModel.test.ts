import { describe, expect, it } from "vitest";
import { SYSTEM_AGENT_APIDS, agentCategoryLabel, agentPresetToDbPreset, agentPresetToConfig, canRegenerateAgentTestReply, canUndoAgentTestTurn, dbPresetToAgentPreset, documentToLlmLevelConfig, filterAgentTestSessionsByCategory, filterAgentsByCategory, formatAgentSessionDate, isValidToolRoundLimit, llmLevelToDocumentConfig, normalizeAgentLevel, removeLatestAgentTestTurn, replaceLatestAgentTestReply } from "@/domain/agent/agentModel";
import { agentPresets } from "@/mock/agentData";
import type { AgentPreset, DocumentLlmConfig } from "@/types/agent";
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

  it("uses apid and intelevel as database authority", () => {
    const preset: AgentPreset = {
      id: "ui-id",
      apid: "agent-db-1",
      name: "报价 Agent",
      description: "",
      prompt: "报价",
      level: 4,
      intelevel: 4,
      tools: ["CRM 查询", "quote_template"],
      category: "regular",
      enabled: true,
      updated_at: "2026-09-10",
    };
    expect(agentPresetToDbPreset(preset)).toEqual({
      apid: "agent-db-1",
      name: "报价 Agent",
      description: "",
      prompt: "报价",
      intelevel: 4,
      tools: ["crm_query", "quote_template"],
    });
    expect(agentPresetToConfig(preset)).toMatchObject({ id: "agent-db-1", apid: "agent-db-1", level: 4, capabilities: ["CRM 查询", "报价模板"] });
    expect(() => normalizeAgentLevel(5)).toThrow();
  });

  it("derives UI-only agent state from database presets", () => {
    const preset = dbPresetToAgentPreset({ apid: "agent-db-2", name: "DB Agent", description: "", prompt: "prompt", intelevel: 0, tools: [] });
    expect(preset).toMatchObject({ id: "agent-db-2", category: "regular", enabled: true, level: 0, intelevel: 0 });
    expect(agentPresetToDbPreset(preset)).toEqual({ apid: "agent-db-2", name: "DB Agent", description: "", prompt: "prompt", intelevel: 0, tools: [] });
  });

  it("matches system agent SQL seed levels", () => {
    const systemApids = new Set<string>(Object.values(SYSTEM_AGENT_APIDS));
    const systemPresets = agentPresets.filter((preset) => systemApids.has(String(preset.apid)));
    expect(systemPresets).toHaveLength(4);
    expect(systemPresets.every((preset) => preset.intelevel === 0 && preset.level === 0 && preset.tools?.length === 0)).toBe(true);
  });

  it("round-trips nullable max tool rounds without converting null to zero", () => {
    const document: DocumentLlmConfig = {
      level: 2,
      base_url: "https://llm.example/v1",
      api_key: "secret",
      model_name: "model",
      system_prompt: "prompt",
      context: 16000,
      max_tool_rounds: null,
    };
    const level = documentToLlmLevelConfig(document);
    expect(level.maxToolRounds).toBeNull();
    expect(llmLevelToDocumentConfig(level)).toMatchObject({ level: 2, max_tool_rounds: null });
    expect(isValidToolRoundLimit(0)).toBe(false);
    expect(isValidToolRoundLimit(null)).toBe(true);
  });
});
