import type { ReactNode } from 'react'

// ============================================================
// 图标占位实现：内联 SVG 简笔图标（方形线帽，呼应漫画锐利感）
// 规范出处：design-language.md §10 要求 Material Symbols Outlined；
// 骨架阶段以自托管 SVG 占位（暂不引入图标字体依赖），
// 后续按规范生长流程对齐 §10（记为「待定」）。
// ============================================================

interface IconProps {
  className?: string
}

function Svg({ className = 'w-5 h-5', children }: IconProps & { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      strokeLinecap="square"
      aria-hidden="true"
      className={className}
    >
      {children}
    </svg>
  )
}

export function CloseIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M6 6l12 12M18 6L6 18" />
    </Svg>
  )
}

export function PauseIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M8 5v14M16 5v14" />
    </Svg>
  )
}

export function PlayIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M8 5l11 7-11 7z" />
    </Svg>
  )
}

export function RestartIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M4 12a8 8 0 1 0 2.3-5.7" />
      <path d="M4 4v5h5" />
    </Svg>
  )
}

export function SunIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M19.1 4.9l-1.4 1.4M6.3 17.7l-1.4 1.4" />
    </Svg>
  )
}

export function MoonIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M20 13.5A8 8 0 1 1 10.5 4a6.5 6.5 0 0 0 9.5 9.5z" />
    </Svg>
  )
}

export function InfoIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5M12 8v.5" />
    </Svg>
  )
}

export function TrophyIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M7 4h10v5a5 5 0 0 1-10 0V4z" />
      <path d="M7 5H4v2a3 3 0 0 0 3 3M17 5h3v2a3 3 0 0 1-3 3" />
      <path d="M12 14v3M8 21h8M9 21v-2h6v2" />
    </Svg>
  )
}
