// ============================================================
// 幸存者小黑（SurvivorBlacky）—— 纯逻辑引擎（决策 #25）
// 唯一出处：同目录 DESIGN.md v1.2
// 无 DOM / 无 React：可注入随机源，node 直跑可测（engine.test.ts）
// v1.2：三大关（绿茵牧场/沙漠集市/月光森林）+ 武器进化 + 收割感数值
// ============================================================

export type Rng = () => number

// —— 常量（DESIGN.md v1.2 §2/§3） ——
export const WORLD_W = 960
export const WORLD_H = 540
export const WAVE_COUNT = 10
export const WAVE_DURATION = 25
export const MAX_ENEMIES = 320
export const MAX_GEMS = 300
export const PLAYER_RADIUS = 12
export const PLAYER_INVULN = 0.75
export const STAGE_COUNT = 3

export type EnemyKindId =
  | 'pig'
  | 'chicken'
  | 'dog'
  | 'pigeon'
  | 'camel'
  | 'scorpion'
  | 'vulture'
  | 'cobra'
  | 'bat'
  | 'boar'
  | 'wolf'
  | 'owl'
export type SpawnKind =
  EnemyKindId | 'minipigeon' | 'miniscorpion' | 'minibat' | 'pigeonking' | 'camelking' | 'wolfking'
export type EnemyTier = 'normal' | 'elite' | 'boss'
export type WeaponId = 'hairball' | 'yarn' | 'boomerang' | 'laser' | 'fishgun' | 'litterbomb'
export type PassiveId = 'canned' | 'teaser' | 'fur' | 'claws' | 'coffee' | 'milk' | 'catnip' | 'box'
export type GamePhase = 'menu' | 'playing' | 'paused' | 'over'

// —— 敌人基础数值（DESIGN.md v1.2 §2.5/§3.2） ——
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
    xp: 2,
    wobbleFreq: 1.2,
    wobbleAmp: 0.35,
    knockResist: 0.4,
  },
  chicken: {
    hp: 10,
    damage: 6,
    speed: 82,
    radius: 11,
    xp: 2,
    wobbleFreq: 5.2,
    wobbleAmp: 0.9,
    knockResist: 0.5,
  },
  dog: {
    hp: 16,
    damage: 10,
    speed: 104,
    radius: 14,
    xp: 3,
    wobbleFreq: 2.4,
    wobbleAmp: 0.3,
    knockResist: 0.3,
  },
  pigeon: {
    hp: 46,
    damage: 14,
    speed: 34,
    radius: 19,
    xp: 6,
    wobbleFreq: 1.8,
    wobbleAmp: 0.55,
    knockResist: 0.5,
  },
  camel: {
    hp: 55,
    damage: 16,
    speed: 30,
    radius: 22,
    xp: 6,
    wobbleFreq: 0.8,
    wobbleAmp: 0.3,
    knockResist: 0.6,
  },
  scorpion: {
    hp: 12,
    damage: 7,
    speed: 100,
    radius: 10,
    xp: 2,
    wobbleFreq: 6,
    wobbleAmp: 0.8,
    knockResist: 0.5,
  },
  vulture: {
    hp: 18,
    damage: 9,
    speed: 120,
    radius: 13,
    xp: 3,
    wobbleFreq: 3,
    wobbleAmp: 0.5,
    knockResist: 0.5,
  },
  cobra: {
    hp: 24,
    damage: 12,
    speed: 70,
    radius: 13,
    xp: 4,
    wobbleFreq: 4,
    wobbleAmp: 0.7,
    knockResist: 0.5,
  },
  bat: {
    hp: 8,
    damage: 5,
    speed: 135,
    radius: 8,
    xp: 1,
    wobbleFreq: 8,
    wobbleAmp: 1,
    knockResist: 0.5,
  },
  boar: {
    hp: 60,
    damage: 15,
    speed: 42,
    radius: 20,
    xp: 6,
    wobbleFreq: 1,
    wobbleAmp: 0.3,
    knockResist: 0.6,
  },
  wolf: {
    hp: 26,
    damage: 12,
    speed: 118,
    radius: 14,
    xp: 4,
    wobbleFreq: 2.5,
    wobbleAmp: 0.4,
    knockResist: 0.3,
  },
  owl: {
    hp: 34,
    damage: 10,
    speed: 38,
    radius: 15,
    xp: 5,
    wobbleFreq: 2,
    wobbleAmp: 0.5,
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
  miniscorpion: {
    hp: 10,
    damage: 6,
    speed: 95,
    radius: 8,
    xp: 1,
    wobbleFreq: 6.5,
    wobbleAmp: 0.9,
    knockResist: 0.5,
  },
  minibat: {
    hp: 6,
    damage: 4,
    speed: 130,
    radius: 7,
    xp: 1,
    wobbleFreq: 9,
    wobbleAmp: 1,
    knockResist: 0.5,
  },
  pigeonking: {
    hp: 3200,
    damage: 24,
    speed: 30,
    radius: 42,
    xp: 60,
    wobbleFreq: 0.7,
    wobbleAmp: 0.25,
    knockResist: 1,
  },
  camelking: {
    hp: 3400,
    damage: 24,
    speed: 26,
    radius: 40,
    xp: 60,
    wobbleFreq: 0.6,
    wobbleAmp: 0.25,
    knockResist: 1,
  },
  wolfking: {
    hp: 4000,
    damage: 26,
    speed: 44,
    radius: 40,
    xp: 60,
    wobbleFreq: 0.9,
    wobbleAmp: 0.3,
    knockResist: 1,
  },
}

