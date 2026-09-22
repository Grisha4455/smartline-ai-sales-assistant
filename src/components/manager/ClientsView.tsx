import { clients, deals } from '../../data/crm'
import { formatPrice, productService } from '../../services/productService'
import { Card, SectionLabel } from '../ui/primitives'

/**
 * Клиенты и сделки — данные существующей CRM.
 * Показываем их, чтобы было видно: AI-модуль встраивается в то,
 * что уже есть, а не заменяет систему.
 */
export function ClientsView() {
  return (
    <div className="h-full overflow-y-auto bg-ink-50/60 px-6 py-6">
      <div className="mx-auto max-w-5xl space-y-5">
        <header>
          <SectionLabel>База клиентов · существующая CRM</SectionLabel>
          <h2 className="mt-1 text-[20px] font-semibold tracking-tight text-ink-900">Клиенты</h2>
          <p className="mt-1 text-[13px] text-ink-500">
            AI-модуль читает историю покупок, чтобы узнавать повторных клиентов и не задавать лишние вопросы.
          </p>
        </header>

        <Card className="overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-ink-50/80 text-[11px] uppercase tracking-wider text-ink-400">
              <tr>
                <th className="px-4 py-2.5 font-semibold">Клиент</th>
                <th className="px-4 py-2.5 font-semibold">Телефон</th>
                <th className="px-4 py-2.5 font-semibold">Город</th>
                <th className="px-4 py-2.5 font-semibold">Заказы</th>
                <th className="px-4 py-2.5 font-semibold">Сумма</th>
                <th className="px-4 py-2.5 font-semibold">Контакт</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {clients.map((client) => (
                <tr key={client.id} className="transition hover:bg-ink-50/60">
                  <td className="px-4 py-3">
                    <p className="text-[13px] font-medium text-ink-900">{client.name}</p>
                    <div className="mt-0.5 flex flex-wrap gap-1">
                      {client.tags.map((tag) => (
                        <span key={tag} className="rounded bg-ink-100 px-1.5 py-0.5 text-[10px] text-ink-600">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-[12.5px] text-ink-600">{client.phone}</td>
                  <td className="px-4 py-3 text-[12.5px] text-ink-600">{client.city}</td>
                  <td className="px-4 py-3 text-[12.5px] font-medium text-ink-800">{client.orders}</td>
                  <td className="px-4 py-3 text-[12.5px] font-semibold text-ink-900">
                    {formatPrice(client.totalSpent)} BYN
                  </td>
                  <td className="px-4 py-3 text-[12px] text-ink-400">{client.lastContact}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        <div>
          <SectionLabel>Закрытые сделки</SectionLabel>
          <div className="mt-2 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
            {deals.map((deal) => {
              const product = productService.byId(deal.productId)
              return (
                <Card key={deal.id} className="px-4 py-3">
                  <div className="flex items-baseline justify-between">
                    <p className="text-[13px] font-medium text-ink-900">{deal.client}</p>
                    <span className="text-[10.5px] text-ink-400">{deal.closedAt}</span>
                  </div>
                  <p className="mt-0.5 text-[11.5px] text-ink-500">
                    {product ? productService.title(product) : deal.productId}
                  </p>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-[14px] font-semibold text-ink-900">{formatPrice(deal.amount)} BYN</span>
                    {deal.source === 'ai_assistant' && (
                      <span className="rounded-md bg-brand-50 px-1.5 py-0.5 text-[10px] font-medium text-brand-700 ring-1 ring-inset ring-brand-100">
                        из AI-заявки
                      </span>
                    )}
                  </div>
                </Card>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
