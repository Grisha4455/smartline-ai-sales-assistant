import { products } from '../data/products'
import type { NeedProfile, Product, Recommendation, UseCase } from '../types'

/**
 * productService — единственная точка доступа AI-модуля к каталогу магазина.
 *
 * ┌─ ТОЧКА ИНТЕГРАЦИИ ────────────────────────────────────────────────┐
 * │ В продакшене PRODUCT_SOURCE заменяется на реальный источник:      │
 * │   const PRODUCT_SOURCE = () => fetch('/api/catalog').then(r => …) │
 * │ Остальной код AI-модуля менять не нужно.                          │
 * └───────────────────────────────────────────────────────────────────┘
 */
const PRODUCT_SOURCE = (): Product[] => products

export const productService = {
  all(): Product[] {
    return PRODUCT_SOURCE()
  },

  byId(id: string): Product | undefined {
    return PRODUCT_SOURCE().find((p) => p.id === id)
  },

  /** Человекочитаемое имя: «Samsung Galaxy S26» */
  title(product: Product): string {
    return `${product.brand} ${product.model}`
  },

  /**
   * Движок подбора. Считает балл соответствия профилю потребности
   * и возвращает top-N с объяснением, почему товар подходит.
   *
   * Это то место, где «AI» опирается на структурированные данные,
   * а не на генерацию текста — поэтому подбор детерминирован и его
   * можно показывать владельцу бизнеса без риска галлюцинаций.
   */
  recommend(profile: NeedProfile, limit = 3): Recommendation[] {
    const catalog = PRODUCT_SOURCE()
    const budget = profile.budget

    // Важно: сортируем по «сырому» баллу. Если ограничить балл сверху
    // до сортировки, сильные модели становятся равными и порядок
    // определяется случайным порядком каталога.
    const scored = catalog
      .filter((p) => p.availability !== 'preorder')
      .filter((p) => (budget ? p.price <= budget * 1.02 : true))
      .map((product) => ({ product, raw: scoreProduct(product, profile) }))
      .sort((a, b) => b.raw - a.raw)

    const top = scored.slice(0, limit)
    const leaderRaw = top[0]?.raw ?? 1

    return top.map(({ product, raw }, index) => ({
      product,
      // Показываем соответствие относительно лидера подбора:
      // порядок карточек и проценты не противоречат друг другу.
      matchScore: Math.max(40, Math.min(99, Math.round((raw / leaderRaw) * 99))),
      reason: buildReason(product, profile, index, top[0]?.product),
      badge: badgeFor(index, product, top[0]?.product),
    }))
  },

  /** Фолбэк, если бюджет слишком низкий и подходящих моделей нет */
  cheapestAbove(budget: number): Product | undefined {
    return PRODUCT_SOURCE()
      .filter((p) => p.price > budget)
      .sort((a, b) => a.price - b.price)[0]
  },
}

/* ------------------------------------------------------------------ */
/* Скоринг                                                             */
/* ------------------------------------------------------------------ */

const USE_CASE_WEIGHTS: Record<UseCase, { performance: number; camera: number; battery: number; display: number }> = {
  // Для игр производительность должна доминировать: иначе модель с чуть
  // лучшей батареей обходит более быструю, что противоречит запросу клиента.
  gaming: { performance: 0.6, camera: 0.05, battery: 0.15, display: 0.2 },
  photo: { performance: 0.15, camera: 0.6, battery: 0.15, display: 0.1 },
  work: { performance: 0.3, camera: 0.15, battery: 0.4, display: 0.15 },
  battery: { performance: 0.15, camera: 0.1, battery: 0.65, display: 0.1 },
  basic: { performance: 0.25, camera: 0.25, battery: 0.35, display: 0.15 },
}

