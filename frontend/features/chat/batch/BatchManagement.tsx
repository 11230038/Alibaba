"use client";

import { ExportOutlined, MessageOutlined } from "@ant-design/icons";
import { Button, Card, Space, Typography } from "antd";

export function BatchManagement({ selectedCount, onSelectAll, onInvert, onClear, onExport, onMassSend }: { selectedCount: number; onSelectAll: () => void; onInvert: () => void; onClear: () => void; onExport: () => void; onMassSend: () => void }) {
  return (
    <Card size="small" title="批量管理">
      <Space direction="vertical" className="w-full">
        <Typography.Text type="secondary">已选择 {selectedCount} 个会话</Typography.Text>
        <Space wrap>
          <Button size="small" onClick={onSelectAll}>全选</Button>
          <Button size="small" onClick={onInvert}>反选</Button>
          <Button size="small" onClick={onClear}>清空</Button>
          <Button size="small" icon={<ExportOutlined />} onClick={onExport}>导出 TXT</Button>
          <Button size="small" icon={<MessageOutlined />} onClick={onMassSend}>群发占位</Button>
        </Space>
      </Space>
    </Card>
  );
}
