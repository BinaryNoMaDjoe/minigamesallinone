// ============================================================
// 幸存者小黑（SurvivorBlacky）—— 纯逻辑引擎（决策 #25）
// 唯一出处：同目录 DESIGN.md v1.0
// 无 DOM / 无 React：可注入随机源，node 直跑可测（engine.test.ts）
// 世界/波次/武器/被动/敌人/经验/升级三选一/计分/事件流全部在此
// 视觉（粒子/拟声词/摇杆）在 Game.tsx，引擎只产出 GameEvent
// ============================================================

export type Rng = () => number

// —— 常量（DESIGN.md §2） ——
// 单屏竞技场（DESIGN.md v1.1 §2.1）：画布 1:1 显示全部场地，无相机
export const WORLD_W = 960
export const WORLD_H = 540
export const WAVE_COUNT = 10
export const WAVE_DURATION = 25
export const MAX_ENEMIES = 240
export const MAX_GEMS = 500
export const PLAYER_RADIUS = 12
export const PLAYER_INVULN = 0.75

export type EnemyKindId = 'pig' | 'chicken' | 'dog' | 'pigeon'
export type SpawnKind = EnemyKindId | 'minipigeon' | 'boss'
export type EnemyTier = 'normal' | 'elite' | 'boss'
export type WeaponId = 'hairball' | 'yarn' | 'boomerang' | 'laser' | 'fishgun' | 'litterbomb'
export type PassiveId = 'canned' | 'teaser' | 'fur' | 'claws' | 'coffee' | 'milk' | 'catnip' | 'box'
export type GamePhase = 'menu' | 'playing' | 'paused' | 'over'

// —— 敌人基础数值（DESIGN.md §2.4） ——
export interface EnemyDef {
  hp: number
  damage: number
  speed: number
  radius: number
  xp: number
  wobbleFreq: number
  wobbleAmp: number
  knockResist: number
}

export const ENEMY_DEFS: Record<SpawnKind, EnemyDef> = {
  pig: {
    hp: 20,
    damage: 8,
    speed: 46,
    radius: 15,
    xp: 1,
    wobbleFreq: 1.2,
    wobbleAmp: 0.35,
    knockResist: 0.4,
  },
  chicken: {
    hp: 10,
    damage: 6,
    speed: 82,
    radius: 11,
    xp: 1,
    wobbleFreq: 5.2,
    wobbleAmp: 0.9,
    knockResist: 0.5,
  },
  dog: {
    hp: 16,
    damage: 10,
    speed: 104,
    radius: 14,
    xp: 2,
    wobbleFreq: 2.4,
    wobbleAmp: 0.3,
    knockResist: 0.3,
  },
  pigeon: {
    hp: 46,
    damage: 14,
    speed: 34,
    radius: 19,
    xp: 3,
    wobbleFreq: 1.8,
    wobbleAmp: 0.55,
    knockResist: 0.5,
  },
  minipigeon: {
    hp: 12,
    damage: 8,
    speed: 70,
    radius: 9,
    xp: 1,
    wobbleFreq: 5.5,
    wobbleAmp: 0.9,
    knockResist: 0.5,
  },
  boss: {
    hp: 2800,
    damage: 24,
    speed: 30,
    radius: 42,
    xp: 80,
    wobbleFreq: 0.7,
    wobbleAmp: 0.25,
    knockResist: 1,
  },
}

// —— 波次出怪构成（DESIGN.md §2.5；weights 对应 pig/chicken/dog/pigeon） ——
export interface WaveDef {
  weights: [number, number, number, number]
  eliteChance: number
}

export const WAVE_DEFS: WaveDef[] = [
  { weights: [1, 0, 0, 0], eliteChance: 0 },
  { weights: [0.3, 0.5, 0.2, 0], eliteChance: 0 },
  { weights: [0.3, 0.2, 0.5, 0], eliteChance: 0 },
  { weights: [0.25, 0.3, 0, 0.45], eliteChance: 0.08 },
  { weights: [0.25, 0.25, 0.25, 0.25], eliteChance: 0.1 },
  { weights: [0.4, 0.2, 0.4, 0], eliteChance: 0.12 },
  { weights: [0, 0.15, 0.25, 0.6], eliteChance: 0.15 },
  { weights: [0.15, 0.4, 0.45, 0], eliteChance: 0.15 },
  { weights: [0.25, 0.25, 0.25, 0.25], eliteChance: 0.2 },
  { weights: [0.3, 0.2, 0.3, 0.2], eliteChance: 0.1 },
]

export const waveBudget = (wave: number): number => 18 + 12 * (wave - 1)
export const waveSpawnInterval = (wave: number): number => Math.max(0.32, 1.05 - 0.08 * (wave - 1))
export const hpScale = (wave: number, minute: number): number =>
  1 + 0.16 * (wave - 1) + 0.06 * minute
export const damageScale = (wave: number): number => 1 + 0.04 * (wave - 1)
export const speedScale = (wave: number): number => 1 + 0.02 * (wave - 1)

// —— 武器数值表（DESIGN.md §2.6；每级数组） ——
export interface WeaponDef {
  damage: number[]
  cooldown: number[]
  count: number[]
  /** 附加参数（爆炸半径/目标数/穿透等），按级数组 */
  extra: number[]
}

