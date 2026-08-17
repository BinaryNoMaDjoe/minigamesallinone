// ============================================================
// 星露谷连连看：六大关主题数据（唯一出处 DESIGN.md v0.6 §4/§6）
// 每大关：双语名 + 场景色板 + 6 元素精灵集（pixel.ts 图鉴 id）
// ============================================================
import type { LocalizedText } from '../shared/types'

export type ChapterId =
  'spring-farm' | 'summer-beach' | 'autumn-forest' | 'town-folk' | 'deep-mines' | 'winter-festival'

/** 场景 + 棋盘 + HUD + 特效统一色板（游戏级画板，本文件定义，DESIGN.md §4.1 汇总） */
export interface ChapterPalette {
  /** 场景：天空（上带） */
  sky: string
  /** 场景：第二背景色（海面/夜空/岩壁等，按场景解释） */
  skyAlt: string
  /** 场景：云/浪花/星光等浅色装饰 */
  cloud: string
  /** 场景：地面主色 */
  ground: string
  /** 场景：地面暗纹 */
  groundDark: string
  /** 场景：点缀色（太阳/落叶/屋顶/晶簇/灯火） */
  decor: string
  /** 棋盘木框 */
  frame: string
  /** 棋盘面板底 */
  panel: string
  /** 棋盘网格线 */
  panelLine: string
  /** 匹配连线主色 */
  line: string
  /** 匹配连线衬底（对比描边） */
  lineDark: string
  /** 选中高亮 */
  select: string
  /** 提示高亮 */
  hint: string
  /** 时间告急 */
  timeWarn: string
  /** 星屑粒子/端点 */
  sparkle: string
  /** UI 底 */
  uiBg: string
  /** UI 描边 */
  uiBorder: string
  /** UI 硬阴影 */
  uiShadow: string
  /** UI 文字 */
  text: string
  /** UI 次级文字 */
  subText: string
  /** 浮层遮罩 */
  overlay: string
  /** 横幅提示底 */
  toastBg: string
}

export interface ChapterTheme {
  id: ChapterId
  name: LocalizedText
  /** 本大关 6 元素（pixel.ts 精灵 id；关卡按需取前 4/5/6 种） */
  sprites: number[]
  palette: ChapterPalette
}

