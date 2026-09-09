"use client";

import { Avatar, Button, Card, Space, Typography } from "antd";
import { BusinessCardView } from "@/components/BusinessCardView";
import type { ChatMessage } from "@/types/chat";

export function MessageTimeline({ messages, showTranslations = true, onRegenerate, onOpenCard }: { messages: ChatMessage[]; showTranslations?: boolean; onRegenerate: (message: ChatMessage) => void; onOpenCard: (cardId: string) => void }) {
  return (
    <Space orientation="vertical" className="w-full" size="middle">
      {messages.map((message) => {
        const isSeller = message.role === "seller";
        const isSystem = message.role === "system";
        return (
          <div key={message.id} className={`flex ${isSeller ? "justify-end" : "justify-start"}`}>
            <div className={`flex max-w-[78%] gap-3 ${isSeller ? "flex-row-reverse" : ""}`}>
              <Avatar style={{ backgroundColor: isSeller ? "#1677ff" : isSystem ? "#64748b" : "#10b981" }}>{isSeller ? "卖" : isSystem ? "系" : message.role === "card" ? "卡" : "买"}</Avatar>
              <Card size="small" className={isSeller ? "bg-blue-50" : isSystem ? "bg-slate-50" : "bg-white"}>
                <Space orientation="vertical" size={8} className="w-full">
                  <Typography.Text type="secondary" className="text-xs">{message.createdAt}</Typography.Text>
                  {message.card ? (
                    <BusinessCardView card={message.card} compact onClick={() => onOpenCard(message.card!.id)} />
                  ) : (
                    <Typography.Paragraph className="!mb-0 whitespace-pre-wrap">{message.content}</Typography.Paragraph>
                  )}
                  {showTranslations && message.translatedContent ? (
                    <Typography.Paragraph className="!mb-0 rounded-lg bg-white/70 p-2 text-slate-600">译文：{message.translatedContent}</Typography.Paragraph>
                  ) : null}
                  {showTranslations && message.role === "buyer" && message.translatedContent ? (
                    <Button size="small" type="link" onClick={() => onRegenerate(message)}>重新翻译</Button>
                  ) : null}
                </Space>
              </Card>
            </div>
          </div>
        );
      })}
    </Space>
  );
}
