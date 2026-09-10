"use client";

import { App } from "antd";
import { useEffect, useMemo, useState } from "react";
import { canRegenerateAgentTestReply, canUndoAgentTestTurn, filterAgentsByCategory, filterAgentTestSessionsByCategory } from "@/domain/agent/agentModel";
import { backend } from "@/services/client";
import type { AgentConfig, AgentTestSession } from "@/types/agent";

type SessionActionType = "send" | "undo" | "regenerate" | "copy" | "delete";
type SessionAction = { type: SessionActionType; sessionId: string };

export function useAgentSessionWorkbench() {
  const { message } = App.useApp();
  const [agents, setAgents] = useState<AgentConfig[]>([]);
  const [sessions, setSessions] = useState<AgentTestSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string>();
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState("");
  const [action, setAction] = useState<SessionAction>();

  useEffect(() => {
    let mounted = true;
    Promise.all([backend.getAgentConsole(), backend.listAgentTestHistory()])
      .then(([consoleState, history]) => {
        if (!mounted) return;
        const regularAgents = filterAgentsByCategory(consoleState.agents, "regular");
        const regularSessions = filterAgentTestSessionsByCategory(history, consoleState.agents, "regular");
        setAgents(regularAgents);
        setSessions(regularSessions);
        setActiveSessionId(regularSessions[0]?.id);
      })
      .catch((error: unknown) => {
        if (mounted) message.error(error instanceof Error ? error.message : "会话加载失败");
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [message]);

  const activeSession = useMemo(
    () => sessions.find((session) => session.id === activeSessionId),
    [activeSessionId, sessions],
  );
  const canUndoTurn = Boolean(activeSession && canUndoAgentTestTurn(activeSession));
  const canRegenerateReply = Boolean(activeSession && canRegenerateAgentTestReply(activeSession));
  const busy = Boolean(action || creating);

  function selectSession(id: string) {
    if (!busy) setActiveSessionId(id);
  }

  async function createSession(agentId: string) {
    if (creating || action) return;
    const agent = agents.find((item) => item.id === agentId && item.category === "regular" && item.enabled);
    if (!agent) return;

    setCreating(true);
    try {
      const result = await backend.runAgentTest({ agentId: agent.id });
      setSessions((current) => [result.session, ...current.filter((item) => item.id !== result.session.id)]);
      setActiveSessionId(result.session.id);
      setDraft("");
      message.success("会话已创建");
    } catch (error: unknown) {
      message.error(error instanceof Error ? error.message : "会话创建失败");
    } finally {
      setCreating(false);
    }
  }

  async function sendMessage() {
    if (busy || !activeSession || !draft.trim()) return;
    const sessionId = activeSession.id;
    setAction({ type: "send", sessionId });
    try {
      const result = await backend.runAgentTest({ agentId: activeSession.agentId, sessionId, content: draft.trim() });
      replaceSession(result.session);
      setDraft("");
      message.success("消息已发送");
    } catch (error: unknown) {
      message.error(error instanceof Error ? error.message : "消息发送失败");
    } finally {
      setAction(undefined);
    }
  }

  async function undoTurn() {
    if (busy || !activeSession || !canUndoTurn) return;
    await updateSession("undo", activeSession.id, () => backend.undoAgentTestSession(activeSession.id), "已撤销一轮");
  }

  async function regenerateReply() {
    if (busy || !activeSession || !canRegenerateReply) return;
    await updateSession("regenerate", activeSession.id, () => backend.regenerateAgentTestSessionReply(activeSession.id), "已重新回复");
  }

  async function copySession(id: string) {
    if (busy || !sessions.some((session) => session.id === id)) return;
    setAction({ type: "copy", sessionId: id });
    try {
      const copy = await backend.branchAgentTestSession(id);
      setSessions((current) => [copy, ...current.filter((item) => item.id !== copy.id)]);
      message.success("会话已复制");
    } catch (error: unknown) {
      message.error(error instanceof Error ? error.message : "会话复制失败");
    } finally {
      setAction(undefined);
    }
  }

  async function deleteSession(id: string) {
    if (busy || !sessions.some((session) => session.id === id)) return false;
    setAction({ type: "delete", sessionId: id });
    try {
      await backend.deleteAgentTestSession(id);
      setSessions((current) => {
        const index = current.findIndex((session) => session.id === id);
        const next = current.filter((session) => session.id !== id);
        if (id === activeSessionId) setActiveSessionId(next[Math.max(0, index - 1)]?.id ?? next[0]?.id);
        return next;
      });
      if (id === activeSessionId) setDraft("");
      message.success("会话已删除");
      return true;
    } catch (error: unknown) {
      message.error(error instanceof Error ? error.message : "会话删除失败");
      return false;
    } finally {
      setAction(undefined);
    }
  }

  async function updateSession(type: "undo" | "regenerate", sessionId: string, request: () => Promise<AgentTestSession>, successText: string) {
    setAction({ type, sessionId });
    try {
      replaceSession(await request());
      message.success(successText);
    } catch (error: unknown) {
      message.error(error instanceof Error ? error.message : "会话操作失败");
    } finally {
      setAction(undefined);
    }
  }

  function replaceSession(session: AgentTestSession) {
    setSessions((current) => [session, ...current.filter((item) => item.id !== session.id)]);
  }

  return {
    agents, sessions, activeSession, activeSessionId, loading, creating, draft, setDraft,
    action, busy, canUndoTurn, canRegenerateReply, selectSession, createSession, sendMessage,
    undoTurn, regenerateReply, copySession, deleteSession,
  };
}
