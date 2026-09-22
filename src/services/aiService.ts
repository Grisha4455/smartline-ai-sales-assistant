import { productService, formatPrice } from './productService'
import type {
  AiSummary,
  CameraPriority,
  ChatMessage,
  Lead,
  NeedProfile,
  NoPreferenceSlot,
  PurchaseMethod,
  QuickReply,
  Recommendation,
  UseCase,
} from '../types'

/* ================================================================== *
 *  aiService — «мозг» AI-модуля SmartLine
 * ==================================================================
 *
 *  DEMO-РЕЖИМ: все ответы генерируются локальным детерминированным
 *  движком (demoProvider ниже). Никаких внешних вызовов нет — демо
 *  работает офлайн и всегда воспроизводимо, что важно для показа.
 *
 *  ┌─ ТОЧКА ПОДКЛЮЧЕНИЯ РЕАЛЬНОГО AI ──────────────────────────────┐
 *  │ Контракт AiProvider специально сделан минимальным.            │
 *  │ Чтобы подключить Anthropic / OpenAI, нужно:                   │
 *  │   1. реализовать AiProvider (см. шаблон в конце файла);       │
 *  │   2. заменить одну строку: const provider = demoProvider;     │
 *  │ Компоненты UI об этом ничего не знают.                        │
 *  └───────────────────────────────────────────────────────────────┘
 */

/* ------------------------------------------------------------------ */
/* Контракт диалогового движка                                         */
/* ------------------------------------------------------------------ */

export type Stage = 'discovery' | 'recommending' | 'selected' | 'qualifying' | 'contacts' | 'done'
export type AwaitingSlot =
  | 'need'
  | 'budget'
  | 'storage'
  | 'camera'
  | 'purchase'
  | 'contacts'
  | 'product'
  | 'none'

export interface ConversationState {
  profile: NeedProfile
  stage: Stage
  awaiting: AwaitingSlot
  selectedProductId?: string
  purchaseMethod?: PurchaseMethod
  recommendedIds: string[]
  answeredFaq: string[]
  /** Сколько раз подряд не удалось разобрать ответ на вопрос по слоту */
  failedAttempts: Partial<Record<AwaitingSlot, number>>
}

/** Одна «реплика» AI. Несколько реплик подряд создают эффект живого диалога. */
export interface AiTurn {
  text: string
  quickReplies?: QuickReply[]
  products?: Recommendation[]
  widget?: ChatMessage['widget']
  meta?: ChatMessage['meta']
  /** Пауза «AI печатает…» перед показом реплики, мс */
  delay?: number
}

export interface AiResult {
  state: ConversationState
  turns: AiTurn[]
}

export type AiAction =
  | { type: 'select_product'; productId: string }
  | { type: 'request_manager' }
  | { type: 'purchase_method'; value: PurchaseMethod }
  | { type: 'lead_created'; leadId: string; clientName: string }

export interface AiProvider {
  readonly id: string
  /** Реакция на свободный текст клиента */
  reply(state: ConversationState, userText: string): AiResult
  /** Реакция на нажатие кнопки в интерфейсе */
  act(state: ConversationState, action: AiAction): AiResult
  greeting(): AiTurn
}

/* ------------------------------------------------------------------ */
/* Начальное состояние                                                 */
/* ------------------------------------------------------------------ */

export function createConversationState(): ConversationState {
  return {
    profile: { intent: 'research', confidence: 0 },
    stage: 'discovery',
    awaiting: 'need',
    recommendedIds: [],
    answeredFaq: [],
    failedAttempts: {},
  }
}

/* ------------------------------------------------------------------ */
/* NLU: извлечение слотов из текста клиента                            */
/* ------------------------------------------------------------------ */

const USE_CASE_PATTERNS: { useCase: UseCase; re: RegExp }[] = [
  { useCase: 'gaming', re: /игр|gam|пубг|pubg|genshin|геншин|танк|кс(?![а-яё])|cs2|fps|стрим|шутер|доту|dota/i },
  { useCase: 'photo', re: /фот|камер|снимк|селфи|блог|видеосъ|инстаг|съёмк|съемк|портрет/i },
  { useCase: 'work', re: /работ|офис|бизнес|документ|звонк|почт|таблиц|учёб|учеб|созвон/i },
  { useCase: 'battery', re: /батар|автоном|заряд|держ(ал|ит)|аккум|долго работ/i },
  { useCase: 'basic', re: /прост|базов|родител|маме|папе|бабушк|звонить|мессендж|недорог/i },
]

