"use client";

import { App } from "antd";
import { useEffect, useState } from "react";
import { backend } from "@/services/client";
import type { AgentConfig, AgentConsoleState, LlmConfig } from "@/types/agent";

export function useAgentWorkbench() {
  const { message } = App.useApp();
  const [state, setState] = useState<AgentConsoleState>();
  const [loading, setLoading] = useState(true);
  const [testAgentId, setTestAgentId] = useState<string>();
  const [testing, setTesting] = useState(false);

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
    setState((current) => current ? { ...current, documentLlmConfig: documentConfig, llmConfig } : current);
    message.success("LLM 参数已保存（Mock）");
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

  return { state, loading, saveLlmConfig, toggleAgent, testAgentId, setTestAgentId, testing, runTest, deleteSession, branchSession, copySession };
}
