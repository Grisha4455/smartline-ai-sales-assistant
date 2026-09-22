import type { SVGProps } from 'react'

/** Иконки инлайном — без внешних зависимостей, единая толщина линий. */

type IconProps = SVGProps<SVGSVGElement>

const base = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.75,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
}

export function SparkleIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M12 3l1.7 4.6L18.3 9.3 13.7 11 12 15.6 10.3 11 5.7 9.3l4.6-1.7L12 3z" />
      <path d="M18.5 15.5l.7 1.9 1.9.7-1.9.7-.7 1.9-.7-1.9-1.9-.7 1.9-.7.7-1.9z" />
    </svg>
  )
}

export function ChatIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M21 12a8 8 0 0 1-8 8H8l-4 3v-5.5A8 8 0 0 1 13 4a8 8 0 0 1 8 8z" />
    </svg>
  )
}

export function InboxIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M3 13l2.5-7A2 2 0 0 1 7.4 4.6h9.2a2 2 0 0 1 1.9 1.4L21 13" />
      <path d="M3 13h5l1.2 2.2h5.6L16 13h5v4.4A2.6 2.6 0 0 1 18.4 20H5.6A2.6 2.6 0 0 1 3 17.4V13z" />
    </svg>
  )
}

export function ProgressIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M12 4a8 8 0 1 1-8 8" />
      <path d="M12 8v4l3 2" />
    </svg>
  )
}

export function UsersIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M16 19v-1.5a3.5 3.5 0 0 0-3.5-3.5h-4A3.5 3.5 0 0 0 5 17.5V19" />
      <circle cx="10.5" cy="8.5" r="3" />
      <path d="M19 19v-1.2a3.2 3.2 0 0 0-2.4-3.1" />
      <path d="M15.2 5.6a3 3 0 0 1 0 5.8" />
    </svg>
  )
}

export function ChartIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M4 20h16" />
      <path d="M7 20v-6" />
      <path d="M12 20V8" />
      <path d="M17 20v-9" />
    </svg>
  )
}

export function SendIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M4.5 12L20 4.5 14.8 20 11.7 14 4.5 12z" />
    </svg>
  )
}

export function CopyIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <rect x="9" y="9" width="11" height="11" rx="2.5" />
      <path d="M15 5.5A2.5 2.5 0 0 0 12.5 3H6.5A2.5 2.5 0 0 0 4 5.5v6A2.5 2.5 0 0 0 6.5 14" />
    </svg>
  )
}

export function CheckIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M4.5 12.5l5 5 10-11" />
    </svg>
  )
}

export function ChevronRightIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M9 5l7 7-7 7" />
    </svg>
  )
}

export function ChevronDownIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M5 9l7 7 7-7" />
    </svg>
  )
}

export function CloseIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  )
}

export function MinusIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M6 12h12" />
    </svg>
  )
}

export function PhoneIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M5 4.5h4l1.6 4-2.2 1.4a10 10 0 0 0 5.7 5.7l1.4-2.2 4 1.6v4A1.5 1.5 0 0 1 18 20.5C10.5 20.5 3.5 13.5 3.5 6A1.5 1.5 0 0 1 5 4.5z" />
    </svg>
  )
}

export function RouteIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="6" cy="6" r="2.5" />
      <circle cx="18" cy="18" r="2.5" />
      <path d="M8.5 6h4.5a3 3 0 0 1 0 6H9a3 3 0 0 0 0 6h6.5" />
    </svg>
  )
}

export function RefreshIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M20 11A8 8 0 0 0 6.3 6.3L4 8.5" />
      <path d="M4 4v4.5h4.5" />
      <path d="M4 13a8 8 0 0 0 13.7 4.7L20 15.5" />
      <path d="M20 20v-4.5h-4.5" />
    </svg>
  )
}

export function SearchIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="11" cy="11" r="6" />
      <path d="M15.5 15.5L20 20" />
    </svg>
  )
}

export function CartIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M4 5h2l2.2 9.4a2 2 0 0 0 2 1.6h6.6a2 2 0 0 0 2-1.5L21 8H7" />
      <circle cx="10" cy="19" r="1.3" />
      <circle cx="17" cy="19" r="1.3" />
    </svg>
  )
}

export function ShieldIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M12 3.5l7 2.5v5.2c0 4.3-2.8 7.7-7 9.3-4.2-1.6-7-5-7-9.3V6l7-2.5z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  )
}

export function BoltIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M13 3L5.5 13.5H11l-1 7.5L18.5 10H13l0-7z" />
    </svg>
  )
}

export function ArrowDownRightIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M7 7l10 10" />
      <path d="M17 9.5V17H9.5" />
    </svg>
  )
}

export function PlugIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M9 3v5M15 3v5" />
      <path d="M6.5 8h11v2.5a5.5 5.5 0 0 1-11 0V8z" />
      <path d="M12 16v5" />
    </svg>
  )
}
