import { useEffect, useState } from 'react'
import { aiService, PURCHASE_METHOD_TEXT } from '../../services/aiService'
import { leadService } from '../../services/leadService'
import { formatPrice, productService } from '../../services/productService'
import type { Lead } from '../../types'
import {
  BoltIcon,
  ChatIcon,
  CheckIcon,
  ChevronDownIcon,
  CopyIcon,
  PhoneIcon,
  RouteIcon,
  SendIcon,
  SparkleIcon,
} from '../ui/icons'
import { AiBadge, AvailabilityPill, Button, PhoneThumb, SectionLabel, StatusPill, cx, timeAgo } from '../ui/primitives'
import { AiSummaryCard } from './AiSummaryCard'
import { ConversationLog } from './ConversationLog'

const USE_CASE_LABEL: Record<string, string> = {
  gaming: 'Игры',
  photo: 'Фото и видео',
  work: 'Работа и звонки',
  battery: 'Автономность',
  basic: 'Повседневные задачи',
}

/**
 * Детальная карточка заявки — правая колонка панели менеджера.
 * Порядок блоков продаёт идею: сначала AI-резюме, потом диалог.
 */
export function LeadDetail({ lead }: { lead: Lead }) {
  const [showLog, setShowLog] = useState(false)
  const [nextSteps, setNextSteps] = useState<string[] | null>(null)
  const [copied, setCopied] = useState(false)

  const product = lead.productId ? productService.byId(lead.productId) : undefined
  const replySent = lead.status === 'replied' || Boolean(lead.replySentAt)

  // Новая заявка — новое состояние блоков
  useEffect(() => {
    setShowLog(false)
    setNextSteps(null)
    setCopied(false)
  }, [lead.id])

  const copyReply = async () => {
    try {
      await navigator.clipboard.writeText(lead.aiReply)
    } catch {
      // В демо буфер обмена может быть недоступен — не мешаем сценарию
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex h-full flex-col overflow-y-auto">
      {/* Шапка заявки */}
      <header className="sticky top-0 z-10 border-b border-ink-200 bg-white/95 px-5 py-4 backdrop-blur">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <SectionLabel>Заявка #{lead.id}</SectionLabel>
              {lead.isLive && (
                <span className="rounded-md bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-700 ring-1 ring-inset ring-emerald-100">
                  только что
                </span>
              )}
            </div>
            <h2 className="mt-1 text-[19px] font-semibold tracking-tight text-ink-900">{lead.client.name}</h2>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-ink-500">
              <span className="inline-flex items-center gap-1.5 font-medium text-ink-700">
                <PhoneIcon className="h-3.5 w-3.5 text-ink-400" />
                {lead.client.phone}
              </span>
              {lead.client.city && <span>{lead.client.city}</span>}
              <span>{timeAgo(lead.createdAt)}</span>
              {lead.client.isReturning && (
                <span className="rounded-md bg-ink-100 px-1.5 py-0.5 text-[10.5px] font-medium text-ink-600">
                  Повторный клиент
                </span>
              )}
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <StatusPill status={lead.status} />
            <div className="flex items-center gap-1.5 text-[11px] text-ink-400">
              <BoltIcon className="h-3.5 w-3.5 text-amber-500" />
              Оценка лида <span className="font-semibold text-ink-700">{lead.leadScore}</span>
            </div>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <Button
            size="sm"
            variant={lead.status === 'in_progress' ? 'primary' : 'secondary'}
            onClick={() => leadService.setStatus(lead.id, 'in_progress')}
          >
            Взять в работу
          </Button>
          <Button size="sm" variant="secondary" onClick={() => leadService.setStatus(lead.id, 'won')}>
            Сделка закрыта
          </Button>
          <Button size="sm" variant="ghost" onClick={() => leadService.setStatus(lead.id, 'lost')}>
            Отказ
          </Button>
        </div>
      </header>

      <div className="space-y-4 px-5 py-4">
        {/* Структурированная заявка */}
        <section className="rounded-2xl bg-white shadow-card ring-1 ring-ink-200/70">
          <div className="flex items-center gap-2 border-b border-ink-100 px-4 py-3">
            <p className="text-[13px] font-semibold text-ink-800">Новая заявка</p>
            <AiBadge label="источник: AI-консультант" />
          </div>

          <dl className="grid grid-cols-2 gap-x-4 gap-y-3 px-4 py-4">
            <Field label="Интерес" value={product ? `${productService.title(product)} ${product.storage} GB` : '—'} />
            <Field label="Бюджет" value={lead.profile.budget ? `до ${formatPrice(lead.profile.budget)} BYN` : '—'} />
            <Field label="Цель" value={lead.profile.useCase ? USE_CASE_LABEL[lead.profile.useCase] : '—'} />
            <Field
              label="Способ покупки"
              value={lead.purchaseMethod ? PURCHASE_METHOD_TEXT[lead.purchaseMethod] : '—'}
            />
          </dl>

          {product && (
            <div className="flex items-center gap-3 border-t border-ink-100 bg-ink-50/60 px-4 py-3">
              <PhoneThumb color={product.color} label={product.model} className="h-12 w-9 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[12.5px] font-medium text-ink-800">
                  {productService.title(product)} · {product.storage} GB
                </p>
                <p className="text-[11px] text-ink-400">
                  {product.chipset} · {formatPrice(product.price)} BYN
                </p>
              </div>
              <AvailabilityPill value={product.availability} />
            </div>
          )}

          {lead.recommendedIds.length > 0 && (
            <div className="border-t border-ink-100 px-4 py-3">
              <p className="text-[11px] font-medium text-ink-400">AI предлагал в диалоге</p>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {lead.recommendedIds.map((id) => {
                  const item = productService.byId(id)
                  if (!item) return null
                  return (
                    <span
                      key={id}
                      className={cx(
                        'inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-[11px] ring-1',
                        id === lead.productId
                          ? 'bg-brand-50 text-brand-700 ring-brand-200'
                          : 'bg-white text-ink-600 ring-ink-200',
                      )}
                    >
                      {id === lead.productId && <CheckIcon className="h-3 w-3" />}
                      {productService.title(item)}
                    </span>
                  )
                })}
              </div>
            </div>
          )}
        </section>

        {/* Главный блок: AI-резюме */}
        <AiSummaryCard summary={lead.aiSummary} />

        {/* Полный диалог */}
        <div>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setShowLog((value) => !value)}
            icon={<ChatIcon className="h-3.5 w-3.5" />}
          >
            {showLog ? 'Скрыть диалог' : 'Посмотреть диалог'}
            <ChevronDownIcon className={cx('h-3.5 w-3.5 transition-transform', showLog && 'rotate-180')} />
          </Button>
          {showLog && (
            <div className="mt-3">
              <ConversationLog transcript={lead.transcript} />
            </div>
          )}
        </div>

        {/* Черновик ответа */}
        <section className="overflow-hidden rounded-2xl bg-white shadow-card ring-1 ring-ink-200/70">
          <div className="flex items-center gap-2 border-b border-ink-100 px-4 py-3">
            <SparkleIcon className="h-4 w-4 text-brand-600" />
            <p className="text-[13px] font-semibold text-ink-800">AI подготовил ответ</p>
            {replySent && (
              <span className="ml-auto inline-flex items-center gap-1 rounded-md bg-sky-50 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-sky-700 ring-1 ring-inset ring-sky-100">
                <CheckIcon className="h-3 w-3" /> Ответ отправлен
              </span>
            )}
          </div>

          <div className="px-4 py-4">
            <div className="rounded-xl bg-ink-50 px-4 py-3.5 ring-1 ring-ink-200">
              {lead.aiReply.split('\n\n').map((paragraph) => (
                <p key={paragraph} className="text-[13px] leading-relaxed text-ink-800 [&:not(:first-child)]:mt-2">
                  {paragraph}
                </p>
              ))}
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => void copyReply()}
                icon={copied ? <CheckIcon className="h-3.5 w-3.5" /> : <CopyIcon className="h-3.5 w-3.5" />}
              >
                {copied ? 'Скопировано' : 'Скопировать'}
              </Button>
              <Button
                size="sm"
                variant={replySent ? 'success' : 'primary'}
                disabled={replySent}
                onClick={() => leadService.markReplySent(lead.id)}
                icon={replySent ? <CheckIcon className="h-3.5 w-3.5" /> : <SendIcon className="h-3.5 w-3.5" />}
              >
                {replySent ? 'Отправлено' : 'Отправить'}
              </Button>
              <span className="text-[10.5px] text-ink-400">
                DEMO-режим: реальная отправка не подключена, меняется только статус
              </span>
            </div>
          </div>
        </section>

        {/* Следующий шаг для менеджера */}
        <section className="rounded-2xl bg-white shadow-card ring-1 ring-ink-200/70">
          <div className="px-4 py-4">
            {nextSteps ? (
              <div className="animate-fade-up">
                <div className="flex items-center gap-2">
                  <RouteIcon className="h-4 w-4 text-brand-600" />
                  <p className="text-[13px] font-semibold text-ink-800">AI рекомендует следующий шаг</p>
                </div>
                <ul className="mt-3 space-y-2">
                  {nextSteps.map((step) => (
                    <li key={step} className="flex gap-2.5 text-[12.5px] leading-relaxed text-ink-700">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" />
                      {step}
                    </li>
                  ))}
                </ul>
                <p className="mt-3 text-[11px] text-ink-400">
                  AI помогает не только клиенту, но и менеджеру: приоритет, аргументы и контекст уже готовы.
                </p>
              </div>
            ) : (
              <Button
                block
                variant="secondary"
                onClick={() => setNextSteps(aiService.suggestNextStep(lead))}
                icon={<SparkleIcon className="h-4 w-4 text-brand-600" />}
              >
                AI рекомендует следующий шаг
              </Button>
            )}
          </div>
        </section>

        {lead.managerNote && (
          <p className="rounded-xl bg-amber-50 px-3.5 py-2.5 text-[12px] leading-relaxed text-amber-900 ring-1 ring-inset ring-amber-100">
            <span className="font-semibold">Заметка менеджера: </span>
            {lead.managerNote}
          </p>
        )}
      </div>
    </div>
  )
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[11px] font-medium text-ink-400">{label}</dt>
      <dd className="mt-0.5 text-[13px] font-semibold text-ink-900">{value}</dd>
    </div>
  )
}
