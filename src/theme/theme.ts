// 明暗主题切换：默认跟随系统 + 手动覆盖（决策记录 #10）
// 存储键 'mgaio:theme'：'light' | 'dark' | 无（跟随系统）
const THEME_KEY = 'mgaio:theme'

export function isDark(): boolean {
  return document.documentElement.classList.contains('dark')
}

export function toggleTheme(): boolean {
  const dark = !isDark()
  document.documentElement.classList.toggle('dark', dark)
  try {
    localStorage.setItem(THEME_KEY, dark ? 'dark' : 'light')
  } catch {
    /* localStorage 不可用时仅切换本次会话 */
  }
  return dark
}