// —— 大关定义（DESIGN.md v1.2 §3） ——
export interface StageDef {
  id: string
  index: number
  /** 每波出怪权重（10 波 × 4 敌） */
  weights: [number, number, number, number][]
  enemies: EnemyKindId[]
  eliteChance: number[]
  boss: SpawnKind
  bossMinion: SpawnKind
}

export const STAGE_DEFS: StageDef[] = [
  {
    id: 'stage1',
    index: 1,
    enemies: ['pig', 'chicken', 'dog', 'pigeon'],
    weights: [
      [1, 0, 0, 0],
      [0.3, 0.5, 0.2, 0],
      [0.3, 0.2, 0.5, 0],
      [0.25, 0.3, 0, 0.45],
      [0.25, 0.25, 0.25, 0.25],
      [0.4, 0.2, 0.4, 0],
      [0, 0.15, 0.25, 0.6],
      [0.15, 0.4, 0.45, 0],
      [0.25, 0.25, 0.25, 0.25],
      [0.3, 0.2, 0.3, 0.2],
    ],
    eliteChance: [0, 0, 0, 0.08, 0.1, 0.12, 0.15, 0.18, 0.2, 0.22],
    boss: 'pigeonking',
    bossMinion: 'minipigeon',
  },
  {
    id: 'stage2',
    index: 2,
    enemies: ['camel', 'scorpion', 'vulture', 'cobra'],
    weights: [
      [0, 0.6, 0, 0.4],
      [0.2, 0.5, 0, 0.3],
      [0, 0.4, 0.4, 0.2],
      [0.4, 0, 0.25, 0.35],
      [0.25, 0.25, 0.25, 0.25],
      [0.25, 0, 0.35, 0.4],
      [0.5, 0.2, 0, 0.3],
      [0, 0.4, 0.45, 0.15],
      [0.25, 0.25, 0.25, 0.25],
      [0.4, 0.2, 0.2, 0.2],
    ],
    eliteChance: [0, 0, 0, 0.08, 0.1, 0.12, 0.15, 0.18, 0.2, 0.22],
    boss: 'camelking',
    bossMinion: 'miniscorpion',
  },
  {
    id: 'stage3',
    index: 3,
    enemies: ['bat', 'boar', 'wolf', 'owl'],
    weights: [
      [0.6, 0, 0.4, 0],
      [0.5, 0, 0.2, 0.3],
      [0.3, 0.2, 0.5, 0],
      [0.25, 0.35, 0, 0.4],
      [0.25, 0.25, 0.25, 0.25],
      [0.2, 0.4, 0.4, 0],
      [0, 0.3, 0.5, 0.2],
      [0.45, 0.15, 0, 0.4],
      [0.25, 0.25, 0.25, 0.25],
      [0.3, 0.3, 0.3, 0.1],
    ],
    eliteChance: [0, 0, 0, 0.08, 0.1, 0.12, 0.15, 0.18, 0.2, 0.22],
    boss: 'wolfking',
    bossMinion: 'minibat',
  },
]

