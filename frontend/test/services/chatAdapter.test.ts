import { describe, expect, it } from "vitest";
import { adaptConversationDetail, adaptConversationSummary } from "@/services/chatAdapter";
import type { BusinessCard } from "@/types/cards";
import type { ConversationAggregateDto } from "@/types/chatTransport";

const card: BusinessCard = {
  id: "card-1",
  title: "推荐卡片",
  type: "generic",
  status: "published",
  summary: "卡片摘要",
  owner: "业务卡片",
  updatedAt: "2026-09-08 10:00",
  tags: ["卡片"],
  coverTone: "#fff",
  details: [],
  recommendedScenario: "推荐场景",
};

const aggregate: ConversationAggregateDto = {
  sid: 42,
  name: "Buyer session",
  participants: [101, 9001],
  accounts: [
    { aid: 101, cid: 301, pid: "alibaba", account: "buyer-account", nickname: "Buyer Nick", avatar: null, sids: [42], extra: { email: "buyer@example.com", phone: "+86 123" } },
    { aid: 9001, cid: 901, pid: "alibaba", account: "seller-account", nickname: "Seller", avatar: null, sids: [42], extra: null },
  ],
  customers: [
    { cid: 301, name: "DB Customer", region: "Germany" },
    { cid: 901, name: "Seller Customer", region: "China" },
  ],
  customer_view: {
    id: "301",
    ali_id: "buyer-account",
    name: "DB Customer",
    company: "Buyer Co.",
    country: "Germany",
    email: "buyer@example.com",
    phone: "+86 123",
    stage: "negotiating",
    tags: ["高意向"],
    availability: "当前可联系",
    behavior: ["近期已联系"],
  },
  latest: { content: "聚合最新内容", updated_at: "2026-09-08 11:00" },
  unread_count: 1,
  status: "unread",
  priority: "high",
  analysis: {
    intent: "需要报价",
    stage: "negotiating",
    score: 91,
    risks: ["交期"],
    next_actions: ["发送报价"],
    summary: "客户处于谈判中阶段。",
  },
  messages: [
    {
      message: { external_mid: "message-1", sid: 42, sender: 101, read: false, content: { text: "需要报价" }, type: "text" },
      created_at: "2026-09-08 10:10",
      role: "buyer",
    },
    {
      message: { external_mid: "message-card", sid: 42, sender: 9001, read: true, content: { card_id: "card-1", label: "系统推荐卡片" }, type: "card" },
      created_at: "2026-09-08 10:11",
      role: "card",
    },
  ],
};

describe("chat adapter", () => {
  it("maps backend aggregate fields and SDK relationships to canonical summary", () => {
    const summary = adaptConversationSummary(aggregate);

    expect(summary).toEqual({
      id: "42",
      customer: expect.objectContaining({ id: "301", aliId: "buyer-account", stage: "negotiating" }),
      latestMessage: "聚合最新内容",
      updatedAt: "2026-09-08 11:00",
      unreadCount: 1,
      status: "unread",
      priority: "high",
    });
  });

  it("maps SDK messages, JSON content and message-wrapper time without leaking raw DTO", () => {
    const detail = adaptConversationDetail(aggregate, { cards: [card] });

    expect(detail.messages).toMatchObject([
      { id: "message-1", externalMid: "message-1", senderAid: 101, read: false, content: "需要报价", createdAt: "2026-09-08 10:10", rawContent: { text: "需要报价" } },
      { id: "message-card", role: "card", content: "系统推荐卡片", card },
    ]);
    expect(detail.analysis).toMatchObject({ stage: "negotiating", score: 91, nextActions: ["发送报价"] });
    expect("source" in detail).toBe(false);
    expect(JSON.stringify(detail)).not.toContain("external_mid");
  });

  it("uses an explicit fallback when optional aggregate data is absent", () => {
    const summary = adaptConversationSummary({ sid: 99, name: null, participants: [], messages: [], latest: { content: null, updated_at: null }, unread_count: 0, status: "following", priority: "low" });
    expect(summary.customer).toMatchObject({ id: "99", name: "未知客户", country: "未知" });
    expect(summary.updatedAt).toBe("未知时间");
  });
});
