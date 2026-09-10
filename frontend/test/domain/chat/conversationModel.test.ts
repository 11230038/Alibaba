import { describe, expect, it } from "vitest";
import { toConversationDetail, toConversationSummary } from "@/domain/chat/chatModel";
import type { BusinessCard } from "@/types/cards";
import type { CrmConversation, UserInfo } from "@/types/chat";
import type { SelfInfo } from "@/types/home";

const selfInfo: SelfInfo = {
  ali_id: "seller-1",
  login_id: "seller-login",
  encrypt_account_id: "seller-enc",
  first_name: "Seller",
  last_name: "Demo",
  country: "China",
  company_name: "Seller Co.",
  avatar_url: "",
  account_status: "active",
};

const user: UserInfo = {
  ali_id: "buyer-1",
  ali_member_id: "member-1",
  login_id: "buyer-login",
  encrypt_account_id: "buyer-enc",
  first_name: "Buyer",
  last_name: "Demo",
  country_code: "US",
  company_name: "Buyer Co.",
  register_date: 1704067200,
  email: "buyer@example.com",
  mobile_number: "+1 000",
  phone_number: "+1 111",
  product_view_count: 8,
  valid_inquiry_count: 2,
  replied_inquiry_count: 1,
  valid_rfq_count: 0,
  login_days: 12,
  spam_inquiry_count: 0,
  blacklisted_count: 0,
  high_quality_level_tag: "高质量买家",
  growth_level: "成长中",
  preferred_industries: ["Lighting"],
  available: true,
  joining_years: 2,
  potential_score: 85,
  recent_contact: true,
  email_validated: true,
};

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

const conversation: CrmConversation = {
  contact_ali_id: "buyer-1",
  last_created_at: "2026-09-08 10:12",
  last_content_label: "Please send sample details.",
  messages: [
    {
      table_name: "message",
      cid: "buyer-1",
      mid: "msg-1",
      sender_id: "buyer-1",
      created_at: "2026-09-08 10:10",
      user_content_type: 1,
      content_label: "Please send sample details.",
      content: "Please send sample details.",
      is_system: false,
      is_auto_reply: false,
    },
    {
      table_name: "message",
      cid: "buyer-1",
      mid: "msg-2",
      sender_id: "seller-1",
      created_at: "2026-09-08 10:11",
      user_content_type: 1,
      content_label: "I will send it today.",
      content: "I will send it today.",
      is_system: false,
      is_auto_reply: false,
    },
    {
      table_name: "message",
      cid: "buyer-1",
      mid: "msg-card",
      sender_id: null,
      created_at: "2026-09-08 10:12",
      user_content_type: 9,
      content_label: "系统推荐卡片",
      content: "系统推荐卡片",
      is_system: false,
      is_auto_reply: false,
      card_id: "card-1",
    },
  ],
};

describe("conversation model adapters", () => {
  it("converts CRM conversation to UI summary", () => {
    const summary = toConversationSummary(conversation, [user], selfInfo);

    expect(summary.id).toBe("buyer-1");
    expect(summary.customer.name).toBe("Buyer Demo");
    expect(summary.status).toBe("unread");
    expect(summary.priority).toBe("high");
  });

  it("converts CRM messages and card references to detail", () => {
    const detail = toConversationDetail(conversation, [user], selfInfo, [card]);

    expect(detail.messages.map((message) => message.role)).toEqual(["buyer", "seller", "card"]);
    expect(detail.messages[2].card?.id).toBe("card-1");
    expect(detail.analysis.stage).toBe("interested");
  });

  it("maps database session and message fields without leaking the legacy typo", () => {
    const detail = toConversationDetail({
      sid: 42,
      name: "Buyer session",
      participants: [101, 9001],
      messages: [
        { external_mid: "db-msg-1", sid: 42, sender: 101, read: false, content: { text: "需要报价" }, type: "text" },
        { external_mid: "db-msg-2", sid: 42, sender: 9001, read: true, content: "已收到", type: "text" },
      ],
    }, [], { ...selfInfo, aid: 9001 });

    expect(detail.id).toBe("42");
    expect(detail.unreadCount).toBe(1);
    expect(detail.messages[0]).toMatchObject({ id: "db-msg-1", sid: 42, externalMid: "db-msg-1", senderAid: 101, read: false, content: '{"text":"需要报价"}' });
    expect(detail.messages[1].id).toBe("db-msg-2");
  });
});