export const CHAPTERS: ChapterTheme[] = [
  {
    id: 'spring-farm',
    name: { zh: '春季农场', en: 'SPRING FARM' },
    sprites: [0, 1, 2, 3, 4, 5],
    palette: {
      sky: '#8ecbeb',
      skyAlt: '#a8ddf5',
      cloud: '#fdfefe',
      ground: '#7fb069',
      groundDark: '#5f8a4e',
      decor: '#ffd83d',
      frame: '#7a4a2a',
      panel: '#d8b078',
      panelLine: 'rgba(122, 74, 42, 0.25)',
      line: '#ffd83d',
      lineDark: '#3a2c1a',
      select: '#ffd83d',
      hint: '#fdfefe',
      timeWarn: '#e63946',
      sparkle: '#fdfefe',
      uiBg: '#f4e4c1',
      uiBorder: '#5a4632',
      uiShadow: '#3a2c1a',
      text: '#3a2c1a',
      subText: '#7a5c3a',
      overlay: 'rgba(58, 44, 26, 0.5)',
      toastBg: '#fff6e0',
    },
  },
  {
    id: 'summer-beach',
    name: { zh: '盛夏海滩', en: 'SUMMER BEACH' },
    sprites: [6, 7, 8, 9, 10, 11],
    palette: {
      sky: '#7ec8ef',
      skyAlt: '#3f9fd9',
      cloud: '#cfe8f5',
      ground: '#f2d98c',
      groundDark: '#d9b96a',
      decor: '#ffd83d',
      frame: '#9a6c3c',
      panel: '#efd9a8',
      panelLine: 'rgba(122, 90, 50, 0.3)',
      line: '#ff5a4d',
      lineDark: '#7a2c24',
      select: '#ff5a4d',
      hint: '#fdfefe',
      timeWarn: '#e63946',
      sparkle: '#fdfefe',
      uiBg: '#fdf3d8',
      uiBorder: '#7a5a3a',
      uiShadow: '#4a3c24',
      text: '#4a3c24',
      subText: '#8a6c44',
      overlay: 'rgba(58, 44, 26, 0.5)',
      toastBg: '#fff6e0',
    },
  },
  {
    id: 'autumn-forest',
    name: { zh: '秋日森林', en: 'AUTUMN FOREST' },
    sprites: [12, 13, 14, 15, 16, 17],
    palette: {
      sky: '#f2b06a',
      skyAlt: '#e89a4a',
      cloud: '#fbe0bc',
      ground: '#c9823c',
      groundDark: '#a8652c',
      decor: '#e0a03c',
      frame: '#5a3a1e',
      panel: '#e8c07a',
      panelLine: 'rgba(90, 58, 30, 0.3)',
      line: '#ffd83d',
      lineDark: '#4a2c14',
      select: '#ffd83d',
      hint: '#fdfefe',
      timeWarn: '#e63946',
      sparkle: '#fdfefe',
      uiBg: '#f8e8c8',
      uiBorder: '#5a4632',
      uiShadow: '#3a2c1a',
      text: '#3a2c1a',
      subText: '#7a5c3a',
      overlay: 'rgba(58, 44, 26, 0.5)',
      toastBg: '#fff6e0',
    },
  },
  {
    id: 'town-folk',
    name: { zh: '小镇村民', en: 'TOWN FOLK' },
    sprites: [18, 19, 20, 21, 22, 23],
    palette: {
      sky: '#a8d8e8',
      skyAlt: '#cfe8f0',
      cloud: '#fdfefe',
      ground: '#b8a888',
      groundDark: '#9a8c6e',
      decor: '#b8683c',
      frame: '#8a5c34',
      panel: '#e8d4a8',
      panelLine: 'rgba(122, 84, 44, 0.3)',
      line: '#ffd83d',
      lineDark: '#4a3c1e',
      select: '#ffd83d',
      hint: '#fdfefe',
      timeWarn: '#e63946',
      sparkle: '#fdfefe',
      uiBg: '#f8ecd0',
      uiBorder: '#5a4632',
      uiShadow: '#3a2c1a',
      text: '#3a2c1a',
      subText: '#7a5c3a',
      overlay: 'rgba(58, 44, 26, 0.5)',
      toastBg: '#fff6e0',
    },
  },
  {
    id: 'deep-mines',
    name: { zh: '幽深矿洞', en: 'DEEP MINES' },
    sprites: [24, 25, 26, 27, 28, 29],
    palette: {
      sky: '#2a2018',
      skyAlt: '#1e1610',
      cloud: '#f0e4d0',
      ground: '#241a12',
      groundDark: '#1a1410',
      decor: '#8a5fbf',
      frame: '#6e625a',
      panel: '#4a4038',
      panelLine: 'rgba(240, 228, 208, 0.12)',
      line: '#ffe066',
      lineDark: '#1a1410',
      select: '#ffe066',
      hint: '#fdfefe',
      timeWarn: '#ff5a4d',
      sparkle: '#fdfefe',
      uiBg: '#3a322a',
      uiBorder: '#8a7a68',
      uiShadow: '#120e0a',
      text: '#f0e4d0',
      subText: '#b8a890',
      overlay: 'rgba(20, 16, 10, 0.6)',
      toastBg: '#4a4038',
    },
  },
  {
    id: 'winter-festival',
    name: { zh: '冬夜庆典', en: 'WINTER FESTIVAL' },
    sprites: [30, 31, 32, 33, 34, 35],
    palette: {
      sky: '#1e3a5e',
      skyAlt: '#2c4a74',
      cloud: '#cfe8f5',
      ground: '#e8f0f8',
      groundDark: '#b8cfe0',
      decor: '#ffd83d',
      frame: '#4a6a8a',
      panel: '#dce8f2',
      panelLine: 'rgba(60, 90, 120, 0.25)',
      line: '#ffd83d',
      lineDark: '#2c4a6e',
      select: '#ffd83d',
      hint: '#fdfefe',
      timeWarn: '#e63946',
      sparkle: '#fdfefe',
      uiBg: '#eef4fa',
      uiBorder: '#3a5a7a',
      uiShadow: '#22344a',
      text: '#22344a',
      subText: '#5a7a94',
      overlay: 'rgba(30, 58, 94, 0.55)',
      toastBg: '#f0f7ff',
    },
  },
]
