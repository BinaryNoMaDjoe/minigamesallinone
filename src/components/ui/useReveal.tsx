import { createContext, useContext, useEffect, useRef } from 'react'
import type { ReactNode, RefObject } from 'react'

// ============================================================
// 滚动入场动效（design-language.md §9 生长 v0.3）
// - 触发：元素进入视口（IntersectionObserver，一次性），淡入 + 上移 24px / 300ms
// - RevealProvider.ready：欢迎页未退出前挂起触发，避免入场动效被覆盖层浪费
// - prefers-reduced-motion：不挂载任何动效类，元素直接呈现
// ============================================================

const RevealReadyContext = createContext(true)

export function RevealProvider({ ready, children }: { ready: boolean; children: ReactNode }) {
  return <RevealReadyContext.Provider value={ready}>{children}</RevealReadyContext.Provider>
}

export function useReveal<T extends HTMLElement>(delayMs = 0): RefObject<T | null> {
  const ready = useContext(RevealReadyContext)
  const ref = useRef<T | null>(null)

  useEffect(() => {
    const el = ref.current
    if (!el || !ready) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    el.classList.add('reveal-init')
    if (delayMs > 0) el.style.transitionDelay = `${delayMs}ms`

    // 动效结束后摘除类与内联延迟，交还 hover 过渡（transition-transform）控制权
    let done = false
    const cleanup = () => {
      if (done) return
      done = true
      el.classList.remove('reveal-init', 'reveal-in')
      el.style.transitionDelay = ''
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            el.classList.add('reveal-in')
            el.addEventListener('transitionend', cleanup, { once: true })
            window.setTimeout(cleanup, 1200)
            observer.disconnect()
            return
          }
        }
      },
      { threshold: 0.15, rootMargin: '0px 0px -40px 0px' },
    )
    observer.observe(el)

    return () => {
      observer.disconnect()
      cleanup()
    }
  }, [ready, delayMs])

  return ref
}
