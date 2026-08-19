import { useEffect, useRef } from 'react'
import { pickLang, useI18n } from '../../i18n'
import { scoreService } from '../../services/score'
import { progressService } from '../../services/progress'
import type { GameCallbacks, GameComponent, GameInstance } from '../shared/types'
import { McsEngine } from './engine'
import type { EngineEvent, MatchState } from './engine'
import { RaycastRenderer, VIEW_W, VIEW_H } from './render'
import type { Camera, KillFeedItem } from './render'
import { WEAPONS, SKINS } from './weapons'
import { MAPS } from './maps'
import { mcsStrings as S } from './strings'
import type { McsStringKey, WeaponId } from './strings'
import './styles.css'

// ============================================================
// MineCounter-Strike —— 渲染与输入层（DESIGN.md v0.1）
// 纯逻辑在 engine.ts、渲染在 render.ts；本文件只做 DOM/Canvas/输入/主循环
// 阶段：menu(main/maps) → playing(loadout/combat) → paused/over
// ============================================================

const GAME_ID = 'mine-counter-strike'

type MenuScreen = 'main' | 'maps'

export const McsGame: GameComponent = ({ onReady }) => {
  const { lang } = useI18n()
  const langRef = useRef(lang)
  langRef.current = lang

  useEffect(() => {
    const engine = new McsEngine()
    const renderer = new RaycastRenderer()
    let root: HTMLDivElement | null = null
    let canvas: HTMLCanvasElement | null = null
    let ctx: CanvasRenderingContext2D | null = null
    let overlayEl: HTMLDivElement | null = null
    let panelEl: HTMLDivElement | null = null
    let loadoutEl: HTMLDivElement | null = null
    let touchEl: HTMLDivElement | null = null
    let lockHintEl: HTMLDivElement | null = null
    let rafId = 0
    let running = false
    let last = performance.now()

    let callbacks: GameCallbacks = { onScore: () => {} }
    let lastScore = -1
    let lastPhase = engine.phase
    let lastMatchState: MatchState = engine.matchState
    let lastLang: string = langRef.current
    let lastScreenKey = ''

    let screen: MenuScreen = 'main'
    let loadoutPicks: (WeaponId | null)[] = [null, null]

    // 视觉瞬态
    let time = 0
    let adsBlend = 0
    let muzzle = 0
    let recoil = 0
    let hitmarker = 0
    let damageFlash = 0
    const killFeed: KillFeedItem[] = []

    // 输入
    const keys = new Set<string>()
    let yaw = 0
    let pitch = 0
    let locked = false
    let lookTouch: { x: number; y: number } | null = null
    let moveTouch: { ax: number; ay: number } | null = null
    const isCoarse = typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches

    const t = (key: McsStringKey) => pickLang(S[key], langRef.current)

    const nameOf = (id: number): string => {
      const e = engine.entities.find((x) => x.id === id)
      if (!e) return '?'
      return e.isPlayer ? t('hudYou') : e.name
    }

    /* ================= 事件 → 视觉 ================= */

    const handleEvents = (events: EngineEvent[]): void => {
      for (const ev of events) {
        switch (ev.type) {
          case 'shot':
            muzzle = 0.25
            recoil = 1
            break
          case 'hit':
            if (ev.by === 0) hitmarker = 0.16
            break
          case 'damaged':
            damageFlash = 1
            break
          case 'kill': {
            const text = nameOf(ev.killerId) + (ev.headshot ? ' ☠ ' : ' ▸ ') + nameOf(ev.victimId)
            killFeed.push({ text, t: 4 })
            if (killFeed.length > 6) killFeed.shift()
            break
          }
          case 'matchStart':
          case 'matchEnd':
            break
        }
      }
    }

    const updateVisuals = (dt: number): void => {
      time += dt
      muzzle = Math.max(0, muzzle - dt)
      recoil = Math.max(0, recoil - dt * 5)
      hitmarker = Math.max(0, hitmarker - dt)
      damageFlash = Math.max(0, damageFlash - dt * 1.6)
      const target = engine.playerAds ? 1 : 0
      adsBlend += (target - adsBlend) * Math.min(1, dt * 12)
      for (let i = killFeed.length - 1; i >= 0; i--) {
        killFeed[i]!.t -= dt
        if (killFeed[i]!.t <= 0) killFeed.splice(i, 1)
      }
    }

    /* ================= 渲染 ================= */

    const cameraFor = (): Camera => {
      if (engine.phase === 'menu') {
        const a = time * 0.35
        return {
          x: 12.5 + Math.cos(a) * 6,
          y: 12.5 + Math.sin(a) * 6,
          angle: Math.atan2(12.5 - (12.5 + Math.sin(a) * 6), 12.5 - (12.5 + Math.cos(a) * 6)),
          pitch: 0,
          zoom: 0,
        }
      }
      return {
        x: engine.player.x,
        y: engine.player.y,
        angle: engine.player.angle,
        pitch: engine.player.pitch,
        zoom: adsBlend,
      }
    }

    const draw = (): void => {
      if (!ctx) return
      const cam = cameraFor()
      const inMap =
        engine.phase === 'playing' || engine.phase === 'paused' || engine.phase === 'over'
      const view = {
        time,
        adsBlend,
        muzzle,
        recoil,
        hitmarker,
        damageFlash,
        killFeed,
      }
      renderer.render(ctx, engine, cam, view, {
        drawGun: inMap && engine.matchState !== 'ended',
        drawHud: engine.phase === 'playing' && engine.matchState === 'combat',
        preview: engine.phase === 'menu' ? { skin: engine.selectedSkin, team: 0 } : null,
      })
    }

    /* ================= DOM 构造 ================= */

    const mkBtn = (label: string, onClick: () => void, primary = false): HTMLButtonElement => {
      const btn = document.createElement('button')
      btn.type = 'button'
      btn.textContent = label
      btn.className = 'mcs-btn' + (primary ? ' primary' : '')
      btn.addEventListener('click', onClick)
      return btn
    }

    const row = (label: string, value: string, hl = false): HTMLDivElement => {
      const el = document.createElement('div')
      el.className = 'mcs-row'
      const l = document.createElement('span')
      l.textContent = label
      const v = document.createElement('b')
      v.textContent = value
      if (hl) v.className = 'hl'
      el.append(l, v)
      return el
    }

    const renderOverlay = (): void => {
      if (!overlayEl || !panelEl) return
      panelEl.replaceChildren()
      const p = engine.phase
      overlayEl.style.display = p === 'playing' ? 'none' : 'flex'
      if (p === 'playing') return

      if (p === 'menu') {
        if (screen === 'maps') {
          const h = document.createElement('h2')
          h.className = 'mcs-title'
          h.textContent = t('mapTitle')
          panelEl.append(h)
          const list = document.createElement('div')
          list.className = 'mcs-map-list'
          for (const m of MAPS) {
            const card = document.createElement('button')
            card.type = 'button'
            card.className = 'mcs-map-card'
            const name = document.createElement('div')
            name.className = 'mcs-map-name'
            name.textContent = t(m.nameKey)
            const desc = document.createElement('div')
            desc.className = 'mcs-map-desc'
            desc.textContent = t(m.descKey)
            card.append(name, desc)
            card.addEventListener('click', () => {
              engine.beginMatch(m.id)
              loadoutPicks = [null, null]
            })
            list.append(card)
          }
          panelEl.append(list)
          panelEl.append(
            mkBtn(
              t('back'),
              () => {
                screen = 'main'
                renderOverlay()
              },
              false,
            ),
          )
        } else {
          const h = document.createElement('h2')
          h.className = 'mcs-title'
          h.textContent = t('title')
          panelEl.append(h)
          const tag = document.createElement('div')
          tag.className = 'mcs-tagline'
          tag.textContent = t('tagline')
          panelEl.append(tag)
          const sub = document.createElement('div')
          sub.className = 'mcs-sub'
          sub.textContent = t('charTitle')
          panelEl.append(sub)
          const swatches = document.createElement('div')
          swatches.className = 'mcs-swatches'
          for (const s of SKINS) {
            const sw = document.createElement('button')
            sw.type = 'button'
            sw.className = 'mcs-swatch' + (s.id === engine.selectedSkin ? ' on' : '')
            sw.style.background = s.color
            sw.setAttribute('aria-label', t(s.nameKey))
            sw.title = t(s.nameKey)
            sw.addEventListener('click', () => {
              engine.setSkin(s.id)
              renderer.setSkinHint(s.id)
              renderOverlay()
            })
            swatches.append(sw)
          }
          panelEl.append(swatches)
          const skinName = document.createElement('div')
          skinName.className = 'mcs-sub'
          const cur = SKINS.find((s) => s.id === engine.selectedSkin) ?? SKINS[0]!
          skinName.textContent = t(cur.nameKey)
          panelEl.append(skinName)
          panelEl.append(
            mkBtn(
              t('start'),
              () => {
                screen = 'maps'
                renderOverlay()
              },
              true,
            ),
          )
          const hint = document.createElement('div')
          hint.className = 'mcs-hint'
          hint.textContent = t('menuHint')
          panelEl.append(hint)
        }
      } else if (p === 'paused') {
        const h = document.createElement('h2')
        h.className = 'mcs-title'
        h.textContent = t('paused')
        panelEl.append(h)
        panelEl.append(mkBtn(t('resume'), () => engine.resume(), true))
        panelEl.append(mkBtn(t('restart'), () => engine.restart()))
        panelEl.append(mkBtn(t('toMenu'), () => engine.toMenu()))
      } else if (p === 'over') {
        const winner = engine.winner
        const h = document.createElement('h2')
        h.className = 'mcs-title ' + (winner === 0 ? 'win' : winner === 1 ? 'lose' : 'draw')
        h.textContent =
          winner === 0 ? t('resultVictory') : winner === 1 ? t('resultDefeat') : t('resultDraw')
        panelEl.append(h)
        panelEl.append(
          row(t('resultTeam'), engine.teamScores[0] + ' : ' + engine.teamScores[1], true),
        )
        const table = document.createElement('div')
        table.className = 'mcs-rank'
        const head = document.createElement('div')
        head.className = 'mcs-rank-row mcs-rank-head'
        for (const label of [
          t('resultRank'),
          t('resultName'),
          t('resultKills'),
          t('resultAssists'),
          t('resultDeaths'),
        ]) {
          const cell = document.createElement('span')
          cell.textContent = label
          head.append(cell)
        }
        table.append(head)
        engine.ranking().forEach((e, i) => {
          const r = document.createElement('div')
          r.className = 'mcs-rank-row' + (e.isPlayer ? ' me' : '')
          const cells = [
            String(i + 1),
            e.isPlayer ? t('hudYou') : e.name,
            String(e.kills),
            String(e.assists),
            String(e.deaths),
          ]
          for (const c of cells) {
            const cell = document.createElement('span')
            cell.textContent = c
            r.append(cell)
          }
          table.append(r)
        })
        panelEl.append(table)
        const best = scoreService.best(GAME_ID)
        if (engine.player.kills > best && engine.player.kills > 0) {
          const nb = document.createElement('div')
          nb.className = 'mcs-newbest'
          nb.textContent = t('newBest')
          panelEl.append(nb)
        }
        panelEl.append(
          mkBtn(
            t('playAgain'),
            () => {
              engine.restart()
              loadoutPicks = [null, null]
            },
            true,
          ),
        )
        panelEl.append(mkBtn(t('toMenu'), () => engine.toMenu()))
      }
    }

    const renderLoadout = (): void => {
      if (!loadoutEl) return
      loadoutEl.replaceChildren()
      const open = engine.phase === 'playing' && engine.matchState === 'loadout'
      loadoutEl.style.display = open ? 'flex' : 'none'
      if (!open) return
      const box = document.createElement('div')
      box.className = 'mcs-loadout-box'
      const h = document.createElement('h2')
      h.className = 'mcs-title'
      h.textContent = t('loadoutTitle')
      box.append(h)
      const sub = document.createElement('div')
      sub.className = 'mcs-sub'
      sub.textContent = t('loadoutSub')
      box.append(sub)
      const timer = document.createElement('div')
      timer.className = 'mcs-loadout-timer'
      timer.textContent = String(Math.ceil(engine.timeLeft))
      box.append(timer)
      const picked = document.createElement('div')
      picked.className = 'mcs-loadout-picked'
      const slotLabels = [t('loadoutSlot'), t('loadoutSlot2')]
      slotLabels.forEach((label, i) => {
        const sp = document.createElement('span')
        const wid = loadoutPicks[i]
        sp.textContent = label + ': ' + (wid ? t(('weapon_' + wid) as McsStringKey) : '—')
        picked.append(sp)
      })
      box.append(picked)
      const cards = document.createElement('div')
      cards.className = 'mcs-cards'
      for (const w of WEAPONS) {
        const card = document.createElement('button')
        card.type = 'button'
        card.className = 'mcs-wcard'
        const name = document.createElement('div')
        name.className = 'mcs-wcard-name'
        name.textContent = t(w.nameKey)
        const desc = document.createElement('div')
        desc.className = 'mcs-wcard-desc'
        desc.textContent = t(w.descKey)
        const stats = document.createElement('div')
        stats.className = 'mcs-wcard-stats'
        stats.textContent = w.damage + ' DMG · ' + w.magSize + ' MAG'
        card.append(name, desc, stats)
        card.addEventListener('click', () => {
          if (loadoutPicks[0] === null) {
            loadoutPicks[0] = w.id
            engine.pickWeapon(0, w.id)
          } else {
            loadoutPicks[1] = w.id
            engine.pickWeapon(1, w.id)
          }
          renderLoadout()
        })
        cards.append(card)
      }
      box.append(cards)
      const confirm = mkBtn(t('loadoutConfirm'), () => engine.confirmLoadout(), true)
      if (loadoutPicks[0] === null || loadoutPicks[1] === null) confirm.disabled = true
      box.append(confirm)
      const def = document.createElement('div')
      def.className = 'mcs-hint'
      def.textContent = t('loadoutDefault')
      box.append(def)
      loadoutEl.append(box)
    }

    /* ================= 输入 ================= */

    const moveFromKeys = (): void => {
      let mx = 0
      let my = 0
      if (keys.has('KeyW') || keys.has('ArrowUp')) my += 1
      if (keys.has('KeyS') || keys.has('ArrowDown')) my -= 1
      if (keys.has('KeyA') || keys.has('ArrowLeft')) mx -= 1
      if (keys.has('KeyD') || keys.has('ArrowRight')) mx += 1
      engine.setMove(mx, my)
    }

    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.target instanceof HTMLButtonElement) return
      const k = event.key
      if (
        k === 'ArrowUp' ||
        k === 'ArrowDown' ||
        k === 'ArrowLeft' ||
        k === 'ArrowRight' ||
        k === ' '
      ) {
        event.preventDefault()
      }
      if (engine.phase === 'menu') {
        if (k === 'Enter') {
          if (screen === 'main') {
            screen = 'maps'
            renderOverlay()
          }
        }
        return
      }
      if (engine.phase === 'over') {
        if (k === 'Enter') {
          engine.restart()
          loadoutPicks = [null, null]
        }
        return
      }
      if (engine.phase === 'paused') {
        if (k === 'Enter' || k === 'p' || k === 'P') engine.resume()
        return
      }
      if (engine.phase === 'playing') {
        if (engine.matchState === 'loadout') {
          if (k === 'Enter') engine.confirmLoadout()
          return
        }
        if (k === 'p' || k === 'P') engine.pause()
        if (k === 'r' || k === 'R') engine.reload()
        if (k === '1') engine.switchWeapon(0)
        if (k === '2') engine.switchWeapon(1)
      }
      keys.add(event.code)
      moveFromKeys()
    }

    const onKeyUp = (event: KeyboardEvent): void => {
      keys.delete(event.code)
      moveFromKeys()
    }

    const onMouseMove = (event: MouseEvent): void => {
      if (!locked) return
      yaw += event.movementX * 0.0022
      pitch -= event.movementY * 0.0022
      pitch = Math.max(-0.9, Math.min(0.9, pitch))
      engine.setLook(yaw, pitch)
    }

    const onLockChange = (): void => {
      locked = document.pointerLockElement === canvas
      if (lockHintEl) {
        lockHintEl.style.display =
          engine.phase === 'playing' && engine.matchState === 'combat' && !locked && !isCoarse
            ? 'flex'
            : 'none'
      }
    }

    const canvasPoint = (event: PointerEvent): { x: number; y: number } => {
      const rect = canvas!.getBoundingClientRect()
      return { x: event.clientX - rect.left, y: event.clientY - rect.top }
    }

    const onPointerDown = (event: PointerEvent): void => {
      if (engine.phase !== 'playing' || engine.matchState !== 'combat') return
      const pt = canvasPoint(event)
      if (event.pointerType === 'touch') {
        if (pt.x < canvas!.clientWidth / 2) {
          moveTouch = { ax: pt.x, ay: pt.y }
        } else {
          lookTouch = { x: pt.x, y: pt.y }
        }
        return
      }
      if (!locked) {
        canvas?.requestPointerLock()
        return
      }
      if (event.button === 0) engine.setTrigger(true)
      else if (event.button === 2) engine.setAds(true)
    }

    const onPointerMove = (event: PointerEvent): void => {
      if (engine.phase !== 'playing' || engine.matchState !== 'combat') return
      if (event.pointerType !== 'touch') return
      const pt = canvasPoint(event)
      if (moveTouch) {
        const dx = pt.x - moveTouch.ax
        const dy = pt.y - moveTouch.ay
        const max = 48
        const cl = Math.hypot(dx, dy)
        const sx = cl > max ? (dx / cl) * max : dx
        const sy = cl > max ? (dy / cl) * max : dy
        engine.setMove(sx / max, -sy / max)
      } else if (lookTouch) {
        yaw += (pt.x - lookTouch.x) * 0.005
        pitch -= (pt.y - lookTouch.y) * 0.005
        pitch = Math.max(-0.9, Math.min(0.9, pitch))
        engine.setLook(yaw, pitch)
        lookTouch = { x: pt.x, y: pt.y }
      }
    }

    const onPointerUp = (event: PointerEvent): void => {
      if (event.pointerType === 'touch') {
        if (moveTouch) {
          moveTouch = null
          moveFromKeys()
        }
        if (lookTouch) lookTouch = null
        return
      }
      if (event.button === 0) engine.setTrigger(false)
      else if (event.button === 2) engine.setAds(false)
    }

    const onWheel = (event: WheelEvent): void => {
      if (engine.phase !== 'playing' || engine.matchState !== 'combat') return
      event.preventDefault()
      engine.cycleWeapon()
    }

    const onContextMenu = (event: Event): void => {
      event.preventDefault()
    }

    /* ================= 触屏按钮 ================= */

    const buildTouchControls = (): HTMLDivElement => {
      const bar = document.createElement('div')
      bar.className = 'mcs-touch'
      const mk = (label: string, onDown: () => void, onUp: () => void): HTMLButtonElement => {
        const b = document.createElement('button')
        b.type = 'button'
        b.textContent = label
        b.className = 'mcs-touch-btn'
        b.addEventListener('pointerdown', (e) => {
          e.preventDefault()
          onDown()
        })
        b.addEventListener('pointerup', onUp)
        b.addEventListener('pointercancel', onUp)
        b.addEventListener('pointerleave', onUp)
        return b
      }
      bar.append(
        mk(
          'FIRE',
          () => engine.setTrigger(true),
          () => engine.setTrigger(false),
        ),
        mk(
          'AIM',
          () => engine.setAds(!engine.playerAds),
          () => {},
        ),
        mk(
          'R',
          () => engine.reload(),
          () => {},
        ),
        mk(
          'SWAP',
          () => engine.cycleWeapon(),
          () => {},
        ),
      )
      return bar
    }

    /* ================= 主循环 ================= */

    const loop = (now: number): void => {
      const dtMs = Math.min(now - last, 250)
      last = now
      const dt = dtMs / 1000
      if (running && engine.phase === 'playing') {
        moveFromKeys()
        engine.tick(dt)
      }
      handleEvents(engine.drainEvents())
      updateVisuals(dt)
      draw()
      sync()
      rafId = requestAnimationFrame(loop)
    }

    const sync = (): void => {
      const kills = engine.player.kills
      if (kills !== lastScore) {
        lastScore = kills
        callbacks.onScore(kills)
      }
      const screenKey = engine.phase + ':' + engine.matchState + ':' + screen
      if (screenKey !== lastScreenKey) {
        lastScreenKey = screenKey
        renderOverlay()
        renderLoadout()
      }
      if (engine.phase !== lastPhase) {
        lastPhase = engine.phase
        callbacks.onPhase?.(engine.phase)
        if (engine.phase === 'over') {
          callbacks.onScore(engine.player.kills)
          progressService.addKills(engine.player.kills)
        }
        if (engine.phase === 'menu') {
          screen = 'main'
        }
      }
      if (engine.matchState !== lastMatchState) {
        lastMatchState = engine.matchState
        if (engine.matchState === 'loadout') loadoutPicks = [null, null]
      }
      if (langRef.current !== lastLang) {
        lastLang = langRef.current
        renderOverlay()
        renderLoadout()
      }
      if (lockHintEl) {
        lockHintEl.style.display =
          engine.phase === 'playing' && engine.matchState === 'combat' && !locked && !isCoarse
            ? 'flex'
            : 'none'
      }
      if (touchEl) {
        touchEl.style.display =
          isCoarse && engine.phase === 'playing' && engine.matchState === 'combat' ? 'flex' : 'none'
      }
    }

    /* ================= GameInstance 契约 ================= */

    const instance: GameInstance = {
      mount(el) {
        root = document.createElement('div')
        root.className = 'mcs-root'
        canvas = document.createElement('canvas')
        canvas.width = VIEW_W
        canvas.height = VIEW_H
        canvas.style.width = '100%'
        canvas.style.height = 'auto'
        canvas.style.aspectRatio = VIEW_W + ' / ' + VIEW_H
        canvas.style.display = 'block'
        canvas.style.imageRendering = 'pixelated'
        canvas.style.touchAction = 'none'
        canvas.tabIndex = -1
        ctx = canvas.getContext('2d')
        canvas.addEventListener('pointerdown', onPointerDown)
        canvas.addEventListener('pointermove', onPointerMove)
        canvas.addEventListener('pointerup', onPointerUp)
        canvas.addEventListener('pointercancel', onPointerUp)
        canvas.addEventListener('wheel', onWheel, { passive: false })
        canvas.addEventListener('contextmenu', onContextMenu)
        root.appendChild(canvas)

        lockHintEl = document.createElement('div')
        lockHintEl.className = 'mcs-lockhint'
        lockHintEl.textContent = t('clickLock')
        root.appendChild(lockHintEl)

        touchEl = buildTouchControls()
        root.appendChild(touchEl)

        loadoutEl = document.createElement('div')
        loadoutEl.className = 'mcs-loadout'
        root.appendChild(loadoutEl)

        overlayEl = document.createElement('div')
        overlayEl.className = 'mcs-overlay'
        panelEl = document.createElement('div')
        panelEl.className = 'mcs-panel'
        overlayEl.appendChild(panelEl)
        root.appendChild(overlayEl)

        el.appendChild(root)
        window.addEventListener('keydown', onKeyDown)
        window.addEventListener('keyup', onKeyUp)
        document.addEventListener('mousemove', onMouseMove)
        document.addEventListener('pointerlockchange', onLockChange)

        yaw = engine.player.angle
        pitch = engine.player.pitch
        renderer.setSkinHint(engine.selectedSkin)
        callbacks.onPhase?.(engine.phase)
        screen = 'main'
        lastScreenKey = ''
        renderOverlay()
        renderLoadout()
        draw()
      },
      start() {
        if (running) return
        running = true
        last = performance.now()
        rafId = requestAnimationFrame(loop)
      },
      pause() {
        engine.pause()
      },
      resume() {
        engine.resume()
      },
      restart() {
        engine.restart()
        loadoutPicks = [null, null]
      },
      destroy() {
        running = false
        cancelAnimationFrame(rafId)
        window.removeEventListener('keydown', onKeyDown)
        window.removeEventListener('keyup', onKeyUp)
        document.removeEventListener('mousemove', onMouseMove)
        document.removeEventListener('pointerlockchange', onLockChange)
        if (document.pointerLockElement === canvas) document.exitPointerLock()
        root?.remove()
        root = null
        canvas = null
        ctx = null
        overlayEl = null
        panelEl = null
        loadoutEl = null
        touchEl = null
        lockHintEl = null
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

export default McsGame
