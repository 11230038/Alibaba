import type { BusinessCard, GenericCard, InquiryCard, ProductCard } from "@/types/cards";

export function productCardToBusinessCard(card: ProductCard, index = 0): BusinessCard {
  return {
    id: card.card_id,
    title: card.title,
    type: "product",
    status: card.expired ? "draft" : "published",
    summary: `${card.display_price || card.price} · MOQ ${card.moq}${card.moq_unit}`,
    owner: "商品卡片",
    updatedAt: offsetDate(index),
    tags: ["产品卡", card.product_id].filter(Boolean),
    coverTone: "#e6f4ff",
    recommendedScenario: "客户询问商品价格、起订量、链接或样品时使用。",
    details: [
      { label: "价格", value: card.display_price || card.price },
      { label: "MOQ", value: `${card.moq}${card.moq_unit}` },
      { label: "商品 ID", value: card.product_id },
      { label: "链接", value: card.product_url },
    ],
  };
}

export function inquiryCardToBusinessCard(card: InquiryCard, index = 0): BusinessCard {
  const firstProduct = card.products[0];
  return {
    id: card.inquiry_id,
    title: firstProduct?.product_name ?? "询盘卡片",
    type: "inquiry",
    status: card.is_seller ? "published" : "reviewing",
    summary: card.inquiry_content,
    owner: card.is_seller ? "卖家询盘池" : "买家询盘池",
    updatedAt: offsetDate(index + 1),
    tags: ["询盘", `${card.products.length} 个商品`, `${card.attachment_count} 个附件`],
    coverTone: "#fff7e6",
    recommendedScenario: "客户围绕询盘商品、附件或报价细节沟通时使用。",
    details: [
      { label: "询盘 ID", value: card.inquiry_id },
      { label: "商品数", value: String(card.products.length) },
      { label: "附件", value: card.attachment_count },
      ...(firstProduct ? [{ label: "首个商品", value: firstProduct.product_name }] : []),
    ],
  };
}

export function genericCardToBusinessCard(card: GenericCard, index = 0): BusinessCard {
  const payload = parseGenericPayload(card.raw_json);
  return {
    id: card.card_id,
    title: payload.title ?? `通用卡片 ${card.card_id}`,
    type: "generic",
    status: "published",
    summary: payload.summary ?? "通用运营卡片",
    owner: payload.owner ?? "通用卡片",
    updatedAt: offsetDate(index + 2),
    tags: payload.tags ?? ["通用卡", `类型 ${card.card_type}`],
    coverTone: "#f6ffed",
    recommendedScenario: payload.scenario ?? "客户沟通需要补充标准化话术或资料时使用。",
    details: [
      { label: "卡片类型", value: String(card.card_type) },
      { label: "来源", value: card.source_url },
    ],
  };
}

export function documentCardsToBusinessCards({
  productCards,
  inquiryCards,
  genericCards,
}: {
  productCards: ProductCard[];
  inquiryCards: InquiryCard[];
  genericCards: GenericCard[];
}): BusinessCard[] {
  return [
    ...productCards.map(productCardToBusinessCard),
    ...inquiryCards.map(inquiryCardToBusinessCard),
    ...genericCards.map(genericCardToBusinessCard),
  ];
}

export function getCardTypeLabel(type: BusinessCard["type"]) {
  return {
    product: "产品卡",
    inquiry: "询盘卡",
    generic: "通用卡",
  }[type];
}

export function getCardStatusLabel(status: BusinessCard["status"]) {
  return {
    published: "已发布",
    draft: "草稿",
    reviewing: "待审核",
  }[status];
}

function parseGenericPayload(rawJson: string): Partial<{ title: string; summary: string; owner: string; scenario: string; tags: string[] }> {
  try {
    const value = JSON.parse(rawJson) as Partial<{ title: string; summary: string; owner: string; scenario: string; tags: string[] }>;
    return value;
  } catch {
    return {};
  }
}

function offsetDate(offset: number) {
  return `2026-09-${String(Math.max(1, 7 - offset)).padStart(2, "0")} ${String(9 + offset).padStart(2, "0")}:12`;
}
