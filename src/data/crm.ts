import type { Client, Deal } from '../types'

/**
 * Клиенты и закрытые сделки — приходят из УЖЕ СУЩЕСТВУЮЩЕЙ CRM магазина.
 * AI-модуль использует их только для контекста («повторный клиент»).
 */

export const clients: Client[] = [
  {
    id: 'C-2201',
    name: 'Сергей Ковалёв',
    phone: '+375 29 445 12 80',
    city: 'Минск',
    orders: 3,
    totalSpent: 7420,
    lastContact: '7 часов назад',
    tags: ['Повторный', 'Apple', 'Trade-in'],
  },
  {
    id: 'C-2198',
    name: 'Анна Северина',
    phone: '+375 25 214 88 36',
    city: 'Могилёв',
    orders: 2,
    totalSpent: 2540,
    lastContact: '2 дня назад',
    tags: ['Фото', 'Xiaomi'],
  },
  {
    id: 'C-2190',
    name: 'Игорь Демидов',
    phone: '+375 29 305 27 19',
    city: 'Минск',
    orders: 1,
    totalSpent: 1899,
    lastContact: '3 дня назад',
    tags: ['Рассрочка', 'Игры'],
  },
  {
    id: 'C-2187',
    name: 'Марина Гриб',
    phone: '+375 33 512 44 07',
    city: 'Минск',
    orders: 1,
    totalSpent: 2499,
    lastContact: '38 минут назад',
    tags: ['Блогер', 'Google'],
  },
  {
    id: 'C-2183',
    name: 'Екатерина Лис',
    phone: '+375 25 330 71 55',
    city: 'Брест',
    orders: 2,
    totalSpent: 2048,
    lastContact: '5 часов назад',
    tags: ['Средний класс'],
  },
  {
    id: 'C-2179',
    name: 'Павел Юрченко',
    phone: '+375 29 677 05 41',
    city: 'Минск',
    orders: 4,
    totalSpent: 6130,
    lastContact: '1 день назад',
    tags: ['Повторный', 'Игры'],
  },
]

export const deals: Deal[] = [
  { id: 'D-8841', client: 'Анна Северина', productId: 'XI-14T', amount: 1349, closedAt: '2 дня назад', source: 'ai_assistant' },
  { id: 'D-8837', client: 'Игорь Демидов', productId: 'OP-13', amount: 1899, closedAt: '3 дня назад', source: 'ai_assistant' },
  { id: 'D-8832', client: 'Ольга Тарасевич', productId: 'SM-A57', amount: 1199, closedAt: '4 дня назад', source: 'site_form' },
  { id: 'D-8828', client: 'Максим Лебедь', productId: 'SM-S26', amount: 1999, closedAt: '5 дней назад', source: 'ai_assistant' },
  { id: 'D-8821', client: 'Юлия Ковалец', productId: 'RM-N14', amount: 999, closedAt: '6 дней назад', source: 'phone' },
]