const FAQ_PATTERNS: { key: string; re: RegExp; answer: string }[] = [
  {
    key: 'delivery',
    re: /доставк|привез|курьер|самовывоз|почт(а|ой)/i,
    answer:
      'По Минску доставка курьером — на следующий день, по Беларуси — 1–3 дня. Также работает самовывоз из пунктов выдачи. Точные сроки по вашему адресу подтвердит менеджер.',
  },
  {
    key: 'warranty',
    re: /гарант|ремонт|сервис|брак/i,
    answer:
      'На все смартфоны действует официальная гарантия 24 месяца с обслуживанием в авторизованных сервисных центрах.',
  },
  {
    key: 'tradein',
    re: /trade|трейд|сдать старый|обмен|доплат/i,
    answer:
      'Trade-in доступен: старый смартфон оценивается и его стоимость идёт в зачёт покупки. Точную оценку делает менеджер по состоянию устройства.',
  },
  {
    key: 'installment',
    re: /рассрочк|кредит|частям|карт(а|ой) покупок|халва/i,
    answer:
      'Рассрочка и кредит доступны. Я не оформляю их сам и не могу подтвердить одобрение — условия и решение по заявке уточняет менеджер вместе с банком.',
  },
  {
    key: 'stock',
    re: /наличи|есть ли в|на склад|когда будет/i,
    answer:
      'Наличие я вижу по каталогу на текущий момент, но перед оформлением менеджер подтверждает остаток по конкретной комплектации.',
  },
  {
    key: 'original',
    re: /оригинал|серый|ростест|еаc|еас|официальн/i,
    answer: 'Все устройства в каталоге — официально поставляемые версии с гарантией и локализацией для Беларуси.',
  },
]

interface Extraction {
  profile: NeedProfile
  filled: (keyof NeedProfile)[]
}

/** Извлекает бюджет / задачу / память / приоритет камеры из реплики клиента. */
export function extractSlots(text: string, state: ConversationState): Extraction {
  const profile: NeedProfile = { ...state.profile }
  const filled: (keyof NeedProfile)[] = []
  const lower = text.toLowerCase()

  /* --- память ----------------------------------------------------- */
  // Память разбираем первой и вырезаем из текста, иначе «512 GB»
  // ошибочно попадёт в бюджет.
  const storage = matchStorage(lower, state.awaiting === 'storage')
  if (storage && profile.storage !== storage.value) {
    profile.storage = storage.value
    filled.push('storage')
  }

  /* --- бюджет ---------------------------------------------------- */
  const budgetText = storage ? lower.replace(storage.matched, ' ') : lower
  const budget = parseBudget(budgetText)
  if (budget && profile.budget !== budget) {
    profile.budget = budget
    filled.push('budget')
  }

  /* --- приоритет камеры ------------------------------------------- */
  // Короткие «не очень» / «важна» трактуем только как ответ на наш вопрос.
  // А прямое упоминание («с хорошей камерой») ловим в любой момент диалога —
  // иначе AI переспрашивает то, что клиент уже сказал.
  const priority =
    state.awaiting === 'camera' ? parseCameraPriority(lower) : parseCameraMention(lower)
  if (priority && profile.cameraPriority !== priority) {
    profile.cameraPriority = priority
    filled.push('cameraPriority')
  }

  /* --- основная задача -------------------------------------------- */
  // Менять уже выбранную задачу можно только по явной формулировке
  // («нужен для фото»). Иначе слово «камерой» в ответе про память
  // переключало бы основную задачу клиента на фотосъёмку.
  const mayChangeUseCase = profile.useCase === undefined || EXPLICIT_TASK_RE.test(lower)
  if (mayChangeUseCase && (state.awaiting !== 'camera' || !filled.includes('cameraPriority'))) {
    for (const { useCase, re } of USE_CASE_PATTERNS) {
      if (re.test(lower)) {
        if (profile.useCase !== useCase) {
          profile.useCase = useCase
          filled.push('useCase')
        }
        break
      }
    }
  }

  /* --- предпочтение бренда ---------------------------------------- */
  const brand = productService
    .all()
    .map((p) => p.brand)
    .find((b) => new RegExp(`\\b${b}`, 'i').test(lower) || (b === 'Apple' && /айфон|iphone/i.test(lower)))
  if (brand && profile.brandPreference !== brand) {
    profile.brandPreference = brand
    filled.push('brandPreference')
  }

  /* --- намерение --------------------------------------------------- */
  profile.intent = detectIntent(lower, profile)
  profile.confidence = confidenceOf(profile)

  return { profile, filled }
}

function parseBudget(lower: string): number | undefined {
  // «до 2000 BYN», «2 000 руб», «бюджет 1500», «до 2к», «2 тысячи»
  // \b здесь не подходит: в JS границей слова кириллица не считается,
  // поэтому «2к» не матчился. Проверяем, что дальше не идёт буква.
  const thousand = lower.match(/(\d{1,2})\s*(?:к|тыс|тысяч[аи]?)(?![а-яёa-z])/)
  if (thousand) return Number(thousand[1]) * 1000

  const withCurrency = lower.match(/(\d[\d\s]{2,7})\s*(?:byn|руб|р\.|рубл|бел)/)
  if (withCurrency) return normalizeNumber(withCurrency[1])

  const withPreposition = lower.match(/(?:до|около|примерно|бюджет|в пределах|максимум)\D{0,6}(\d[\d\s]{2,7})/)
  if (withPreposition) return normalizeNumber(withPreposition[1])

  // Одинокое крупное число трактуем как бюджет: «2000»
  const bare = lower.match(/(?:^|\s)(\d[\d\s]{2,7})(?:$|\s)/)
  if (bare) {
    const value = normalizeNumber(bare[1])
    if (value >= 500 && value <= 20000) return value
  }
  return undefined
}

