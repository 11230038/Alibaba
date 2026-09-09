import type { HomeDashboard } from "@/types/home";
import { businessCards } from "@/mock/cardData";
import { crmConversations, userInfos } from "@/mock/conversationData";
import { mockSelfInfo } from "@/mock/selfData";
import { tasks } from "@/mock/statusData";

export const homeDashboard: HomeDashboard = {
  info: mockSelfInfo,
  metrics: [
    { key: "conversations", title: "活跃会话", value: crmConversations.length, delta: { value: 12.4, direction: "up", label: "较昨日" } },
    { key: "unread", title: "待回复客户", value: crmConversations.reduce((count, item) => count + item.messages.filter((message) => message.sender_id !== mockSelfInfo.ali_id && !message.is_system).length, 0), delta: { value: 6.1, direction: "down", label: "较昨日" } },
    { key: "cards", title: "可用卡片", value: businessCards.length, delta: { value: 4, direction: "up", label: "本周新增" } },
    { key: "agent", title: "Agent 可用率", value: 96.8, suffix: "%", delta: { value: 1.2, direction: "up", label: "近 24h" } },
  ],
  cardTrends: [
    { label: "周一", value: 42 },
    { label: "周二", value: 58 },
    { label: "周三", value: 51 },
    { label: "周四", value: 73 },
    { label: "周五", value: 69 },
    { label: "周六", value: 46 },
    { label: "周日", value: 61 },
  ],
  customerSummaries: userInfos.slice(0, 3).map((user) => ({
    key: user.ali_id,
    name: [user.first_name, user.last_name].filter(Boolean).join(" "),
    stage: user.potential_score >= 80 ? "高意向" : "新线索",
    nextAction: user.valid_inquiry_count >= 5 ? "发送阶梯报价" : "补充认证资料",
    priority: user.potential_score >= 80 ? "high" : "medium",
  })),
  capabilities: [
    { key: "translation", agent: "翻译 Agent", ability: "消息翻译 / 贸易术语", coverage: 92, status: "healthy" },
    { key: "reply-suggestion", agent: "回复建议 Agent", ability: "多语回复 / 客户跟进", coverage: 88, status: "healthy" },
    { key: "intent-analysis", agent: "客户意图分析 Agent", ability: "意图识别 / 风险判断", coverage: 76, status: "warning" },
  ],
  tasks,
};
