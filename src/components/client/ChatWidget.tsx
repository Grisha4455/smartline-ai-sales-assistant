import { useCallback, useEffect, useRef, useState } from 'react'
import {
  aiService,
  createConversationState,
  PURCHASE_METHOD_TEXT,
  type AiTurn,
  type ConversationState,
} from '../../services/aiService'
import { leadService } from '../../services/leadService'
import { productService } from '../../services/productService'
import type { ChatMessage, PurchaseMethod, QuickReply } from '../../types'
import { CloseIcon, MinusIcon, SendIcon, SparkleIcon } from '../ui/icons'
import { AiAvatar, Button, DemoBadge, cx } from '../ui/primitives'
import { NeedProfileCard } from './NeedProfileCard'
import { ProductChatCard } from './ProductChatCard'
import { ContactFormBlock, LeadCreatedBlock, PurchaseMethodBlock, SelectedProductBlock } from './ChatWidgets'

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

let messageSeq = 0
const nextId = () => `msg-${++messageSeq}`

function clock(): string {
  return new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
}

function turnToMessage(turn: AiTurn): ChatMessage {
  return {
    id: nextId(),
    author: 'ai',
    text: turn.text,
    time: clock(),
    quickReplies: turn.quickReplies,
    products: turn.products,
    widget: turn.widget,
    meta: turn.meta,
  }
}

export interface ChatWidgetProps {
  onOpenDashboard: () => void
  onProfileChange: (state: ConversationState) => void
  /** Меняется при сбросе демонстрации — перезапускает диалог */
  resetKey: number
}

