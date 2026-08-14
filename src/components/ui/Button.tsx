import type { ButtonHTMLAttributes, Ref } from 'react'

// ============================================================
// 按钮规范：design-language.md §8.1
//   Primary   ：红底白字，2px 墨线 + 墨黑硬阴影；hover 抬升 1px 阴影增至 8px；active 按压
//   Secondary ：纸白底墨字，2px 墨线 + 蓝硬阴影；hover 变蓝底白字
//   Icon      ：40×40 方形，4px 墨线 + 墨黑硬阴影
//   Text      ：无底主色文字，hover 下划线
// 按压态 = @utility active-press（附录 B 配方，支持 active: 变体）
// ============================================================

export type ButtonVariant = 'primary' | 'secondary' | 'icon' | 'text'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  ref?: Ref<HTMLButtonElement>
}

const styles: Record<ButtonVariant, string> = {
  primary:
    'bg-primary text-on-primary comic-border-2 comic-shadow px-6 py-2 font-label-bold text-label-bold uppercase hover:-translate-y-[1px] hover:shadow-[8px_8px_0_0_var(--ink-shadow)] transition-transform duration-100 active:active-press',
  secondary:
    'bg-surface-container-lowest text-on-surface comic-border-2 comic-shadow-blue px-4 py-2 font-label-bold text-label-bold uppercase hover:bg-secondary hover:text-on-secondary transition-colors active:active-press',
  icon: 'w-10 h-10 comic-border bg-surface-container-highest text-on-surface comic-shadow hover:bg-surface-variant transition-colors active:active-press flex items-center justify-center',
  text: 'font-label-bold text-label-bold uppercase text-primary hover:underline',
}

export function Button({
  variant = 'primary',
  className = '',
  type = 'button',
  ref,
  ...rest
}: ButtonProps) {
  return (
    <button
      ref={ref}
      type={type}
      className={`inline-flex items-center justify-center gap-2 select-none ${styles[variant]} ${className}`}
      {...rest}
    />
  )
}
