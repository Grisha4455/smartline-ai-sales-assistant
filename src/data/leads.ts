import { aiService } from '../services/aiService'
import { productService } from '../services/productService'
import type { ChatMessage, Lead, LeadSource, LeadStatus, NeedProfile, PurchaseMethod } from '../types'

/**
 * DEMO-заявки для панели менеджера.
 *
 * Заявка #SL-1048 — заранее подготовленный эталонный сценарий:
 * она уже лежит в панели, а при прохождении клиентского флоу
 * перезаписывается живым диалогом (см. leadService.createLead).
 */

export const DEMO_SCENARIO_LEAD_ID = 'SL-1048'

/* ------------------------------------------------------------------ */
/* Утилиты времени: заявки всегда выглядят свежими                     */
/* ------------------------------------------------------------------ */

const NOW = Date.now()
const minutesAgo = (m: number) => new Date(NOW - m * 60_000).toISOString()
const hoursAgo = (h: number) => minutesAgo(h * 60)
const daysAgo = (d: number) => hoursAgo(d * 24)

function clockOf(iso: string): string {
  return new Date(iso).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
}

/* ------------------------------------------------------------------ */
/* Конструктор заявки                                                  */
/* ------------------------------------------------------------------ */

interface LeadSeed {
  id: string
  createdAt: string
  name: string
  phone: string
  city?: string
  isReturning?: boolean
  source?: LeadSource
  status: LeadStatus
  profile: NeedProfile
  productId?: string
  recommendedIds?: string[]
  purchaseMethod?: PurchaseMethod
  transcript: ChatMessage[]
  isDemoScenario?: boolean
  replySentAt?: string
  managerNote?: string
}

function buildLead(seed: LeadSeed): Lead {
  return {
    id: seed.id,
    createdAt: seed.createdAt,
    client: {
      name: seed.name,
      phone: seed.phone,
      city: seed.city,
      isReturning: seed.isReturning,
    },
    source: seed.source ?? 'ai_assistant',
    status: seed.status,
    profile: seed.profile,
    productId: seed.productId,
    recommendedIds: seed.recommendedIds ?? [],
    purchaseMethod: seed.purchaseMethod,
    transcript: seed.transcript,
    aiSummary: aiService.buildSummary({
      profile: seed.profile,
      productId: seed.productId,
      purchaseMethod: seed.purchaseMethod,
      clientName: seed.name,
    }),
    aiReply: aiService.buildReply({
      clientName: seed.name,
      productId: seed.productId,
      purchaseMethod: seed.purchaseMethod,
    }),
    leadScore: aiService.scoreLead({
      profile: seed.profile,
      productId: seed.productId,
      purchaseMethod: seed.purchaseMethod,
    }),
    isDemoScenario: seed.isDemoScenario,
    replySentAt: seed.replySentAt,
    managerNote: seed.managerNote,
  }
}

/** Короткая запись диалога: ['client', 'текст'] */
type Line = [ChatMessage['author'], string, ChatMessage['widget']?]

function transcriptOf(createdAt: string, lines: Line[]): ChatMessage[] {
  const start = new Date(createdAt).getTime() - lines.length * 25_000
  return lines.map(([author, text, widget], index) => ({
    id: `m${index}`,
    author,
    text,
    time: clockOf(new Date(start + index * 25_000).toISOString()),
    widget,
  }))
}

/* ------------------------------------------------------------------ */
/* Эталонный сценарий #SL-1048                                         */
/* ------------------------------------------------------------------ */

const scenarioProfile: NeedProfile = {
  budget: 2000,
  useCase: 'gaming',
  storage: 256,
  cameraPriority: 'low',
  intent: 'purchase',
  confidence: 1,
}

const scenarioCreatedAt = minutesAgo(4)
const scenarioRecommendations = productService.recommend(scenarioProfile, 3)