export const WEAPON_DEFS: Record<WeaponId, WeaponDef> = {
  hairball: {
    damage: [14, 18, 25, 34, 46],
    cooldown: [1.1, 1.0, 0.9, 0.8, 0.7],
    count: [1, 1, 2, 2, 3],
    extra: [0, 0, 0, 0, 46],
  },
  yarn: {
    damage: [9, 13, 17, 23, 23],
    cooldown: [0, 0, 0, 0, 0],
    count: [1, 2, 3, 4, 4],
    extra: [70, 70, 70, 70, 70],
  },
  boomerang: {
    damage: [16, 21, 28, 37, 50],
    cooldown: [1.6, 1.5, 1.4, 1.3, 1.2],
    count: [1, 1, 1, 1, 2],
    extra: [2, 3, 4, 5, -1],
  },
  laser: {
    damage: [12, 16, 23, 32, 46],
    cooldown: [1.5, 1.4, 1.3, 1.2, 1.1],
    count: [1, 2, 3, 4, 5],
    extra: [520, 520, 520, 520, 520],
  },
  fishgun: {
    damage: [7, 9, 12, 15, 20],
    cooldown: [0.42, 0.38, 0.34, 0.3, 0.26],
    count: [1, 1, 2, 2, 3],
    extra: [0, 0, 0, 0, 0],
  },
  litterbomb: {
    damage: [20, 28, 37, 48, 63],
    cooldown: [3.2, 3.0, 2.8, 2.6, 2.4],
    count: [1, 1, 2, 2, 3],
    extra: [60, 66, 72, 78, 85],
  },
}

export const WEAPON_MAX_LEVEL = 5
export const PASSIVE_MAX_LEVEL = 5
export const BOMB_FUSE = 0.8
export const BOMB_ZONE_DPS = 8
export const BOMB_ZONE_LIFE = 3
export const BOMB_ZONE_RADIUS = 60
export const LASER_RANGE = 520
export const LASER_BURN_DPS = 3
export const LASER_BURN_TIME = 2
export const HAIRBALL_SPEED = 260
export const HAIRBALL_TURN = 6.5
export const HAIRBALL_LIFE = 3
export const HAIRBALL_RADIUS = 7
export const HAIRBALL_AOE_MULT = 0.6
export const ORBIT_SPEED = 2.6
export const ORBIT_HIT_WINDOW = 0.45
export const BOOMERANG_SPEED = 300
export const BOOMERANG_RETURN_SPEED = 340
export const BOOMERANG_RANGE = 380
export const BOOMERANG_RADIUS = 9
export const FISHGUN_SPEED = 420
export const FISHGUN_LIFE = 0.9
export const FISHGUN_RADIUS = 6
export const FISHGUN_SPREAD = 0.14
export const BOMB_PLACE_RANGE = 320
export const ZONE_TICK = 0.5
export const BOSS_MINION_INTERVAL = 8
export const BOSS_MINION_COUNT = 3
export const WAVE10_TRICKLE_INTERVAL = 2.8
export const QUOTE_COOLDOWN = 12

// —— 实体 ——
export interface PlayerState {
  x: number
  y: number
  facing: number
  hp: number
  maxHp: number
  invuln: number
  moveX: number
  moveY: number
  moving: boolean
  hurtT: number
}

export interface Enemy {
  id: number
  kind: SpawnKind
  tier: EnemyTier
  x: number
  y: number
  hp: number
  maxHp: number
  speed: number
  damage: number
  radius: number
  xp: number
  facing: number
  vx: number
  vy: number
  flash: number
  burnDps: number
  burnT: number
  wobbleSeed: number
  spawnT: number
  bossTimer: number
  bornT: number
}

export type ProjectileKind =
  'homing' | 'orbit' | 'boomerang' | 'beam' | 'straight' | 'bomb' | 'zone'

export interface Projectile {
  id: number
  weapon: WeaponId
  kind: ProjectileKind
  x: number
  y: number
  vx: number
  vy: number
  damage: number
  radius: number
  /** -1 = 无限穿透（鱼骨满级） */
  pierce: number
  hitIds: number[]
  life: number
  turnRate: number
  angle: number
  orbitR: number
  hitWindow: number
  phase: 'out' | 'back'
  maxDist: number
  traveled: number
  fuse: number
  boomRadius: number
  spawnZone: boolean
  dps: number
  zoneTick: number
  fx: number
  fy: number
}

export interface Gem {
  x: number
  y: number
  value: number
  vx: number
  vy: number
  magnet: boolean
  t: number
  dead?: boolean
}

export interface WeaponState {
  id: WeaponId
  level: number
  cd: number
}

// —— 升级选项（DESIGN.md §2.8） ——
export type UpgradeOption =
  | { kind: 'weapon'; id: WeaponId; nextLevel: number }
  | { kind: 'passive'; id: PassiveId; nextLevel: number }
  | { kind: 'heal'; amount: number }

export type QuoteKey = 'start' | 'boss' | 'lowHp' | 'levelUp' | 'victory'

export type GameEvent =
  | { type: 'hit'; x: number; y: number; amount: number; crit: boolean }
  | { type: 'kill'; x: number; y: number; kind: SpawnKind; tier: EnemyTier }
  | { type: 'collect'; x: number; y: number; value: number }
  | { type: 'wave'; wave: number }
  | { type: 'boss' }
  | { type: 'boom'; x: number; y: number; radius: number }
  | { type: 'zone'; x: number; y: number }
  | { type: 'levelup'; level: number }
  | { type: 'hurt' }
  | { type: 'quote'; key: QuoteKey }
  | { type: 'over'; outcome: 'win' | 'lose'; cause: SpawnKind | 'unknown' }

const defaultRng: Rng = Math.random

// ============================================================

export class SurvivorEngine {
  readonly random: Rng

  phase: GamePhase = 'menu'
  outcome: 'win' | 'lose' | null = null
  deathCause: SpawnKind | 'unknown' = 'unknown'

  player: PlayerState
  enemies: Enemy[] = []
  projectiles: Projectile[] = []
  gems: Gem[] = []
  weapons: WeaponState[] = []
  passiveLevels: Record<PassiveId, number> = {
    canned: 0,
    teaser: 0,
    fur: 0,
    claws: 0,
    coffee: 0,
    milk: 0,
    catnip: 0,
    box: 0,
  }

  wave = 1
  waveTime = 0
  survived = 0
  kills = 0
  waveCompleted = 0
  bossKilled = 0
  /** 本局收集小鱼干数（成就用） */
  gemsCollected = 0
  /** 本局受击次数（成就用） */
  hitsTaken = 0

  pendingLevelUps = 0
  pendingChoices: UpgradeOption[][] = []

