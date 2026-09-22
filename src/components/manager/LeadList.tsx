import { PURCHASE_METHOD_TEXT } from '../../services/aiService'
import { formatPrice, productService } from '../../services/productService'
import type { Lead } from '../../types'
import { BoltIcon, SparkleIcon } from '../ui/icons'
import { StatusPill, cx, timeAgo } from '../ui/primitives'

const SOURCE_LABEL: Record<Lead['source'], string> = {
  ai_assistant: 'AI-консультант',
  site_form: 'Форма на сайте',
  phone: 'Звонок',
  manager: 'Менеджер',
}

/** Центральная колонка: очередь заявок. */
export function LeadList({
  leads,
  selectedId,
  onSelect,
  title,
  subtitle,
}: {
  leads: Lead[]
  selectedId?: string
  onSelect: (id: string) => void
  title: string
  subtitle: string
}) {
  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-ink-200 px-4 py-4">
        <h2 className="text-[15px] font-semibold tracking-tight text-ink-900">{title}</h2>
        <p className="mt-0.5 text-[12px] text-ink-500">{subtitle}</p>
      </div>

      <div className="flex-1 overflow-y-auto p-2.5">
        {leads.length === 0 && (
          <p className="px-2 py-8 text-center text-[12.5px] text-ink-400">В этой очереди пока нет заявок</p>
        )}

        <div className="space-y-2">
          {leads.map((lead) => {
            const product = lead.productId ? productService.byId(lead.productId) : undefined
            const isActive = lead.id === selectedId
            return (
              <button
                key={lead.id}
                onClick={() => onSelect(lead.id)}
                className={cx(
                  'w-full rounded-xl px-3.5 py-3 text-left transition-all duration-150',
                  isActive
                    ? 'bg-white shadow-lift ring-2 ring-brand-500'
                    : 'bg-white/70 ring-1 ring-ink-200 hover:bg-white hover:shadow-card',
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="truncate text-[13.5px] font-semibold text-ink-900">{lead.client.name}</p>
                      {lead.isLive && (
                        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" title="Создана только что" />
                      )}
                    </div>
                    <p className="mt-0.5 truncate text-[11.5px] text-ink-500">
                      {product ? `${productService.title(product)} · ${product.storage} GB` : 'Подбор без выбранной модели'}
                    </p>
                  </div>
                  <span className="shrink-0 text-[10.5px] text-ink-400">{timeAgo(lead.createdAt)}</span>
                </div>

                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  <StatusPill status={lead.status} />
                  {lead.source === 'ai_assistant' && (
                    <span className="inline-flex items-center gap-1 rounded-md bg-brand-50 px-1.5 py-0.5 text-[10px] font-medium text-brand-700 ring-1 ring-inset ring-brand-100">
                      <SparkleIcon className="h-2.5 w-2.5" />
                      {SOURCE_LABEL[lead.source]}
                    </span>
                  )}
                  {lead.purchaseMethod && lead.purchaseMethod !== 'research' && (
                    <span className="rounded-md bg-ink-100 px-1.5 py-0.5 text-[10px] font-medium text-ink-600">
                      {PURCHASE_METHOD_TEXT[lead.purchaseMethod]}
                    </span>
                  )}
                </div>

                <div className="mt-2 flex items-center justify-between border-t border-ink-100 pt-2">
                  <span className="inline-flex items-center gap-1 text-[10.5px] text-ink-400">
                    <BoltIcon className="h-3 w-3 text-amber-500" />
                    Оценка {lead.leadScore}
                  </span>
                  <span className="text-[11px] font-semibold text-ink-700">
                    {product ? `${formatPrice(product.price)} BYN` : lead.profile.budget ? `до ${formatPrice(lead.profile.budget)} BYN` : '—'}
                  </span>
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