function scoreProduct(product: Product, profile: NeedProfile): number {
  const weights = USE_CASE_WEIGHTS[profile.useCase ?? 'basic']

  let score =
    (product.scores.performance * weights.performance +
      product.scores.camera * weights.camera +
      product.scores.battery * weights.battery +
      product.scores.display * weights.display) *
    10

  // Соответствие памяти: нехватка памяти — существенный минус
  if (profile.storage) {
    if (product.storage >= profile.storage) score += 6
    else score -= 18
  }

  // Приоритет камеры, заявленный клиентом
  if (profile.cameraPriority === 'high') score += (product.scores.camera - 8) * 6
  if (profile.cameraPriority === 'low') score += (product.scores.performance - 8) * 3

  // Использование бюджета: ценим модели, которые берут максимум от бюджета,
  // но не упираются в самый его край
  if (profile.budget) {
    const usage = product.price / profile.budget
    if (usage >= 0.85) score += 8
    else if (usage >= 0.65) score += 4
    else score -= 4
  }

  if (profile.brandPreference && product.brand.toLowerCase() === profile.brandPreference.toLowerCase()) {
    score += 12
  }

  if (product.availability === 'in_stock') score += 3
  if (product.availability === 'low_stock') score -= 1

  score += (product.rating - 4.4) * 6

  // Возвращаем «сырой» балл без ограничения сверху: ограничение
  // превращает сильные модели в равные и ломает сортировку подбора.
  return Math.max(0, score)
}

/* ------------------------------------------------------------------ */
/* Генерация объяснения «почему подходит»                              */
/* ------------------------------------------------------------------ */

const USE_CASE_LABEL: Record<UseCase, string> = {
  gaming: 'требовательными играми',
  photo: 'фото- и видеосъёмкой',
  work: 'рабочими задачами',
  battery: 'длительной работой без зарядки',
  basic: 'повседневными задачами',
}

function buildReason(product: Product, profile: NeedProfile, index: number, leader?: Product): string {
  const task = USE_CASE_LABEL[profile.useCase ?? 'basic']
  const inBudget = profile.budget ? product.price <= profile.budget : true

  if (index === 0) {
    const budgetPart = inBudget ? 'Подходит под ваш бюджет и ' : 'Немного выше бюджета, но '
    return `${budgetPart}уверенно справляется с ${task}: ${product.chipset}, ${product.ram} GB RAM, ${product.storage} GB памяти.`
  }

  // Сначала называем то, чем модель действительно выделяется,
  // и только потом — экономию: так у карточек разные аргументы.
  if (product.scores.battery >= 9.2) {
    return `Хороший баланс производительности и автономности: батарея ${product.batteryMah} мА·ч и ${product.storage} GB памяти.`
  }

  if (leader && product.price < leader.price) {
    const diff = leader.price - product.price
    return `Более доступный вариант — на ${formatPrice(diff)} BYN дешевле, при этом производительность остаётся на уровне ${product.scores.performance.toFixed(1)}/10.`
  }

  return `Альтернатива с запасом по характеристикам: ${product.chipset}, ${product.storage} GB памяти, оценка пользователей ${product.rating}.`
}

function badgeFor(index: number, product: Product, leader?: Product): string | undefined {
  if (index === 0) return 'Лучшее соответствие'
  if (product.scores.battery >= 9.2) return 'Максимум автономности'
  // Две одинаковые метки подряд выглядят как ошибка вёрстки
  if (leader && product.price < leader.price) return index >= 2 ? 'Ещё доступнее' : 'Экономнее'
  return 'Альтернатива'
}

/**
 * Цена с разделителем разрядов.
 *
  return value.toLocaleString('ru-RU').replace(/[\s,]/g, ' ')
 * разделителя либо узкий неразрывный пробел, либо запятую. Приводим всё
 * к обычному пробелу, чтобы строки были одинаковыми везде —
 * иначе одна и та же цена в диалоге и в CRM выглядит по-разному.
 */
export function formatPrice(value: number): string {
  return value.toLocaleString('ru-RU').replace(/[\s,]/g, ' ')
}
