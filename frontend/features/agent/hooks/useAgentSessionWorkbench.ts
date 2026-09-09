"use client";

import { App } from "antd";
import { useEffect, useMemo, useState } from "react";
import { filterAgentsByCategory, filterAgentTestSessionsByCategory } from "@/domain/agent/agentModel";
import { backend } from "@/services/client";
import type { AgentConfig, AgentTestSession } from "@/types/agent";

export function useAgentSessionWorkbench() {
  const { message } = App.useApp();
  const [agents, setAgents] = useState<AgentConfig[]>([]);
  const [sessions, setSessions] = useState<AgentTestSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string>();
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    let mounted = true;
    Promise.all([backend.getAgentConsole(), backend.listAgentTestHistory()]).then(([consoleState, history]) => {
      if (!mounted) return;
      const regularAgents = filterAgentsByCategory(consoleState.agents, "regular");
      const regularSessions = filterAgentTestSessionsByCategory(history, consoleState.agents, "regular");
      setAgents(regularAgents);
      setSessions(regularSessions);
      setActiveSessionId(regularSessions[0]?.id);
      setLoading(false);
    });

    return () => {
      mounted = false;
    };
  }, []);

  const activeSession = useMemo(
    () => sessions.find((session) => session.id === activeSessionId),
    [activeSessionId, sessions],
  );

  function selectSession(id: string) {
    setActiveSessionId(id);
  }

  async function createSession(agentId: string, content: string) {
    if (creating) return;
    const agent = agents.find((item) => item.id === agentId && item.category === "regular");
    if (!agent || !content.trim()) return;

    setCreating(true);
    try {
      const result = await backend.runAgentTest({ agentId: agent.id, content: content.trim() });
      setSessions((current) => [result.session, ...current.filter((item) => item.id !== result.session.id)]);
      setActiveSessionId(result.session.id);
      message.success("会话已创建");
    } finally {
      setCreating(false);
    }
  }

  return { agents, sessions, activeSession, activeSessionId, loading, creating, selectSession, createSession };
}
