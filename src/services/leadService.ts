import { DEMO_SCENARIO_LEAD_ID, demoLeads } from '../data/leads'
import { aiService, type ConversationState } from './aiService'
import type { ChatMessage, Lead, LeadStatus } from '../types'

/**
 * leadService — хранилище заявок AI-модуля.
 *
 * ┌─ ТОЧКА ИНТЕГРАЦИИ ────────────────────────────────────────────────┐
 * │ В продакшене create() отправляет заявку в существующую CRM:       │
 * │   await fetch('/api/crm/leads', { method: 'POST', body: … })      │
 * │ Здесь используется in-memory store, чтобы демо работало офлайн.   │
 * └───────────────────────────────────────────────────────────────────┘
 *
 * Store реализован как наблюдаемый источник для useSyncExternalStore —
 * оба экрана (клиент и менеджер) видят одни и те же данные.
 */

let leads: Lead[] = [...demoLeads]
let scenarioSlotFree = true
let nextSequence = 1049

const listeners = new Set<() => void>()

function emit() {
  leads = [...leads]
  listeners.forEach((fn) => fn())
}

export interface CreateLeadInput {
  state: ConversationState
  transcript: ChatMessage[]
  name: string
  phone: string
}

export const leadService = {
  subscribe(listener: () => void): () => void {
    listeners.add(listener)
    return () => listeners.delete(listener)
  },

  /** Снимок для useSyncExternalStore — ссылка меняется только при изменении данных. */
  snapshot(): Lead[] {
    return leads
  },

  byId(id: string): Lead | undefined {
    return leads.find((l) => l.id === id)
  },

  byStatus(status: LeadStatus | 'all'): Lead[] {
    const sorted = [...leads].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
    return status === 'all' ? sorted : sorted.filter((l) => l.status === status)
  },

  /**
   * Создаёт заявку по итогам диалога с AI.
   *
   * Первая заявка за сеанс занимает заранее подготовленный номер
   * #SL-1048 — это делает демонстрацию предсказуемой: в панели
   * менеджера появляется именно та заявка, которую мы только что
   * оформили в чате, с живым диалогом внутри.
   */
  create(input: CreateLeadInput): Lead {
    const { state, transcript, name, phone } = input

    const id = scenarioSlotFree ? DEMO_SCENARIO_LEAD_ID : `SL-${++nextSequence}`
    scenarioSlotFree = false

    const lead: Lead = {
      id,
      createdAt: new Date().toISOString(),
      client: { name, phone, city: 'Минск' },
      source: 'ai_assistant',
      status: 'new',
      profile: state.profile,
      productId: state.selectedProductId,
      recommendedIds: state.recommendedIds,
      purchaseMethod: state.purchaseMethod,
      transcript,
      aiSummary: aiService.buildSummary({
        profile: state.profile,
        productId: state.selectedProductId,
        purchaseMethod: state.purchaseMethod,
        clientName: name,
      }),
      aiReply: aiService.buildReply({
        clientName: name,
        productId: state.selectedProductId,
        purchaseMethod: state.purchaseMethod,
      }),
      leadScore: aiService.scoreLead({
        profile: state.profile,
        productId: state.selectedProductId,
        purchaseMethod: state.purchaseMethod,
      }),
      isDemoScenario: id === DEMO_SCENARIO_LEAD_ID,
      isLive: true,
    }

    leads = [lead, ...leads.filter((l) => l.id !== id)]
    emit()
    return lead
  },

  setStatus(id: string, status: LeadStatus) {
    leads = leads.map((l) => (l.id === id ? { ...l, status } : l))
    emit()
  },

  /** DEMO-режим: реальная отправка не подключена, меняется только статус. */
  markReplySent(id: string) {
    leads = leads.map((l) =>
      l.id === id ? { ...l, status: 'replied' as LeadStatus, replySentAt: new Date().toISOString() } : l,
    )
    emit()
  },

  /** Сброс демонстрации в исходное состояние. */
  reset() {
    leads = [...demoLeads]
    scenarioSlotFree = true
    nextSequence = 1049
    emit()
  },
}
