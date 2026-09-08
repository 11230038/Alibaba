import type { MetricDelta } from "@/types/common";
import type { TaskItem } from "@/types/status";

export interface SelfInfo {
  ali_id: string;
  login_id: string;
  encrypt_account_id: string;
  first_name: string;
  last_name: string;
  country: string;
  company_name: string;
  avatar_url: string;
  account_status: string;
}

export interface DashboardMetric {
  key: string;
  title: string;
  value: number | string;
  suffix?: string;
  delta: MetricDelta;
}

export interface TrendPoint {
  label: string;
  value: number;
}

export interface CapabilityRow {
  key: string;
  agent: string;
  ability: string;
  coverage: number;
  status: "healthy" | "warning" | "offline";
}

export interface CustomerSummary {
  key: string;
  name: string;
  stage: string;
  nextAction: string;
  priority: "high" | "medium" | "low";
}

export interface HomeDashboard {
  info: SelfInfo | null;
  metrics: DashboardMetric[];
  cardTrends: TrendPoint[];
  customerSummaries: CustomerSummary[];
  capabilities: CapabilityRow[];
  tasks: TaskItem[];
}
