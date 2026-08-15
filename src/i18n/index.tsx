import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import type { ReactNode } from 'react'

// ============================================================
// 轻量自研 i18n（ADR-0004）
// 纪律（skills/skill-i18n.md）：zh/en 必须同步修改；键名 camelCase 按域分组
// ============================================================

export type Lang = 'zh' | 'en'

export const zh = {
  // 公共
  'common.appName': '迷你游戏合集',
  'common.publisher': 'BINARY NOMAD',
  // 大厅
  'lobby.bubble': '警告：极高娱乐性',
  'lobby.heroTitleA': '所有小游戏',
  'lobby.heroTitleB': '一个入口',
  'lobby.heroBody': '一个收集各类小游戏的中枢：点击卡片打开弹窗即玩，自动记录本地最高分。',
  'lobby.cta': '开始游戏',
  'lobby.gamesBubble': '新鲜上架！',
  'lobby.gamesTitle': '游戏选择',
  'lobby.play': '进入游戏',
  'lobby.empty': '暂无游戏，敬请期待',
  'lobby.leaderboardTitle': '本地最高分',
  'lobby.noScores': '还没有分数记录',
  // 分类标签
  'category.classic': '经典',
  'category.arcade': '街机',
  'category.puzzle': '益智',
  'category.other': '其他',
  // 游戏弹窗（GameWindow 壳层）
  'shell.score': '当前分',
  'shell.best': '最高分',
  'shell.pause': '暂停',
  'shell.resume': '继续',
  'shell.restart': '重新开始',
  'shell.close': '关闭',
  'shell.howto': '玩法说明',
  'shell.loading': '加载中…',
  // 欢迎页
  'welcome.page': '欢迎页',
  'welcome.enter': '进入',
  // 页脚
  'footer.copyright': '© 2026 BinaryNomad.io · 开发者 @BinaryNomadjoe',
  'footer.license': '仅用于学习研究，禁止商用与传播',
} as const

export type MessageKey = keyof typeof zh

export const en: Record<MessageKey, string> = {
  'common.appName': 'MINIGAMESALLINONE',
  'common.publisher': 'BINARY NOMAD',
  'lobby.bubble': 'WARNING: EXTREMELY FUN',
  'lobby.heroTitleA': 'ALL THE GAMES',
  'lobby.heroTitleB': 'ONE PORTAL',
  'lobby.heroBody':
    'One hub for every mini game: open a card, play instantly in a popup, local high scores are saved automatically.',
  'lobby.cta': 'PLAY NOW',
  'lobby.gamesBubble': 'FRESH DROPS!',
  'lobby.gamesTitle': 'GAME SELECT',
  'lobby.play': 'PLAY',
  'lobby.empty': 'No games yet. Stay tuned.',
  'lobby.leaderboardTitle': 'LOCAL TOP SCORES',
  'lobby.noScores': 'No scores yet',
  'category.classic': 'CLASSIC',
  'category.arcade': 'ARCADE',
  'category.puzzle': 'PUZZLE',
  'category.other': 'OTHER',
  'shell.score': 'SCORE',
  'shell.best': 'BEST',
  'shell.pause': 'PAUSE',
  'shell.resume': 'RESUME',
  'shell.restart': 'RESTART',
  'shell.close': 'CLOSE',
  'shell.howto': 'HOW TO PLAY',
  'shell.loading': 'LOADING…',
  'welcome.page': 'Welcome',
  'welcome.enter': 'ENTER',
  'footer.copyright': '© 2026 BinaryNomad.io · by @BinaryNomadjoe',
  'footer.license': 'For study and research only. No commercial use or redistribution.',
}

const LANG_KEY = 'mgaio:lang'

function detectLang(): Lang {
  try {
    const stored = localStorage.getItem(LANG_KEY)
    if (stored === 'zh' || stored === 'en') return stored
  } catch {
    /* localStorage 不可用 */
  }
  return navigator.language.toLowerCase().startsWith('zh') ? 'zh' : 'en'
}

interface I18nContextValue {
  lang: Lang
  setLang: (lang: Lang) => void
  t: (key: MessageKey) => string
}

const I18nContext = createContext<I18nContextValue | null>(null)

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(detectLang)

  const setLang = useCallback((next: Lang) => {
    setLangState(next)
    try {
      localStorage.setItem(LANG_KEY, next)
    } catch {
      /* localStorage 不可用 */
    }
    document.documentElement.lang = next === 'zh' ? 'zh-CN' : 'en'
  }, [])

  const t = useCallback((key: MessageKey) => (lang === 'zh' ? zh[key] : en[key]), [lang])

  const value = useMemo(() => ({ lang, setLang, t }), [lang, setLang, t])

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useI18n 必须在 I18nProvider 内使用')
  return ctx
}

/** 按当前语言取本地化文本（游戏 manifest 双语字段用） */
export function pickLang<T extends { zh: string; en: string }>(text: T, lang: Lang): string {
  return lang === 'zh' ? text.zh : text.en
}
