import type { ButtonHTMLAttributes, ReactNode } from 'react'
import type { LeadStatus, Availability } from '../../types'
import { SparkleIcon } from './icons'

export function cx(...values: (string | false | null | undefined)[]): string {
  return values.filter(Boolean).join(' ')
}

/* ------------------------------------------------------------------ */
/* Кнопки                                                              */
/* ------------------------------------------------------------------ */

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'dark' | 'success'
type ButtonSize = 'sm' | 'md'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  icon?: ReactNode
  block?: boolean
}

const VARIANTS: Record<ButtonVariant, string> = {
  primary:
    'bg-brand-600 text-white shadow-[0_1px_2px_rgba(14,18,32,.16)] hover:bg-brand-700 active:bg-brand-800 disabled:bg-brand-300',
  secondary:
    'bg-white text-ink-800 ring-1 ring-inset ring-ink-200 hover:bg-ink-50 hover:ring-ink-300 disabled:text-ink-300',
  ghost: 'text-ink-600 hover:bg-ink-100 hover:text-ink-900',
  dark: 'bg-ink-900 text-white hover:bg-ink-800',
  success: 'bg-emerald-600 text-white hover:bg-emerald-700',
}

const SIZES: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-[13px] gap-1.5 rounded-lg',
  md: 'h-10 px-4 text-sm gap-2 rounded-xl',
}

export function Button({ variant = 'primary', size = 'md', icon, block, className, children, ...rest }: ButtonProps) {
  return (
    <button
      {...rest}
      className={cx(
        'inline-flex items-center justify-center font-medium transition-all duration-150',
        'disabled:cursor-not-allowed disabled:opacity-70',
        VARIANTS[variant],
        SIZES[size],
        block && 'w-full',
        className,
      )}
    >
      {icon}
      {children}
    </button>
  )
}

/* ------------------------------------------------------------------ */
/* Бейджи и статусы                                                    */
/* ------------------------------------------------------------------ */

export function DemoBadge({ className }: { className?: string }) {
  return (
    <span
      className={cx(
        'inline-flex items-center gap-1 rounded-md bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-amber-700 ring-1 ring-inset ring-amber-200',
        className,
      )}
    >
      Demo
    </span>
  )
}

export function AiBadge({ label = 'AI', className }: { label?: string; className?: string }) {
  return (
    <span
      className={cx(
        'inline-flex items-center gap-1 rounded-md bg-brand-50 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-brand-700 ring-1 ring-inset ring-brand-100',
        className,
      )}
    >
      <SparkleIcon className="h-3 w-3" />
      {label}
    </span>
  )
}

export const LEAD_STATUS_META: Record<LeadStatus, { label: string; className: string; dot: string }> = {
  new: { label: 'Новая', className: 'bg-brand-50 text-brand-700 ring-brand-100', dot: 'bg-brand-500' },
  in_progress: { label: 'В работе', className: 'bg-amber-50 text-amber-700 ring-amber-100', dot: 'bg-amber-500' },
  replied: { label: 'Ответ отправлен', className: 'bg-sky-50 text-sky-700 ring-sky-100', dot: 'bg-sky-500' },
  won: { label: 'Сделка', className: 'bg-emerald-50 text-emerald-700 ring-emerald-100', dot: 'bg-emerald-500' },
  lost: { label: 'Отказ', className: 'bg-ink-100 text-ink-500 ring-ink-200', dot: 'bg-ink-400' },
}

export function StatusPill({ status, className }: { status: LeadStatus; className?: string }) {
  const meta = LEAD_STATUS_META[status]
  return (
    <span
      className={cx(
        'inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset',
        meta.className,
        className,
      )}
    >
      <span className={cx('h-1.5 w-1.5 rounded-full', meta.dot)} />
      {meta.label}
    </span>
  )
}

export const AVAILABILITY_META: Record<Availability, { label: string; className: string }> = {
  in_stock: { label: 'В наличии', className: 'text-emerald-700 bg-emerald-50 ring-emerald-100' },
  low_stock: { label: 'Мало на складе', className: 'text-amber-700 bg-amber-50 ring-amber-100' },
  preorder: { label: 'Предзаказ', className: 'text-ink-600 bg-ink-100 ring-ink-200' },
}

export function AvailabilityPill({ value }: { value: Availability }) {
  const meta = AVAILABILITY_META[value]
  return (
    <span
      className={cx(
        'inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-medium ring-1 ring-inset',
        meta.className,
      )}
    >
      {meta.label}
    </span>
  )
}

/* ------------------------------------------------------------------ */
/* Карточки и заголовки                                                */
/* ------------------------------------------------------------------ */

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div className={cx('rounded-2xl bg-white shadow-card ring-1 ring-ink-200/70', className)}>{children}</div>
  )
}

export function SectionLabel({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p className={cx('text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-400', className)}>{children}</p>
  )
}

/* ------------------------------------------------------------------ */
/* Мелкие визуальные элементы                                          */
/* ------------------------------------------------------------------ */

