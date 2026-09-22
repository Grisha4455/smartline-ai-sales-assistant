import type { NeedProfile, NoPreferenceSlot } from '../../types'
import { formatPrice } from '../../services/productService'
import { SparkleIcon } from '../ui/icons'
import { cx } from '../ui/primitives'

const USE_CASE_LABEL: Record<string, string> = {
  gaming: 'Игры',
  photo: 'Фото и видео',
  work: 'Работа и звонки',
  battery: 'Автономность',
  basic: 'Повседневные задачи',
}

const CAMERA_LABEL: Record<string, string> = {
  low: 'Низкий приоритет',
  normal: 'Средний приоритет',
  high: 'Высокий приоритет',
}

const INTENT_LABEL: Record<string, string> = {
  purchase: 'Покупка',
  comparison: 'Сравнение моделей',
  research: 'Изучает варианты',
  support: 'Поддержка',
}

/**
 * «Потребность клиента» — то, что AI понял из диалога.
 *
 * Показывается и внутри переписки, и как отдельный блок рядом с виджетом:
 * владелец бизнеса должен видеть, что AI не просто болтает, а собирает
 * структурированные данные.
 */
export function NeedProfileCard({ profile, variant = 'chat' }: { profile: NeedProfile; variant?: 'chat' | 'panel' }) {
  // Клиент мог сказать «не важно» — это осознанный ответ, а не пропуск
  const skipped = profile.noPreference ?? []
  const value = (slot: NoPreferenceSlot, formatted: string | undefined) =>
    skipped.includes(slot) ? 'не важно' : formatted

  const rows: { label: string; value: string | undefined }[] = [
    { label: 'Бюджет', value: value('budget', profile.budget ? `до ${formatPrice(profile.budget)} BYN` : undefined) },
    {
      label: 'Основная задача',
      value: value('useCase', profile.useCase ? USE_CASE_LABEL[profile.useCase] : undefined),
    },
    { label: 'Память', value: value('storage', profile.storage ? `${profile.storage} GB+` : undefined) },
    {
      label: 'Камера',
      value: value('cameraPriority', profile.cameraPriority ? CAMERA_LABEL[profile.cameraPriority] : undefined),
    },
    { label: 'Намерение', value: INTENT_LABEL[profile.intent] },
  ]

  const filled = Math.round(profile.confidence * 100)

  return (
    <div
      className={cx(
        'overflow-hidden rounded-xl bg-white ring-1 ring-ink-200',
        variant === 'panel' ? 'shadow-lift' : 'shadow-card',
      )}
    >
      <div className="flex items-center gap-2 border-b border-ink-100 bg-ink-50/70 px-3.5 py-2.5">
        <SparkleIcon className="h-3.5 w-3.5 text-brand-600" />
        <p className="text-[12px] font-semibold text-ink-800">Потребность клиента</p>
        <span className="ml-auto text-[10px] font-medium text-ink-400">AI-профиль</span>
      </div>

      <dl className="divide-y divide-ink-100">
        {rows.map((row) => (
          <div key={row.label} className="flex items-baseline justify-between gap-3 px-3.5 py-2">
            <dt className="text-[12px] text-ink-500">{row.label}</dt>
            <dd
              className={cx(
                'text-right text-[12px] font-semibold',
                row.value ? 'text-ink-900' : 'text-ink-300',
              )}
            >
              {row.value ?? 'уточняется'}
            </dd>
          </div>
        ))}
      </dl>

      <div className="flex items-center gap-2 border-t border-ink-100 px-3.5 py-2.5">
        <span className="text-[10px] font-medium uppercase tracking-wider text-ink-400">Квалификация</span>
        <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-ink-100">
          <span
            className="block h-full rounded-full bg-brand-500 transition-all duration-700 ease-out"
            style={{ width: `${Math.max(6, filled)}%` }}
          />
        </span>
        <span className="text-[11px] font-semibold text-ink-700">{filled}%</span>
      </div>
    </div>
  )
}