  // —— 派生属性（computeStats 更新） ——
  speed = 165
  armor = 0
  damageMult = 1
  attackSpeedMult = 1
  critChance = 0.05
  critMult = 2
  pickupRadius = 90
  xpMult = 1
  regen = 0

  spawnBudget = 0
  private spawnTimer = 0
  private trickleTimer = 0
  private trickleAlternate = false
  private bossSpawned = false
  private quoteT = 0
  private lastHpQuoteAt = -99
  private events: GameEvent[] = []
  private nextId = 1
  private levelValue = 1
  private xpProgress = 0

  constructor(opts: { random?: Rng } = {}) {
    this.random = opts.random ?? defaultRng
    this.player = this.freshPlayer()
  }

  private freshPlayer(): PlayerState {
    return {
      x: WORLD_W / 2,
      y: WORLD_H / 2,
      facing: 0,
      hp: 100,
      maxHp: 100,
      invuln: 0,
      moveX: 0,
      moveY: 0,
      moving: false,
      hurtT: 0,
    }
  }

  get score(): number {
    return (
      this.kills * 10 + Math.floor(this.survived) + this.waveCompleted * 50 + this.bossKilled * 500
    )
  }

  get boss(): Enemy | null {
    return this.enemies.find((e) => e.kind === 'boss') ?? null
  }

  get currentLevel(): number {
    return this.levelValue
  }

  get xp(): number {
    return this.xpProgress
  }

  get xpNext(): number {
    return this.xpNeeded()
  }

  private xpNeeded(): number {
    return 6 + 4 * (this.levelValue - 1)
  }

  // ==================== 生命周期 ====================

  startRun(): void {
    this.phase = 'playing'
    this.outcome = null
    this.deathCause = 'unknown'
    this.player = this.freshPlayer()
    this.enemies = []
    this.projectiles = []
    this.gems = []
    this.weapons = [{ id: 'hairball', level: 1, cd: 0.4 }]
    this.passiveLevels = {
      canned: 0,
      teaser: 0,
      fur: 0,
      claws: 0,
      coffee: 0,
      milk: 0,
      catnip: 0,
      box: 0,
    }
    this.wave = 1
    this.waveTime = 0
    this.survived = 0
    this.kills = 0
    this.waveCompleted = 0
    this.bossKilled = 0
    this.gemsCollected = 0
    this.hitsTaken = 0
    this.levelValue = 1
    this.xpProgress = 0
    this.pendingLevelUps = 0
    this.pendingChoices = []
    this.spawnBudget = waveBudget(1)
    this.spawnTimer = 0.8
    this.trickleTimer = 0
    this.bossSpawned = false
    this.quoteT = 0
    this.lastHpQuoteAt = -99
    this.computeStats()
    this.events.push({ type: 'wave', wave: 1 })
    this.tryQuote('start')
  }

  toMenu(): void {
    this.phase = 'menu'
    this.outcome = null
    this.enemies = []
    this.projectiles = []
    this.gems = []
    this.pendingLevelUps = 0
    this.pendingChoices = []
    this.weapons = []
    this.player = this.freshPlayer()
    this.computeStats()
  }

  pause(): void {
    // 升级浮层打开时战场已冻结，忽略壳层暂停（DESIGN.md §5）
    if (this.phase === 'playing' && this.pendingLevelUps === 0) this.phase = 'paused'
  }

  resume(): void {
    if (this.phase === 'paused') this.phase = 'playing'
  }

  setMove(dx: number, dy: number): void {
    this.player.moveX = dx
    this.player.moveY = dy
  }

  drainEvents(): GameEvent[] {
    const out = this.events
    this.events = []
    return out
  }

  private emit(event: GameEvent): void {
    this.events.push(event)
  }

  private tryQuote(key: QuoteKey): void {
    if (this.quoteT > 0) return
    this.quoteT = QUOTE_COOLDOWN
    this.emit({ type: 'quote', key })
  }

  private finish(outcome: 'win' | 'lose', cause: SpawnKind | 'unknown'): void {
    if (this.phase !== 'playing') return
    this.phase = 'over'
    this.outcome = outcome
    this.deathCause = cause
    this.pendingLevelUps = 0
    this.pendingChoices = []
    this.emit({ type: 'over', outcome, cause })
    if (outcome === 'win') this.tryQuote('victory')
  }

  // ==================== 属性计算（DESIGN.md §2.7） ====================

  computeStats(): void {
    const p = this.passiveLevels
    this.player.maxHp = 100 + 15 * p.canned
    this.speed = 165 * (1 + 0.07 * p.teaser)
    this.armor = p.fur
    this.damageMult = 1 + 0.08 * p.claws
    this.attackSpeedMult = 1 + 0.08 * p.coffee
    this.critChance = 0.05 + 0.07 * p.catnip
    this.pickupRadius = 90 * (1 + 0.22 * p.milk)
    this.xpMult = 1 + 0.1 * p.box
    this.regen = p.canned >= PASSIVE_MAX_LEVEL ? 0.5 : 0
  }

  // ==================== 升级三选一（DESIGN.md §2.8） ====================