const KNOWN_STORAGE = [64, 128, 256, 512, 1024]

/** Возвращает объём памяти и найденную подстроку, чтобы исключить её из разбора бюджета. */
function matchStorage(lower: string, awaitingStorage: boolean): { value: number; matched: string } | undefined {
  const terabyte = lower.match(/\b1\s*(?:тб|tb|терабайт\w*)/)
  if (terabyte) return { value: 1024, matched: terabyte[0] }

  const explicit = lower.match(/(\d{2,4})\s*(?:gb|гб|g|г)(?![а-яёa-z])/)
  if (explicit && KNOWN_STORAGE.includes(Number(explicit[1]))) {
    return { value: Number(explicit[1]), matched: explicit[0] }
  }

  // «память 128», «памяти 256» — единицы клиент часто не пишет
  const labelled =
    lower.match(/памят[а-яё]*\s*(?:на\s*)?(\d{2,4})/) ?? lower.match(/(\d{2,4})\s*памят[а-яё]*/)
  if (labelled && KNOWN_STORAGE.includes(Number(labelled[1]))) {
    return { value: Number(labelled[1]), matched: labelled[0] }
  }

  const plus = lower.match(/\b(128|256|512)\s*\+/)
  if (plus) return { value: Number(plus[1]), matched: plus[0] }

  if (awaitingStorage) {
    const bare = lower.match(/\b(128|256|512|1024)\b/)
    if (bare) return { value: Number(bare[1]), matched: bare[0] }
    // «побольше» / «максимум» / «поменьше» — тоже понятные ответы
    if (/побольше|больше|максимум|много|с запасом/.test(lower)) return { value: 512, matched: '' }
    if (/поменьше|меньше|минимум|хватит и|достаточно и/.test(lower)) return { value: 128, matched: '' }
  }
  return undefined
}

/**
 * Приоритет камеры.
 *
 * ВНИМАНИЕ: \b в JS не считает кириллицу символом слова, поэтому
 * «нет\b» или «да\b» НИКОГДА не матчатся. Используем lookahead —
 * иначе клиент отвечает «нет», а AI не понимает и повторяет вопрос.
 */
function parseCameraPriority(lower: string): CameraPriority | undefined {
  if (/очень важн|критичн|приоритет|главн|максимум/.test(lower)) return 'high'
  if (/не очень|не важн|не критичн|не принципиал|без разниц|не сильно|низк|нет(?![а-яё])/.test(lower)) return 'low'
  if (/важн|нужн|да(?![а-яё])|средн|норм|хотелось|желательно/.test(lower)) return 'normal'
  return undefined
}

/**
 * Клиент сам упомянул камеру посреди разговора — например
 * «с хорошей камерой и память 128». Такое требование нужно засчитать
 * сразу, иначе AI следом спросит то, что уже услышал.
 */
function parseCameraMention(lower: string): CameraPriority | undefined {
  // \w в JS не покрывает кириллицу, поэтому окончания слов
  // перечисляем через [а-яё]* — иначе «камерой» не совпадает с «камер\w*».
  if (/камер[а-яё]*\s+не\s+(важн|нужн|принципиал|критичн)|без\s+камер|камер[а-яё]*\s+не\s+в\s+приоритет/.test(lower)) {
    return 'low'
  }
  if (
    /(хорош|отличн|мощн|качествен|топов|сильн|лучш)[а-яё]*\s+камер/.test(lower) ||
    /камер[а-яё]*\s+(очень\s+)?важн|важн[а-яё]*\s+камер|камер[а-яё]*\s+хорош/.test(lower) ||
    /главное\s+камер|упор\s+на\s+камер|акцент\s+на\s+камер/.test(lower)
  ) {
    return 'high'
  }
  return undefined
}

/**
 * Явная формулировка задачи. Только она даёт право сменить уже
 * выбранную основную задачу клиента.
 */
const EXPLICIT_TASK_RE =
  /(для|под|чтобы)\s+\S*\s*(игр|поигр|фото|съ[ёе]мк|снима|фотограф|работ|учёб|учеб|звонк|видео|блог)|вообще-то|на самом деле|передумал/i

/** «Не знаю / без разницы / подбери сам» — клиент не хочет уточнять слот. */
export const NO_PREFERENCE_RE =
  /не знаю|не в курсе|без разниц|всё равно|все равно|не важно|неважно|не принципиал|любая|любой|любое|на ваш выбор|подбери|подберите|реши(те)? сам|решай|как считаете|не могу сказать|пофиг/i

function normalizeNumber(raw: string): number {
  return Number(raw.replace(/\s/g, ''))
}

function detectIntent(lower: string, profile: NeedProfile): NeedProfile['intent'] {
  if (/сравн|или(?![а-яё])|что лучше|разниц/.test(lower)) return 'comparison'
  if (/не работает|сломал|верн|обмен|заказ №|мой заказ/.test(lower)) return 'support'
  if (/куп|заказ|беру|оформ|хочу|нужен|нужна|подбер/.test(lower)) return 'purchase'
  if (profile.budget && profile.useCase) return 'purchase'
  return 'research'
}

