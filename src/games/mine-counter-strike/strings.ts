import type { LocalizedText } from '../shared/types'

// ============================================================
// 游戏内文案（双语，随界面语言；skills/skill-i18n.md）
// 唯一出处：同目录 DESIGN.md v0.1
// ============================================================

export type WeaponId = 'pistol' | 'smg' | 'rifle' | 'machinegun' | 'sniper'
export type SkinId = 'red' | 'blue' | 'yellow' | 'green' | 'purple' | 'orange'
export type MapId = 'shipment' | 'dust' | 'snow' | 'court'

export const mcsStrings = {
  // —— 通用 ——
  title: { zh: '我的反恐精英', en: 'MINECOUNTER-STRIKE' } satisfies LocalizedText,
  tagline: {
    zh: '体素风 5V5 团队死斗',
    en: 'VOXEL 5V5 TEAM DEATHMATCH',
  } satisfies LocalizedText,
  start: { zh: '开始游戏', en: 'START' } satisfies LocalizedText,
  back: { zh: '返回', en: 'BACK' } satisfies LocalizedText,
  resume: { zh: '继续', en: 'RESUME' } satisfies LocalizedText,
  restart: { zh: '重新开始', en: 'RESTART' } satisfies LocalizedText,
  toMenu: { zh: '返回主菜单', en: 'MAIN MENU' } satisfies LocalizedText,
  playAgain: { zh: '再来一局', en: 'PLAY AGAIN' } satisfies LocalizedText,
  paused: { zh: '已暂停', en: 'PAUSED' } satisfies LocalizedText,

  // —— 主菜单：换角色 ——
  charTitle: { zh: '选择角色皮肤', en: 'CHOOSE SKIN' } satisfies LocalizedText,
  charHint: {
    zh: '点击色块换装，点击开始游戏',
    en: 'PICK A COLOR, THEN START',
  } satisfies LocalizedText,

  // —— 皮肤 ——
  skin_red: { zh: '红队红', en: 'TEAM RED' } satisfies LocalizedText,
  skin_blue: { zh: '蓝队蓝', en: 'TEAM BLUE' } satisfies LocalizedText,
  skin_yellow: { zh: '矿工黄', en: 'MINER GOLD' } satisfies LocalizedText,
  skin_green: { zh: '苦力怕绿', en: 'CREEPER GREEN' } satisfies LocalizedText,
  skin_purple: { zh: '末影紫', en: 'ENDER PURPLE' } satisfies LocalizedText,
  skin_orange: { zh: '史莱姆橙', en: 'SLIME ORANGE' } satisfies LocalizedText,

  // —— 选地图 ——
  mapTitle: { zh: '选择地图', en: 'SELECT MAP' } satisfies LocalizedText,
  map_shipment: { zh: '运输船', en: 'SHIPMENT' } satisfies LocalizedText,
  map_dust: { zh: '沙城', en: 'DUST' } satisfies LocalizedText,
  map_snow: { zh: '雪地', en: 'SNOW' } satisfies LocalizedText,
  map_court: { zh: '杂物篮球场', en: 'COURT CLUTTER' } satisfies LocalizedText,
  map_shipment_desc: {
    zh: '货柜码头 · 集装箱密集近战',
    en: 'Container yard · tight CQB',
  } satisfies LocalizedText,
  map_dust_desc: {
    zh: '沙漠小镇 · 中路对狙',
    en: 'Desert town · mid lane',
  } satisfies LocalizedText,
  map_snow_desc: { zh: '雪地仓库 · 中远交火', en: 'Snow yard · mid range' } satisfies LocalizedText,
  map_court_desc: {
    zh: '堆满杂物的室内球场',
    en: 'Indoor court full of clutter',
  } satisfies LocalizedText,

  // —— 载入（30s 选枪） ——
  loadoutTitle: { zh: '选择两把枪', en: 'PICK 2 GUNS' } satisfies LocalizedText,
  loadoutSub: {
    zh: '点选两把枪，或等倒计时归零',
    en: 'Pick two guns, or wait for the timer',
  } satisfies LocalizedText,
  loadoutConfirm: { zh: '确认装备', en: 'LOCK IN' } satisfies LocalizedText,
  loadoutDefault: {
    zh: '默认：步枪 + 手枪',
    en: 'Default: rifle + pistol',
  } satisfies LocalizedText,
  loadoutSlot: { zh: '主武器', en: 'PRIMARY' } satisfies LocalizedText,
  loadoutSlot2: { zh: '副武器', en: 'SECONDARY' } satisfies LocalizedText,
  loadoutPicked: { zh: '已选', en: 'PICKED' } satisfies LocalizedText,

  // —— 枪械 ——
  weapon_pistol: { zh: '手枪', en: 'PISTOL' } satisfies LocalizedText,
  weapon_smg: { zh: '冲锋枪', en: 'SMG' } satisfies LocalizedText,
  weapon_rifle: { zh: '步枪', en: 'RIFLE' } satisfies LocalizedText,
  weapon_machinegun: { zh: '机关枪', en: 'MACHINE GUN' } satisfies LocalizedText,
  weapon_sniper: { zh: '狙击枪', en: 'SNIPER' } satisfies LocalizedText,
  weapon_pistol_desc: {
    zh: '半自动 · 精准 · 灵活',
    en: 'Semi-auto · accurate · agile',
  } satisfies LocalizedText,
  weapon_smg_desc: {
    zh: '高射速 · 近战压制',
    en: 'Fast fire · close range',
  } satisfies LocalizedText,
  weapon_rifle_desc: {
    zh: '全自动 · 均衡全能',
    en: 'Full-auto · all-round',
  } satisfies LocalizedText,
  weapon_machinegun_desc: {
    zh: '百发弹匣 · 火力倾泻',
    en: '100-round mag · suppressive',
  } satisfies LocalizedText,
  weapon_sniper_desc: {
    zh: '一击致命 · 高倍开镜',
    en: 'One shot · high zoom',
  } satisfies LocalizedText,

  // —— HUD ——
  hudReload: { zh: '换弹中…', en: 'RELOADING…' } satisfies LocalizedText,
  hudYou: { zh: '你', en: 'YOU' } satisfies LocalizedText,
  hudRespawn: { zh: '复活倒计时', en: 'RESPAWN IN' } satisfies LocalizedText,
  hudWaitingLoadout: { zh: '等待选枪…', en: 'PICKING GUNS…' } satisfies LocalizedText,
  hudFight: { zh: '战斗开始！', en: 'FIGHT!' } satisfies LocalizedText,
  hudMatchEnd: { zh: '时间到', en: 'TIME UP' } satisfies LocalizedText,

  // —— 结算 ——
  resultVictory: { zh: '胜利！', en: 'VICTORY!' } satisfies LocalizedText,
  resultDefeat: { zh: '战败', en: 'DEFEAT' } satisfies LocalizedText,
  resultDraw: { zh: '平局', en: 'DRAW' } satisfies LocalizedText,
  resultTeam: { zh: '团队比分', en: 'TEAM SCORE' } satisfies LocalizedText,
  resultKills: { zh: '击杀', en: 'KILLS' } satisfies LocalizedText,
  resultAssists: { zh: '助攻', en: 'ASSISTS' } satisfies LocalizedText,
  resultDeaths: { zh: '死亡', en: 'DEATHS' } satisfies LocalizedText,
  resultRank: { zh: '排名', en: 'RANK' } satisfies LocalizedText,
  resultName: { zh: '玩家', en: 'PLAYER' } satisfies LocalizedText,
  resultScore: { zh: '战绩', en: 'SCORE' } satisfies LocalizedText,
  newBest: { zh: '新纪录！', en: 'NEW BEST!' } satisfies LocalizedText,

  // —— 提示 ——
  menuHint: {
    zh: 'WASD 移动 · 鼠标瞄准 · 左键射击 · 右键开镜 · R 换弹 · 1/2 切枪 · P 暂停',
    en: 'WASD MOVE · MOUSE AIM · LMB FIRE · RMB AIM · R RELOAD · 1/2 SWAP · P PAUSE',
  } satisfies LocalizedText,
  clickLock: { zh: '点击画面锁定鼠标', en: 'CLICK TO LOCK MOUSE' } satisfies LocalizedText,
} satisfies Record<string, LocalizedText>

export type McsStringKey = keyof typeof mcsStrings