  private rollChoices(): UpgradeOption[] {
    const options: UpgradeOption[] = []
    const allWeapons: WeaponId[] = [
      'hairball',
      'yarn',
      'boomerang',
      'laser',
      'fishgun',
      'litterbomb',
    ]
    const allPassives: PassiveId[] = [
      'canned',
      'teaser',
      'fur',
      'claws',
      'coffee',
      'milk',
      'catnip',
      'box',
    ]
    const ownedCount = this.weapons.length
    for (const id of allWeapons) {
      const owned = this.weapons.find((w) => w.id === id)
      if (!owned) options.push({ kind: 'weapon', id, nextLevel: 1 })
      else if (owned.level < WEAPON_MAX_LEVEL)
        options.push({ kind: 'weapon', id, nextLevel: owned.level + 1 })
    }
    for (const id of allPassives) {
      const lv = this.passiveLevels[id]
      if (lv < PASSIVE_MAX_LEVEL) options.push({ kind: 'passive', id, nextLevel: lv + 1 })
    }
    if (this.player.hp < 0.65 * this.player.maxHp) options.push({ kind: 'heal', amount: 0.35 })

    const weight = (o: UpgradeOption): number => {
      if (o.kind === 'heal') return 30
      if (o.kind === 'weapon' && o.nextLevel === 1) return ownedCount < 2 ? 60 : 25
      return 45
    }
    const picked: UpgradeOption[] = []
    const pool = [...options]
    for (let i = 0; i < 3 && pool.length > 0; i++) {
      const total = pool.reduce((sum, o) => sum + weight(o), 0)
      let roll = this.random() * total
      let idx = 0
      for (let j = 0; j < pool.length; j++) {
        roll -= weight(pool[j]!)
        if (roll <= 0) {
          idx = j
          break
        }
      }
      picked.push(pool[idx]!)
      pool.splice(idx, 1)
    }
    // 保底：前 3 次升级至少出现一个新武器选项（新手节奏，DESIGN.md §2.8）
    const unowned = options.filter((o) => o.kind === 'weapon' && o.nextLevel === 1)
    const hasNewWeapon = picked.some((o) => o.kind === 'weapon' && o.nextLevel === 1)
    if (this.levelValue <= 3 && !hasNewWeapon && unowned.length > 0) {
      const replacement = unowned[Math.floor(this.random() * unowned.length)]!
      // 替换最后一项；跳过已是新武器的项
      for (let i = picked.length - 1; i >= 0; i--) {
        const pi = picked[i]!
        if (pi.kind === 'weapon' && pi.nextLevel === 1) continue
        picked[i] = replacement
        break
      }
    }
    return picked
  }

  chooseUpgrade(index: number): void {
    const queue = this.pendingChoices[0]
    if (!queue || index < 0 || index >= queue.length) return
    const option = queue[index]!
    this.applyUpgrade(option)
    this.pendingChoices.shift()
    this.pendingLevelUps = Math.max(0, this.pendingLevelUps - 1)
  }

  private applyUpgrade(option: UpgradeOption): void {
    if (option.kind === 'weapon') {
      const owned = this.weapons.find((w) => w.id === option.id)
      if (owned) owned.level = option.nextLevel
      else this.weapons.push({ id: option.id, level: option.nextLevel, cd: 0.3 })
      // 毛线球环：数量随等级即时同步
      this.syncOrbs()
    } else if (option.kind === 'passive') {
      const before = this.passiveLevels[option.id]
      this.passiveLevels[option.id] = option.nextLevel
      const gained = option.nextLevel - before
      if (option.id === 'canned') {
        this.player.maxHp += 15 * gained
        this.player.hp = Math.min(this.player.maxHp, this.player.hp + 15 * gained)
      }
      this.computeStats()
    } else {
      this.player.hp = Math.min(
        this.player.maxHp,
        this.player.hp + option.amount * this.player.maxHp,
      )
    }
  }

  private syncOrbs(): void {
    const yarnWeapon = this.weapons.find((w) => w.id === 'yarn')
    const want = yarnWeapon ? WEAPON_DEFS.yarn.count[yarnWeapon.level - 1]! : 0
    const orbs = this.projectiles.filter((p) => p.kind === 'orbit')
    // 移除多余
    while (orbs.length > want) {
      const last = orbs.pop()
      if (last) this.projectiles.splice(this.projectiles.indexOf(last), 1)
    }
    // 补充缺失
    while (orbs.length < want) {
      const base = WEAPON_DEFS.yarn.damage[yarnWeapon ? yarnWeapon.level - 1 : 0]!
      const orb = this.makeProjectile('yarn', 'orbit', base, 8, -1, 0)
      this.projectiles.push(orb)
      orbs.push(orb)
    }
    // 角度均分（含已有）
    if (orbs.length > 0) {
      for (let i = 0; i < orbs.length; i++) {
        orbs[i]!.angle = (i / orbs.length) * Math.PI * 2
      }
    }
  }

  // ==================== 主循环（DESIGN.md §2） ====================

  tick(dt: number): void {
    if (dt <= 0) return
    if (this.phase !== 'playing' || this.pendingLevelUps > 0) return

    this.survived += dt
    this.quoteT = Math.max(0, this.quoteT - dt)

    // 波次推进
    if (this.wave < WAVE_COUNT) {
      this.waveTime += dt
      if (this.waveTime >= WAVE_DURATION) {
        this.waveTime -= WAVE_DURATION
        this.wave++
        this.waveCompleted++
        this.spawnBudget += waveBudget(this.wave)
        this.emit({ type: 'wave', wave: this.wave })
      }
    }

    // 第 10 波 BOSS 入场（DESIGN.md §2.2/2.4）
    if (this.wave >= WAVE_COUNT && !this.bossSpawned) {
      this.bossSpawned = true
      this.spawnEnemy('boss', false)
      for (let i = 0; i < 10; i++) this.spawnEnemy('pigeon', false)
      this.emit({ type: 'boss' })
      this.tryQuote('boss')
    }

    this.updatePlayer(dt)
    this.updateSpawning(dt)
    this.updateEnemies(dt)
    this.updateWeapons(dt)
    this.updateProjectiles(dt)
    this.updateGems(dt)

    // 胜利/失败判定
    if (this.phase === 'playing') {
      if (this.player.hp <= 0) {
        this.player.hp = 0
        this.finish('lose', this.deathCause)
      } else if (this.bossKilled > 0) {
        this.finish('win', 'boss')
      }
    }
  }

  // ==================== 玩家 ====================

  private updatePlayer(dt: number): void {
    const p = this.player
    let dx = p.moveX
    let dy = p.moveY
    const len = Math.hypot(dx, dy)
    if (len > 1) {
      dx /= len
      dy /= len
    } else if (len <= 0.01) {
      dx = 0
      dy = 0
    }
    p.moving = dx !== 0 || dy !== 0
    if (p.moving) p.facing = Math.atan2(dy, dx)
    p.x += dx * this.speed * dt
    p.y += dy * this.speed * dt
    const m = 26
    p.x = Math.max(m, Math.min(WORLD_W - m, p.x))
    p.y = Math.max(m, Math.min(WORLD_H - m, p.y))

    p.invuln = Math.max(0, p.invuln - dt)
    p.hurtT = Math.max(0, p.hurtT - dt)
    if (this.regen > 0 && p.hp < p.maxHp) {
      p.hp = Math.min(p.maxHp, p.hp + this.regen * dt)
    }
  }