/** Слот считается закрытым и когда клиент сказал «не важно». */
function isResolved(profile: NeedProfile, slot: NoPreferenceSlot): boolean {
  if (profile.noPreference?.includes(slot)) return true
  switch (slot) {
    case 'budget':
      return profile.budget !== undefined
    case 'useCase':
      return profile.useCase !== undefined
    case 'storage':
      return profile.storage !== undefined
    case 'cameraPriority':
      return profile.cameraPriority !== undefined
  }
}

function confidenceOf(profile: NeedProfile): number {
  const slots: NoPreferenceSlot[] = ['budget', 'useCase', 'storage', 'cameraPriority']
  const resolved = slots.filter((slot) => isResolved(profile, slot)).length
  return Math.round((resolved / slots.length) * 100) / 100
}

/* ------------------------------------------------------------------ */
/* Диалоговая политика (DEMO-провайдер)                                */
/* ------------------------------------------------------------------ */

const STORAGE_REPLIES: QuickReply[] = [
  { label: '128 GB', value: '128 GB' },
  { label: '256 GB', value: '256 GB' },
  { label: '512 GB+', value: '512 GB' },
]

const CAMERA_REPLIES: QuickReply[] = [
  { label: 'Не очень', value: 'Не очень' },
  { label: 'Важна', value: 'Важна' },
  { label: 'Очень важна', value: 'Очень важна' },
]

const NEED_REPLIES: QuickReply[] = [
  { label: 'Для игр до 2000 BYN', value: 'Нужен хороший телефон для игр до 2000 BYN' },
  { label: 'Для фото', value: 'Нужен телефон с хорошей камерой' },
  { label: 'Для работы', value: 'Нужен телефон для работы и звонков' },
]

const USE_CASE_ACK: Record<UseCase, string> = {
  gaming: 'Отлично. Тогда я подберу модели с хорошей производительностью и охлаждением.',
  photo: 'Хорошо. Сделаю акцент на качестве камеры и обработке снимков.',
  work: 'Понял. Подберу модели с хорошей автономностью и стабильной работой.',
  battery: 'Понял. Сделаю акцент на ёмкости батареи и скорости зарядки.',
  basic: 'Хорошо. Подберу простые и надёжные модели без переплаты.',
}

const USE_CASE_TEXT: Record<UseCase, string> = {
  gaming: 'игры',
  photo: 'фото и видео',
  work: 'работа и звонки',
  battery: 'автономность',
  basic: 'повседневные задачи',
}

const CAMERA_TEXT: Record<CameraPriority, string> = {
  low: 'низкий приоритет',
  normal: 'средний приоритет',
  high: 'высокий приоритет',
}

export const PURCHASE_METHOD_OPTIONS: { value: PurchaseMethod; label: string }[] = [
  { value: 'full', label: 'Оплата сразу' },
  { value: 'installment', label: 'Рассрочка' },
  { value: 'credit', label: 'Кредит' },
  { value: 'research', label: 'Пока просто хочу узнать подробнее' },
]

export const PURCHASE_METHOD_TEXT: Record<PurchaseMethod, string> = {
  full: 'Оплата сразу',
  installment: 'Рассрочка',
  credit: 'Кредит',
  research: 'Уточняет информацию',
}

