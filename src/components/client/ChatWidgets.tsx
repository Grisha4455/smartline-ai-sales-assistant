import { useState } from 'react'
import { PURCHASE_METHOD_OPTIONS } from '../../services/aiService'
import { formatPrice, productService } from '../../services/productService'
import type { PurchaseMethod } from '../../types'
import { ArrowDownRightIcon, CheckIcon, RouteIcon, ShieldIcon } from '../ui/icons'
import { Button, PhoneThumb, cx } from '../ui/primitives'

/* ------------------------------------------------------------------ */
/* Выбранный товар + передача менеджеру                                */
/* ------------------------------------------------------------------ */

export function SelectedProductBlock({
  productId,
  onRequestManager,
  done,
}: {
  productId: string
  onRequestManager: () => void
  done: boolean
}) {
  const product = productService.byId(productId)
  if (!product) return null

  return (
    <div className="overflow-hidden rounded-xl bg-white shadow-card ring-1 ring-ink-200">
      <div className="flex items-center gap-3 p-3">
        <PhoneThumb color={product.color} label={product.model} className="h-14 w-11 shrink-0" />
        <div className="min-w-0">
          <p className="truncate text-[13px] font-semibold text-ink-900">{productService.title(product)}</p>
          <p className="text-[11px] text-ink-400">{product.storage} GB · выбран клиентом</p>
          <p className="mt-0.5 text-[13px] font-bold text-ink-900">{formatPrice(product.price)} BYN</p>
        </div>
      </div>
      <div className="border-t border-ink-100 p-2.5">
        <Button block onClick={onRequestManager} disabled={done} icon={<RouteIcon className="h-4 w-4" />}>
          {done ? 'Запрос отправлен' : 'Получить консультацию менеджера'}
        </Button>
        <p className="mt-2 text-center text-[10.5px] leading-snug text-ink-400">
          AI не оформляет заказ и не подтверждает наличие — это делает менеджер
        </p>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Квалификация: способ покупки                                        */
/* ------------------------------------------------------------------ */

export function PurchaseMethodBlock({
  onPick,
  picked,
}: {
  onPick: (value: PurchaseMethod) => void
  picked?: PurchaseMethod
}) {
  return (
    <div className="space-y-1.5">
      {PURCHASE_METHOD_OPTIONS.map((option) => {
        const isPicked = picked === option.value
        return (
          <button
            key={option.value}
            onClick={() => onPick(option.value)}
            disabled={Boolean(picked)}
            className={cx(
              'flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-[13px] font-medium transition-all',
              isPicked
                ? 'bg-brand-600 text-white ring-1 ring-brand-600'
                : picked
                  ? 'bg-white text-ink-300 ring-1 ring-ink-200'
                  : 'bg-white text-ink-700 ring-1 ring-ink-200 hover:bg-brand-50 hover:text-brand-700 hover:ring-brand-200',
            )}
          >
            {isPicked && <CheckIcon className="h-4 w-4" />}
            {option.label}
          </button>
        )
      })}
      <p className="pt-0.5 text-[10.5px] leading-snug text-ink-400">
        Условия рассрочки и кредита подтверждает менеджер. AI только фиксирует предпочтение.
      </p>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Контакты                                                            */
/* ------------------------------------------------------------------ */

export function ContactFormBlock({
  onSubmit,
  submitted,
}: {
  onSubmit: (name: string, phone: string) => void
  submitted: boolean
}) {
  const [name, setName] = useState('Александр')
  const [phone, setPhone] = useState('+375 29 764 18 03')
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = () => {
    if (name.trim().length < 2) {
      setError('Укажите имя')
      return
    }
    if (phone.replace(/\D/g, '').length < 9) {
      setError('Проверьте номер телефона')
      return
    }
    setError(null)
    onSubmit(name.trim(), phone.trim())
  }

  return (
    <div className="rounded-xl bg-white p-3 shadow-card ring-1 ring-ink-200">
      <div className="space-y-2.5">
        <label className="block">
          <span className="text-[11px] font-medium text-ink-500">Имя</span>
          <input
            value={name}
            disabled={submitted}
            onChange={(event) => setName(event.target.value)}
            className="mt-1 h-9 w-full rounded-lg bg-ink-50 px-3 text-[13px] text-ink-900 ring-1 ring-inset ring-ink-200 transition focus:bg-white focus:ring-brand-400 disabled:text-ink-400"
            placeholder="Как к вам обращаться"
          />
        </label>
        <label className="block">
          <span className="text-[11px] font-medium text-ink-500">Телефон</span>
          <input
            value={phone}
            disabled={submitted}
            onChange={(event) => setPhone(event.target.value)}
            onKeyDown={(event) => event.key === 'Enter' && handleSubmit()}
            className="mt-1 h-9 w-full rounded-lg bg-ink-50 px-3 text-[13px] text-ink-900 ring-1 ring-inset ring-ink-200 transition focus:bg-white focus:ring-brand-400 disabled:text-ink-400"
            placeholder="+375 XX XXX XX XX"
          />
        </label>
        {error && <p className="text-[11px] font-medium text-rose-600">{error}</p>}
        <Button block disabled={submitted} onClick={handleSubmit}>
          {submitted ? 'Передано' : 'Передать менеджеру'}
        </Button>
        <p className="flex items-start gap-1.5 text-[10.5px] leading-snug text-ink-400">
          <ShieldIcon className="mt-px h-3.5 w-3.5 shrink-0" />
          Данные уходят в CRM магазина. В DEMO-режиме ничего не отправляется наружу.
        </p>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Заявка создана                                                      */
/* ------------------------------------------------------------------ */

export function LeadCreatedBlock({
  leadId,
  onOpenDashboard,
}: {
  leadId: string
  onOpenDashboard: () => void
}) {
  return (
    <div className="overflow-hidden rounded-xl bg-white shadow-card ring-1 ring-emerald-200 animate-scale-in">
      <div className="flex items-start gap-3 bg-emerald-50 px-3.5 py-3">
        <span className="mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white">
          <CheckIcon className="h-4 w-4" />
        </span>
        <div>
          <p className="text-[13px] font-semibold text-emerald-900">Готово</p>
          <p className="mt-0.5 text-[12px] leading-relaxed text-emerald-800">
            Заявка <span className="font-semibold">#{leadId}</span> передана менеджеру.
          </p>
        </div>
      </div>
      <div className="space-y-2 px-3.5 py-3">
        <p className="text-[11.5px] leading-relaxed text-ink-500">
          Менеджер получил структурированную заявку, резюме диалога и готовый черновик ответа.
        </p>
        <Button
          block
          variant="dark"
          size="sm"
          onClick={onOpenDashboard}
          icon={<ArrowDownRightIcon className="h-3.5 w-3.5" />}
        >
          Открыть панель менеджера
        </Button>
      </div>
    </div>
  )
}