  // ==================== 出怪（DESIGN.md §2.2/2.5） ====================

  private pickSpawnKind(): SpawnKind {
    const def = WAVE_DEFS[Math.min(this.wave, WAVE_COUNT) - 1]!
    if (this.wave >= WAVE_COUNT) {
      return this.trickleAlternate ? 'pig' : 'chicken'
    }
    const total = def.weights[0] + def.weights[1] + def.weights[2] + def.weights[3]
    let roll = this.random() * total
    const kinds: EnemyKindId[] = ['pig', 'chicken', 'dog', 'pigeon']
    for (let i = 0; i < 4; i++) {
      roll -= def.weights[i]
      if (roll <= 0) return kinds[i]!
    }
    return 'pig'
  }

  private spawnPosition(): { x: number; y: number } {
    const side = Math.floor(this.random() * 4)
    const t = this.random()
    const m = 20
    if (side === 0) return { x: WORLD_W * t, y: -m }
    if (side === 1) return { x: WORLD_W + m, y: WORLD_H * t }
    if (side === 2) return { x: WORLD_W * t, y: WORLD_H + m }
    return { x: -m, y: WORLD_H * t }
  }

  private spawnEnemy(kind: SpawnKind, rollElite: boolean): Enemy {
    const def = ENEMY_DEFS[kind]
    const minute = Math.floor(this.survived / 60)
    const tier: EnemyTier =
      kind === 'boss'
        ? 'boss'
        : rollElite && this.random() < WAVE_DEFS[Math.min(this.wave, WAVE_COUNT) - 1]!.eliteChance
          ? 'elite'
          : 'normal'
    const elite = tier === 'elite'
    const isBoss = kind === 'boss'
    // BOSS 使用基础值，不参与波次缩放（DESIGN.md §2.4 数值即第 10 波数值）
    const hp = isBoss ? def.hp : def.hp * hpScale(this.wave, minute) * (elite ? 2.6 : 1)
    const pos = this.spawnPosition()
    const enemy: Enemy = {
      id: this.nextId++,
      kind,
      tier,
      x: pos.x,
      y: pos.y,
      hp,
      maxHp: hp,
      speed: isBoss ? def.speed : def.speed * speedScale(this.wave) * (elite ? 1.05 : 1),
      damage: isBoss ? def.damage : def.damage * damageScale(this.wave) * (elite ? 1.6 : 1),
      radius: def.radius * (elite ? 1.25 : 1),
      xp: Math.round(def.xp * (elite ? 2 : 1)),
      facing: 0,
      vx: 0,
      vy: 0,
      flash: 0,
      burnDps: 0,
      burnT: 0,
      wobbleSeed: this.random() * Math.PI * 2,
      spawnT: 0.4,
      bossTimer: BOSS_MINION_INTERVAL,
      bornT: this.survived,
    }
    this.enemies.push(enemy)
    return enemy
  }

  private updateSpawning(dt: number): void {
    if (this.wave < WAVE_COUNT) {
      this.spawnTimer -= dt
      while (this.spawnTimer <= 0 && this.spawnBudget > 0 && this.enemies.length < MAX_ENEMIES) {
        this.spawnTimer += waveSpawnInterval(this.wave)
        this.spawnBudget -= 1
        this.spawnEnemy(this.pickSpawnKind(), true)
      }
    } else {
      this.trickleTimer -= dt
      if (this.trickleTimer <= 0 && this.enemies.length < MAX_ENEMIES) {
        this.trickleTimer = WAVE10_TRICKLE_INTERVAL
        this.spawnEnemy(this.pickSpawnKind(), true)
        this.trickleAlternate = !this.trickleAlternate
      }
    }
  }

  // ==================== 敌人 ====================

  private updateEnemies(dt: number): void {
    const p = this.player
    for (const e of this.enemies) {
      e.spawnT = Math.max(0, e.spawnT - dt)
      e.flash = Math.max(0, e.flash - dt)
      if (e.burnT > 0) {
        e.burnT -= dt
        const burn = e.burnDps * dt
        e.hp -= burn
        e.flash = 0.06
        if (burn >= 0.3) {
          this.emit({
            type: 'hit',
            x: e.x,
            y: e.y - e.radius - 6,
            amount: Math.max(1, Math.round(burn)),
            crit: false,
          })
        }
        if (e.hp <= 0) this.killEnemy(e)
      }
      if (e.hp <= 0) continue

      const dx = p.x - e.x
      const dy = p.y - e.y
      const dist = Math.hypot(dx, dy) || 1
      const dirX = dx / dist
      const dirY = dy / dist
      // 垂直摇摆（性格化走位，DESIGN.md §2.4）
      const wobble =
        Math.sin(this.survived * ENEMY_DEFS[e.kind].wobbleFreq + e.wobbleSeed) *
        ENEMY_DEFS[e.kind].wobbleAmp
      const mvX = dirX + -dirY * wobble
      const mvY = dirY + dirX * wobble
      const mvLen = Math.hypot(mvX, mvY) || 1
      e.x += ((mvX / mvLen) * e.speed + e.vx) * dt
      e.y += ((mvY / mvLen) * e.speed + e.vy) * dt
      e.vx *= Math.max(0, 1 - 8 * dt)
      e.vy *= Math.max(0, 1 - 8 * dt)
      e.facing = Math.atan2(dirY, dirX)

      // BOSS 召唤迷你鸽（DESIGN.md §2.4）
      if (e.kind === 'boss') {
        e.bossTimer -= dt
        if (e.bossTimer <= 0) {
          e.bossTimer = BOSS_MINION_INTERVAL
          for (let i = 0; i < BOSS_MINION_COUNT; i++) {
            const a = this.random() * Math.PI * 2
            const m = this.spawnEnemy('minipigeon', false)
            m.x = e.x + Math.cos(a) * (e.radius + 26)
            m.y = e.y + Math.sin(a) * (e.radius + 26)
          }
        }
      }

      // 接触伤害（DESIGN.md §2.3 无敌帧）
      const hitDist = e.radius + PLAYER_RADIUS
      if (dist < hitDist && p.invuln <= 0 && p.hp > 0) {
        const amount = Math.max(1, Math.round(e.damage - this.armor))
        p.hp -= amount
        this.hitsTaken++
        p.invuln = PLAYER_INVULN
        p.hurtT = 0.25
        // 击退玩家（瞬时）与敌人（BOSS 免疫）
        p.x += dirX * 34
        p.y += dirY * 34
        const resist = ENEMY_DEFS[e.kind].knockResist
        e.vx -= dirX * 220 * (1 - resist)
        e.vy -= dirY * 220 * (1 - resist)
        this.emit({ type: 'hurt' })
        if (p.hp > 0 && p.hp < 0.3 * p.maxHp && this.survived - this.lastHpQuoteAt > 20) {
          this.lastHpQuoteAt = this.survived
          this.tryQuote('lowHp')
        }
        if (p.hp <= 0) this.deathCause = e.kind
      }
    }
    this.enemies = this.enemies.filter((e) => e.hp > 0)
  }

