"use client";

import { Badge, Checkbox, List, Radio, Space, Typography } from "antd";
import { groupConversations, sortConversations } from "@/domain/chat/chatModel";
import type { Conversation } from "@/types/chat";
import { StatusTag } from "@/components/StatusTag";

export function ConversationList({
  conversations,
  activeId,
  selectedIds = [],
  groupMode = "time",
  onGroupModeChange,
  onSelect,
  onToggleSelected,
  selectable = false,
}: {
  conversations: Conversation[];
  activeId?: string;
  selectedIds?: string[];
  groupMode?: "time" | "status";
  onGroupModeChange?: (mode: "time" | "status") => void;
  onSelect?: (id: string) => void;
  onToggleSelected?: (id: string) => void;
  selectable?: boolean;
}) {
  const groups = groupConversations(sortConversations(conversations), groupMode);

  return (
    <Space orientation="vertical" className="w-full" size="middle">
      <Radio.Group
        size="small"
        value={groupMode}
        onChange={(event) => onGroupModeChange?.(event.target.value)}
        options={[{ label: "按时间", value: "time" }, { label: "按状态", value: "status" }]}
        optionType="button"
      />
      {groups.map((group) => (
        <div key={group.label}>
          <Typography.Text type="secondary" className="px-1 text-xs">{group.label}</Typography.Text>
          <List
            dataSource={group.items}
            renderItem={(item) => (
              <List.Item
                className={`cursor-pointer rounded-lg px-2 ${activeId === item.id ? "bg-blue-50" : "hover:bg-slate-50"}`}
                onClick={() => onSelect?.(item.id)}
              >
                <div className="flex w-full gap-2">
                  {selectable ? <Checkbox checked={selectedIds.includes(item.id)} onClick={(event) => event.stopPropagation()} onChange={() => onToggleSelected?.(item.id)} /> : null}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <Typography.Text strong ellipsis>{item.customer.name}</Typography.Text>
                      <Badge count={item.unreadCount} size="small" />
                    </div>
                    <Typography.Text type="secondary" ellipsis className="block text-xs">{item.customer.company} · {item.customer.country}</Typography.Text>
                    <Typography.Text ellipsis className="block text-xs">{item.latestMessage}</Typography.Text>
                    <div className="mt-2 flex items-center justify-between">
                      <StatusTag status={item.status} />
                      <Typography.Text type="secondary" className="text-xs">{item.updatedAt.slice(5)}</Typography.Text>
                    </div>
                  </div>
                </div>
              </List.Item>
            )}
          />
        </div>
      ))}
    </Space>
  );
}