const demoProvider: AiProvider = {
  id: 'demo-rule-engine',

  greeting(): AiTurn {
    return {
      text: 'Привет! Помогу подобрать смартфон под ваши задачи и бюджет.',
      quickReplies: NEED_REPLIES,
    }
  },

  reply(state, userText) {
    const turns: AiTurn[] = []
    const faq = FAQ_PATTERNS.find((f) => f.re.test(userText))
    const { profile, filled } = extractSlots(userText, state)
    let next: ConversationState = { ...state, profile }

    // 1. Клиент задал типовой вопрос — отвечаем и возвращаемся к подбору
    if (faq && !filled.length) {
      turns.push({ text: faq.answer, delay: 900 })
      next = { ...next, answeredFaq: [...new Set([...next.answeredFaq, faq.key])] }
      // understood = true: клиент задал вопрос, а не «не понял» наш —
      // такой ход не должен приближать отказ от уточнения слота
      return { state: advance(next, turns, true), turns }
    }

    // 2. Благодарность / завершение
    if (/^(спасибо|благодар|ок|окей|отлично|понятно|пока)(?![а-яё])/i.test(userText.trim()) && !filled.length) {
      turns.push({
        text:
          next.stage === 'done'
            ? 'Рад помочь. Менеджер свяжется с вами в рабочее время.'
            : 'Пожалуйста! Если нужно — уточню характеристики или подберу другие варианты.',
        delay: 700,
      })
      return { state: next, turns }
    }

    // 2.5. «Не знаю / без разницы» — закрываем текущий вопрос и идём дальше
    if (!filled.length && NO_PREFERENCE_RE.test(userText)) {
      const pending = firstMissingSlot(next)
      const slot = pending ? SLOT_OF_QUESTION[pending] : undefined
      const relaxed = pending ? markNoPreference(next, pending) : undefined
      if (relaxed && slot) {
        turns.push({ text: NO_PREFERENCE_ACK[slot], delay: 700 })
        return { state: advance(relaxed, turns, true), turns }
      }
    }

    // 3. Подтверждаем понимание новой информации
    if (!filled.length) {
      turns.push({ text: fallbackText(next), delay: 800 })
    } else {
      // Клиент мог сказать несколько вещей сразу («с хорошей камерой
      // и память 128»). Подтверждаем ВСЁ, что услышали, иначе выглядит,
      // будто часть ответа потерялась.
      const ack = buildAck(filled, profile)
      ack.forEach((text, index) => turns.push({ text, delay: index === 0 ? 850 : 600 }))
    }

    // 4. Следующий шаг: спросить недостающее или показать подбор
    return { state: advance(next, turns, filled.length > 0), turns }
  },

  act(state, action) {
    const turns: AiTurn[] = []

    switch (action.type) {
      case 'select_product': {
        const product = productService.byId(action.productId)
        if (!product) return { state, turns }
        turns.push({
          text: `Отличный выбор. ${productService.title(product)} — ${formatPrice(product.price)} BYN.`,
          delay: 700,
        })
        turns.push({
          text: 'Могу передать ваши данные менеджеру, чтобы он уточнил наличие и доступные способы оплаты.',
          widget: 'selected-product',
          meta: { productId: product.id },
          delay: 900,
        })
        return {
          state: {
            ...state,
            stage: 'selected',
            awaiting: 'none',
            selectedProductId: product.id,
            profile: { ...state.profile, intent: 'purchase', confidence: 1 },
          },
          turns,
        }
      }

      case 'request_manager': {
        turns.push({
          text: 'Как вам удобнее приобрести смартфон?',
          widget: 'purchase-method',
          delay: 800,
        })
        return { state: { ...state, stage: 'qualifying', awaiting: 'purchase' }, turns }
      }

      case 'purchase_method': {
        turns.push({ text: purchaseAck(action.value), delay: 800 })
        turns.push({
          text: 'Оставьте номер телефона, и менеджер свяжется с вами.',
          widget: 'contact-form',
          delay: 900,
        })
        return {
          state: { ...state, stage: 'contacts', awaiting: 'contacts', purchaseMethod: action.value },
          turns,
        }
      }

      case 'lead_created': {
        turns.push({
          text: `${action.clientName}, спасибо! Заявка передана менеджеру вместе с историей нашего диалога — повторно объяснять задачу не потребуется.`,
          widget: 'lead-created',
          meta: { leadId: action.leadId },
          delay: 850,
        })
        return { state: { ...state, stage: 'done', awaiting: 'none' }, turns }
      }
    }
  },
}

/* --- вспомогательные функции политики ------------------------------ */

/**
 * Завершает ход AI: задаёт следующий вопрос или переходит к подбору.
 *
 * `understood` = удалось ли извлечь что-то из реплики клиента. Если два
 * раза подряд не поняли ответ на один и тот же вопрос — перестаём
 * переспрашивать: диалог, который зацикливается на одном вопросе,
 * выглядит хуже, чем подбор по неполным данным.
 */
function advance(state: ConversationState, turns: AiTurn[], understood: boolean): ConversationState {
  let next = state
  const pending = firstMissingSlot(next)

  if (!understood && pending) {
    const fails = (next.failedAttempts[pending] ?? 0) + 1
    next = { ...next, failedAttempts: { ...next.failedAttempts, [pending]: fails } }

    if (fails >= 2) {
      const relaxed = markNoPreference(next, pending)
      if (relaxed) {
        next = relaxed
        turns.push({
          text: 'Хорошо, не буду на этом задерживаться — подберу по остальным параметрам.',
          delay: 750,
        })
      }
    }
  }

  const missing = firstMissingSlot(next)
  if (missing) {
    next = { ...next, awaiting: missing }
    const question = questionFor(missing)
    if (question) turns.push(question)
    return next
  }

  if (next.stage === 'discovery') return { ...next, ...recommendationTransition(next, turns) }
  return { ...next, awaiting: 'none' }
}

/** Какой слот спрашиваем следующим. Слоты «не важно» пропускаем. */
function firstMissingSlot(state: ConversationState): AwaitingSlot | undefined {
  if (state.stage !== 'discovery') return undefined
  if (!isResolved(state.profile, 'useCase')) return 'need'
  if (!isResolved(state.profile, 'budget')) return 'budget'
  if (!isResolved(state.profile, 'storage')) return 'storage'
  if (!isResolved(state.profile, 'cameraPriority')) return 'camera'
  return undefined
}

/** Слот профиля, который закрывает вопрос по данному шагу диалога. */
const SLOT_OF_QUESTION: Partial<Record<AwaitingSlot, NoPreferenceSlot>> = {
  need: 'useCase',
  budget: 'budget',
  storage: 'storage',
  camera: 'cameraPriority',
}

const NO_PREFERENCE_ACK: Record<NoPreferenceSlot, string> = {
  useCase: 'Хорошо, тогда подберу универсальные модели.',
  budget: 'Понял, не буду ограничивать бюджет — покажу варианты в разных ценах.',
  storage: 'Хорошо, объём памяти не критичен — учту остальные параметры.',
  cameraPriority: 'Понял, камера не в приоритете.',
}

