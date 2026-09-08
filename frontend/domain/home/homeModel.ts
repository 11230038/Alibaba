import type { DashboardMetric } from "@/types/home";

export function metricDeltaText(metric: DashboardMetric) {
  const sign = metric.delta.direction === "down" ? "-" : metric.delta.direction === "up" ? "+" : "";
  return `${metric.delta.label} ${sign}${metric.delta.value}%`;
}

export function normalizeTrend(values: number[]) {
  const max = Math.max(...values, 1);
  return values.map((value) => Math.round((value / max) * 100));
}
