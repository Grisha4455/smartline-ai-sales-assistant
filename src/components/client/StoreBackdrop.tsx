import { productService, formatPrice } from '../../services/productService'
import { CartIcon, SearchIcon, PhoneIcon } from '../ui/icons'
import { PhoneThumb, Stars } from '../ui/primitives'

/**
 * Макет УЖЕ СУЩЕСТВУЮЩЕГО сайта магазина.
 *
 * Это намеренно нерабочий фон: он не кликается, приглушён по цвету и
 * подписан как существующая инфраструктура. Его задача — показать
 * владельцу бизнеса, что мы ничего не переделываем, а добавляем
 * только виджет AI-консультанта в правом нижнем углу.
 */
export function StoreBackdrop() {
  const showcase = productService.all().slice(0, 8)

  return (
    <div className="site-mock pointer-events-none select-none" aria-hidden>
      {/* Хедер существующего сайта */}
      <header className="border-b border-ink-200 bg-white">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-6 px-6">
          <span className="text-[17px] font-bold tracking-tight text-ink-900">
            Smart<span className="text-brand-600">Line</span>
          </span>
          <nav className="hidden items-center gap-5 text-[13px] text-ink-500 md:flex">
            <span>Смартфоны</span>
            <span>Аксессуары</span>
            <span>Рассрочка</span>
            <span>Trade-in</span>
            <span>Доставка</span>
          </nav>
          <div className="ml-auto flex items-center gap-3">
            <span className="hidden h-8 w-48 items-center gap-2 rounded-lg bg-ink-100 px-2.5 text-[12px] text-ink-400 lg:flex">
              <SearchIcon className="h-3.5 w-3.5" /> Поиск по каталогу
            </span>
            <span className="hidden items-center gap-1.5 text-[12px] text-ink-500 sm:flex">
              <PhoneIcon className="h-3.5 w-3.5" /> +375 17 000 00 00
            </span>
            <CartIcon className="h-4 w-4 text-ink-500" />
          </div>
        </div>
      </header>

      {/* Баннер и каталог */}
      <div className="mx-auto max-w-6xl px-6 py-7">
        {/* Баннер намеренно светлый: поверх него ложится тёмная поясняющая карточка */}
        <div className="flex items-center justify-between gap-6 rounded-2xl bg-ink-100 px-7 py-6 ring-1 ring-ink-200">
          <div>
            <p className="text-[11px] uppercase tracking-[0.14em] text-ink-400">Новинки сезона</p>
            <p className="mt-1.5 text-2xl font-semibold text-ink-700">Флагманы 2026 с рассрочкой до 24 месяцев</p>
            <p className="mt-1 text-[13px] text-ink-500">Официальная гарантия 24 месяца · Доставка по Беларуси</p>
          </div>
          <span className="hidden rounded-xl bg-white px-4 py-2 text-[13px] font-medium text-ink-500 ring-1 ring-ink-200 lg:block">
            Смотреть каталог
          </span>
        </div>

        <div className="mt-7 flex items-baseline justify-between">
          <h2 className="text-[15px] font-semibold text-ink-800">Популярные смартфоны</h2>
          <span className="text-[12px] text-ink-400">Сортировка: по популярности</span>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {showcase.map((product) => (
            <div key={product.id} className="rounded-xl border border-ink-200 bg-white p-3">
              <PhoneThumb color={product.color} label={product.model} className="h-28 w-full" />
              <p className="mt-2.5 truncate text-[13px] font-medium text-ink-800">
                {productService.title(product)}
              </p>
              <p className="text-[11px] text-ink-400">
                {product.storage} GB · {product.ram} GB RAM
              </p>
              <div className="mt-1.5 flex items-center justify-between">
                <span className="text-[13px] font-semibold text-ink-900">{formatPrice(product.price)} BYN</span>
                <Stars value={product.rating} />
              </div>
              <div className="mt-2 h-7 rounded-lg bg-ink-100" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
