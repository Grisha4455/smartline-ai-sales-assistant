import type { Recommendation } from '../../types'
import { formatPrice, productService } from '../../services/productService'
import { CheckIcon } from '../ui/icons'
import { AvailabilityPill, Button, Meter, PhoneThumb, Stars, cx } from '../ui/primitives'

/**
 * Карточка товара ВНУТРИ диалога с AI.
 *
 * Это не витрина каталога: карточка — часть ответа консультанта,
 * поэтому в ней есть объяснение «почему подходит» и балл соответствия.
 */
export function ProductChatCard({
  recommendation,
  index,
  selectedId,
  onSelect,
}: {
  recommendation: Recommendation
  index: number
  selectedId?: string
  onSelect?: (productId: string) => void
}) {
  const { product, reason, badge, matchScore } = recommendation
  const isSelected = selectedId === product.id
  const isLocked = Boolean(selectedId) && !isSelected

  // У части моделей название — просто число («15», «13»),
  // и кнопка «Выбрать 13» выглядит ошибкой. Тогда добавляем бренд.
  const shortName = /[a-zа-я]/i.test(product.model) ? product.model : `${product.brand} ${product.model}`

  return (
    <article
      className={cx(
        'overflow-hidden rounded-xl bg-white ring-1 transition-all duration-200 animate-fade-up',
        isSelected ? 'ring-2 ring-brand-500 shadow-lift' : 'ring-ink-200 shadow-card hover:shadow-lift',
        isLocked && 'opacity-60',
      )}
      style={{ animationDelay: `${index * 90}ms` }}
    >
      <div className="flex gap-3 p-3">
        <PhoneThumb color={product.color} label={productService.title(product)} className="h-[92px] w-[68px] shrink-0" />

        <div className="min-w-0 flex-1">
          {/* Метка над названием: иначе длинное «Лучшее соответствие»
              съедает ширину и обрезает название модели */}
          {badge && (
            <span
              className={cx(
                'mb-1 inline-block rounded-md px-1.5 py-0.5 text-[10px] font-semibold ring-1 ring-inset',
                index === 0 ? 'bg-brand-50 text-brand-700 ring-brand-100' : 'bg-ink-50 text-ink-500 ring-ink-200',
              )}
            >
              {badge}
            </span>
          )}
          <h4 className="text-[13.5px] font-semibold leading-snug text-ink-900">{productService.title(product)}</h4>
          <p className="mt-0.5 text-[11px] leading-snug text-ink-400">
            {product.storage} GB · {product.ram} GB RAM · {product.chipset}
          </p>

          <div className="mt-2 flex items-center gap-2">
            <span className="text-[15px] font-bold text-ink-900">{formatPrice(product.price)} BYN</span>
            {product.oldPrice && (
              <span className="text-[11px] text-ink-400 line-through">{formatPrice(product.oldPrice)}</span>
            )}
            <AvailabilityPill value={product.availability} />
          </div>

          <div className="mt-1.5 flex items-center gap-2">
            <Stars value={product.rating} />
            <span className="text-[11px] text-ink-400">{product.reviews} отзывов</span>
          </div>
        </div>
      </div>

      <div className="space-y-1.5 border-t border-ink-100 px-3 py-2.5">
        <Meter label="Производительность" value={product.scores.performance} />
        <Meter label="Камера" value={product.scores.camera} />
        <Meter label="Батарея" value={product.scores.battery} />
      </div>

      <div className="border-t border-ink-100 bg-ink-50/60 px-3 py-2.5">
        <p className="text-[11px] font-semibold text-ink-500">Почему подходит</p>
        <p className="mt-1 text-[12px] leading-relaxed text-ink-700">«{reason}»</p>
      </div>

      <div className="flex items-center gap-2 border-t border-ink-100 px-3 py-2.5">
        <span className="text-[11px] text-ink-400">
          Соответствие <span className="font-semibold text-ink-700">{matchScore}%</span>
        </span>
        {isSelected ? (
          <span className="ml-auto inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-2.5 py-1.5 text-[12px] font-medium text-emerald-700 ring-1 ring-inset ring-emerald-100">
            <CheckIcon className="h-3.5 w-3.5" /> Выбрано
          </span>
        ) : (
          <Button
            size="sm"
            variant={index === 0 ? 'primary' : 'secondary'}
            className="ml-auto"
            disabled={isLocked || !onSelect}
            onClick={() => onSelect?.(product.id)}
          >
            Выбрать {shortName}
          </Button>
        )}
      </div>
    </article>
  )
}
