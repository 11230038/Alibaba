import { describe, expect, it } from "vitest";
import { buildConversationExport, conversationToTuples, groupConversations, sortConversations, stageLabel, statusLabel } from "@/domain/chat/chatModel";
import type { ChatMessage, Conversation, ConversationDetail } from "@/types/chatCanonical";

const summary = (id: string, updatedAt: string, status: Conversation["status"] = "following"): Conversation => ({
  id,
  customer: {
    id: id,
    aliId: `buyer-${id}`,
    name: `Buyer ${id}`,
    company: "Buyer Co.",
    country: "US",
    email: "buyer@example.com",
    phone: "+1 000",
    stage: "interested",
    tags: ["高质量买家"],
    availability: "当前可联系",
    behavior: [],
  },
  latestMessage: "最新消息",
  updatedAt,
  unreadCount: status === "unread" ? 1 : 0,
  status,
  priority: "high",
});

const messages: ChatMessage[] = [
  { id: "message-1", role: "buyer", content: "需要报价", createdAt: "2026-09-08 10:10", read: false, sid: 42, externalMid: "message-1", senderAid: 101, type: "text", rawContent: { text: "需要报价" } },
  { id: "message-2", role: "seller", content: "已收到", createdAt: "2026-09-08 10:11", read: true, sid: 42, externalMid: "message-2", senderAid: 9001, type: "text", rawContent: "已收到" },
];

const detail: ConversationDetail = {
  ...summary("42", "2026-09-08 10:11", "unread"),
  messages,
  analysis: {
    intent: "需要报价",
    stage: "interested",
    score: 85,
    risks: ["交期"],
    nextActions: ["发送报价"],
    summary: "客户处于高意向阶段。",
  },
};

describe("conversation domain model", () => {
  it("sorts and groups canonical conversations", () => {
    const conversations = [summary("old", "2026-09-06 10:00"), summary("new", "2026-09-08 10:00", "unread")];
    expect(sortConversations(conversations).map((item) => item.id)).toEqual(["new", "old"]);
    expect(groupConversations(conversations, "status").map((group) => group.label)).toEqual(["跟进中", "未读待回"]);
    expect(statusLabel("closed")).toBe("已关闭");
  });

  it("builds canonical tuples without transport fields", () => {
    expect(conversationToTuples(detail)).toEqual([
      ["2026-09-08 10:10", "买家", "需要报价"],
      ["2026-09-08 10:11", "我", "已收到"],
    ]);
  });

  it("exports canonical details", () => {
    expect(buildConversationExport([detail]).content).toContain("客户：Buyer 42");
    expect(buildConversationExport([detail]).content).toContain("[2026-09-08 10:10] buyer: 需要报价");
    expect(stageLabel("interested")).toBe("高意向");
  });
});
