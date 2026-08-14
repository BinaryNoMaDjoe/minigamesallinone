import type { HTMLAttributes } from 'react'

// ============================================================
// 对话气泡：design-language.md §8.7
// 白底 3px 墨线 + 尖角尾巴（.comic-bubble 配方见 theme/textures.css）
// ============================================================

export function SpeechBubble({
  className = '',
  children,
  ...rest
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`comic-bubble ${className}`} {...rest}>
      {children}
    </div>
  )
}
