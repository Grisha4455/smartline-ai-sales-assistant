/**
 * Доменные типы AI-модуля SmartLine.
 *
 * Важно: это типы AI-надстройки, а не интернет-магазина.
 * Товары / клиенты / заявки приходят из УЖЕ СУЩЕСТВУЮЩИХ систем бизнеса
 * (каталог, CRM) — здесь описан только тот контракт, который нужен AI-модулю.
 */

/* ------------------------------------------------------------------ */
/* Каталог (внешняя система — read-only для AI-модуля)                 */
/* ------------------------------------------------------------------ */

export type UseCase = 'gaming' | 'photo' | 'work' | 'basic' | 'battery'

export type Availability = 'in_stock' | 'low_stock' | 'preorder'

export interface Product {
  /** SKU из существующего каталога магазина */
  id: string
  brand: string
  model: string
  /** Цена в BYN */
  price: number
  oldPrice?: number
  storage: number
  ram: number
  chipset: string
  /** Оценки 0–10, используются движком подбора */
  scores: {
    performance: number
    camera: number
    battery: number
    display: number
  }
  cameraMp: number
  batteryMah: number
  screen: string
  rating: number
  reviews: number
  availability: Availability
  /** Акцентный цвет карточки — заменяет реальные фото в DEMO-режиме */
  color: string
  tags: string[]
  highlights: string[]
}

/* ------------------------------------------------------------------ */
/* Профиль потребности, который собирает AI                            */
/* ------------------------------------------------------------------ */

export type CameraPriority = 'low' | 'normal' | 'high'
export type PurchaseMethod = 'full' | 'installment' | 'credit' | 'research'
export type Intent = 'purchase' | 'comparison' | 'research' | 'support'

/** Слоты профиля, по которым клиент может сказать «не важно». */
export type NoPreferenceSlot = 'budget' | 'useCase' | 'storage' | 'cameraPriority'

export interface NeedProfile {
  budget?: number
  useCase?: UseCase
  storage?: number
  cameraPriority?: CameraPriority
  brandPreference?: string
  intent: Intent
  /**
   * Слоты, по которым клиент явно сказал «не важно / не знаю».
   * Такой слот считается закрытым: AI не повторяет вопрос,
   * а менеджер видит, что параметр не является требованием.
   */
  noPreference?: NoPreferenceSlot[]
  /** Уверенность квалификации 0–1 — считается по закрытым слотам */
  confidence: number
}

/* ------------------------------------------------------------------ */
/* Диалог                                                             */
/* ------------------------------------------------------------------ */

export type MessageAuthor = 'ai' | 'client' | 'manager'

export interface QuickReply {
  label: string
  /** Значение, которое уходит в движок подбора вместо текста */
  value: string
}

export interface ChatMessage {
  id: string
  author: MessageAuthor
  text: string
  time: string
  /** Варианты быстрого ответа, показанные под сообщением AI */
  quickReplies?: QuickReply[]
  /** Карточки товаров внутри сообщения AI */
  products?: Recommendation[]
  /** Служебные блоки, которые рисуются внутри ленты диалога */
  widget?: 'need-profile' | 'purchase-method' | 'contact-form' | 'lead-created' | 'selected-product'
  /** Для widget: 'selected-product' / 'lead-created' */
  meta?: { productId?: string; leadId?: string }
}

export interface Recommendation {
  product: Product
  /** Итоговый балл соответствия профилю, 0–100 */
  matchScore: number
  /** Объяснение AI: почему именно этот товар */
  reason: string
  /** Короткая метка-бейдж: «Лучший выбор», «Экономнее» и т.д. */
  badge?: string
}

/* ------------------------------------------------------------------ */
/* Заявка (передаётся в существующую CRM)                              */
/* ------------------------------------------------------------------ */

export type LeadStatus = 'new' | 'in_progress' | 'replied' | 'won' | 'lost'
export type LeadSource = 'ai_assistant' | 'site_form' | 'phone' | 'manager'

export interface Lead {
  id: string
  createdAt: string
  client: {
    name: string
    phone: string
    city?: string
    isReturning?: boolean
  }
  source: LeadSource
  status: LeadStatus
  profile: NeedProfile
  /** Выбранный клиентом товар */
  productId?: string
  /** Что AI предлагал в диалоге */
  recommendedIds: string[]
  purchaseMethod?: PurchaseMethod
  transcript: ChatMessage[]
  /** Резюме диалога, подготовленное AI для менеджера */
  aiSummary: AiSummary
  /** Черновик ответа клиенту, подготовленный AI */
  aiReply: string
  /** Оценка AI: насколько лид «горячий», 0–100 */
  leadScore: number
  /** Закреплённый сценарий для демонстрации */
  isDemoScenario?: boolean
  /** Заявка создана прямо сейчас, в этом сеансе демонстрации */
  isLive?: boolean
  /** Заполняется после нажатия «Отправить» в DEMO-режиме */
  replySentAt?: string
  managerNote?: string
}

export interface AiSummary {
  paragraphs: string[]
  recommendedAction: string
  facts: { label: string; value: string }[]
}

/* ------------------------------------------------------------------ */
/* Клиенты и сделки (из существующей CRM)                              */
/* ------------------------------------------------------------------ */

export interface Client {
  id: string
  name: string
  phone: string
  city: string
  orders: number
  totalSpent: number
  lastContact: string
  tags: string[]
}

export interface Deal {
  id: string
  client: string
  productId: string
  amount: number
  closedAt: string
  source: LeadSource
}

/* ------------------------------------------------------------------ */
/* Аналитика AI-модуля                                                */
/* ------------------------------------------------------------------ */

export interface AnalyticsSnapshot {
  kpis: {
    key: string
    label: string
    value: string
    delta?: string
    hint: string
    trend: 'up' | 'down' | 'flat'
  }[]
  dialogsByDay: { day: string; dialogs: number; qualified: number }[]
  topIntents: { label: string; share: number }[]
  funnel: { label: string; value: number }[]
}
