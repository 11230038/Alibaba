import type { HealthStatus, KeyStatus, NetworkStatus, NodeTestResult, SystemStatusSnapshot, TaskItem, TaskSnapshot, TaskStatus } from "@/types/status";

export function healthLabel(status: HealthStatus) {
  return {
    healthy: "正常",
    warning: "告警",
    offline: "离线",
  }[status];
}

export function taskStatusLabel(status: TaskStatus) {
  return {
    queued: "排队中",
    running: "运行中",
    succeeded: "成功",
    failed: "失败",
  }[status];
}

export function healthScore(status: HealthStatus) {
  return {
    healthy: 100,
    warning: 68,
    offline: 0,
  }[status];
}

export function documentTaskStatusToUi(status: TaskSnapshot["status"]): TaskStatus {
  return status === "pending" ? "queued" : status;
}

export function taskSnapshotToTaskItem(snapshot: TaskSnapshot): TaskItem {
  return {
    id: snapshot.task_id,
    type: snapshot.description,
    status: documentTaskStatusToUi(snapshot.status),
    createdAt: formatStatusTime(snapshot.created_at),
    duration: formatDuration(snapshot.started_at, snapshot.completed_at),
    owner: "任务队列",
    remark: snapshot.message,
  };
}

export function buildSystemStatusSnapshot({
  userStatus,
  proxyStatus,
  receiverStatus,
  nodeResult,
  taskSnapshots,
  updatedAt = new Date().toLocaleString("zh-CN", { hour12: false }).replaceAll("/", "-"),
}: {
  userStatus: KeyStatus;
  proxyStatus: NetworkStatus;
  receiverStatus: NetworkStatus;
  nodeResult: NodeTestResult;
  taskSnapshots: TaskSnapshot[];
  updatedAt?: string;
}): SystemStatusSnapshot {
  return {
    updatedAt,
    modules: [
      {
        id: "health-identity",
        name: "身份服务",
        status: userStatus.has_key && userStatus.db_exists ? "healthy" : "warning",
        latency: 68,
        description: `${userStatus.source} · ${userStatus.ali_id || "未识别"}`,
        lastCheckedAt: updatedAt,
      },
      {
        id: "health-proxy",
        name: "代理服务",
        status: networkToHealth(proxyStatus),
        latency: proxyStatus.latency_ms ?? 0,
        description: `${proxyStatus.host}:${proxyStatus.port}${proxyStatus.error ? ` · ${proxyStatus.error}` : ""}`,
        lastCheckedAt: updatedAt,
      },
      {
        id: "health-receiver",
        name: "Receiver",
        status: networkToHealth(receiverStatus),
        latency: receiverStatus.latency_ms ?? 0,
        description: `${receiverStatus.host}:${receiverStatus.port}${receiverStatus.error ? ` · ${receiverStatus.error}` : ""}`,
        lastCheckedAt: updatedAt,
      },
      {
        id: "health-node",
        name: "MaaFW 节点",
        status: nodeResult.success ? "healthy" : "offline",
        latency: nodeResult.success ? 120 : 0,
        description: nodeResult.message,
        lastCheckedAt: updatedAt,
      },
    ],
    tasks: taskSnapshots.map(taskSnapshotToTaskItem),
    userStatus,
    proxyStatus,
    receiverStatus,
    nodeResult,
    taskSnapshots,
  };
}

function networkToHealth(status: NetworkStatus): HealthStatus {
  if (!status.reachable) return "offline";
  if ((status.latency_ms ?? 0) > 180) return "warning";
  return "healthy";
}

function formatStatusTime(value: number) {
  return new Date(value * 1000).toLocaleString("zh-CN", { hour12: false }).replaceAll("/", "-");
}

function formatDuration(startedAt: number | null, completedAt: number | null) {
  if (!startedAt) return "0s";
  const end = completedAt ?? Date.now() / 1000;
  const seconds = Math.max(0, Math.round(end - startedAt));
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return minutes ? `${minutes}m ${rest}s` : `${rest}s`;
}
