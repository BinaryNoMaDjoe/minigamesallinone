import type { GameManifest } from '../shared/types'
import cover from './cover.svg'
import coverPortrait from './cover-portrait.svg'

// ============================================================
// MineCounter-Strike —— 体素风 FPS（第四个正式游戏）
// 游戏级规范见同目录 DESIGN.md；双语字段 zh/en 缺一不可
// ============================================================

const manifest: GameManifest = {
  id: 'mine-counter-strike',
  name: {
    zh: '我的反恐精英',
    en: 'MINECOUNTER-STRIKE',
  },
  description: {
    zh: 'Minecraft 体素风第一人称射击：5V5 团队死斗，五类枪械、六组皮肤、四张地图，腰射开镜、换弹切枪，5 分钟定胜负。',
    en: 'A voxel first-person shooter in the spirit of Minecraft: 5v5 team deathmatch, five gun classes, six skins, four maps, hip-fire and ADS, reload and swap, decided in 5 minutes.',
  },
  category: 'arcade',
  theme: {
    // 出处：design-language.md §2.1 Action Red（#E62429，射击游戏准星/红队主题）
    accent: 'var(--primary-container)',
  },
  aspect: { width: 16, height: 9 },
  supportsPause: true,
  howTo: {
    zh: 'WASD/方向键移动，鼠标瞄准（点击画面锁定），左键射击、右键开镜、R 换弹、1/2 或滚轮切枪、P 暂停。流程：换皮肤 → 选地图 → 30 秒选两把枪 → 5V5 团队死斗。触屏：左半拖动移动、右半拖动瞄准、下方按钮射击/开镜/换弹/切枪。',
    en: 'WASD/arrows move, mouse aim (click to lock), LMB fire, RMB aim, R reload, 1/2 or wheel to swap, P pause. Flow: pick skin → pick map → pick 2 guns in 30s → 5v5 team deathmatch. Touch: drag left half to move, right half to aim, buttons to fire/aim/reload/swap.',
  },
  cover,
  coverPortrait,
}

export default manifest
