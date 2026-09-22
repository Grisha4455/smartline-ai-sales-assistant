import { useEffect, useMemo, useState, useSyncExternalStore } from 'react'
import { analyticsService } from '../../services/analyticsService'
import { leadService } from '../../services/leadService'
import type { Lead } from '../../types'
import { ChartIcon, ChatIcon, InboxIcon, ProgressIcon, SparkleIcon, UsersIcon } from '../ui/icons'
import { AiBadge, cx } from '../ui/primitives'
import { AnalyticsView } from './AnalyticsView'
import { ClientsView } from './ClientsView'
import { LeadDetail } from './LeadDetail'
import { LeadList } from './LeadList'

type NavKey = 'new' | 'in_progress' | 'clients' | 'analytics'

const NAV_ITEMS: { key: NavKey; label: string; icon: typeof InboxIcon }[] = [
  { key: 'new', label: 'Новые заявки', icon: InboxIcon },
  { key: 'in_progress', label: 'В работе', icon: ProgressIcon },
  { key: 'clients', label: 'Клиенты', icon: UsersIcon },
  { key: 'analytics', label: 'Аналитика', icon: ChartIcon },
]

/** Очередь заявок для выбранного раздела, свежие сверху. */
function queueFor(leads: Lead[], nav: NavKey): Lead[] {
  const matches =
    nav === 'in_progress'
      ? (l: Lead) => l.status === 'in_progress' || l.status === 'replied'
      : (l: Lead) => l.status === 'new'
  return leads.filter(matches).sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
}

/**
 * ЭКРАН 2 — Manager Dashboard.
 *
 * Это условно существующая внутренняя панель менеджера, в которую
 * добавлены AI-функции: источник «AI-консультант», AI-резюме,
 * готовый черновик ответа и подсказка следующего шага.
 */
