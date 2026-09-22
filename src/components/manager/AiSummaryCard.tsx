import type { AiSummary } from '../../types'
import { RouteIcon, SparkleIcon } from '../ui/icons'

/**
 * AI-анализ клиента — ключевой блок панели менеджера.
 *
 * Смысл блока: менеджеру НЕ нужно читать весь диалог.
 * Поэтому резюме и рекомендованное действие визуально доминируют.
 */
export function AiSummaryCard({ summary }: { summary: AiSummary }) {
  return (
    <section className="overflow-hidden rounded-2xl ring-1 ring-brand-200/70 shadow-card">
      <header className="flex items-center gap-2 ai-gradient px-4 py-3">
        <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-white/20">
          <SparkleIcon className="h-4 w-4 text-white" />
        </span>
        <div>
          <p className="text-[13.5px] font-semibold text-white">AI-анализ клиента</p>
          <p className="text-[11px] text-white/70">Диалог обработан автоматически · читать переписку не требуется</p>
        </div>
      </header>

      <div className="bg-gradient-to-b from-brand-50/80 to-white px-4 py-4">
        <div className="space-y-2">
          {summary.paragraphs.map((paragraph) => (
            <p key={paragraph} className="text-[13px] leading-relaxed text-ink-800">
              {paragraph}
            </p>
          ))}
        </div>

        <div className="mt-4 flex flex-wrap gap-1.5">
          {summary.facts
            .filter((fact) => fact.value !== '—')
            .map((fact) => (
              <span
                key={fact.label}
                className="inline-flex items-center gap-1.5 rounded-lg bg-white px-2.5 py-1.5 text-[11.5px] ring-1 ring-ink-200"
              >
                <span className="text-ink-400">{fact.label}:</span>
                <span className="font-semibold text-ink-800">{fact.value}</span>
              </span>
            ))}
        </div>

        <div className="mt-4 flex gap-3 rounded-xl bg-ink-900 px-4 py-3.5 text-white">
          <RouteIcon className="mt-0.5 h-4 w-4 shrink-0 text-brand-300" />
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-white/50">
              Рекомендуемое действие
            </p>
            <p className="mt-1 text-[13px] font-medium leading-relaxed">{summary.recommendedAction}</p>
          </div>
        </div>
      </div>
    </section>
  )
}