/**
 * Закрывает слот как «не важно».
 *
 * Нужен, чтобы диалог не зацикливался: если клиент говорит «не знаю»
 * или дважды отвечает непонятно, AI перестаёт переспрашивать и идёт
 * к подбору. Для камеры ставим нейтральный приоритет — иначе движок
 * подбора не получит ориентира.
 */
function markNoPreference(state: ConversationState, question: AwaitingSlot): ConversationState | undefined {
  const slot = SLOT_OF_QUESTION[question]
  if (!slot) return undefined

  const profile: NeedProfile = {
    ...state.profile,
    noPreference: [...new Set([...(state.profile.noPreference ?? []), slot])],
  }
  if (slot === 'cameraPriority') profile.cameraPriority = 'normal'
  if (slot === 'useCase') profile.useCase = 'basic'
  profile.confidence = confidenceOf(profile)

  return { ...state, profile }
}

function questionFor(slot: AwaitingSlot): AiTurn | undefined {
  switch (slot) {
    case 'need':
      return {
        text: 'Расскажите чуть подробнее: для каких задач нужен смартфон и какой бюджет рассматриваете?',
        quickReplies: NEED_REPLIES,
        delay: 800,
      }
    case 'budget':
      return {
        text: 'Какой бюджет рассматриваете?',
        quickReplies: [
          { label: 'до 1500 BYN', value: 'до 1500 BYN' },
          { label: 'до 2000 BYN', value: 'до 2000 BYN' },
          { label: 'до 3000 BYN', value: 'до 3000 BYN' },
        ],
        delay: 800,
      }
    case 'storage':
      return { text: 'Сколько памяти вам желательно?', quickReplies: STORAGE_REPLIES, delay: 850 }
    case 'camera':
      return { text: 'А камера для вас важна?', quickReplies: CAMERA_REPLIES, delay: 800 }
    default:
      return undefined
  }
}

/** Переход к показу профиля и подбора товаров. */
function recommendationTransition(state: ConversationState, turns: AiTurn[]): Partial<ConversationState> {
  const recommendations = productService.recommend(state.profile, 3)

  turns.push({
    text: 'Спасибо, этого достаточно. Вот как я понял вашу задачу:',
    widget: 'need-profile',
    delay: 900,
  })

  if (!recommendations.length) {
    const alternative = state.profile.budget ? productService.cheapestAbove(state.profile.budget) : undefined
    turns.push({
      text: alternative
        ? `В указанный бюджет подходящих моделей сейчас нет. Ближайший вариант — ${productService.title(alternative)} за ${formatPrice(alternative.price)} BYN. Могу передать запрос менеджеру, он подскажет по акциям и trade-in.`
        : 'Подходящих моделей по этим параметрам сейчас нет. Могу передать запрос менеджеру.',
      delay: 1000,
    })
    return { stage: 'recommending', awaiting: 'none', recommendedIds: [] }
  }

  turns.push({
    text: 'Я нашёл 3 варианта, которые соответствуют вашим требованиям.',
    products: recommendations,
    delay: 1100,
  })

  return {
    stage: 'recommending',
    awaiting: 'product',
    recommendedIds: recommendations.map((r) => r.product.id),
  }
}

/**
 * Подтверждение понятого.
 *
 * Один слот — короткая реплика, как в живом разговоре.
 * Несколько — перечисляем всё: клиент должен видеть, что его услышали
 * целиком, а не наполовину.
 */
function buildAck(filled: (keyof NeedProfile)[], profile: NeedProfile): string[] {
  const facts: string[] = []
  if (filled.includes('budget') && profile.budget) facts.push(`бюджет до ${formatPrice(profile.budget)} BYN`)
  if (filled.includes('storage') && profile.storage) facts.push(`память ${profile.storage} GB`)
  if (filled.includes('cameraPriority') && profile.cameraPriority) {
    facts.push(CAMERA_FACT[profile.cameraPriority])
  }

  const taskAck = filled.includes('useCase') && profile.useCase ? USE_CASE_ACK[profile.useCase] : undefined

  // Один факт и без смены задачи — отвечаем коротко
  if (!taskAck && facts.length === 1) {
    if (filled.includes('storage')) return ['Понял.']
    if (filled.includes('budget') && profile.budget) {
      return [`Принял, ориентируюсь на бюджет до ${formatPrice(profile.budget)} BYN.`]
    }
    if (profile.cameraPriority) return [cameraAck(profile.cameraPriority)]
  }

  // Задача подтверждена и факт всего один (обычно бюджет из той же фразы) —
  // перечислять его отдельной репликой избыточно: следующий вопрос AI
  // и так показывает, что ответ принят.
  if (taskAck && facts.length <= 1) return [taskAck]

  const lines: string[] = []
  if (taskAck) lines.push(taskAck)
  if (facts.length) lines.push(`Записал: ${facts.join(', ')}.`)
  return lines.length ? lines : ['Понял.']
}

const CAMERA_FACT: Record<CameraPriority, string> = {
  low: 'камера не в приоритете',
  normal: 'камера среднего приоритета',
  high: 'камера важна',
}

