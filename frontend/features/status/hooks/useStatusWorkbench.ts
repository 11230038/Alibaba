"use client";

import { App } from "antd";
import { useEffect, useState } from "react";
import { backend } from "@/services/client";
import type { SystemStatusSnapshot } from "@/types/status";

export function useStatusWorkbench() {
  const { message } = App.useApp();
  const [snapshot, setSnapshot] = useState<SystemStatusSnapshot>();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deletingTaskId, setDeletingTaskId] = useState<string>();

  useEffect(() => {
    async function load() {
      const [userStatus, proxyStatus, receiverStatus, taskSnapshots] = await Promise.all([
        backend.checkUserStatus(),
        backend.checkMitmProxy(),
        backend.checkMitmReceiver(),
        backend.listTaskSnapshots(),
      ]);
      const snapshot = await backend.getSystemStatus();
      setSnapshot({ ...snapshot, userStatus, proxyStatus, receiverStatus, taskSnapshots });
      setLoading(false);
    }

    void load();
  }, []);

  async function refresh() {
    setRefreshing(true);
    await backend.runNodeTest();
    setSnapshot(await backend.refreshSystemStatus());
    setRefreshing(false);
    message.success("系统状态已刷新");
  }

  async function createTestTask() {
    const task = await backend.createTestTask({ type: "前端连通性测试", owner: "Console" });
    setSnapshot((current) => current ? { ...current, tasks: [task, ...current.tasks] } : current);
    message.success("测试任务已创建");
  }

  async function deleteTask(id: string) {
    if (deletingTaskId) return;
    setDeletingTaskId(id);
    try {
      await backend.deleteTask(id);
      setSnapshot((current) => current ? {
        ...current,
        tasks: current.tasks.filter((task) => task.id !== id),
        taskSnapshots: current.taskSnapshots?.filter((task) => task.task_id !== id),
      } : current);
      message.success("任务已删除");
    } finally {
      setDeletingTaskId(undefined);
    }
  }

  return { snapshot, loading, refreshing, refresh, createTestTask, deleteTask, deletingTaskId };
}
