"use client";

import { CheckOutlined, ClearOutlined, ExportOutlined, MessageOutlined, SwapOutlined } from "@ant-design/icons";
import { Button, Card, Space, Tag, Typography } from "antd";

export function BatchManagement({ selectedCount, onSelectAll, onInvert, onClear, onExport, onMassSend }: { selectedCount: number; onSelectAll: () => void; onInvert: () => void; onClear: () => void; onExport: () => void; onMassSend: () => void }) {
  return (
    <Card
      size="small"
      className="overflow-hidden border-slate-200"
      title={
        <div className="flex items-center gap-2">
          <Typography.Text strong>批量管理</Typography.Text>
          <Tag color={selectedCount ? "blue" : "default"}>{selectedCount} 个已选</Tag>
        </div>
      }
    >
      <div className="flex flex-col gap-4 rounded-lg bg-slate-50 px-4 py-3 md:flex-row md:items-center md:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600">
            <CheckOutlined />
          </div>
          <Typography.Text type="secondary">已选择 {selectedCount} 个会话</Typography.Text>
        </div>
        <Space wrap size={[8, 8]} className="md:justify-end">
          <Button size="small" icon={<CheckOutlined />} onClick={onSelectAll}>全选</Button>
          <Button size="small" icon={<SwapOutlined />} onClick={onInvert}>反选</Button>
          <Button size="small" icon={<ClearOutlined />} onClick={onClear}>清空</Button>
          <Button size="small" icon={<ExportOutlined />} onClick={onExport}>导出 TXT</Button>
          <Button size="small" type="primary" icon={<MessageOutlined />} onClick={onMassSend}>群发占位</Button>
        </Space>
      </div>
    </Card>
  );
}
