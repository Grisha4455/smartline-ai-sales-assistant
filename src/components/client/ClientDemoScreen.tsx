import { useCallback, useState } from 'react'
import { createConversationState, type ConversationState } from '../../services/aiService'
import { BoltIcon, PlugIcon, SparkleIcon } from '../ui/icons'
import { DemoBadge, SectionLabel, cx } from '../ui/primitives'
import { ChatWidget } from './ChatWidget'
import { NeedProfileCard } from './NeedProfileCard'
import { StoreBackdrop } from './StoreBackdrop'

/**
 * ЭКРАН 1 — Client Demo.
 *
 * Композиция экрана несёт главное сообщение прототипа:
 * сайт магазина уже существует (фон), а AI-модуль — это виджет
 * в правом нижнем углу плюс живой профиль потребности слева.
 */
export function ClientDemoScreen({
  onOpenDashboard,
  resetKey,
}: {
  onOpenDashboard: () => void
  resetKey: number
}) {
  const [convo, setConvo] = useState<ConversationState>(createConversationState)
  const handleProfileChange = useCallback((state: ConversationState) => setConvo(state), [])

  // confidence учитывает и слоты, по которым клиент сказал «не важно»
  const hasProfile = convo.profile.confidence > 0

  return (
    <div className="relative min-h-[calc(100vh-3.5rem)] overflow-hidden bg-ink-50">
      {/* Существующий сайт магазина — фон, который мы не трогаем */}
      <div className="absolute inset-0 overflow-hidden opacity-[0.82]">
        <StoreBackdrop />
      </div>
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/50 via-white/20 to-ink-100/60" />

      {/* Пояснительный слой. pt-20 — чтобы шапка «существующего сайта» осталась видна */}
      <div className="relative mx-auto max-w-6xl px-6 pb-6 pt-20">
        <div className="flex max-w-xl flex-col items-start gap-3">
          <div className="max-w-xl rounded-2xl bg-ink-900/95 px-5 py-4 text-white shadow-widget backdrop-blur">
            <div className="flex items-center gap-2">
              <PlugIcon className="h-4 w-4 text-brand-300" />
              <SectionLabel className="!text-white/50">AI-надстройка над существующим сайтом</SectionLabel>
              <DemoBadge />
            </div>
            <p className="mt-2 text-[17px] font-semibold leading-snug">
              Сайт, каталог, CRM и менеджеры остаются как есть.
              <br />
              Новое — только AI-консультант в углу страницы.
            </p>
            <p className="mt-2 text-[12.5px] leading-relaxed text-white/60">
              Он ведёт первую линию: выясняет задачу и бюджет, подбирает модели из вашего каталога, квалифицирует
              клиента и передаёт менеджеру готовую заявку с резюме диалога.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {['Подключение скриптом', 'Работает 24/7', 'Данные — из вашего каталога'].map((item) => (
                <span
                  key={item}
                  className="rounded-lg bg-white/10 px-2.5 py-1 text-[11px] font-medium text-white/80"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-xl bg-white/85 px-3.5 py-2.5 text-[12px] font-medium text-ink-500 shadow-card ring-1 ring-ink-200 backdrop-blur">
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-lg bg-ink-100 text-ink-400">
              <BoltIcon className="h-3.5 w-3.5" />
            </span>
            Витрина ниже — существующий сайт. Он неактивен в демо.
          </div>
        </div>

        {/* Живой AI-профиль клиента рядом с виджетом */}
        <div
          className={cx(
            'pointer-events-none fixed bottom-6 left-6 z-30 hidden w-[286px] transition-all duration-500 xl:block',
            hasProfile ? 'translate-y-0 opacity-100' : 'translate-y-3 opacity-0',
          )}
        >
          <div className="mb-2 flex items-center gap-2 rounded-lg bg-ink-900/90 px-2.5 py-1.5 text-[11px] font-medium text-white/80 backdrop-blur">
            <SparkleIcon className="h-3.5 w-3.5 text-brand-300" />
            AI собирает профиль в реальном времени
          </div>
          <NeedProfileCard profile={convo.profile} variant="panel" />
          {convo.selectedProductId && (
            <div className="mt-2 rounded-xl bg-emerald-600 px-3 py-2 text-[11.5px] font-medium text-white shadow-lift">
              Клиент выбрал модель — лид готов к передаче менеджеру
            </div>
          )}
        </div>
      </div>

      <ChatWidget onOpenDashboard={onOpenDashboard} onProfileChange={handleProfileChange} resetKey={resetKey} />
    </div>
  )
}