export const waveBudget = (wave: number): number => 24 + 18 * (wave - 1)
export const waveSpawnInterval = (wave: number): number => Math.max(0.24, 0.9 - 0.07 * (wave - 1))
// 收割曲线：敌人 HP 增长放缓，玩家 DPS 在中后期反超（DESIGN v1.2 §2.5）
export const hpScale = (wave: number, minute: number): number =>
  1 + 0.1 * (wave - 1) + 0.04 * minute
export const damageScale = (wave: number): number => 1 + 0.03 * (wave - 1)
export const speedScale = (wave: number): number => 1 + 0.02 * (wave - 1)

// —— 武器数值表（DESIGN.md v1.2 §2.3；每级 ×1.4 递进） ——
export interface WeaponDef {
  damage: number[]
  cooldown: number[]
  count: number[]
  extra: number[]
}

export const WEAPON_DEFS: Record<WeaponId, WeaponDef> = {
  hairball: {
    damage: [14, 20, 28, 40, 56],
    cooldown: [1.1, 1.0, 0.9, 0.8, 0.7],
    count: [1, 2, 2, 3, 3],
    extra: [0, 0, 0, 0, 46],
  },
  yarn: {
    damage: [9, 13, 18, 26, 36],
    cooldown: [0, 0, 0, 0, 0],
    count: [1, 2, 3, 4, 4],
    extra: [70, 70, 70, 70, 70],
  },
  boomerang: {
    damage: [16, 22, 31, 43, 60],
    cooldown: [1.6, 1.5, 1.4, 1.3, 1.2],
    count: [1, 1, 1, 2, 2],
    extra: [2, 3, 4, 5, -1],
  },
  laser: {
    damage: [12, 17, 24, 34, 48],
    cooldown: [1.5, 1.4, 1.3, 1.2, 1.1],
    count: [1, 2, 3, 4, 5],
    extra: [520, 520, 520, 520, 520],
  },
  fishgun: {
    damage: [7, 10, 14, 20, 28],
    cooldown: [0.42, 0.38, 0.34, 0.3, 0.26],
    count: [1, 2, 2, 3, 3],
    extra: [0, 0, 0, 0, 0],
  },
  litterbomb: {
    damage: [20, 28, 39, 55, 77],
    cooldown: [3.2, 3.0, 2.8, 2.6, 2.4],
    count: [1, 1, 2, 2, 3],
    extra: [60, 66, 72, 78, 85],
  },
}

// —— 进化（DESIGN.md v1.2 §2.3：武器满级 + 配对被动满级 = Lv6 进化） ——
export interface EvolutionDef {
  weapon: WeaponId
  passive: PassiveId
  damage: number
  cooldown: number
  count: number
  extra: number
  flags: string[]
}

export const EVOLUTIONS: EvolutionDef[] = [
  {
    weapon: 'hairball',
    passive: 'claws',
    damage: 110,
    cooldown: 0.5,
    count: 6,
    extra: 80,
    flags: ['fastTurn'],
  },
  {
    weapon: 'yarn',
    passive: 'coffee',
    damage: 55,
    cooldown: 0,
    count: 8,
    extra: 95,
    flags: ['fastOrbit'],
  },
  {
    weapon: 'boomerang',
    passive: 'catnip',
    damage: 95,
    cooldown: 1.0,
    count: 4,
    extra: -1,
    flags: ['allPierce', 'crit20'],
  },
  {
    weapon: 'laser',
    passive: 'catnip',
    damage: 80,
    cooldown: 1.0,
    count: 8,
    extra: 560,
    flags: ['burn2', 'beamLong'],
  },
  {
    weapon: 'fishgun',
    passive: 'coffee',
    damage: 40,
    cooldown: 0.13,
    count: 5,
    extra: 0,
    flags: ['pierce1'],
  },
  {
    weapon: 'litterbomb',
    passive: 'box',
    damage: 120,
    cooldown: 2.4,
    count: 5,
    extra: 120,
    flags: ['zoneLong'],
  },
]