/** Рейтинг звёздами: идентичность не передаётся только цветом — рядом есть число. */
export function Stars({ value, className }: { value: number; className?: string }) {
  const full = Math.round(value)
  return (
    <span className={cx('inline-flex items-center gap-1', className)} aria-label={`Рейтинг ${value} из 5`}>
      <span className="flex" aria-hidden>
        {Array.from({ length: 5 }, (_, i) => (
          <svg key={i} viewBox="0 0 20 20" className={cx('h-3 w-3', i < full ? 'text-amber-400' : 'text-ink-200')}>
            <path
              fill="currentColor"
              d="M10 2.6l2.2 4.6 5 .7-3.6 3.5.9 5-4.5-2.4-4.5 2.4.9-5L2.8 7.9l5-.7L10 2.6z"
            />
          </svg>
        ))}
      </span>
      <span className="text-[11px] font-medium text-ink-500">{value.toFixed(1)}</span>
    </span>
  )
}

/** Компактный индикатор 0–10 (производительность, камера и т.д.) */
export function Meter({ label, value, max = 10 }: { label: string; value: number; max?: number }) {
  const pct = Math.max(4, Math.min(100, (value / max) * 100))
  return (
    <div className="flex items-center gap-2">
      <span className="w-[118px] shrink-0 text-[10px] leading-tight text-ink-500">{label}</span>
      <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-ink-100">
        <span className="block h-full rounded-full bg-brand-500 transition-all duration-500" style={{ width: `${pct}%` }} />
      </span>
      <span className="w-8 shrink-0 text-right text-[11px] font-semibold text-ink-700">{value.toFixed(1)}</span>
    </div>
  )
}

/** Силуэт смартфона вместо фото — демо не зависит от внешних картинок. */
export function PhoneThumb({
  color,
  label,
  className,
}: {
  color: string
  label: string
  className?: string
}) {
  return (
    <div
      className={cx('relative flex items-center justify-center overflow-hidden rounded-xl', className)}
      style={{ background: `linear-gradient(150deg, ${color} 0%, ${shade(color, -22)} 100%)` }}
      aria-label={label}
      role="img"
    >
      <div className="absolute -right-4 -top-6 h-16 w-16 rounded-full bg-white/10" />
      <svg viewBox="0 0 40 68" className="relative h-[78%] w-auto drop-shadow-[0_2px_6px_rgba(0,0,0,.28)]">
        <rect x="1" y="1" width="38" height="66" rx="7" fill="rgba(255,255,255,.14)" stroke="rgba(255,255,255,.5)" />
        <rect x="4" y="5" width="32" height="58" rx="4.5" fill="rgba(255,255,255,.2)" />
        <rect x="14" y="2.6" width="12" height="2.6" rx="1.3" fill="rgba(255,255,255,.45)" />
        <circle cx="10.5" cy="12" r="3" fill="rgba(255,255,255,.5)" />
        <circle cx="10.5" cy="19.5" r="3" fill="rgba(255,255,255,.35)" />
      </svg>
    </div>
  )
}

/** Затемнение/осветление hex-цвета на percent (−100…100). */
function shade(hex: string, percent: number): string {
  const value = hex.replace('#', '')
  const num = parseInt(
    value.length === 3
      ? value
          .split('')
          .map((c) => c + c)
          .join('')
      : value,
    16,
  )
  const amt = Math.round(2.55 * percent)
  const r = clamp255((num >> 16) + amt)
  const g = clamp255(((num >> 8) & 0x00ff) + amt)
  const b = clamp255((num & 0x0000ff) + amt)
  return `rgb(${r} ${g} ${b})`
}

function clamp255(value: number): number {
  return Math.max(0, Math.min(255, value))
}

/** Аватар AI-консультанта */
export function AiAvatar({ size = 'md', animated }: { size?: 'sm' | 'md' | 'lg'; animated?: boolean }) {
  const dimension = size === 'sm' ? 'h-7 w-7' : size === 'lg' ? 'h-11 w-11' : 'h-9 w-9'
  const icon = size === 'sm' ? 'h-3.5 w-3.5' : size === 'lg' ? 'h-5 w-5' : 'h-4 w-4'
  return (
    <span className={cx('relative inline-flex shrink-0 items-center justify-center rounded-xl ai-gradient', dimension)}>
      {animated && <span className="absolute inset-0 rounded-xl bg-brand-400 animate-pulse-ring" />}
      <SparkleIcon className={cx('relative text-white', icon)} />
    </span>
  )
}

/** Относительное время: «4 минуты назад» */
export function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const minutes = Math.round(diff / 60_000)
  if (minutes < 1) return 'только что'
  if (minutes < 60) return `${minutes} ${plural(minutes, 'минуту', 'минуты', 'минут')} назад`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours} ${plural(hours, 'час', 'часа', 'часов')} назад`
  const days = Math.round(hours / 24)
  return `${days} ${plural(days, 'день', 'дня', 'дней')} назад`
}

function plural(count: number, one: string, few: string, many: string): string {
  const mod10 = count % 10
  const mod100 = count % 100
  if (mod10 === 1 && mod100 !== 11) return one
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return few
  return many
}