/** Диалог эталонного сценария — точно такой же, как генерирует живой флоу. */
function scenarioTranscript(): ChatMessage[] {
  const base = transcriptOf(scenarioCreatedAt, [
    ['ai', 'Привет! Помогу подобрать смартфон под ваши задачи и бюджет.'],
    ['client', 'Нужен хороший телефон для игр до 2000 BYN.'],
    ['ai', 'Отлично. Тогда я подберу модели с хорошей производительностью и охлаждением.'],
    ['ai', 'Сколько памяти вам желательно?'],
    ['client', '256 GB'],
    ['ai', 'Понял.'],
    ['ai', 'А камера для вас важна?'],
    ['client', 'Не очень'],
    ['ai', 'Понял, камера не в приоритете — сделаю акцент на производительности.'],
    ['ai', 'Спасибо, этого достаточно. Вот как я понял вашу задачу:', 'need-profile'],
    ['ai', 'Я нашёл 3 варианта, которые соответствуют вашим требованиям.'],
    ['client', 'Выбираю Samsung Galaxy S26'],
    ['ai', 'Отличный выбор. Samsung Galaxy S26 — 1 999 BYN.'],
    ['ai', 'Могу передать ваши данные менеджеру, чтобы он уточнил наличие и доступные способы оплаты.'],
    ['ai', 'Как вам удобнее приобрести смартфон?', 'purchase-method'],
    ['client', 'Рассрочка'],
    ['ai', 'Хорошо. Передам менеджеру ваше предпочтение, чтобы он уточнил доступные условия рассрочки.'],
    ['ai', 'Оставьте номер телефона, и менеджер свяжется с вами.', 'contact-form'],
    ['client', 'Александр, +375 29 764 18 03'],
    ['ai', 'Александр, спасибо! Заявка передана менеджеру вместе с историей нашего диалога.', 'lead-created'],
  ])

  // Карточки товаров живут внутри реплики AI — как в клиентском интерфейсе
  const cardsIndex = base.findIndex((m) => m.text.startsWith('Я нашёл 3 варианта'))
  if (cardsIndex >= 0) base[cardsIndex] = { ...base[cardsIndex], products: scenarioRecommendations }
  return base
}

export const demoScenarioLead: Lead = buildLead({
  id: DEMO_SCENARIO_LEAD_ID,
  createdAt: scenarioCreatedAt,
  name: 'Александр',
  phone: '+375 29 764 18 03',
  city: 'Минск',
  status: 'new',
  profile: scenarioProfile,
  productId: 'SM-S26',
  recommendedIds: scenarioRecommendations.map((r) => r.product.id),
  purchaseMethod: 'installment',
  transcript: scenarioTranscript(),
  isDemoScenario: true,
})

/* ------------------------------------------------------------------ */
/* Остальные 9 заявок                                                  */
/* ------------------------------------------------------------------ */

