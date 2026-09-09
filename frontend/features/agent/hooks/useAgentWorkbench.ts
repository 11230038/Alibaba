"use client";

import { App } from "antd";
import { createContext, createElement, useContext, useEffect, useState, type ReactNode } from "react";
import { backend } from "@/services/client";
import type { AgentConfig, AgentConsoleState, AgentPreset, LlmConfig, LlmLevelConfig } from "@/types/agent";
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
    const documentConfig = await backend.saveLlmConfig({
      base_url: config.baseUrl ?? state?.documentLlmConfig?.base_url ?? "http://127.0.0.1:8787/mock-llm",
      api_key: config.apiKey ?? state?.documentLlmConfig?.api_key ?? "mock-api-key",
      model_name: config.model,
      system_prompt: config.systemPrompt,
      context: config.context ?? state?.documentLlmConfig?.context ?? 16000,
      max_tool_rounds: config.maxToolRounds ?? state?.documentLlmConfig?.max_tool_rounds ?? 4,
    });
    const llmConfig = await backend.updateLlmConfig({ ...config, baseUrl: documentConfig.base_url, apiKey: documentConfig.api_key, context: documentConfig.context, maxToolRounds: documentConfig.max_tool_rounds });
    setState((current) => {
      if (!current) return current;
      const nextLevels = config.level === undefined
        ? current.llmLevels
        : (current.llmLevels ?? []).map((item) => item.level === config.level ? {
            ...item,
            baseUrl: documentConfig.base_url,
            apiKey: documentConfig.api_key,
            modelName: documentConfig.model_name,
            systemPrompt: documentConfig.system_prompt ?? "",
            context: documentConfig.context,
            maxToolRounds: documentConfig.max_tool_rounds ?? item.maxToolRounds,
          } : item);
      return { ...current, documentLlmConfig: documentConfig, llmConfig, llmLevels: nextLevels };
    });
    message.success("LLM 参数已保存（Mock）");
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
    const preset: AgentPreset = {
      id: agent.id,
      name: values.name.trim(),
      category: agent.category,
      enabled: agent.enabled,
      description: values.description.trim(),
      prompt: values.prompt.trim(),
      level: values.level,
      tools: values.capabilities.map((item: string) => item.trim()).filter(Boolean),
      updated_at: updatedAt,
      apid: agent.apid,
    };
    setAgentMutationId(agent.id);
    try {
      const saved = await backend.saveAgentPreset(preset);
      syncAgentState(saved);
      message.success("Agent 已保存");
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
    const updated: AgentConfig = {
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
    };
    setState((current) => current ? {
      ...current,
      agents: current.agents.map((item) => item.id === updated.id ? updated : item),
      agentPresets: current.agentPresets?.map((item) => item.id === preset.id ? preset : item),
    } : current);
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

  return { state, loading, saveLlmConfig, saveLlmLevel, toggleAgent, saveAgent, deleteAgent, resetSystemAgent, agentMutationId, testAgentId, setTestAgentId, testing, runTest, deleteSession, branchSession, copySession };
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
