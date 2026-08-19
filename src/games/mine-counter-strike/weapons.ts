import type { McsStringKey, SkinId, WeaponId } from './strings'

// ============================================================
// 枪械与皮肤数值 —— 唯一出处：同目录 DESIGN.md v0.1 §5 / §6
// ============================================================

export interface WeaponDef {
  id: WeaponId
  nameKey: McsStringKey
  descKey: McsStringKey
  /** 单发伤害（命中身体） */
  damage: number
  /** 爆头伤害倍率 */
  headshotMult: number
  /** 射速间隔（秒） */
  fireInterval: number
  /** 是否全自动 */
  auto: boolean
  /** 弹匣容量 */
  magSize: number
  /** 换弹时长（秒） */
  reloadTime: number
  /** 腰射散布（弧度，单侧） */
  spreadHip: number
  /** 开镜散布（弧度，单侧） */
  spreadAds: number
  /** 射程（世界单位） */
  range: number
  /** 开镜缩放：相机平面缩放系数（越小放大越多） */
  adsZoom: number
  /** 移动速度系数 */
  moveSpeedMult: number
  /** 单次后坐俯仰冲击（渲染用，弧度） */
  recoilKick: number
}

export const WEAPONS: WeaponDef[] = [
  {
    id: 'pistol',
    nameKey: 'weapon_pistol',
    descKey: 'weapon_pistol_desc',
    damage: 25,
    headshotMult: 2.0,
    fireInterval: 0.22,
    auto: false,
    magSize: 12,
    reloadTime: 1.2,
    spreadHip: 0.016,
    spreadAds: 0.007,
    range: 40,
    adsZoom: 0.82,
    moveSpeedMult: 1.0,
    recoilKick: 0.012,
  },
  {
    id: 'smg',
    nameKey: 'weapon_smg',
    descKey: 'weapon_smg_desc',
    damage: 14,
    headshotMult: 2.0,
    fireInterval: 0.075,
    auto: true,
    magSize: 30,
    reloadTime: 1.6,
    spreadHip: 0.055,
    spreadAds: 0.022,
    range: 30,
    adsZoom: 0.88,
    moveSpeedMult: 0.96,
    recoilKick: 0.008,
  },
  {
    id: 'rifle',
    nameKey: 'weapon_rifle',
    descKey: 'weapon_rifle_desc',
    damage: 22,
    headshotMult: 2.0,
    fireInterval: 0.105,
    auto: true,
    magSize: 30,
    reloadTime: 1.8,
    spreadHip: 0.034,
    spreadAds: 0.013,
    range: 45,
    adsZoom: 0.76,
    moveSpeedMult: 0.92,
    recoilKick: 0.01,
  },
  {
    id: 'machinegun',
    nameKey: 'weapon_machinegun',
    descKey: 'weapon_machinegun_desc',
    damage: 16,
    headshotMult: 2.0,
    fireInterval: 0.062,
    auto: true,
    magSize: 100,
    reloadTime: 3.0,
    spreadHip: 0.085,
    spreadAds: 0.032,
    range: 35,
    adsZoom: 0.9,
    moveSpeedMult: 0.8,
    recoilKick: 0.006,
  },
  {
    id: 'sniper',
    nameKey: 'weapon_sniper',
    descKey: 'weapon_sniper_desc',
    damage: 90,
    headshotMult: 2.5,
    fireInterval: 1.1,
    auto: false,
    magSize: 5,
    reloadTime: 2.2,
    spreadHip: 0.004,
    spreadAds: 0.0008,
    range: 100,
    adsZoom: 0.34,
    moveSpeedMult: 0.85,
    recoilKick: 0.03,
  },
]

export const WEAPON_INDEX: Record<WeaponId, WeaponDef> = Object.fromEntries(
  WEAPONS.map((w) => [w.id, w]),
) as Record<WeaponId, WeaponDef>

export interface SkinDef {
  id: SkinId
  nameKey: McsStringKey
  /** 主色（头/躯干） */
  color: string
  /** 深一档（描边/四肢阴影） */
  dark: string
}

export const SKINS: SkinDef[] = [
  { id: 'red', nameKey: 'skin_red', color: '#e62429', dark: '#a31217' },
  { id: 'blue', nameKey: 'skin_blue', color: '#0074e4', dark: '#005ab4' },
  { id: 'yellow', nameKey: 'skin_yellow', color: '#ffd700', dark: '#c9a900' },
  { id: 'green', nameKey: 'skin_green', color: '#4dbf4d', dark: '#2e8b2e' },
  { id: 'purple', nameKey: 'skin_purple', color: '#8b3fbf', dark: '#6a2d99' },
  { id: 'orange', nameKey: 'skin_orange', color: '#f78c00', dark: '#c57600' },
]

export const SKIN_INDEX: Record<SkinId, SkinDef> = Object.fromEntries(
  SKINS.map((s) => [s.id, s]),
) as Record<SkinId, SkinDef>
