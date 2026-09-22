import { useMemo, useState } from 'react'
import { analyticsService, CHART_COLORS } from '../../services/analyticsService'
import { SparkleIcon } from '../ui/icons'
import { Card, SectionLabel, cx } from '../ui/primitives'

/**
 * Аналитика AI-модуля.
 *
 * Правила визуализации: одна шкала на график, тонкие метки, скруглённые
 * верхушки столбцов с зазором 2px, приглушённая сетка, легенда для двух
 * серий + прямые подписи на пиковой группе, тултип по наведению.
 * Палитра проверена на различимость при дальтонизме.
 */
export function AnalyticsView() {
  const snapshot = useMemo(() => analyticsService.snapshot(), [])

  return (
    <div className="h-full overflow-y-auto bg-ink-50/60 px-6 py-6">
      <div className="mx-auto max-w-5xl space-y-5">
        <header>
          <div className="flex items-center gap-2">
            <SectionLabel>Аналитика AI-модуля</SectionLabel>
            <span className="inline-flex items-center gap-1 rounded-md bg-brand-50 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-brand-700 ring-1 ring-inset ring-brand-100">
              <SparkleIcon className="h-3 w-3" /> 7 дней
            </span>
          </div>
          <h2 className="mt-1 text-[20px] font-semibold tracking-tight text-ink-900">
            Что AI взял на себя за неделю
          </h2>
          <p className="mt-1 max-w-2xl text-[13px] leading-relaxed text-ink-500">
            Метрики считаются по диалогам AI-консультанта и заявкам, переданным в существующую CRM.
          </p>
        </header>

        {/* KPI-плитки: главное число крупно, пояснение — текстом, не цветом */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
          {snapshot.kpis.map((kpi) => (
            <Card key={kpi.key} className="px-4 py-3.5">
              <p className="text-[11.5px] font-medium text-ink-500">{kpi.label}</p>
              <div className="mt-1.5 flex items-baseline gap-2">
                <span className="text-[26px] font-semibold leading-none tracking-tight text-ink-900">
                  {kpi.value}
                </span>
                {kpi.delta && (
                  <span
                    className={cx(
                      'rounded-md px-1.5 py-0.5 text-[11px] font-semibold',
                      kpi.trend === 'up' ? 'bg-emerald-50 text-emerald-700' : 'bg-ink-100 text-ink-600',
                    )}
                  >
                    {kpi.delta}
                  </span>
                )}
              </div>
              <p className="mt-1.5 text-[11px] leading-snug text-ink-400">{kpi.hint}</p>
            </Card>
          ))}
        </div>

        <DialogsChart data={snapshot.dialogsByDay} />

        <div className="grid gap-3 lg:grid-cols-2">
          <FunnelCard funnel={snapshot.funnel} />
          <IntentsCard intents={snapshot.topIntents} />
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Диалоги и квалифицированные заявки по дням                          */
/* ------------------------------------------------------------------ */

const WIDTH = 720
const HEIGHT = 240
const PAD = { top: 26, right: 12, bottom: 28, left: 34 }

function DialogsChart({ data }: { data: { day: string; dialogs: number; qualified: number }[] }) {
  const [hovered, setHovered] = useState<number | null>(null)

  const max = Math.ceil(Math.max(...data.map((d) => d.dialogs)) / 50) * 50
  const plotWidth = WIDTH - PAD.left - PAD.right
  const plotHeight = HEIGHT - PAD.top - PAD.bottom
  const groupWidth = plotWidth / data.length
  const barWidth = Math.min(22, (groupWidth - 14) / 2)
  const ticks = [0, max / 2, max]
  const peakIndex = data.reduce((best, item, index) => (item.dialogs > data[best].dialogs ? index : best), 0)

  const y = (value: number) => PAD.top + plotHeight - (value / max) * plotHeight

  return (
    <Card className="px-4 py-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <p className="text-[13.5px] font-semibold text-ink-800">Диалоги и квалифицированные заявки</p>
          <p className="mt-0.5 text-[11.5px] text-ink-400">Одна шкала — количество за день</p>
        </div>
        {/* Легенда обязательна для двух серий */}
        <div className="flex items-center gap-3">
          {[
            { label: 'Диалоги с AI', color: CHART_COLORS.dialogs },
            { label: 'Квалифицировано', color: CHART_COLORS.qualified },
          ].map((series) => (
            <span key={series.label} className="inline-flex items-center gap-1.5 text-[11.5px] text-ink-600">
              <span className="h-2.5 w-2.5 rounded-sm" style={{ background: series.color }} aria-hidden />
              {series.label}
            </span>
          ))}
        </div>
      </div>

      <div className="relative mt-2">
        <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full" role="img" aria-label="Диалоги и заявки по дням">
          {/* Приглушённая сетка */}
          {ticks.map((tick) => (
            <g key={tick}>
              <line
                x1={PAD.left}
                x2={WIDTH - PAD.right}
                y1={y(tick)}
                y2={y(tick)}
                stroke="rgb(14 18 32 / 0.08)"
                strokeWidth="1"
              />
              <text x={PAD.left - 8} y={y(tick) + 3.5} textAnchor="end" className="fill-ink-400 text-[10px]">
                {tick}
              </text>
            </g>
          ))}

          {data.map((item, index) => {
            const groupX = PAD.left + index * groupWidth
            // Зазор 2px между соседними столбцами группы
            const firstX = groupX + groupWidth / 2 - barWidth - 1
            const secondX = groupX + groupWidth / 2 + 1
            const isHovered = hovered === index

            return (
              <g
                key={item.day}
                onMouseEnter={() => setHovered(index)}
                onMouseLeave={() => setHovered(null)}
                className="cursor-default"
              >
                {/* Зона наведения шире столбцов */}
                <rect x={groupX} y={PAD.top} width={groupWidth} height={plotHeight} fill="transparent" />
                {isHovered && (
                  <rect
                    x={groupX + 2}
                    y={PAD.top}
                    width={groupWidth - 4}
                    height={plotHeight}
                    fill="rgb(14 18 32 / 0.03)"
                    rx="6"
                  />
                )}

                <path
                  d={topRoundedBar(firstX, y(item.dialogs), barWidth, PAD.top + plotHeight - y(item.dialogs))}
                  fill={CHART_COLORS.dialogs}
                  opacity={hovered === null || isHovered ? 1 : 0.55}
                />
                <path
                  d={topRoundedBar(secondX, y(item.qualified), barWidth, PAD.top + plotHeight - y(item.qualified))}
                  fill={CHART_COLORS.qualified}
                  opacity={hovered === null || isHovered ? 1 : 0.55}
                />

                {/* Прямые подписи только на пиковой группе */}
                {index === peakIndex && (
                  <>
                    <text
                      x={firstX + barWidth / 2}
                      y={y(item.dialogs) - 7}
                      textAnchor="middle"
                      className="fill-ink-700 text-[10px] font-semibold"
                    >
                      {item.dialogs}
                    </text>
                    <text
                      x={secondX + barWidth / 2}
                      y={y(item.qualified) - 7}
                      textAnchor="middle"
                      className="fill-ink-700 text-[10px] font-semibold"
                    >
                      {item.qualified}
                    </text>
                  </>
                )}

                <text
                  x={groupX + groupWidth / 2}
                  y={HEIGHT - 9}
                  textAnchor="middle"
                  className={cx('text-[11px]', isHovered ? 'fill-ink-700 font-semibold' : 'fill-ink-400')}
                >
                  {item.day}
                </text>
              </g>
            )
          })}

          <line
            x1={PAD.left}
            x2={WIDTH - PAD.right}
            y1={PAD.top + plotHeight}
            y2={PAD.top + plotHeight}
            stroke="rgb(14 18 32 / 0.16)"
            strokeWidth="1"
          />
        </svg>

        {/* Тултип */}
        {hovered !== null && (
          <div
            className="pointer-events-none absolute top-0 z-10 w-[150px] -translate-x-1/2 rounded-xl bg-ink-900 px-3 py-2 text-white shadow-lift"
            // Держим тултип в пределах карточки: у крайних дней он иначе уезжает за край
            style={{
              left: `${Math.min(88, Math.max(12, ((PAD.left + (hovered + 0.5) * groupWidth) / WIDTH) * 100))}%`,
            }}
          >
            <p className="text-[11px] font-semibold">{data[hovered].day}</p>
            <div className="mt-1 space-y-0.5">
              <Row color={CHART_COLORS.dialogs} label="Диалоги" value={data[hovered].dialogs} />
              <Row color={CHART_COLORS.qualified} label="Заявки" value={data[hovered].qualified} />
              <p className="pt-0.5 text-[10.5px] text-white/60">
                Конверсия {Math.round((data[hovered].qualified / data[hovered].dialogs) * 100)}%
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Табличный доступ к тем же данным */}
      <details className="mt-2 group">
        <summary className="cursor-pointer text-[11px] font-medium text-ink-400 hover:text-ink-600">
          Показать данные таблицей
        </summary>
        <table className="mt-2 w-full text-[11.5px]">
          <thead>
            <tr className="text-left text-ink-400">
              <th className="py-1 font-medium">День</th>
              <th className="py-1 font-medium">Диалоги</th>
              <th className="py-1 font-medium">Квалифицировано</th>
            </tr>
          </thead>
          <tbody className="text-ink-700">
            {data.map((item) => (
              <tr key={item.day} className="border-t border-ink-100">
                <td className="py-1">{item.day}</td>
                <td className="py-1">{item.dialogs}</td>
                <td className="py-1">{item.qualified}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </Card>
  )
}

function Row({ color, label, value }: { color: string; label: string; value: number }) {
  return (
    <p className="flex items-center gap-1.5 text-[11px]">
      <span className="h-2 w-2 rounded-sm" style={{ background: color }} aria-hidden />
      <span className="text-white/70">{label}</span>
      <span className="ml-auto font-semibold">{value}</span>
    </p>
  )
}

/** Столбец со скруглённой верхушкой, прижатый к базовой линии. */
function topRoundedBar(x: number, y: number, width: number, height: number): string {
  const r = Math.min(4, width / 2, Math.max(0, height))
  const bottom = y + Math.max(height, 0)
  return [
    `M ${x} ${bottom}`,
    `L ${x} ${y + r}`,
    `Q ${x} ${y} ${x + r} ${y}`,
    `L ${x + width - r} ${y}`,
    `Q ${x + width} ${y} ${x + width} ${y + r}`,
    `L ${x + width} ${bottom}`,
    'Z',
  ].join(' ')
}

/* ------------------------------------------------------------------ */
/* Воронка                                                             */
/* ------------------------------------------------------------------ */

function FunnelCard({ funnel }: { funnel: { label: string; value: number }[] }) {
  const top = funnel[0]?.value ?? 1
  return (
    <Card className="px-4 py-4">
      <p className="text-[13.5px] font-semibold text-ink-800">Воронка AI-диалога</p>
      <p className="mt-0.5 text-[11.5px] text-ink-400">Путь клиента внутри виджета</p>

      <div className="mt-3 space-y-2.5">
        {funnel.map((stage, index) => {
          const share = stage.value / top
          const prev = index === 0 ? stage.value : funnel[index - 1].value
          return (
            <div key={stage.label}>
              <div className="flex items-baseline justify-between text-[12px]">
                <span className="text-ink-600">{stage.label}</span>
                <span className="font-semibold text-ink-900">
                  {stage.value}
                  {index > 0 && (
                    <span className="ml-1.5 text-[10.5px] font-medium text-ink-400">
                      {Math.round((stage.value / prev) * 100)}%
                    </span>
                  )}
                </span>
              </div>
              <div className="mt-1 h-2 overflow-hidden rounded-full bg-ink-100">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${Math.max(4, share * 100)}%`,
                    background: CHART_COLORS.sequential,
                    opacity: 1 - index * 0.13,
                  }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </Card>
  )
}

/* ------------------------------------------------------------------ */
/* Темы обращений                                                      */
/* ------------------------------------------------------------------ */

function IntentsCard({ intents }: { intents: { label: string; share: number }[] }) {
  return (
    <Card className="px-4 py-4">
      <p className="text-[13.5px] font-semibold text-ink-800">О чём спрашивают клиенты</p>
      <p className="mt-0.5 text-[11.5px] text-ink-400">Доля диалогов по темам</p>

      <div className="mt-3 space-y-2.5">
        {intents.map((intent, index) => (
          <div key={intent.label} className="flex items-center gap-3">
            <span className="w-[170px] shrink-0 text-[12px] leading-snug text-ink-600">{intent.label}</span>
            <span className="h-2 flex-1 overflow-hidden rounded-full bg-ink-100">
              <span
                className="block h-full rounded-full transition-all duration-700"
                style={{
                  width: `${intent.share * 100}%`,
                  background: CHART_COLORS.sequential,
                  opacity: 1 - index * 0.13,
                }}
              />
            </span>
            <span className="w-9 shrink-0 text-right text-[12px] font-semibold text-ink-900">
              {Math.round(intent.share * 100)}%
            </span>
          </div>
        ))}
      </div>
    </Card>
  )
}
