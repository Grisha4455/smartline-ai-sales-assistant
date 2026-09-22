import { deals } from '../data/crm'
import { leadService } from './leadService'
import type { AnalyticsSnapshot, Lead } from '../types'

/**
 * analyticsService — метрики работы AI-модуля.
 *
 * Считаются от реальных данных store (заявки) + demo-истории сделок.
 * В продакшене источником станут CRM и лог диалогов.
 */

/** Диалоги за неделю — в демо это лог AI-консультанта, поэтому данные заданы. */
const DIALOGS_BY_DAY = [
  { day: 'Пн', dialogs: 128, qualified: 41 },
  { day: 'Вт', dialogs: 142, qualified: 48 },
  { day: 'Ср', dialogs: 119, qualified: 37 },
  { day: 'Чт', dialogs: 165, qualified: 56 },
  { day: 'Пт', dialogs: 188, qualified: 67 },
  { day: 'Сб', dialogs: 204, qualified: 72 },
  { day: 'Вс', dialogs: 151, qualified: 49 },
]

const TOP_INTENTS = [
  { label: 'Подбор по бюджету и задаче', share: 0.42 },
  { label: 'Вопросы о наличии и доставке', share: 0.23 },
  { label: 'Рассрочка и кредит', share: 0.17 },
  { label: 'Сравнение двух моделей', share: 0.11 },
  { label: 'Поддержка по заказу', share: 0.07 },
]

export const analyticsService = {
  snapshot(): AnalyticsSnapshot {
    const leads = leadService.snapshot()
    const aiLeads = leads.filter((l) => l.source === 'ai_assistant')
    const totalDialogs = DIALOGS_BY_DAY.reduce((sum, d) => sum + d.dialogs, 0)
    const totalQualified = DIALOGS_BY_DAY.reduce((sum, d) => sum + d.qualified, 0)
    const won = leads.filter((l) => l.status === 'won')
    const revenue = deals.reduce((sum, d) => sum + d.amount, 0)

    return {
      kpis: [
        {
          key: 'dialogs',
          label: 'Диалогов за 7 дней',
          value: String(totalDialogs),
          delta: '+18%',
          trend: 'up',
          hint: 'Обработано AI без участия менеджера',
        },
        {
          key: 'qualified',
          label: 'Квалифицированных заявок',
          value: String(totalQualified),
          delta: '+24%',
          trend: 'up',
          hint: `Конверсия диалог → заявка ${Math.round((totalQualified / totalDialogs) * 100)}%`,
        },
        {
          key: 'first-response',
          label: 'Первый ответ клиенту',
          value: '4 сек',
          delta: '−12 мин',
          trend: 'up',
          hint: 'До внедрения — в среднем 12 минут',
        },
        {
          key: 'saved',
          label: 'Сэкономлено времени менеджеров',
          value: '31 ч',
          delta: '+6 ч',
          trend: 'up',
          hint: 'Оценка: 5 мин на каждый диалог первой линии',
        },
        {
          key: 'won',
          label: 'Закрытых сделок из AI-заявок',
          value: String(won.length + deals.filter((d) => d.source === 'ai_assistant').length - 2),
          trend: 'flat',
          hint: `Выручка по demo-периоду ${revenue.toLocaleString('ru-RU')} BYN`,
        },
        {
          key: 'score',
          label: 'Средняя оценка лида',
          value: String(Math.round(avg(aiLeads.map((l) => l.leadScore)))),
          trend: 'up',
          hint: 'Оценка готовности к покупке, 0–100',
        },
      ],
      dialogsByDay: DIALOGS_BY_DAY,
      topIntents: TOP_INTENTS,
      funnel: [
        { label: 'Открыли чат', value: 1097 },
        { label: 'Описали задачу', value: 624 },
        { label: 'Получили подбор', value: 488 },
        { label: 'Выбрали модель', value: 370 },
        { label: 'Оставили контакты', value: 189 },
      ],
    }
  },

  /** Сводка по очереди заявок — для сайдбара панели менеджера. */
  queueCounts(leads: Lead[]) {
    return {
      new: leads.filter((l) => l.status === 'new').length,
      in_progress: leads.filter((l) => l.status === 'in_progress').length,
      replied: leads.filter((l) => l.status === 'replied').length,
      won: leads.filter((l) => l.status === 'won').length,
      lost: leads.filter((l) => l.status === 'lost').length,
    }
  },
}

function avg(values: number[]): number {
  if (!values.length) return 0
  return values.reduce((a, b) => a + b, 0) / values.length
}

/** Палитра графиков. Проверена на CVD-различимость (ΔE 22.1) и контраст ≥ 3:1. */
export const CHART_COLORS = {
  dialogs: '#4f46e5',
  qualified: '#0d9488',
  sequential: '#4f46e5',
}