function cameraAck(priority: CameraPriority): string {
  if (priority === 'high') return 'Принял, камера в приоритете.'
  if (priority === 'low') return 'Понял, камера не в приоритете — сделаю акцент на производительности.'
  return 'Понял, учту камеру при подборе.'
}

function purchaseAck(method: PurchaseMethod): string {
  switch (method) {
    case 'installment':
      return 'Хорошо. Передам менеджеру ваше предпочтение, чтобы он уточнил доступные условия рассрочки.'
    case 'credit':
      return 'Хорошо. Передам менеджеру, чтобы он уточнил доступные кредитные программы.'
    case 'full':
      return 'Хорошо. Отмечу, что вы планируете оплату сразу.'
    case 'research':
      return 'Понял, без спешки. Менеджер просто ответит на вопросы, без давления.'
  }
}

function fallbackText(state: ConversationState): string {
  if (state.stage === 'recommending') {
    return 'Могу подробнее рассказать про любой из вариантов или подобрать другие модели — уточните, что важно поменять.'
  }
  if (state.stage === 'done') {
    return 'Заявка уже у менеджера. Если нужно что-то добавить — напишите, я передам.'
  }
  return 'Уточню, чтобы подобрать точнее.'
}

/* ------------------------------------------------------------------ */
/* Активный провайдер                                                  */
/* ------------------------------------------------------------------ */

/**
 * ⬇️ ЕДИНСТВЕННАЯ СТРОКА, КОТОРУЮ НУЖНО ПОМЕНЯТЬ ДЛЯ РЕАЛЬНОГО AI.
 *    const provider: AiProvider = createAnthropicProvider({ ... })
 */
const provider: AiProvider = demoProvider

/* ------------------------------------------------------------------ */
/* Публичный API сервиса                                               */
/* ------------------------------------------------------------------ */

