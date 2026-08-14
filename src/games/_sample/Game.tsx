import { useEffect } from 'react'
import type { GameCallbacks, GameComponent, GameInstance } from '../shared/types'

// ============================================================
// 示例占位游戏（决策记录 #11）：点击移动方块得分
// 窗内视觉属游戏级规范；取色仍经设计令牌（--primary-container / --ink）
// 实现方式：命令式 Canvas（mount 挂载画布、destroy 全量清理），
// 验证 GameInstance 契约与固定时间步长循环（games/shared/useGameLoop 的等价实现）
// ============================================================

const LOGICAL_W = 480
const LOGICAL_H = 360
const TARGET_SIZE = 40
const STEP_MS = 1000 / 60

function resolveToken(el: HTMLElement, name: string, fallback: string): string {
  const value = getComputedStyle(el).getPropertyValue(name).trim()
  return value || fallback
}

export const SampleGame: GameComponent = ({ onReady }) => {
  useEffect(() => {
    let canvas: HTMLCanvasElement | null = null
    let ctx: CanvasRenderingContext2D | null = null
    let host: HTMLElement | null = null
    let rafId = 0
    let running = false
    let score = 0
    let last = performance.now()
    let accumulator = 0
    const position = { x: LOGICAL_W / 2, y: LOGICAL_H / 2 }
    let velocity = { x: 90, y: 70 }
    let callbacks: GameCallbacks = { onScore: () => {} }

    const randomize = () => {
      const speed = 90 + score * 3
      const angle = Math.random() * Math.PI * 2
      velocity = { x: Math.cos(angle) * speed, y: Math.sin(angle) * speed }
    }

    const draw = () => {
      if (!ctx || !host) return
      const accent = resolveToken(host, '--primary-container', '#e62429')
      const ink = resolveToken(host, '--ink', '#1c1b1b')
      const dpr = window.devicePixelRatio || 1
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, LOGICAL_W, LOGICAL_H)
      ctx.fillStyle = accent
      ctx.strokeStyle = ink
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.rect(position.x - TARGET_SIZE / 2, position.y - TARGET_SIZE / 2, TARGET_SIZE, TARGET_SIZE)
      ctx.fill()
      ctx.stroke()
    }

    const step = (dtSec: number) => {
      position.x += velocity.x * dtSec
      position.y += velocity.y * dtSec
      if (position.x < TARGET_SIZE / 2) {
        position.x = TARGET_SIZE / 2
        velocity.x = Math.abs(velocity.x)
      } else if (position.x > LOGICAL_W - TARGET_SIZE / 2) {
        position.x = LOGICAL_W - TARGET_SIZE / 2
        velocity.x = -Math.abs(velocity.x)
      }
      if (position.y < TARGET_SIZE / 2) {
        position.y = TARGET_SIZE / 2
        velocity.y = Math.abs(velocity.y)
      } else if (position.y > LOGICAL_H - TARGET_SIZE / 2) {
        position.y = LOGICAL_H - TARGET_SIZE / 2
        velocity.y = -Math.abs(velocity.y)
      }
      draw()
    }

    const loop = (now: number) => {
      accumulator += Math.min(now - last, 250)
      last = now
      while (accumulator >= STEP_MS) {
        step(STEP_MS / 1000)
        accumulator -= STEP_MS
      }
      rafId = requestAnimationFrame(loop)
    }

    const onPointerDown = (event: PointerEvent) => {
      if (!canvas) return
      const rect = canvas.getBoundingClientRect()
      if (rect.width === 0 || rect.height === 0) return
      const x = ((event.clientX - rect.left) / rect.width) * LOGICAL_W
      const y = ((event.clientY - rect.top) / rect.height) * LOGICAL_H
      if (
        Math.abs(x - position.x) < TARGET_SIZE / 2 &&
        Math.abs(y - position.y) < TARGET_SIZE / 2
      ) {
        score += 1
        callbacks.onScore(score)
        randomize()
        draw()
      }
    }

    const instance: GameInstance = {
      mount(el) {
        host = el
        canvas = document.createElement('canvas')
        canvas.style.width = '100%'
        canvas.style.height = '100%'
        canvas.style.display = 'block'
        canvas.style.touchAction = 'none'
        const dpr = window.devicePixelRatio || 1
        canvas.width = LOGICAL_W * dpr
        canvas.height = LOGICAL_H * dpr
        ctx = canvas.getContext('2d')
        el.appendChild(canvas)
        canvas.addEventListener('pointerdown', onPointerDown)
        draw()
      },
      start() {
        if (running) return
        running = true
        last = performance.now()
        accumulator = 0
        rafId = requestAnimationFrame(loop)
      },
      pause() {
        running = false
        cancelAnimationFrame(rafId)
      },
      resume() {
        if (running) return
        running = true
        last = performance.now()
        accumulator = 0
        rafId = requestAnimationFrame(loop)
      },
      restart() {
        score = 0
        callbacks.onScore(0)
        randomize()
        if (running) draw()
      },
      destroy() {
        running = false
        cancelAnimationFrame(rafId)
        canvas?.removeEventListener('pointerdown', onPointerDown)
        canvas?.remove()
        canvas = null
        ctx = null
        host = null
      },
      setCallbacks(next) {
        callbacks = next
      },
    }

    onReady(instance)
    return () => instance.destroy()
  }, [onReady])

  return null
}

export default SampleGame
