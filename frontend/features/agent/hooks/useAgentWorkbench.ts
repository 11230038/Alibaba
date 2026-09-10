"use client";

import { App } from "antd";
import { createContext, createElement, useContext, useEffect, useState, type ReactNode } from "react";
import { agentConfigToPreset, agentPresetToConfig, documentToUiLlmConfig } from "@/domain/agent/agentModel";
import { backend } from "@/services/client";
import type { AgentConfig, AgentConsoleState, AgentPreset, DocumentLlmConfig, LlmConfig, LlmLevelConfig } from "@/types/agent";
import type { AgentEditValues } from "../AgentEditModal";

function nowText() {
  return new Date().toLocaleString("zh-CN", { hour12: false }).replaceAll("/", "-");
}

function useAgentWorkbenchController() {
  const { message } = App.useApp();
  const [state, setState] = useState<AgentConsoleState>();
  const [loading, setLoading] = useState(true);
  const [testAgentId, setTestAgentId] = useState<string>();
  const [testing, setTesting] = useState(false);
  const [agentMutationId, setAgentMutationId] = useState<string>();

  useEffect(() => {
    backend.getAgentConsole().then((data) => {
      setState(data);
      setLoading(false);
    });
  }, []);

  async function saveLlmConfig(config: LlmConfig) {
    const current = state?.documentLlmConfig;
    const level = config.level ?? current?.level ?? state?.llmConfig.level ?? 0;
    const documentConfig: DocumentLlmConfig = {
      level,
      base_url: config.baseUrl ?? current?.base_url ?? "",
      api_key: config.apiKey ?? current?.api_key ?? "",
      model_name: config.model,
      system_prompt: config.systemPrompt,
      context: config.context ?? current?.context ?? 16000,
      context_limit_output_text: config.contextLimitOutputText ?? current?.context_limit_output_text,
      tool_round_limit_output_text: config.toolRoundLimitOutputText ?? current?.tool_round_limit_output_text,
      max_tool_rounds: config.maxToolRounds === undefined ? (current?.max_tool_rounds ?? null) : config.maxToolRounds,
    };
    const saved = await backend.saveLlmConfig(documentConfig);
    const llmConfig = documentToUiLlmConfig(saved, state?.llmConfig ?? {
      level,
      model: saved.model_name,
      temperature: 0.4,
      maxTokens: 4096,
      systemPrompt: saved.system_prompt ?? "",
    });
    setState((currentState) => {
      if (!currentState) return currentState;
      const nextLevels = (currentState.llmLevels ?? []).map((item) => item.level === saved.level ? {
        ...item,
        ...documentToUiLlmConfig(saved, {
          level: item.level,
          model: item.modelName,
          temperature: currentState.llmConfig.temperature,
          maxTokens: currentState.llmConfig.maxTokens,
          systemPrompt: item.systemPrompt,
        }),
        level: item.level,
        modelName: saved.model_name,
        baseUrl: saved.base_url,
        apiKey: saved.api_key,
        systemPrompt: saved.system_prompt ?? item.systemPrompt,
        context: saved.context,
        contextLimitOutputText: saved.context_limit_output_text,
        toolRoundLimitOutputText: saved.tool_round_limit_output_text,
        maxToolRounds: saved.max_tool_rounds ?? null,
      } : item);
      return { ...currentState, documentLlmConfig: saved, llmConfig, llmLevels: nextLevels };
    });
    message.success("LLM 参数已保存");
  }

  async function saveLlmLevel(config: LlmLevelConfig) {
    await saveLlmConfig({
      level: config.level,
      model: config.modelName,
      temperature: state?.llmConfig.temperature ?? 0.4,
      maxTokens: state?.llmConfig.maxTokens ?? 4096,
      systemPrompt: config.systemPrompt,
      baseUrl: config.baseUrl,
      apiKey: config.apiKey,
      context: config.context,
      contextLimitOutputText: config.contextLimitOutputText,
      toolRoundLimitOutputText: config.toolRoundLimitOutputText,
      maxToolRounds: config.maxToolRounds,
    });
  }

  async function toggleAgent(agent: AgentConfig, enabled: boolean) {
    const updatedAt = new Date().toLocaleString("zh-CN", { hour12: false }).replaceAll("/", "-");
    const updated = await backend.updateAgentConfig({ ...agent, enabled, updatedAt });
    if (agent.prompt && agent.level !== undefined) {
      await backend.saveAgentPreset({
        id: agent.id,
        name: agent.name,
        category: agent.category,
        enabled,
        description: agent.description,
        prompt: agent.prompt,
        level: agent.level,
        tools: agent.capabilities,
        updated_at: updatedAt,
        apid: agent.apid,
      });
    }
    setState((current) => current ? { ...current, agents: current.agents.map((item) => item.id === updated.id ? updated : item) } : current);
  }

  async function saveAgent(agent: AgentConfig, values: AgentEditValues) {
    if (agentMutationId) return;
    const updatedAt = nowText();
    const preset = agentConfigToPreset(agent, values, updatedAt);
    setAgentMutationId(String(preset.apid ?? preset.id));
    try {
      const saved = await backend.saveAgentPreset(preset);
      syncAgentState(saved);
      message.success("Agent 已保存");
    } finally {
      setAgentMutationId(undefined);
    }
  }

  async function createAgent(values: AgentEditValues) {
    if (agentMutationId) return;
    const apid = `agent-${Date.now()}`;
    const preset: AgentPreset = {
      id: apid,
      apid,
      name: values.name.trim(),
      category: "regular",
      enabled: true,
      description: values.description.trim(),
      prompt: values.prompt.trim(),
      level: values.level,
      intelevel: values.level,
      tools: values.capabilities,
      updated_at: nowText(),
    };
    setAgentMutationId(apid);
    try {
      const saved = await backend.saveAgentPreset(preset);
      syncAgentState(saved);
      message.success("Agent 已创建");
    } finally {
      setAgentMutationId(undefined);
    }
  }

  async function deleteAgent(agent: AgentConfig) {
    if (agent.category !== "regular" || agentMutationId) return;
    setAgentMutationId(agent.id);
    try {
      await backend.deleteAgentPreset(agent.id);
      setState((current) => current ? {
        ...current,
        agents: current.agents.filter((item) => item.id !== agent.id),
        agentPresets: current.agentPresets?.filter((item) => item.id !== agent.id),
      } : current);
      message.success("Agent 已删除");
    } finally {
      setAgentMutationId(undefined);
    }
  }

  async function resetSystemAgent(agent: AgentConfig) {
    if (agent.category !== "system" || !agent.apid || agentMutationId) return;
    setAgentMutationId(agent.id);
    try {
      const restored = await backend.restoreSystemAgentDefault(agent.apid);
      syncAgentState(restored);
      message.success("系统 Agent 已重置");
    } finally {
      setAgentMutationId(undefined);
    }
  }

  function syncAgentState(preset: AgentPreset) {
    const updated = agentPresetToConfig(preset);
    const agentId = String(updated.id);
    setState((current) => {
      if (!current) return current;
      const hasAgent = current.agents.some((item) => String(item.id) === agentId);
      const hasPreset = current.agentPresets?.some((item) => String(item.id) === agentId) ?? false;
      return {
        ...current,
        agents: hasAgent ? current.agents.map((item) => String(item.id) === agentId ? updated : item) : [updated, ...current.agents],
        agentPresets: current.agentPresets
          ? (hasPreset ? current.agentPresets.map((item) => String(item.id) === agentId ? preset : item) : [preset, ...current.agentPresets])
          : [preset],
      };
    });
  }

  async function runTest(content: string) {
    if (!testAgentId) return;
    setTesting(true);
    await backend.runAgentTest({ agentId: testAgentId, content });
    const history = await backend.listAgentTestHistory();
    setState((current) => current ? { ...current, history } : current);
    setTesting(false);
    message.success("测试完成");
  }

  async function deleteSession(id: string) {
    await backend.deleteAgentTestSession(id);
    setState((current) => current ? { ...current, history: current.history.filter((session) => session.id !== id) } : current);
    message.success("历史已删除");
  }

  async function branchSession(id: string) {
    const branch = await backend.branchAgentTestSession(id);
    setState((current) => current ? { ...current, history: [branch, ...current.history] } : current);
    message.success("已创建分支会话");
  }

  async function copySession(id: string) {
    const session = state?.history.find((item) => item.id === id);
    if (!session) return;
    await navigator.clipboard.writeText(session.messages.map((item) => `${item.role}: ${item.content}`).join("\n"));
    message.success("已复制测试历史");
  }

  return { state, loading, saveLlmConfig, saveLlmLevel, toggleAgent, saveAgent, createAgent, deleteAgent, resetSystemAgent, agentMutationId, testAgentId, setTestAgentId, testing, runTest, deleteSession, branchSession, copySession };
}

type AgentWorkbench = ReturnType<typeof useAgentWorkbenchController>;
const AgentWorkbenchContext = createContext<AgentWorkbench | null>(null);

export function AgentWorkbenchProvider({ children }: { children: ReactNode }) {
  const workbench = useAgentWorkbenchController();

  return createElement(AgentWorkbenchContext.Provider, { value: workbench }, children);
}

export function useAgentWorkbench() {
  const workbench = useContext(AgentWorkbenchContext);
  if (!workbench) {
    throw new Error("useAgentWorkbench must be used within AgentWorkbenchProvider");
  }
  return workbench;
}
