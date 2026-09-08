import { describe, expect, it } from "vitest";
import { buildSystemStatusSnapshot, taskSnapshotToTaskItem } from "@/domain/status/statusModel";
import type { TaskSnapshot } from "@/types/status";

const task: TaskSnapshot = {
  task_id: "task-1",
  description: "联系人跳转",
  status: "pending",
  message: "等待执行",
  result: null,
  created_at: 1788842400,
  started_at: null,
  completed_at: null,
};

describe("status model adapters", () => {
  it("maps document task snapshot to UI task item", () => {
    const item = taskSnapshotToTaskItem(task);

    expect(item.id).toBe("task-1");
    expect(item.status).toBe("queued");
    expect(item.remark).toBe("等待执行");
  });

  it("builds status modules from document status objects", () => {
    const snapshot = buildSystemStatusSnapshot({
      userStatus: { has_key: true, source: ".env", ali_id: "seller-1", db_exists: true },
      proxyStatus: { reachable: true, host: "127.0.0.1", port: 7890, latency_ms: 50, error: null },
      receiverStatus: { reachable: false, host: "127.0.0.1", port: 8788, latency_ms: null, error: "closed" },
      nodeResult: { success: true, message: "ok" },
      taskSnapshots: [task],
      updatedAt: "2026-09-08 10:00",
    });

    expect(snapshot.modules.map((module) => module.status)).toEqual(["healthy", "healthy", "offline", "healthy"]);
    expect(snapshot.tasks[0].status).toBe("queued");
    expect(snapshot.receiverStatus?.error).toBe("closed");
  });
});
