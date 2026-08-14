import { useEffect } from 'react'

// ============================================================
// 游戏循环基础设施：requestAnimationFrame + 固定时间步长
// - 固定步长保证不同刷新率屏幕下游戏逻辑一致
// - 后台标签页恢复后限制最大补帧（≤250ms），防止大步长穿墙
// - 组件卸载自动清理（防内存泄漏，skill-code-review 维度 3）
// 注意：tick 请传稳定引用（如 ref.current），避免每帧重建循环
// ============================================================

export function useGameLoop(tick: (dtSec: number) => void, fps = 60, active = true): void {
  useEffect(() => {
    if (!active) return

    let rafId = 0
    let last = performance.now()
    let accumulator = 0
    const stepMs = 1000 / fps

    const loop = (now: number) => {
      accumulator += Math.min(now - last, 250)
      last = now
      while (accumulator >= stepMs) {
        tick(stepMs / 1000)
        accumulator -= stepMs
      }
      rafId = requestAnimationFrame(loop)
    }

    rafId = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(rafId)
  }, [tick, fps, active])
}