export function ManagerDashboard({ highlightLeadId }: { highlightLeadId?: string }) {
  const leads = useSyncExternalStore(leadService.subscribe, leadService.snapshot, leadService.snapshot)
  const [nav, setNav] = useState<NavKey>('new')
  const [selectedId, setSelectedId] = useState<string | undefined>(highlightLeadId)

  const counts = useMemo(() => analyticsService.queueCounts(leads), [leads])

  const visibleLeads = useMemo<Lead[]>(() => queueFor(leads, nav), [leads, nav])

  const changeNav = (key: NavKey) => {
    setNav(key)
    // При переходе в другую очередь открываем её первую заявку
    if (key === 'new' || key === 'in_progress') setSelectedId(queueFor(leads, key)[0]?.id)
  }

  // Заявка из клиентского сценария открывается сразу
  useEffect(() => {
    if (highlightLeadId) {
      setNav('new')
      setSelectedId(highlightLeadId)
    }
  }, [highlightLeadId])

  // Держим выбранной существующую заявку.
  //
  // Проверяем существование по ВСЕМ заявкам, а не по текущей очереди:
  // после «Взять в работу» или «Отправить» заявка меняет статус и уходит
  // из списка «Новые». Если ориентироваться на очередь, открытая карточка
  // переключилась бы на другую заявку — ровно в тот момент, когда нужно
  // показать смену статуса.
  useEffect(() => {
    if (nav === 'clients' || nav === 'analytics') return
    const exists = leads.some((l) => l.id === selectedId)
    if (!exists) setSelectedId(visibleLeads[0]?.id)
  }, [leads, visibleLeads, selectedId, nav])

  const selectedLead = leads.find((l) => l.id === selectedId)
  const isQueue = nav === 'new' || nav === 'in_progress'

  return (
    <div className="flex h-[calc(100vh-3.5rem)] flex-col bg-white">
      {/* Навигация для узких экранов — там сайдбар скрыт */}
      <nav className="flex shrink-0 gap-1 overflow-x-auto border-b border-ink-200 bg-ink-50/70 px-3 py-2 lg:hidden">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon
          const isActive = nav === item.key
          return (
            <button
              key={item.key}
              onClick={() => changeNav(item.key)}
              className={cx(
                'inline-flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[12.5px] font-medium transition',
                isActive ? 'bg-white text-ink-900 shadow-card ring-1 ring-ink-200' : 'text-ink-500',
              )}
            >
              <Icon className={cx('h-3.5 w-3.5', isActive ? 'text-brand-600' : 'text-ink-400')} />
              {item.label}
            </button>
          )
        })}
      </nav>

      <div className="flex min-h-0 flex-1">
        {/* Сайдбар скрываем до lg: иначе на планшете карточке заявки остаётся ~200px */}
        <aside className="hidden w-[232px] shrink-0 flex-col border-r border-ink-200 bg-ink-50/70 lg:flex">
          <div className="px-4 py-4">
            <p className="text-[13px] font-bold tracking-tight text-ink-900">
              Smart<span className="text-brand-600">Line</span> CRM
            </p>
            <p className="mt-0.5 text-[10.5px] text-ink-400">Панель менеджера · существующая система</p>
          </div>

          <div className="mx-3 mb-3 rounded-xl bg-white px-3 py-2.5 ring-1 ring-brand-100">
            <div className="flex items-center gap-1.5">
              <SparkleIcon className="h-3.5 w-3.5 text-brand-600" />
              <p className="text-[11.5px] font-semibold text-ink-800">AI-модуль подключён</p>
            </div>
            <p className="mt-1 text-[10.5px] leading-snug text-ink-500">
              Обрабатывает первую линию и передаёт готовые заявки
            </p>
          </div>

          <nav className="flex-1 space-y-0.5 px-2">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon
              const count =
                item.key === 'new' ? counts.new : item.key === 'in_progress' ? counts.in_progress + counts.replied : 0
              const isActive = nav === item.key
              return (
                <button
                  key={item.key}
                  onClick={() => changeNav(item.key)}
                  className={cx(
                    'flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium transition',
                    isActive ? 'bg-white text-ink-900 shadow-card ring-1 ring-ink-200' : 'text-ink-600 hover:bg-white/70',
                  )}
                >
                  <Icon className={cx('h-4 w-4', isActive ? 'text-brand-600' : 'text-ink-400')} />
                  <span className="flex-1 text-left">{item.label}</span>
                  {count > 0 && (
                    <span
                      className={cx(
                        'rounded-md px-1.5 py-0.5 text-[10.5px] font-semibold',
                        item.key === 'new' ? 'bg-brand-600 text-white' : 'bg-ink-200 text-ink-700',
                      )}
                    >
                      {count}
                    </span>
                  )}
                </button>
              )
            })}
          </nav>

          <div className="border-t border-ink-200 px-3 py-3">
            <div className="flex items-center gap-2.5">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-ink-900 text-[11px] font-semibold text-white">
                ИП
              </span>
              <div className="min-w-0">
                <p className="truncate text-[12px] font-medium text-ink-800">Ирина Петрова</p>
                <p className="text-[10.5px] text-ink-400">Менеджер отдела продаж</p>
              </div>
            </div>
          </div>
        </aside>

        {/* Очередь заявок */}
        {isQueue && (
          <div className="w-full shrink-0 border-r border-ink-200 bg-ink-50/40 md:w-[324px] lg:w-[352px]">
            <LeadList
              leads={visibleLeads}
              selectedId={selectedId}
              onSelect={setSelectedId}
              title={nav === 'new' ? 'Новые заявки' : 'В работе'}
              subtitle={
                nav === 'new'
                  ? `${visibleLeads.length} заявок ждут первого контакта`
                  : `${visibleLeads.length} заявок в процессе`
              }
            />
          </div>
        )}

        {/* Детальная карточка / другие разделы */}
        {/* В режиме очереди на телефоне показываем только список: карточке нужна ширина */}
        <main className={cx('min-w-0 flex-1', isQueue ? 'hidden md:block' : 'block')}>
          {nav === 'analytics' && <AnalyticsView />}
          {nav === 'clients' && <ClientsView />}
          {isQueue && (selectedLead ? <LeadDetail key={selectedLead.id} lead={selectedLead} /> : <EmptyState />)}
        </main>
      </div>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
      <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-ink-100 text-ink-400">
        <ChatIcon className="h-5 w-5" />
      </span>
      <p className="text-[14px] font-medium text-ink-700">Выберите заявку</p>
      <p className="max-w-xs text-[12.5px] leading-relaxed text-ink-400">
        В карточке заявки видно AI-резюме диалога, черновик ответа и рекомендованный следующий шаг.
      </p>
      <AiBadge label="AI-модуль" />
    </div>
  )
}