  private damageEnemy(
    e: Enemy,
    amount: number,
    crit: boolean,
    kbX: number,
    kbY: number,
    kbForce: number,
  ): void {
    if (e.hp <= 0) return
    e.hp -= amount
    e.flash = 0.12
    const len = Math.hypot(kbX, kbY) || 1
    const resist = ENEMY_DEFS[e.kind].knockResist
    e.vx += (kbX / len) * kbForce * (1 - resist)
    e.vy += (kbY / len) * kbForce * (1 - resist)
    this.emit({
      type: 'hit',
      x: e.x + this.random() * 14 - 7,
      y: e.y - e.radius - 6,
      amount: Math.max(1, Math.round(amount)),
      crit,
    })
    if (e.hp <= 0) this.killEnemy(e)
  }

  private killEnemy(e: Enemy): void {
    this.kills++
    this.emit({ type: 'kill', x: e.x, y: e.y, kind: e.kind, tier: e.tier })
    if (e.kind === 'boss') this.bossKilled++
    // 经验小鱼干（DESIGN.md §2.8）
    for (let i = 0; i < e.xp; i++) {
      if (this.gems.length >= MAX_GEMS) {
        const oldest = this.gems.shift()
        if (oldest) this.gainXp(oldest.value)
      }
      const a = this.random() * Math.PI * 2
      const sp = 40 + this.random() * 60
      this.gems.push({
        x: e.x,
        y: e.y,
        value: 1,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp,
        magnet: false,
        t: 0,
      })
    }
  }

  private gainXp(value: number): void {
    let rest = value * this.xpMult
    while (rest > 0 && this.phase === 'playing') {
      const need = this.xpNeeded()
      const total = this.xpProgress + rest
      if (total < need) {
        this.xpProgress = total
        rest = 0
        break
      }
      rest -= need - this.xpProgress
      this.xpProgress = 0
      this.levelValue++
      this.pendingLevelUps++
      this.pendingChoices.push(this.rollChoices())
      this.emit({ type: 'levelup', level: this.levelValue })
      if (this.levelValue % 3 === 0) this.tryQuote('levelUp')
    }
  }

  // ==================== 武器系统（DESIGN.md §2.6） ====================

  private nearestEnemy(
    x: number,
    y: number,
    maxDist: number,
    exclude: number[] = [],
  ): Enemy | null {
    let best: Enemy | null = null
    let bestD = maxDist * maxDist
    for (const e of this.enemies) {
      if (e.hp <= 0 || exclude.includes(e.id)) continue
      const d = (e.x - x) * (e.x - x) + (e.y - y) * (e.y - y)
      if (d < bestD) {
        bestD = d
        best = e
      }
    }
    return best
  }