export const WEAPON_MAX_LEVEL = 5
export const EVOLVED_LEVEL = 6
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
export const WAVE10_TRICKLE_INTERVAL = 2.2
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
  critBonus: number
  zoneLong: boolean
  orbitSpeed: number
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
  evolved: boolean
}

export type UpgradeOption =
  | { kind: 'weapon'; id: WeaponId; nextLevel: number }
  | { kind: 'passive'; id: PassiveId; nextLevel: number }
  | { kind: 'heal'; amount: number }

export type QuoteKey = 'start' | 'boss' | 'lowHp' | 'levelUp' | 'victory' | 'evolve'

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
  | { type: 'evolve'; weapon: WeaponId }
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

  stage = 1
  wave = 1
  waveTime = 0
  survived = 0
  kills = 0
  waveCompleted = 0
  bossKilled = 0
  gemsCollected = 0
  hitsTaken = 0

  pendingLevelUps = 0
  pendingChoices: UpgradeOption[][] = []

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

  get stageDef(): StageDef {
    return STAGE_DEFS[Math.min(this.stage, STAGE_COUNT) - 1]!
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
    const winBonus = this.outcome === 'win' ? 500 * this.stage : 0
    return (
      this.kills * 10 +
      Math.floor(this.survived) +
      this.waveCompleted * 50 +
      this.bossKilled * 500 +
      winBonus
    )
  }

  get boss(): Enemy | null {
    return this.enemies.find((e) => e.kind === this.stageDef.boss) ?? null
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
    return 5 + 3 * (this.levelValue - 1)
  }

  // ==================== 生命周期 ====================

  setStage(stage: number): void {
    this.stage = Math.max(1, Math.min(STAGE_COUNT, stage))
  }

  startRun(): void {
    this.phase = 'playing'
    this.outcome = null
    this.deathCause = 'unknown'
    this.player = this.freshPlayer()
    this.enemies = []
    this.projectiles = []
    this.gems = []
    this.weapons = [{ id: 'hairball', level: 1, cd: 0.4, evolved: false }]
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
    this.spawnTimer = 0.6
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

  // ==================== 属性计算（DESIGN.md v1.2 §2.4） ====================

  computeStats(): void {
    const p = this.passiveLevels
    this.player.maxHp = 100 + 18 * p.canned
    this.speed = 165 * (1 + 0.08 * p.teaser)
    this.armor = p.fur + (p.fur >= PASSIVE_MAX_LEVEL ? 1 : 0)
    this.damageMult = 1 + 0.1 * p.claws + (p.claws >= PASSIVE_MAX_LEVEL ? 0.1 : 0)
    this.attackSpeedMult = 1 + 0.1 * p.coffee + (p.coffee >= PASSIVE_MAX_LEVEL ? 0.1 : 0)
    this.critChance = 0.05 + 0.08 * p.catnip
    this.critMult = p.catnip >= PASSIVE_MAX_LEVEL ? 2.5 : 2
    this.pickupRadius = p.milk >= PASSIVE_MAX_LEVEL ? 9999 : 90 * (1 + 0.25 * p.milk)
    this.xpMult = 1 + 0.12 * p.box + (p.box >= PASSIVE_MAX_LEVEL ? 0.12 : 0)
    this.regen = p.canned >= PASSIVE_MAX_LEVEL ? 1 : 0
  }

  // ==================== 进化（DESIGN.md v1.2 §2.3） ====================

  private tryEvolve(): void {
    for (const evo of EVOLUTIONS) {
      const weapon = this.weapons.find((w) => w.id === evo.weapon)
      if (!weapon || weapon.evolved || weapon.level < WEAPON_MAX_LEVEL) continue
      if (this.passiveLevels[evo.passive] < PASSIVE_MAX_LEVEL) continue
      weapon.evolved = true
      weapon.level = EVOLVED_LEVEL
      this.emit({ type: 'evolve', weapon: weapon.id })
      this.tryQuote('evolve')
      if (weapon.id === 'yarn') this.syncOrbs()
    }
  }

  // ==================== 升级三选一（DESIGN.md v1.2 §2.2） ====================

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
      else if (!owned.evolved && owned.level < WEAPON_MAX_LEVEL) {
        options.push({ kind: 'weapon', id, nextLevel: owned.level + 1 })
      }
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
    const unowned = options.filter((o) => o.kind === 'weapon' && o.nextLevel === 1)
    const hasNewWeapon = picked.some((o) => o.kind === 'weapon' && o.nextLevel === 1)
    if (this.levelValue <= 3 && !hasNewWeapon && unowned.length > 0) {
      const replacement = unowned[Math.floor(this.random() * unowned.length)]!
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
      else this.weapons.push({ id: option.id, level: option.nextLevel, cd: 0.3, evolved: false })
      this.syncOrbs()
    } else if (option.kind === 'passive') {
      const before = this.passiveLevels[option.id]
      this.passiveLevels[option.id] = option.nextLevel
      const gained = option.nextLevel - before
      if (option.id === 'canned') {
        this.player.maxHp += 18 * gained
        this.player.hp = Math.min(this.player.maxHp, this.player.hp + 18 * gained)
      }
      this.computeStats()
    } else {
      this.player.hp = Math.min(
        this.player.maxHp,
        this.player.hp + option.amount * this.player.maxHp,
      )
    }
    this.tryEvolve()
  }

  private syncOrbs(): void {
    const yarnWeapon = this.weapons.find((w) => w.id === 'yarn')
    const want = yarnWeapon
      ? yarnWeapon.evolved
        ? EVOLUTIONS[1]!.count
        : WEAPON_DEFS.yarn.count[yarnWeapon.level - 1]!
      : 0
    const orbs = this.projectiles.filter((p) => p.kind === 'orbit')
    while (orbs.length > want) {
      const last = orbs.pop()
      if (last) this.projectiles.splice(this.projectiles.indexOf(last), 1)
    }
    while (orbs.length < want) {
      const yw = yarnWeapon ?? { id: 'yarn' as WeaponId, level: 1, cd: 0, evolved: false }
      const stats = this.weaponStats(yw)
      const orb = this.makeProjectile('yarn', 'orbit', stats.damage, 8, -1, 0)
      orb.orbitR = stats.extra
      orb.orbitSpeed = yw.evolved ? 4.2 : ORBIT_SPEED
      this.projectiles.push(orb)
      orbs.push(orb)
    }
    if (orbs.length > 0) {
      for (let i = 0; i < orbs.length; i++) {
        orbs[i]!.angle = (i / orbs.length) * Math.PI * 2
      }
    }
  }

  /** 武器当前数值（进化态取 EVOLUTIONS 表，DESIGN v1.2 §2.3） */
  weaponStats(w: WeaponState): {
    damage: number
    cooldown: number
    count: number
    extra: number
    flags: string[]
  } {
    if (w.evolved) {
      const evo = EVOLUTIONS.find((e) => e.weapon === w.id)!
      return {
        damage: evo.damage,
        cooldown: evo.cooldown,
        count: evo.count,
        extra: evo.extra,
        flags: evo.flags,
      }
    }
    const def = WEAPON_DEFS[w.id]
    const idx = Math.max(0, Math.min(WEAPON_MAX_LEVEL - 1, w.level - 1))
    return {
      damage: def.damage[idx]!,
      cooldown: def.cooldown[idx]!,
      count: def.count[idx]!,
      extra: def.extra[idx]!,
      flags: [],
    }
  }

  // ==================== 主循环 ====================

  tick(dt: number): void {
    if (dt <= 0) return
    if (this.phase !== 'playing' || this.pendingLevelUps > 0) return

    this.survived += dt
    this.quoteT = Math.max(0, this.quoteT - dt)

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

    if (this.wave >= WAVE_COUNT && !this.bossSpawned) {
      this.bossSpawned = true
      this.spawnEnemy(this.stageDef.boss, false)
      for (let i = 0; i < 10; i++) this.spawnEnemy(this.stageDef.enemies[0]!, false)
      this.emit({ type: 'boss' })
      this.tryQuote('boss')
    }

    this.updatePlayer(dt)
    this.updateSpawning(dt)
    this.updateEnemies(dt)
    this.updateWeapons(dt)
    this.updateProjectiles(dt)
    this.updateGems(dt)

    if (this.phase === 'playing') {
      if (this.player.hp <= 0) {
        this.player.hp = 0
        this.finish('lose', this.deathCause)
      } else if (this.bossKilled > 0) {
        this.finish('win', this.stageDef.boss)
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

  // ==================== 出怪（DESIGN.md v1.2 §2.5/§3.3） ====================

  private pickSpawnKind(): SpawnKind {
    if (this.wave >= WAVE_COUNT) {
      return this.trickleAlternate ? this.stageDef.enemies[0]! : this.stageDef.enemies[1]!
    }
    const weights = this.stageDef.weights[Math.min(this.wave, WAVE_COUNT) - 1]!
    const total = weights[0] + weights[1] + weights[2] + weights[3]
    let roll = this.random() * total
    for (let i = 0; i < 4; i++) {
      roll -= weights[i]
      if (roll <= 0) return this.stageDef.enemies[i]!
    }
    return this.stageDef.enemies[0]!
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

  /** 公开出怪入口（测试/调试用；正式流程经 updateSpawning 调用） */
  spawnEnemy(kind: SpawnKind, rollElite: boolean): Enemy {
    const def = ENEMY_DEFS[kind]
    const minute = Math.floor(this.survived / 60)
    const tier: EnemyTier =
      kind === this.stageDef.boss
        ? 'boss'
        : rollElite &&
            this.random() < this.stageDef.eliteChance[Math.min(this.wave, WAVE_COUNT) - 1]!
          ? 'elite'
          : 'normal'
    const elite = tier === 'elite'
    const isBoss = kind === this.stageDef.boss
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

      if (e.kind === this.stageDef.boss) {
        e.bossTimer -= dt
        if (e.bossTimer <= 0) {
          e.bossTimer = BOSS_MINION_INTERVAL
          for (let i = 0; i < BOSS_MINION_COUNT; i++) {
            const a = this.random() * Math.PI * 2
            const m = this.spawnEnemy(this.stageDef.bossMinion, false)
            m.x = e.x + Math.cos(a) * (e.radius + 26)
            m.y = e.y + Math.sin(a) * (e.radius + 26)
          }
        }
      }

      const hitDist = e.radius + PLAYER_RADIUS
      if (dist < hitDist && p.invuln <= 0 && p.hp > 0) {
        const amount = Math.max(1, Math.round(e.damage - this.armor))
        p.hp -= amount
        this.hitsTaken++
        p.invuln = PLAYER_INVULN
        p.hurtT = 0.25
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
    if (e.kind === this.stageDef.boss) this.bossKilled++
    // 大珠制：每敌 1 颗小鱼干，价值 = 敌人经验（DESIGN v1.2 §2.2）
    if (this.gems.length >= MAX_GEMS) {
      const oldest = this.gems.shift()
      if (oldest) this.gainXp(oldest.value)
    }
    const a = this.random() * Math.PI * 2
    const sp = 40 + this.random() * 60
    this.gems.push({
      x: e.x,
      y: e.y,
      value: e.xp,
      vx: Math.cos(a) * sp,
      vy: Math.sin(a) * sp,
      magnet: false,
      t: 0,
    })
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

  // ==================== 武器系统（DESIGN.md v1.2 §2.3） ====================

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

  private critFor(critBonus: number): boolean {
    return this.random() < this.critChance + critBonus
  }

  private updateWeapons(dt: number): void {
    for (const w of this.weapons) {
      w.cd -= dt
      if (w.cd > 0) continue
      const stats = this.weaponStats(w)
      const damage = stats.damage * this.damageMult
      const count = stats.count
      const extra = stats.extra
      const flags = stats.flags
      const baseCd = (stats.cooldown || 0.0001) / this.attackSpeedMult
      const critBonus = flags.includes('crit20') ? 0.2 : 0

      switch (w.id) {
        case 'hairball': {
          const target = this.nearestEnemy(this.player.x, this.player.y, 900)
          if (target) {
            for (let i = 0; i < count; i++) {
              const ang =
                Math.atan2(target.y - this.player.y, target.x - this.player.x) +
                (i - (count - 1) / 2) * 0.18
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
              proj.turnRate = flags.includes('fastTurn') ? HAIRBALL_TURN * 1.6 : HAIRBALL_TURN
              proj.life = HAIRBALL_LIFE
              proj.boomRadius = extra > 0 ? extra : 0
              this.projectiles.push(proj)
            }
            w.cd = baseCd
          }
          break
        }
        case 'yarn': {
          w.cd = 999
          break
        }
        case 'boomerang': {
          const target = this.nearestEnemy(this.player.x, this.player.y, 800)
          if (target) {
            const baseAng = Math.atan2(target.y - this.player.y, target.x - this.player.x)
            for (let i = 0; i < count; i++) {
              const ang = baseAng + (i - (count - 1) / 2) * 0.25
              const proj = this.makeProjectile(
                'boomerang',
                'boomerang',
                damage,
                BOOMERANG_RADIUS,
                extra < 0 ? -1 : extra,
                ang,
              )
              proj.vx = Math.cos(ang) * BOOMERANG_SPEED
              proj.vy = Math.sin(ang) * BOOMERANG_SPEED
              proj.maxDist = BOOMERANG_RANGE
              proj.traveled = 0
              proj.phase = 'out'
              proj.life = 2.2
              proj.critBonus = critBonus
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
            const crit = this.critFor(critBonus)
            const dmg = damage * (crit ? this.critMult : 1)
            this.damageEnemy(t, dmg, crit, t.x - this.player.x, t.y - this.player.y, 60)
            if (w.level >= WEAPON_MAX_LEVEL) {
              t.burnDps = flags.includes('burn2') ? LASER_BURN_DPS * 2 : LASER_BURN_DPS
              t.burnT = flags.includes('burn2') ? LASER_BURN_TIME * 1.5 : LASER_BURN_TIME
            }
            const beam = this.makeProjectile(
              'laser',
              'beam',
              0,
              2,
              0,
              Math.atan2(t.y - this.player.y, t.x - this.player.x),
            )
            beam.life = flags.includes('beamLong') ? 0.3 : 0.16
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
                flags.includes('pierce1') ? 1 : 0,
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
            bomb.spawnZone = w.level >= WEAPON_MAX_LEVEL
            bomb.zoneLong = flags.includes('zoneLong')
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
      critBonus: 0,
      zoneLong: false,
      orbitSpeed: ORBIT_SPEED,
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
            this.damageEnemy(e, d, this.critFor(proj.critBonus), dx, dy, 90)
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
            this.damageEnemy(e, d, this.critFor(proj.critBonus), dx, dy, 60)
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
            this.damageEnemy(e, d, this.critFor(proj.critBonus), dx, dy, 110)
          })
          break
        }
        case 'orbit': {
          proj.hitWindow -= dt
          if (proj.hitWindow <= 0) {
            proj.hitWindow = ORBIT_HIT_WINDOW
            proj.hitIds = []
          }
          proj.angle += proj.orbitSpeed * dt
          proj.x = p.x + Math.cos(proj.angle) * proj.orbitR
          proj.y = p.y - 6 + Math.sin(proj.angle) * proj.orbitR
          for (const e of this.enemies) {
            if (e.hp <= 0 || proj.hitIds.includes(e.id)) continue
            const rr = proj.radius + e.radius
            const dx = e.x - proj.x
            const dy = e.y - proj.y
            if (dx * dx + dy * dy < rr * rr) {
              proj.hitIds.push(e.id)
              const crit = this.critFor(proj.critBonus)
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
        const crit = this.critFor(proj.critBonus)
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
        this.damageEnemy(e, proj.damage, this.critFor(proj.critBonus), dx, dy, 150)
      }
    }
    if (proj.spawnZone) {
      const zone = this.makeProjectile('litterbomb', 'zone', 0, 10, 0, 0)
      zone.x = proj.x
      zone.y = proj.y
      zone.dps = BOMB_ZONE_DPS
      zone.life = proj.zoneLong ? 8 : BOMB_ZONE_LIFE
      zone.zoneTick = 0
      this.projectiles.push(zone)
      this.emit({ type: 'zone', x: proj.x, y: proj.y })
    }
  }

  // ==================== 经验小鱼干（DESIGN.md v1.2 §2.2 大珠制） ====================

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
