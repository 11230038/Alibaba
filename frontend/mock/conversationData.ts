import { toConversationDetail, replySuggestionsToAssistantSuggestions } from "@/domain/chat/chatModel";
import { businessCards } from "@/mock/cardData";
import { mockSelfInfo } from "@/mock/selfData";
import type { DbAccount, DbConversation, DbCustomer, ReplySuggestions, UserInfo } from "@/types/chat";

export const userInfos: UserInfo[] = [
  {
    ali_id: "buyer-ali-001",
    ali_member_id: "member-001",
    login_id: "sofia.luma",
    encrypt_account_id: "enc-buyer-001",
    first_name: "Sofia",
    last_name: "Martinez",
    country_code: "Spain",
    company_name: "Luma Retail Group",
    register_date: 1704067200,
    email: "sofia@luma.example",
    mobile_number: "+34 600 123 456",
    phone_number: "+34 91 000 0000",
    product_view_count: 12,
    valid_inquiry_count: 4,
    replied_inquiry_count: 2,
    valid_rfq_count: 1,
    login_days: 28,
    spam_inquiry_count: 0,
    blacklisted_count: 0,
    high_quality_level_tag: "高质量买家",
    growth_level: "成长中",
    preferred_industries: ["新能源", "户外照明"],
    available: true,
    joining_years: 3,
    potential_score: 88,
    recent_contact: true,
    email_validated: true,
  },
  {
    ali_id: "buyer-ali-002",
    ali_member_id: "member-002",
    login_id: "ahmed.gfresh",
    encrypt_account_id: "enc-buyer-002",
    first_name: "Ahmed",
    last_name: "Khan",
    country_code: "UAE",
    company_name: "Gulf Fresh Logistics",
    register_date: 1688169600,
    email: "ahmed@gfresh.example",
    mobile_number: "+971 55 000 1188",
    phone_number: "+971 4 000 1188",
    product_view_count: 9,
    valid_inquiry_count: 6,
    replied_inquiry_count: 5,
    valid_rfq_count: 2,
    login_days: 46,
    spam_inquiry_count: 0,
    blacklisted_count: 0,
    high_quality_level_tag: "高潜买家",
    growth_level: "成熟买家",
    preferred_industries: ["冷链", "IoT"],
    available: true,
    joining_years: 5,
    potential_score: 82,
    recent_contact: true,
    email_validated: true,
  },
  {
    ali_id: "buyer-ali-003",
    ali_member_id: "member-003",
    login_id: "maya.harbor",
    encrypt_account_id: "enc-buyer-003",
    first_name: "Maya",
    last_name: "Brown",
    country_code: "Canada",
    company_name: "North Harbor Supplies",
    register_date: 1717200000,
    email: "maya@northharbor.example",
    mobile_number: "+1 604 000 9281",
    phone_number: "+1 604 000 9280",
    product_view_count: 3,
    valid_inquiry_count: 1,
    replied_inquiry_count: 0,
    valid_rfq_count: 0,
    login_days: 6,
    spam_inquiry_count: 0,
    blacklisted_count: 0,
    high_quality_level_tag: "展会线索",
    growth_level: "新买家",
    preferred_industries: ["OEM", "工业品"],
    available: false,
    joining_years: 1,
    potential_score: 63,
    recent_contact: false,
    email_validated: true,
  },
];

const customers: DbCustomer[] = [
  { cid: 1001, name: "Sofia Martinez", region: "Spain", extra: { company: "Luma Retail Group" } },
  { cid: 1002, name: "Ahmed Khan", region: "UAE", extra: { company: "Gulf Fresh Logistics" } },
  { cid: 1003, name: "Maya Brown", region: "Canada", extra: { company: "North Harbor Supplies" } },
  { cid: 9001, name: "Demo Seller", region: "China", extra: { company: "Hangzhou Smart Export Co., Ltd." } },
];

