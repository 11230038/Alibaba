export type ID = string;

export type AsyncStatus = "idle" | "loading" | "success" | "error";

export interface ApiResponse<T> {
  code: number;
  msg: string;
  data: T;
}

export interface PageResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
}

export interface DocumentPageResult<T> {
  items: T[];
  page: number;
  page_size: number;
  total: number;
}

export interface MetricDelta {
  value: number;
  direction: "up" | "down" | "flat";
  label: string;
}

export interface OptionItem {
  label: string;
  value: string;
}