const otherLeads: Lead[] = [
  buildLead({
    id: 'SL-1047',
    createdAt: minutesAgo(38),
    name: 'Марина',
    phone: '+375 33 512 44 07',
    city: 'Минск',
    status: 'new',
    profile: { budget: 2600, useCase: 'photo', storage: 256, cameraPriority: 'high', intent: 'purchase', confidence: 1 },
    productId: 'GP-10',
    recommendedIds: ['GP-10', 'HO-M7P', 'XI-14T'],
    purchaseMethod: 'full',
    transcript: transcriptOf(minutesAgo(38), [
      ['ai', 'Привет! Помогу подобрать смартфон под ваши задачи и бюджет.'],
      ['client', 'Хочу телефон с лучшей камерой, бюджет около 2600'],
      ['ai', 'Хорошо. Сделаю акцент на качестве камеры и обработке снимков.'],
      ['ai', 'Сколько памяти вам желательно?'],
      ['client', '256'],
      ['ai', 'А камера для вас важна?'],
      ['client', 'Очень важна, снимаю для блога'],
      ['ai', 'Я нашёл 3 варианта, которые соответствуют вашим требованиям.'],
      ['client', 'Беру Pixel 10'],
      ['ai', 'Оставьте номер телефона, и менеджер свяжется с вами.'],
    ]),
  }),
  buildLead({
    id: 'SL-1046',
    createdAt: hoursAgo(2),
    name: 'Дмитрий',
    phone: '+375 29 118 90 22',
    city: 'Гомель',
    status: 'new',
    profile: { budget: 1500, useCase: 'gaming', storage: 256, cameraPriority: 'normal', intent: 'purchase', confidence: 1 },
    productId: 'PO-F8P',
    recommendedIds: ['PO-F8P', 'XI-14T', 'MO-E60'],
    purchaseMethod: 'installment',
    transcript: transcriptOf(hoursAgo(2), [
      ['ai', 'Привет! Помогу подобрать смартфон под ваши задачи и бюджет.'],
      ['client', 'Телефон для игр, но не дороже 1500'],
      ['ai', 'Отлично. Тогда я подберу модели с хорошей производительностью и охлаждением.'],
      ['client', '256 гб, камера средне'],
      ['ai', 'Я нашёл 3 варианта, которые соответствуют вашим требованиям.'],
      ['client', 'Poco F8 Pro подойдёт'],
    ]),
  }),
  buildLead({
    id: 'SL-1045',
    createdAt: hoursAgo(5),
    name: 'Екатерина',
    phone: '+375 25 330 71 55',
    city: 'Брест',
    status: 'in_progress',
    profile: { budget: 1300, useCase: 'basic', storage: 128, cameraPriority: 'normal', intent: 'purchase', confidence: 1 },
    productId: 'SM-A57',
    recommendedIds: ['SM-A57', 'MO-E60', 'RM-N14'],
    purchaseMethod: 'full',
    managerNote: 'Перезвонить после 18:00, просила не звонить в рабочее время.',
    transcript: transcriptOf(hoursAgo(5), [
      ['ai', 'Привет! Помогу подобрать смартфон под ваши задачи и бюджет.'],
      ['client', 'Нужен простой телефон маме, до 1300'],
      ['ai', 'Хорошо. Подберу простые и надёжные модели без переплаты.'],
      ['client', '128 достаточно'],
      ['ai', 'Я нашёл 3 варианта, которые соответствуют вашим требованиям.'],
      ['client', 'Galaxy A57 выглядит хорошо'],
    ]),
  }),
  buildLead({
    id: 'SL-1044',
    createdAt: hoursAgo(7),
    name: 'Сергей',
    phone: '+375 29 445 12 80',
    city: 'Минск',
    isReturning: true,
    status: 'in_progress',
    profile: { budget: 4000, useCase: 'work', storage: 512, cameraPriority: 'high', intent: 'purchase', confidence: 1 },
    productId: 'IP-17PM',
    recommendedIds: ['IP-17PM', 'SM-S26U', 'XI-15U'],
    purchaseMethod: 'credit',
    managerNote: 'Повторный клиент, покупал S24 в 2024. Просит trade-in.',
    transcript: transcriptOf(hoursAgo(7), [
      ['ai', 'Привет! Помогу подобрать смартфон под ваши задачи и бюджет.'],
      ['client', 'Нужен топовый айфон для работы, до 4000'],
      ['ai', 'Понял. Подберу модели с хорошей автономностью и стабильной работой.'],
      ['client', 'Память 512, камера важна'],
      ['ai', 'Я нашёл 3 варианта, которые соответствуют вашим требованиям.'],
      ['client', 'Можно ли сдать старый телефон?'],
      [
        'ai',
        'Trade-in доступен: старый смартфон оценивается и его стоимость идёт в зачёт покупки. Точную оценку делает менеджер по состоянию устройства.',
      ],
    ]),
  }),
  buildLead({
    id: 'SL-1043',
    createdAt: hoursAgo(9),
    name: 'Ольга',
    phone: '+375 33 901 63 14',
    city: 'Витебск',
    status: 'in_progress',
    profile: { budget: 1800, useCase: 'battery', storage: 256, cameraPriority: 'low', intent: 'purchase', confidence: 1 },
    productId: 'OP-13',
    recommendedIds: ['OP-13', 'RM-14P', 'XI-15'],
    purchaseMethod: 'installment',
    transcript: transcriptOf(hoursAgo(9), [
      ['ai', 'Привет! Помогу подобрать смартфон под ваши задачи и бюджет.'],
      ['client', 'Главное — чтобы держал батарею весь день, до 1800'],
      ['ai', 'Понял. Сделаю акцент на ёмкости батареи и скорости зарядки.'],
      ['client', '256, камера не очень важна'],
      ['ai', 'Я нашёл 3 варианта, которые соответствуют вашим требованиям.'],
      ['client', 'OnePlus 13'],
    ]),
  }),
  buildLead({
    id: 'SL-1042',
    createdAt: daysAgo(1),
    name: 'Павел',
    phone: '+375 29 677 05 41',
    city: 'Минск',
    status: 'replied',
    profile: { budget: 1700, useCase: 'gaming', storage: 256, cameraPriority: 'low', intent: 'purchase', confidence: 1 },
    productId: 'XI-15',
    recommendedIds: ['XI-15', 'RM-14P', 'PO-F8P'],
    purchaseMethod: 'full',
    replySentAt: hoursAgo(20),
    transcript: transcriptOf(daysAgo(1), [
      ['ai', 'Привет! Помогу подобрать смартфон под ваши задачи и бюджет.'],
      ['client', 'Хочу Xiaomi для игр, бюджет 1700'],
      ['ai', 'Отлично. Тогда я подберу модели с хорошей производительностью и охлаждением.'],
      ['client', '256, камера не важна'],
      ['ai', 'Я нашёл 3 варианта, которые соответствуют вашим требованиям.'],
      ['client', 'Xiaomi 15'],
    ]),
  }),
  buildLead({
    id: 'SL-1041',
    createdAt: daysAgo(2),
    name: 'Анна',
    phone: '+375 25 214 88 36',
    city: 'Могилёв',
    status: 'won',
    profile: { budget: 1400, useCase: 'photo', storage: 256, cameraPriority: 'high', intent: 'purchase', confidence: 1 },
    productId: 'XI-14T',
    recommendedIds: ['XI-14T', 'HO-200', 'RM-N14'],
    purchaseMethod: 'full',
    replySentAt: daysAgo(2),
    managerNote: 'Оплатила онлайн, доставка выполнена.',
    transcript: transcriptOf(daysAgo(2), [
      ['ai', 'Привет! Помогу подобрать смартфон под ваши задачи и бюджет.'],
      ['client', 'Нужен телефон с хорошей камерой до 1400'],
      ['ai', 'Хорошо. Сделаю акцент на качестве камеры и обработке снимков.'],
      ['client', '256 гб'],
      ['ai', 'Я нашёл 3 варианта, которые соответствуют вашим требованиям.'],
      ['client', 'Xiaomi 14T'],
    ]),
  }),
  buildLead({
    id: 'SL-1040',
    createdAt: daysAgo(3),
    name: 'Игорь',
    phone: '+375 29 305 27 19',
    city: 'Минск',
    status: 'won',
    profile: { budget: 2100, useCase: 'gaming', storage: 512, cameraPriority: 'normal', intent: 'purchase', confidence: 1 },
    productId: 'OP-13',
    recommendedIds: ['OP-13', 'SM-S26', 'XI-15'],
    purchaseMethod: 'installment',
    replySentAt: daysAgo(3),
    managerNote: 'Оформлена рассрочка на 12 месяцев.',
    transcript: transcriptOf(daysAgo(3), [
      ['ai', 'Привет! Помогу подобрать смартфон под ваши задачи и бюджет.'],
      ['client', 'Игровой телефон, 512 памяти, до 2100'],
      ['ai', 'Отлично. Тогда я подберу модели с хорошей производительностью и охлаждением.'],
      ['ai', 'Я нашёл 3 варианта, которые соответствуют вашим требованиям.'],
      ['client', 'OnePlus 13, интересует рассрочка'],
    ]),
  }),
  buildLead({
    id: 'SL-1039',
    createdAt: daysAgo(4),
    name: 'Виктор',
    phone: '+375 33 748 51 62',
    city: 'Гродно',
    status: 'lost',
    profile: { budget: 700, useCase: 'gaming', storage: 256, cameraPriority: 'normal', intent: 'research', confidence: 0.75 },
    recommendedIds: [],
    purchaseMethod: 'research',
    managerNote: 'Бюджет ниже минимальной цены игровых моделей. Отправлено предложение на A37.',
    transcript: transcriptOf(daysAgo(4), [
      ['ai', 'Привет! Помогу подобрать смартфон под ваши задачи и бюджет.'],
      ['client', 'Игровой телефон до 700 рублей'],
      ['ai', 'Отлично. Тогда я подберу модели с хорошей производительностью и охлаждением.'],
      [
        'ai',
        'В указанный бюджет подходящих моделей сейчас нет. Ближайший вариант — Samsung Galaxy A37 за 849 BYN. Могу передать запрос менеджеру, он подскажет по акциям и trade-in.',
      ],
      ['client', 'Пока просто смотрю'],
    ]),
  }),
]

export const demoLeads: Lead[] = [demoScenarioLead, ...otherLeads]