const accounts: DbAccount[] = [
  { aid: 101, cid: 1001, pid: "alibaba", account: "buyer-ali-001", nickname: "Sofia Martinez", avatar: null, sids: [42], extra: { email: "sofia@luma.example", phone: "+34 600 123 456" } },
  { aid: 102, cid: 1002, pid: "alibaba", account: "buyer-ali-002", nickname: "Ahmed Khan", avatar: null, sids: [43], extra: { email: "ahmed@gfresh.example", phone: "+971 55 000 1188" } },
  { aid: 103, cid: 1003, pid: "alibaba", account: "buyer-ali-003", nickname: "Maya Brown", avatar: null, sids: [44], extra: { email: "maya@northharbor.example", phone: "+1 604 000 9281" } },
  { aid: 9001, cid: 9001, pid: "alibaba", account: mockSelfInfo.ali_id, nickname: "Demo Seller", avatar: mockSelfInfo.avatar_url, sids: [42, 43, 44], extra: null },
];

function conversationAccounts(aid: number) {
  return accounts.filter((account) => account.aid === aid || account.aid === mockSelfInfo.aid);
}

function conversationCustomers(aid: number) {
  const cids = new Set(conversationAccounts(aid).map((account) => account.cid));
  return customers.filter((customer) => cids.has(customer.cid));
}

export const crmConversations: DbConversation[] = [
  {
    sid: 42,
    name: "Luma Retail Group",
    participants: [101, 9001],
    accounts: conversationAccounts(101),
    customers: conversationCustomers(101),
    display_updated_at: "2026-09-07 10:21",
    display_latest_content: "客户浏览了 3 个太阳能灯 SKU，并下载认证附件。",
    messages: [
      { external_mid: "msg-001", sid: 42, sender: 101, read: false, content: "Hi, could you confirm the MOQ and lead time for the solar lights?", type: "text" },
      { external_mid: "msg-002", sid: 42, sender: 9001, read: true, content: { card_id: "inq-20260907-001", label: "系统推荐卡片" }, type: "card" },
      { external_mid: "msg-003", sid: 42, sender: 9001, read: true, content: "客户浏览了 3 个太阳能灯 SKU，并下载认证附件。", type: "system" },
    ],
  },
  {
    sid: 43,
    name: "Gulf Fresh Logistics",
    participants: [102, 9001],
    accounts: conversationAccounts(102),
    customers: conversationCustomers(102),
    display_updated_at: "2026-09-07 09:48",
    display_latest_content: "系统推荐卡片",
    messages: [
      { external_mid: "msg-004", sid: 43, sender: 102, read: false, content: "Could you share the warranty extension options for a tiered order?", type: "text" },
      { external_mid: "msg-005", sid: 43, sender: 9001, read: true, content: "Thanks Ahmed. I will check the warranty extension policy and share a tiered quote today.", type: "text" },
      { external_mid: "msg-006", sid: 43, sender: 9001, read: true, content: { card_id: "card-product-001", label: "系统推荐卡片" }, type: "card" },
    ],
  },
  {
    sid: 44,
    name: "North Harbor Supplies",
    participants: [103, 9001],
    accounts: conversationAccounts(103),
    customers: conversationCustomers(103),
    display_updated_at: "2026-09-06 22:11",
    display_latest_content: "系统推荐卡片",
    messages: [
      { external_mid: "msg-007", sid: 44, sender: 103, read: false, content: "Can you send the latest catalog and sample terms?", type: "text" },
      { external_mid: "msg-008", sid: 44, sender: 9001, read: true, content: { card_id: "card-generic-001", label: "系统推荐卡片" }, type: "card" },
    ],
  },
];

export const replySuggestions: ReplySuggestions = {
  buyer_language: "English",
  items: [
    {
      zh: "正式报价回复",
      reply: "Thanks for your interest. We can provide the sample cost, CE certificate, and lead time today. May I confirm your target quantity and preferred packaging?",
    },
    {
      zh: "友好推进样品",
      reply: "Happy to help. I will send the CE certificate first, then prepare a sample quote with shipping options for your review.",
    },
    {
      zh: "紧急高意向跟进",
      reply: "We have sample stock available this week. If the certificate meets your requirement, I can reserve samples and arrange dispatch quickly.",
    },
  ],
};

export const assistantSuggestions = replySuggestionsToAssistantSuggestions(replySuggestions);
export const conversations = crmConversations.map((conversation) => toConversationDetail(conversation, userInfos, mockSelfInfo, businessCards));