  private updateWeapons(dt: number): void {
    for (const w of this.weapons) {
      w.cd -= dt
      if (w.cd > 0) continue
      const def = WEAPON_DEFS[w.id]
      const idx = w.level - 1
      const damage = def.damage[idx]! * this.damageMult
      const count = def.count[idx]!
      const extra = def.extra[idx]!
      const baseCd = def.cooldown[idx]! / this.attackSpeedMult

      switch (w.id) {
        case 'hairball': {
          const target = this.nearestEnemy(this.player.x, this.player.y, 900)
          if (target) {
            for (let i = 0; i < count; i++) {
              const ang =
                Math.atan2(target.y - this.player.y, target.x - this.player.x) +
                (i - (count - 1) / 2) * 0.22
              const proj = this.makeProjectile(
                'hairball',
                'homing',
                damage,
                HAIRBALL_RADIUS,
                0,
                ang,
              )
              proj.vx = Math.cos(ang) * HAIRBALL_SPEED
              proj.vy = Math.sin(ang) * HAIRBALL_SPEED
              proj.turnRate = HAIRBALL_TURN
              proj.life = HAIRBALL_LIFE
              proj.boomRadius = idx === 4 ? extra : 0
              this.projectiles.push(proj)
            }
            w.cd = baseCd
          }
          break
        }
        case 'yarn': {
          // 轨道球由 syncOrbs 维护，此处只防空转
          w.cd = 999
          break
        }
        case 'boomerang': {
          const target = this.nearestEnemy(this.player.x, this.player.y, 800)
          if (target) {
            const baseAng = Math.atan2(target.y - this.player.y, target.x - this.player.x)
            for (let i = 0; i < count; i++) {
              const ang = baseAng + (i - (count - 1) / 2) * 0.3
              const proj = this.makeProjectile(
                'boomerang',
                'boomerang',
                damage,
                BOOMERANG_RADIUS,
                idx === 4 ? -1 : extra,
                ang,
              )
              proj.vx = Math.cos(ang) * BOOMERANG_SPEED
              proj.vy = Math.sin(ang) * BOOMERANG_SPEED
              proj.maxDist = BOOMERANG_RANGE
              proj.traveled = 0
              proj.phase = 'out'
              proj.life = 2.2
              this.projectiles.push(proj)
            }
            w.cd = baseCd
          }
          break
        }
        case 'laser': {
          const targets: Enemy[] = []
          const seen: number[] = []
          for (let i = 0; i < count; i++) {
            const t = this.nearestEnemy(this.player.x, this.player.y, extra || LASER_RANGE, seen)
            if (!t) break
            targets.push(t)
            seen.push(t.id)
          }
          for (const t of targets) {
            const crit = this.random() < this.critChance
            const dmg = damage * (crit ? this.critMult : 1)
            this.damageEnemy(t, dmg, crit, t.x - this.player.x, t.y - this.player.y, 60)
            if (idx === 4) {
              t.burnDps = LASER_BURN_DPS
              t.burnT = LASER_BURN_TIME
            }
            // 光束视觉弹（纯表现，无碰撞）
            const beam = this.makeProjectile(
              'laser',
              'beam',
              0,
              2,
              0,
              Math.atan2(t.y - this.player.y, t.x - this.player.x),
            )
            beam.life = 0.16
            beam.fx = t.x
            beam.fy = t.y
            this.projectiles.push(beam)
          }
          w.cd = baseCd
          break
        }
        case 'fishgun': {
          const target = this.nearestEnemy(this.player.x, this.player.y, 700)
          if (target) {
            const baseAng = Math.atan2(target.y - this.player.y, target.x - this.player.x)
            for (let i = 0; i < count; i++) {
              const ang = baseAng + (i - (count - 1) / 2) * FISHGUN_SPREAD
              const proj = this.makeProjectile(
                'fishgun',
                'straight',
                damage,
                FISHGUN_RADIUS,
                0,
                ang,
              )
              proj.vx = Math.cos(ang) * FISHGUN_SPEED
              proj.vy = Math.sin(ang) * FISHGUN_SPEED
              proj.life = FISHGUN_LIFE
              this.projectiles.push(proj)
            }
            w.cd = baseCd
          }
          break
        }
        case 'litterbomb': {
          for (let i = 0; i < count; i++) {
            const target = this.nearestEnemy(this.player.x, this.player.y, BOMB_PLACE_RANGE)
            let bx: number
            let by: number
            if (target) {
              bx = target.x + (this.random() - 0.5) * 40
              by = target.y + (this.random() - 0.5) * 40
            } else {
              const a = this.random() * Math.PI * 2
              bx = this.player.x + Math.cos(a) * 130
              by = this.player.y + Math.sin(a) * 130
            }
            const bomb = this.makeProjectile('litterbomb', 'bomb', damage, 10, 0, 0)
            bomb.x = Math.max(20, Math.min(WORLD_W - 20, bx))
            bomb.y = Math.max(20, Math.min(WORLD_H - 20, by))
            bomb.fuse = BOMB_FUSE
            bomb.boomRadius = extra
            bomb.spawnZone = idx === 4
            this.projectiles.push(bomb)
          }
          w.cd = baseCd
          break
        }
      }
    }
  }

  private makeProjectile(
    weapon: WeaponId,
    kind: ProjectileKind,
    damage: number,
    radius: number,
    pierce: number,
    angle: number,
  ): Projectile {
    return {
      id: this.nextId++,
      weapon,
      kind,
      x: this.player.x,
      y: this.player.y - 6,
      vx: 0,
      vy: 0,
      damage,
      radius,
      pierce,
      hitIds: [],
      life: 10,
      turnRate: 0,
      angle,
      orbitR: 70,
      hitWindow: ORBIT_HIT_WINDOW,
      phase: 'out',
      maxDist: 0,
      traveled: 0,
      fuse: 0,
      boomRadius: 0,
      spawnZone: false,
      dps: 0,
      zoneTick: 0,
      fx: 0,
      fy: 0,
    }
  }

  // ==================== 弹体 ====================

