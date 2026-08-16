import type { GameManifest } from '../shared/types'
import cover from './cover.svg'
import coverPortrait from './cover-portrait.svg'

// ============================================================
// 幸存者小黑（SurvivorBlacky）—— 第三个正式游戏
// 游戏级规范见同目录 DESIGN.md；双语字段 zh/en 缺一不可
// ============================================================

const manifest: GameManifest = {
  id: 'survivor-blacky',
  name: {
    zh: '幸存者小黑',
    en: 'SURVIVOR BLACKY',
  },
  description: {
    zh: '三渲二美漫风的吸血鬼幸存者式肉鸽：操控小黑猫自动战斗，吃小鱼干升级三选一，活过 10 波击败鸽子王。',
    en: 'A cel-shaded comic roguelike in the vein of Vampire Survivors: your cat auto-fights, dried fish levels you up, survive 10 waves and beat the Pigeon King.',
  },
  category: 'arcade',
  theme: {
    // 出处：design-language.md §2.1 Hero Yellow（#FFD700，呼应小黑猫的黄色眼珠）
    accent: 'var(--tertiary-fixed-dim)',
  },
  aspect: { width: 16, height: 10 },
  supportsPause: true,
  howTo: {
    zh: '自动攻击，走位生存！WASD/方向键移动，吃小鱼干升级（1/2/3 三选一），P 暂停。触屏：按住拖动 = 虚拟摇杆。活过 10 波击败鸽子王。',
    en: 'Weapons fire on their own - just survive! WASD/arrows to move, collect dried fish to level up (pick 1/2/3), P to pause. Touch: press and drag for a virtual joystick. Survive 10 waves and beat the Pigeon King.',
  },
  cover,
  coverPortrait,
}

export default manifest
