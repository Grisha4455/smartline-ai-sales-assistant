import { useCallback, useState, useSyncExternalStore } from 'react'
import { DEMO_SCENARIO_LEAD_ID } from './data/leads'
import { leadService } from './services/leadService'
import { ClientDemoScreen } from './components/client/ClientDemoScreen'
import { ManagerDashboard } from './components/manager/ManagerDashboard'
import { ChatIcon, InboxIcon, RefreshIcon, SparkleIcon } from './components/ui/icons'
import { DemoBadge, cx } from './components/ui/primitives'

type Screen = 'client' | 'manager'

/**
 * Оболочка демонстрации.
 *
 * Верхняя панель — часть DEMO-стенда, а не продукта: она нужна, чтобы
 * на записи видео переключаться между взглядом клиента и взглядом
 * менеджера.
 */
export default function App() {
  const [screen, setScreen] = useState<Screen>('client')
  const [resetKey, setResetKey] = useState(0)
  const leads = useSyncExternalStore(leadService.subscribe, leadService.snapshot, leadService.snapshot)

  const liveLead = leads.find((lead) => lead.isLive)
  const newCount = leads.filter((lead) => lead.status === 'new').length

  const openDashboard = useCallback(() => setScreen('manager'), [])

  const resetDemo = () => {
    leadService.reset()
    setResetKey((value) => value + 1)
    setScreen('client')
  }

  return (
    <div className="min-h-screen bg-ink-50">
      <header className="sticky top-0 z-50 flex h-14 items-center gap-2 border-b border-ink-800/60 bg-ink-950 px-3 text-white sm:gap-4 sm:px-4">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg ai-gradient">
            <SparkleIcon className="h-4 w-4" />
          </span>
          <div className="min-w-0 leading-tight">
            <p className="truncate text-[13px] font-semibold">
              SmartLine <span className="text-white/50">AI Sales Assistant</span>
            </p>
            <p className="hidden text-[10.5px] text-white/40 sm:block">
              AI-надстройка над существующим интернет-магазином
            </p>
          </div>
          <DemoBadge className="ml-1 hidden sm:inline-flex" />
        </div>

        {/* Переключатель экранов демонстрации */}
        <nav className="ml-auto flex shrink-0 items-center gap-1 rounded-xl bg-white/5 p-1 ring-1 ring-inset ring-white/10">
          <ScreenTab
            active={screen === 'client'}
            onClick={() => setScreen('client')}
            icon={<ChatIcon className="h-3.5 w-3.5" />}
            label="Клиент"
            hint="Сайт магазина"
          />
          <ScreenTab
            active={screen === 'manager'}
            onClick={() => setScreen('manager')}
            icon={<InboxIcon className="h-3.5 w-3.5" />}
            label="Менеджер"
            hint="AI Sales Dashboard"
            badge={newCount}
          />
        </nav>

        <button
          onClick={resetDemo}
          className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[12px] font-medium text-white/60 transition hover:bg-white/10 hover:text-white"
          title="Вернуть демонстрацию в исходное состояние"
        >
          <RefreshIcon className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Сбросить демо</span>
        </button>
      </header>

      {screen === 'client' ? (
        <ClientDemoScreen onOpenDashboard={openDashboard} resetKey={resetKey} />
      ) : (
        <ManagerDashboard highlightLeadId={liveLead?.id ?? DEMO_SCENARIO_LEAD_ID} />
      )}
    </div>
  )
}

function ScreenTab({
  active,
  onClick,
  icon,
  label,
  hint,
  badge,
}: {
  active: boolean
  onClick: () => void
  icon: React.ReactNode
  label: string
  hint: string
  badge?: number
}) {
  return (
    <button
      onClick={onClick}
      className={cx(
        'flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-left transition sm:px-3',
        active ? 'bg-white text-ink-900 shadow-sm' : 'text-white/60 hover:text-white',
      )}
    >
      <span className={active ? 'text-brand-600' : ''}>{icon}</span>
      <span className="hidden leading-tight sm:block">
        <span className="block text-[12.5px] font-semibold">{label}</span>
        <span className={cx('hidden text-[10px] lg:block', active ? 'text-ink-400' : 'text-white/35')}>{hint}</span>
      </span>
      {badge ? (
        <span
          className={cx(
            'ml-0.5 rounded-md px-1.5 py-0.5 text-[10px] font-semibold',
            active ? 'bg-brand-600 text-white' : 'bg-white/15 text-white/80',
          )}
        >
          {badge}
        </span>
      ) : null}
    </button>
  )
}