export function ChatWidget({ onOpenDashboard, onProfileChange, resetKey }: ChatWidgetProps) {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [convo, setConvo] = useState<ConversationState>(createConversationState)
  const [typing, setTyping] = useState(false)
  const [busy, setBusy] = useState(false)
  const [input, setInput] = useState('')
  const [leadId, setLeadId] = useState<string | null>(null)

  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const greetedRef = useRef(false)
  const runRef = useRef(0)

  /**
   * Актуальное состояние диалога для обработчиков из очереди.
   *
   * Обработчик может выполниться позже, чем был создан, поэтому читать
   * `convo` из замыкания нельзя — там будет устаревший профиль.
   */
  const convoRef = useRef(convo)
  const applyState = useCallback((next: ConversationState) => {
    convoRef.current = next
    setConvo(next)
  }, [])

  /**
   * Очередь ходов.
   *
   * Клиент может написать, пока AI ещё «печатает». Раньше такие
   * сообщения молча отбрасывались — выглядело так, будто консультант
   * принимает только свои кнопки. Теперь ход встаёт в очередь.
   */
  const queueRef = useRef<Promise<void>>(Promise.resolve())
  const enqueue = useCallback((task: () => Promise<void>) => {
    queueRef.current = queueRef.current.then(task).catch(() => undefined)
    return queueRef.current
  }, [])

  /** Лента сообщений в ref: нужна для заявки, которая формируется из очереди. */
  const messagesRef = useRef<ChatMessage[]>([])
  const appendMessage = useCallback((message: ChatMessage) => {
    messagesRef.current = [...messagesRef.current, message]
    setMessages(messagesRef.current)
  }, [])

  /* --- автоскролл ------------------------------------------------- */
  useEffect(() => {
    const node = scrollRef.current
    if (node) node.scrollTo({ top: node.scrollHeight, behavior: 'smooth' })
  }, [messages, typing])

  /* --- профиль наружу (боковой блок на клиентском экране) --------- */
  useEffect(() => onProfileChange(convo), [convo, onProfileChange])

  /* --- виджет «появляется» на существующем сайте ------------------ */
  useEffect(() => {
    const timer = setTimeout(() => setOpen(true), 1100)
    return () => clearTimeout(timer)
  }, [resetKey])

  /* --- сброс демонстрации ----------------------------------------- */
  useEffect(() => {
    if (resetKey === 0) return
    runRef.current += 1
    greetedRef.current = false
    messagesRef.current = []
    queueRef.current = Promise.resolve()
    setMessages([])
    const fresh = createConversationState()
    convoRef.current = fresh
    setConvo(fresh)
    setTyping(false)
    setBusy(false)
    setInput('')
    setLeadId(null)
    setOpen(false)
  }, [resetKey])

  /** Последовательно проигрывает реплики AI с паузами «печатает…». */
  const playTurns = useCallback(async (turns: AiTurn[]) => {
    const run = runRef.current
    setBusy(true)
    for (const turn of turns) {
      setTyping(true)
      await sleep(aiService.typingDelay(turn))
      if (run !== runRef.current) return
      setTyping(false)
      appendMessage(turnToMessage(turn))
      await sleep(160)
      if (run !== runRef.current) return
    }
    setTyping(false)
    setBusy(false)
  }, [appendMessage])

  /* --- приветствие при первом открытии ---------------------------- */
  useEffect(() => {
    if (!open || greetedRef.current) return
    greetedRef.current = true
    void playTurns([aiService.greeting()])
  }, [open, playTurns])

  const pushClientMessage = (text: string) => {
    appendMessage({ id: nextId(), author: 'client', text, time: clock() })
  }

  /** Сообщение клиента показываем сразу, ответ AI — в порядке очереди. */
  const sendText = (raw: string) => {
    const text = raw.trim()
    if (!text) return
    setInput('')
    pushClientMessage(text)
    void enqueue(async () => {
      const result = aiService.reply(convoRef.current, text)
      applyState(result.state)
      await playTurns(result.turns)
      inputRef.current?.focus()
    })
  }

  const selectProduct = (productId: string) => {
    const product = productService.byId(productId)
    pushClientMessage(product ? `Выбираю ${productService.title(product)}` : 'Выбираю этот вариант')
    void enqueue(async () => {
      const result = aiService.act(convoRef.current, { type: 'select_product', productId })
      applyState(result.state)
      await playTurns(result.turns)
    })
  }

  const requestManager = () => {
    void enqueue(async () => {
      const result = aiService.act(convoRef.current, { type: 'request_manager' })
      applyState(result.state)
      await playTurns(result.turns)
    })
  }

  const pickPurchaseMethod = (value: PurchaseMethod) => {
    pushClientMessage(PURCHASE_METHOD_TEXT[value])
    void enqueue(async () => {
      const result = aiService.act(convoRef.current, { type: 'purchase_method', value })
      applyState(result.state)
      await playTurns(result.turns)
    })
  }

  const submitContacts = (name: string, phone: string) => {
    const contactLine = `${name}, ${phone}`
    pushClientMessage(contactLine)
    void enqueue(async () => {
      // Заявка уходит в существующую CRM (в демо — в leadService).
      // Диалог берём из актуального состояния ленты, включая последнюю реплику.
      const lead = leadService.create({
        state: convoRef.current,
        transcript: messagesRef.current,
        name,
        phone,
      })
      setLeadId(lead.id)

      const result = aiService.act(convoRef.current, { type: 'lead_created', leadId: lead.id, clientName: name })
      applyState(result.state)
      await playTurns(result.turns)
    })
  }

  const lastMessage = messages[messages.length - 1]
  const activeQuickReplies = !busy && !typing ? lastMessage?.quickReplies : undefined

  /* ------------------------------------------------------------------ */

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="group fixed bottom-6 right-6 z-40 flex items-center gap-3 rounded-2xl bg-ink-900 px-4 py-3 text-white shadow-widget transition-transform hover:scale-[1.02]"
      >
        <span className="relative flex h-9 w-9 items-center justify-center rounded-xl ai-gradient">
          <span className="absolute inset-0 rounded-xl bg-brand-400 animate-pulse-ring" />
          <SparkleIcon className="relative h-4 w-4" />
        </span>
        <span className="text-left">
          <span className="block text-[13px] font-semibold">SmartLine AI</span>
          <span className="block text-[11px] text-white/60">Подберу смартфон за 1 минуту</span>
        </span>
      </button>
    )
  }

  return (
    <div
      className={cx(
        'fixed bottom-4 right-4 z-40 flex w-[calc(100vw-2rem)] max-w-[420px] flex-col overflow-hidden',
        'rounded-2xl bg-white shadow-widget ring-1 ring-ink-900/10 animate-widget-in',
        'h-[min(720px,calc(100vh-7rem))]',
      )}
    >
      {/* Заголовок виджета */}
      <header className="flex items-center gap-3 bg-ink-900 px-4 py-3 text-white">
        <AiAvatar size="md" animated={typing} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate text-[13.5px] font-semibold">SmartLine AI</p>
            <DemoBadge />
          </div>
          <p className="mt-0.5 flex items-center gap-1.5 text-[11px] text-white/60">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            {typing ? 'печатает…' : 'AI-консультант · отвечает сразу'}
          </p>
        </div>
        <button
          onClick={() => setOpen(false)}
          className="rounded-lg p-1.5 text-white/60 transition hover:bg-white/10 hover:text-white"
          aria-label="Свернуть"
        >
          <MinusIcon className="h-4 w-4" />
        </button>
        <button
          onClick={() => setOpen(false)}
          className="rounded-lg p-1.5 text-white/60 transition hover:bg-white/10 hover:text-white"
          aria-label="Закрыть"
        >
          <CloseIcon className="h-4 w-4" />
        </button>
      </header>

      {/* Лента диалога */}
      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto bg-ink-50/60 px-3.5 py-4">
        {messages.map((message, index) => (
          <MessageRow
            key={message.id}
            message={message}
            convo={convo}
            leadId={leadId}
            // Быстрые ответы активны только под последней репликой AI
            quickReplies={index === messages.length - 1 ? activeQuickReplies : undefined}
            onQuickReply={(value) => void sendText(value)}
            onSelectProduct={selectProduct}
            onRequestManager={requestManager}
            onPickPurchaseMethod={pickPurchaseMethod}
            onSubmitContacts={submitContacts}
            onOpenDashboard={onOpenDashboard}
          />
        ))}
        {typing && <TypingBubble />}
      </div>

      {/* Ввод */}
      <div className="border-t border-ink-200 bg-white">
        <form
          className="flex items-center gap-2 p-3"
          onSubmit={(event) => {
            event.preventDefault()
            void sendText(input)
          }}
        >
          <input
            ref={inputRef}
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Напишите, что вам нужно…"
            className="h-10 flex-1 rounded-xl bg-ink-100/70 px-3.5 text-[13px] text-ink-900 placeholder:text-ink-400 ring-1 ring-inset ring-transparent transition focus:bg-white focus:ring-brand-400"
          />
          <Button
            type="submit"
            size="md"
            className="!w-10 !px-0"
            disabled={!input.trim()}
            aria-label="Отправить"
          >
            <SendIcon className="h-4 w-4" />
          </Button>
        </form>
        <p className="pb-2.5 text-center text-[10px] text-ink-400">
          Виджет AI-модуля · встраивается на существующий сайт одним скриптом
        </p>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Реплика                                                             */
/* ------------------------------------------------------------------ */

interface MessageRowProps {
  message: ChatMessage
  convo: ConversationState
  leadId: string | null
  quickReplies?: QuickReply[]
  onQuickReply: (value: string) => void
  onSelectProduct: (productId: string) => void
  onRequestManager: () => void
  onPickPurchaseMethod: (value: PurchaseMethod) => void
  onSubmitContacts: (name: string, phone: string) => void
  onOpenDashboard: () => void
}

function MessageRow({
  message,
  convo,
  leadId,
  quickReplies,
  onQuickReply,
  onSelectProduct,
  onRequestManager,
  onPickPurchaseMethod,
  onSubmitContacts,
  onOpenDashboard,
}: MessageRowProps) {
  const isClient = message.author === 'client'

  return (
    <div className="animate-fade-up">
      <div className={cx('flex items-end gap-2', isClient && 'flex-row-reverse')}>
        {!isClient && <AiAvatar size="sm" />}
        <div
          className={cx(
            'max-w-[84%] rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed shadow-sm',
            isClient
              ? 'rounded-br-md bg-brand-600 text-white'
              : 'rounded-bl-md bg-white text-ink-800 ring-1 ring-ink-200',
          )}
        >
          {message.text}
        </div>
      </div>

      <div className={cx('mt-1 text-[10px] text-ink-400', isClient ? 'pr-1 text-right' : 'pl-9')}>{message.time}</div>

      {/* Варианты ответа — прямо под вопросом AI */}
      {quickReplies && quickReplies.length > 0 && (
        <div className="mt-1.5 flex flex-wrap gap-1.5 pl-9 animate-fade-up">
          {quickReplies.map((reply) => (
            <button
              key={reply.value}
              onClick={() => onQuickReply(reply.value)}
              className="rounded-full bg-white px-3 py-1.5 text-[12px] font-medium text-brand-700 ring-1 ring-inset ring-brand-200 transition hover:bg-brand-50 hover:ring-brand-300"
            >
              {reply.label}
            </button>
          ))}
        </div>
      )}

      {/* Встроенные блоки: профиль, карточки, квалификация, контакты */}
      {(message.widget || message.products) && (
        <div className="mt-2 space-y-2 pl-9">
          {message.widget === 'need-profile' && <NeedProfileCard profile={convo.profile} />}

          {message.products?.map((recommendation, index) => (
            <ProductChatCard
              key={recommendation.product.id}
              recommendation={recommendation}
              index={index}
              selectedId={convo.selectedProductId}
              onSelect={convo.selectedProductId ? undefined : onSelectProduct}
            />
          ))}

          {message.widget === 'selected-product' && message.meta?.productId && (
            <SelectedProductBlock
              productId={message.meta.productId}
              onRequestManager={onRequestManager}
              done={convo.stage !== 'selected'}
            />
          )}

          {message.widget === 'purchase-method' && (
            <PurchaseMethodBlock onPick={onPickPurchaseMethod} picked={convo.purchaseMethod} />
          )}

          {message.widget === 'contact-form' && (
            <ContactFormBlock onSubmit={onSubmitContacts} submitted={Boolean(leadId)} />
          )}

          {message.widget === 'lead-created' && message.meta?.leadId && (
            <LeadCreatedBlock leadId={message.meta.leadId} onOpenDashboard={onOpenDashboard} />
          )}
        </div>
      )}
    </div>
  )
}

function TypingBubble() {
  return (
    <div className="flex items-end gap-2 animate-fade-in">
      <AiAvatar size="sm" />
      <div className="flex items-center gap-2 rounded-2xl rounded-bl-md bg-white px-3.5 py-3 ring-1 ring-ink-200">
        <span className="flex gap-1">
          {[0, 1, 2].map((index) => (
            <span
              key={index}
              className="h-1.5 w-1.5 rounded-full bg-brand-400 animate-blink"
              style={{ animationDelay: `${index * 160}ms` }}
            />
          ))}
        </span>
        <span className="text-[11px] font-medium text-ink-400">AI печатает…</span>
      </div>
    </div>
  )
}
