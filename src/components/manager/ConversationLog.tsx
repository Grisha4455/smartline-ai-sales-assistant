import { formatPrice, productService } from '../../services/productService'
import type { ChatMessage } from '../../types'
import { SparkleIcon } from '../ui/icons'
import { cx } from '../ui/primitives'

/**
 * Полный диалог клиента с AI — открывается по кнопке «Посмотреть диалог».
 * Режим только для чтения: интерактивные блоки показаны как отметки.
 */
export function ConversationLog({ transcript }: { transcript: ChatMessage[] }) {
  return (
    <div className="space-y-3 rounded-2xl bg-ink-50/80 p-4 ring-1 ring-ink-200 animate-fade-up">
      <div className="flex items-center justify-between">
        <p className="text-[12px] font-semibold text-ink-700">Полная переписка</p>
        <span className="text-[11px] text-ink-400">{transcript.length} сообщений</span>
      </div>

      <div className="space-y-2.5">
        {transcript.map((message) => {
          const isClient = message.author === 'client'
          return (
            <div key={message.id} className={cx('flex gap-2', isClient ? 'flex-row-reverse' : 'flex-row')}>
              {!isClient && (
                <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-lg ai-gradient">
                  <SparkleIcon className="h-3 w-3 text-white" />
                </span>
              )}
              <div className={cx('max-w-[78%]', isClient && 'text-right')}>
                <p className="mb-0.5 text-[10px] font-medium uppercase tracking-wider text-ink-400">
                  {isClient ? 'Клиент' : 'AI'} · {message.time}
                </p>
                <div
                  className={cx(
                    'inline-block rounded-xl px-3 py-2 text-left text-[12.5px] leading-relaxed',
                    isClient ? 'bg-brand-600 text-white' : 'bg-white text-ink-700 ring-1 ring-ink-200',
                  )}
                >
                  {message.text}
                </div>

                {message.products && message.products.length > 0 && (
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {message.products.map((recommendation) => (
                      <span
                        key={recommendation.product.id}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-white px-2 py-1 text-[11px] ring-1 ring-ink-200"
                      >
                        <span
                          className="h-2.5 w-2.5 rounded-sm"
                          style={{ background: recommendation.product.color }}
                          aria-hidden
                        />
                        <span className="font-medium text-ink-700">
                          {productService.title(recommendation.product)}
                        </span>
                        <span className="text-ink-400">{formatPrice(recommendation.product.price)} BYN</span>
                      </span>
                    ))}
                  </div>
                )}

                {message.widget && (
                  <p className="mt-1 text-[10px] font-medium text-brand-600">{WIDGET_NOTE[message.widget]}</p>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

const WIDGET_NOTE: Record<NonNullable<ChatMessage['widget']>, string> = {
  'need-profile': '↳ AI показал собранный профиль потребности',
  'selected-product': '↳ AI предложил передать данные менеджеру',
  'purchase-method': '↳ AI уточнил способ покупки',
  'contact-form': '↳ AI запросил контакты',
  'lead-created': '↳ Заявка создана и передана в CRM',
}