export const aiService = {
  providerId: provider.id,

  greeting: () => provider.greeting(),
  reply: (state: ConversationState, text: string) => provider.reply(state, text),
  act: (state: ConversationState, action: AiAction) => provider.act(state, action),

  /** Задержка «AI печатает…»: 500–1200 мс, зависит от длины реплики. */
  typingDelay(turn: AiTurn): number {
    if (turn.delay) return clamp(turn.delay, 500, 1200)
    return clamp(400 + turn.text.length * 12, 500, 1200)
  },

  /* ---------------- Артефакты для менеджера ---------------------- */

  /** Резюме диалога: менеджеру не нужно читать всю переписку. */
  buildSummary(input: {
    profile: NeedProfile
    productId?: string
    purchaseMethod?: PurchaseMethod
    clientName: string
  }): AiSummary {
    const { profile, productId, purchaseMethod, clientName } = input
    const product = productId ? productService.byId(productId) : undefined
    const task = profile.useCase ? USE_CASE_TEXT[profile.useCase] : 'не уточнена'

    const skipped = profile.noPreference ?? []

    const paragraphs: string[] = [
      skipped.includes('useCase')
        ? 'Клиент рассматривает покупку смартфона, конкретную задачу не выделил.'
        : `Клиент заинтересован в покупке смартфона для задачи «${task}».`,
      skipped.includes('budget')
        ? 'Бюджет клиент не ограничивает.'
        : profile.budget
          ? `Бюджет — до ${formatPrice(profile.budget)} BYN.`
          : 'Бюджет не уточнён.',
    ]

    if (skipped.includes('storage')) paragraphs.push('Объём памяти для клиента не принципиален.')
    else if (profile.storage) paragraphs.push(`Предпочтительная память — от ${profile.storage} GB.`)

    if (skipped.includes('cameraPriority')) {
      paragraphs.push('Требований к камере клиент не высказал.')
    } else if (profile.cameraPriority) {
      paragraphs.push(
        profile.cameraPriority === 'low'
          ? 'Камера не является приоритетом.'
          : `Камера имеет ${CAMERA_TEXT[profile.cameraPriority]}.`,
      )
    }
    if (product) {
      paragraphs.push(`Клиент выбрал ${productService.title(product)} ${product.storage} GB.`)
    }
    if (purchaseMethod) {
      paragraphs.push(
        purchaseMethod === 'research'
          ? 'Клиент пока уточняет информацию и не готов к оформлению.'
          : `Предпочтительный способ покупки — ${PURCHASE_METHOD_TEXT[purchaseMethod].toLowerCase()}.`,
      )
    }

    const recommendedAction = product
      ? purchaseMethod === 'installment' || purchaseMethod === 'credit'
        ? `уточнить наличие ${productService.title(product)} ${product.storage} GB и предложить доступные условия ${purchaseMethod === 'installment' ? 'рассрочки' : 'кредита'}.`
        : `подтвердить наличие ${productService.title(product)} ${product.storage} GB и согласовать доставку.`
      : `предложить ${clientName} 2–3 модели в рамках бюджета и уточнить сроки покупки.`

    const fact = (slot: NoPreferenceSlot, formatted: string | undefined) =>
      skipped.includes(slot) ? 'не важно' : (formatted ?? '—')

    const facts: AiSummary['facts'] = [
      { label: 'Бюджет', value: fact('budget', profile.budget ? `до ${formatPrice(profile.budget)} BYN` : undefined) },
      {
        label: 'Задача',
        value: fact('useCase', profile.useCase ? capitalize(USE_CASE_TEXT[profile.useCase]) : undefined),
      },
      { label: 'Память', value: fact('storage', profile.storage ? `${profile.storage} GB+` : undefined) },
      {
        label: 'Камера',
        value: fact('cameraPriority', profile.cameraPriority ? CAMERA_TEXT[profile.cameraPriority] : undefined),
      },
      { label: 'Способ покупки', value: purchaseMethod ? PURCHASE_METHOD_TEXT[purchaseMethod] : '—' },
      { label: 'Намерение', value: profile.intent === 'purchase' ? 'Покупка' : 'Уточняет информацию' },
    ]

    return { paragraphs, recommendedAction, facts }
  },

  /** Черновик ответа клиенту — менеджер может отправить или отредактировать. */
  buildReply(input: { clientName: string; productId?: string; purchaseMethod?: PurchaseMethod }): string {
    const { clientName, productId, purchaseMethod } = input
    const product = productId ? productService.byId(productId) : undefined
    const lines: string[] = [`Здравствуйте, ${clientName}!`]

    if (product) {
      lines.push(`Вы оставляли заявку на ${productService.title(product)} ${product.storage} GB.`)
      lines.push('Модель подходит под ваши требования по производительности и бюджету.')
    } else {
      lines.push('Вы оставляли заявку на подбор смартфона.')
    }

    if (purchaseMethod === 'installment') lines.push('Вы также указали, что хотите рассмотреть рассрочку.')
    if (purchaseMethod === 'credit') lines.push('Вы также указали, что хотите рассмотреть кредит.')

    lines.push('Я могу уточнить актуальные условия и наличие.')
    return lines.join('\n\n')
  },

  /** «AI рекомендует следующий шаг» — подсказка для менеджера. */
  suggestNextStep(lead: Lead): string[] {
    const product = lead.productId ? productService.byId(lead.productId) : undefined
    const steps: string[] = ['Связаться с клиентом в течение рабочего дня.']

    if (product) steps.push(`Основной товар: ${productService.title(product)} ${product.storage} GB.`)
    if (lead.purchaseMethod && lead.purchaseMethod !== 'research') {
      steps.push(`Дополнительное предложение: ${PURCHASE_METHOD_TEXT[lead.purchaseMethod].toLowerCase()}.`)
    }
    steps.push(
      'Клиент уже прошёл квалификацию, поэтому повторно задавать вопросы о бюджете и назначении телефона не требуется.',
    )
    if (product && product.availability === 'low_stock') {
      steps.push('Внимание: по каталогу остаток ограничен — подтвердите наличие до звонка.')
    }
    return steps
  },

  /** Оценка «горячести» лида, 0–100. */
  scoreLead(input: { profile: NeedProfile; productId?: string; purchaseMethod?: PurchaseMethod }): number {
    let score = 30 + Math.round(input.profile.confidence * 30)
    if (input.productId) score += 20
    if (input.purchaseMethod && input.purchaseMethod !== 'research') score += 15
    if (input.profile.intent === 'purchase') score += 5
    if (input.purchaseMethod === 'research') score -= 10
    return clamp(score, 5, 99)
  },
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1)
}

/* ================================================================== *
 *  ШАБЛОН ПОДКЛЮЧЕНИЯ РЕАЛЬНОГО AI (намеренно не активирован)
 * ==================================================================
 *
 *  Диалоговая политика выше (какие слоты собрать, когда показать
 *  подбор, когда передать менеджеру) остаётся на нашей стороне —
 *  LLM отвечает только за формулировки и понимание свободного текста.
 *  Это снижает риск галлюцинаций: цены и наличие всегда берутся из
 *  productService, а не из модели.
 *
 *  export function createAnthropicProvider(cfg: { apiKey: string }): AiProvider {
 *    return {
 *      id: 'anthropic',
 *      greeting: demoProvider.greeting,
 *      act: demoProvider.act,                       // кнопки — детерминированы
 *      reply(state, userText) {
 *        // 1) NLU: извлечение слотов можно оставить локальным…
 *        const { profile } = extractSlots(userText, state)
 *        // …либо поручить модели через tool use:
 *        //    POST https://api.anthropic.com/v1/messages
 *        //    { model: 'claude-opus-5',
 *        //      system: SALES_ASSISTANT_SYSTEM_PROMPT,
 *        //      tools: [{ name: 'update_need_profile', input_schema: … },
 *        //              { name: 'recommend_products',  input_schema: … }],
 *        //      messages: toAnthropicMessages(state, userText) }
 *        // 2) товары — ВСЕГДА из каталога:
 *        //    productService.recommend(profile)
 *        // 3) собрать AiTurn[] из текста модели + карточек товаров
 *        return { state: { ...state, profile }, turns: [] }
 *      },
 *    }
 *  }
 *
 *  Вызов должен идти через собственный backend-прокси
 *  (например POST /api/ai/chat), чтобы API-ключ не попадал в браузер.
 */