  private updateProjectiles(dt: number): void {
    const p = this.player
    const dead: Projectile[] = []
    for (const proj of this.projectiles) {
      if (proj.kind !== 'orbit') proj.life -= dt
      if (proj.life <= 0) {
        dead.push(proj)
        continue
      }

      switch (proj.kind) {
        case 'homing': {
          const target = this.nearestEnemy(proj.x, proj.y, 1000, proj.hitIds)
          if (target) {
            const want = Math.atan2(target.y - proj.y, target.x - proj.x)
            const cur = Math.atan2(proj.vy, proj.vx)
            let diff = want - cur
            while (diff > Math.PI) diff -= Math.PI * 2
            while (diff < -Math.PI) diff += Math.PI * 2
            const turn = Math.max(-proj.turnRate * dt, Math.min(proj.turnRate * dt, diff))
            const spd = Math.hypot(proj.vx, proj.vy) || HAIRBALL_SPEED
            const na = cur + turn
            proj.vx = Math.cos(na) * spd
            proj.vy = Math.sin(na) * spd
          }
          proj.x += proj.vx * dt
          proj.y += proj.vy * dt
          this.collide(proj, (e, d, dx, dy) => {
            this.damageEnemy(e, d, this.random() < this.critChance, dx, dy, 90)
            // 满级命中爆炸（DESIGN.md §2.6，除被击目标外的 AoE）
            if (proj.boomRadius > 0 && e.hp > 0) {
              this.emit({ type: 'boom', x: proj.x, y: proj.y, radius: proj.boomRadius })
              for (const o of this.enemies) {
                if (o.id === e.id || o.hp <= 0) continue
                const rr = proj.boomRadius + o.radius
                const ox = o.x - proj.x
                const oy = o.y - proj.y
                if (ox * ox + oy * oy < rr * rr) {
                  this.damageEnemy(o, proj.damage * HAIRBALL_AOE_MULT, false, ox, oy, 130)
                }
              }
            }
          })
          break
        }
        case 'straight': {
          proj.x += proj.vx * dt
          proj.y += proj.vy * dt
          this.collide(proj, (e, d, dx, dy) => {
            this.damageEnemy(e, d, this.random() < this.critChance, dx, dy, 60)
          })
          break
        }
        case 'boomerang': {
          if (proj.phase === 'out') {
            proj.x += proj.vx * dt
            proj.y += proj.vy * dt
            proj.traveled += BOOMERANG_SPEED * dt
            if (proj.traveled >= proj.maxDist) proj.phase = 'back'
          } else {
            const dx = p.x - proj.x
            const dy = p.y - proj.y
            const dist = Math.hypot(dx, dy)
            if (dist < 20) {
              dead.push(proj)
              continue
            }
            proj.x += (dx / dist) * BOOMERANG_RETURN_SPEED * dt
            proj.y += (dy / dist) * BOOMERANG_RETURN_SPEED * dt
          }
          this.collide(proj, (e, d, dx, dy) => {
            this.damageEnemy(e, d, this.random() < this.critChance, dx, dy, 110)
          })
          break
        }
        case 'orbit': {
          proj.hitWindow -= dt
          if (proj.hitWindow <= 0) {
            proj.hitWindow = ORBIT_HIT_WINDOW
            proj.hitIds = []
          }
          proj.angle += ORBIT_SPEED * dt
          proj.x = p.x + Math.cos(proj.angle) * proj.orbitR
          proj.y = p.y - 6 + Math.sin(proj.angle) * proj.orbitR
          for (const e of this.enemies) {
            if (e.hp <= 0 || proj.hitIds.includes(e.id)) continue
            const rr = proj.radius + e.radius
            const dx = e.x - proj.x
            const dy = e.y - proj.y
            if (dx * dx + dy * dy < rr * rr) {
              proj.hitIds.push(e.id)
              const crit = this.random() < this.critChance
              this.damageEnemy(
                e,
                proj.damage * this.damageMult * (crit ? this.critMult : 1),
                crit,
                dx,
                dy,
                70,
              )
            }
          }
          break
        }
        case 'beam': {
          // 纯视觉，等待寿命结束
          break
        }
        case 'bomb': {
          proj.fuse -= dt
          if (proj.fuse <= 0) {
            this.explode(proj)
            dead.push(proj)
          }
          break
        }
        case 'zone': {
          proj.zoneTick -= dt
          if (proj.zoneTick <= 0) {
            proj.zoneTick = ZONE_TICK
            for (const e of this.enemies) {
              if (e.hp <= 0) continue
              const rr = BOMB_ZONE_RADIUS + e.radius
              const dx = e.x - proj.x
              const dy = e.y - proj.y
              if (dx * dx + dy * dy < rr * rr) {
                this.damageEnemy(e, proj.dps * ZONE_TICK, false, dx, dy, 0)
              }
            }
          }
          break
        }
      }
    }
    if (dead.length > 0) {
      const deadIds = new Set(dead.map((d) => d.id))
      this.projectiles = this.projectiles.filter((proj) => !deadIds.has(proj.id))
    }
  }

  private collide(
    proj: Projectile,
    onHit: (enemy: Enemy, damage: number, dx: number, dy: number) => void,
  ): void {
    for (const e of this.enemies) {
      if (e.hp <= 0 || proj.hitIds.includes(e.id)) continue
      const rr = proj.radius + e.radius
      const dx = e.x - proj.x
      const dy = e.y - proj.y
      if (dx * dx + dy * dy < rr * rr) {
        const crit = this.random() < this.critChance
        const dmg = proj.damage * (crit ? this.critMult : 1)
        proj.hitIds.push(e.id)
        onHit(e, dmg, dx, dy)
        if (proj.pierce >= 0) {
          proj.pierce--
          if (proj.pierce < 0) {
            proj.life = 0
            break
          }
        }
      }
    }
  }

  private explode(proj: Projectile): void {
    this.emit({ type: 'boom', x: proj.x, y: proj.y, radius: proj.boomRadius })
    for (const e of this.enemies) {
      if (e.hp <= 0) continue
      const rr = proj.boomRadius + e.radius
      const dx = e.x - proj.x
      const dy = e.y - proj.y
      if (dx * dx + dy * dy < rr * rr) {
        this.damageEnemy(e, proj.damage, this.random() < this.critChance, dx, dy, 150)
      }
    }
    if (proj.spawnZone) {
      const zone = this.makeProjectile('litterbomb', 'zone', 0, 10, 0, 0)
      zone.x = proj.x
      zone.y = proj.y
      zone.dps = BOMB_ZONE_DPS
      zone.life = BOMB_ZONE_LIFE
      zone.zoneTick = 0
      this.projectiles.push(zone)
      this.emit({ type: 'zone', x: proj.x, y: proj.y })
    }
  }

  // ==================== 经验小鱼干（DESIGN.md §2.8） ====================

  private updateGems(dt: number): void {
    const p = this.player
    for (const g of this.gems) {
      g.t += dt
      g.x += g.vx * dt
      g.y += g.vy * dt
      g.vx *= Math.max(0, 1 - 5 * dt)
      g.vy *= Math.max(0, 1 - 5 * dt)
      const dx = p.x - g.x
      const dy = p.y - g.y
      const dist = Math.hypot(dx, dy)
      if (g.magnet || dist < this.pickupRadius) {
        g.magnet = true
        if (dist > 4) {
          const pull = 520
          g.x += (dx / dist) * pull * dt
          g.y += (dy / dist) * pull * dt
        }
      }
      if (g.magnet && dist < 16) {
        g.dead = true
        this.gemsCollected++
        this.gainXp(g.value)
        this.emit({ type: 'collect', x: g.x, y: g.y, value: g.value })
      }
    }
    this.gems = this.gems.filter((g) => !g.dead)
  }
}
