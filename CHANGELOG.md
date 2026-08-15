# Changelog

> 本站点版本遵循语义化版本（SemVer）。本文件由规范化 commit（Conventional Commits）人工整理手写（流程规范 §5：Changelog 由规范化 commit 自动生成；当前仓库未引入生成工具，按决策记录 #12 首版不引入自动化，由人工整理）。

## [0.1.0] - 2026-08-15

首版发布。站点：minigamesallinone.binarynomad.io（决策 #4）。

### 新增 Added

- **工程脚手架**：Vite + React 19 + TypeScript（严格模式）+ Tailwind v4 + pnpm；husky + lint-staged 质量门（决策 #6/#7/#15）
- **Inked Kinetic 设计体系**：设计令牌（亮暗两套）与纹理配方落地（ADR-0003，design-language.md v0.2~v0.6）
- **大厅壳层**：游戏卡片墙、Hero 面板、本地排行榜；卡片与 Hero 支持封面缩略图（决策 #26）
- **游戏弹窗壳层**（GameWindow，ADR-0002）：窗外/窗框网页规范；控制条随游戏阶段 menu/playing/paused/over 适配（决策 #24、ADR-0007）
- **欢迎页与品牌字标**：MINIGAMESALLINONE 两视觉行 + by@BinaryNomad.io（决策 #20/#22）
- **响应式与动效**：手机横竖屏到桌面全分辨率适配；滚动入场动效（决策 #18/#19）
- **游戏注册表**：import.meta.glob 自动汇总 + React.lazy 按需加载（ADR-0001）
- **ScoreService**：本地计分（localStorage 实现，接口可替换，ADR-0005）
- **轻量自研 i18n**：zh/en 双语、typed key、语言记忆（ADR-0004）
- **游戏：俄罗斯方块**（像素风格）：引擎抽纯逻辑 + 冒烟测试（决策 #25）
- **游戏：连连看**：几何风首发，后重做为星露谷式像素风（英文名 clickclick）
- **发布配套**：favicon、OG 社交图（欢迎页配方）、robots.txt 禁收录、SEO/OG 元标签

### 变更 Changed

- 俄罗斯方块完整性改造：开始/暂停/结束/返回主菜单
- 移除示例占位游戏（决策 #11/#23）

### 修复 Fixed

- 欢迎页动效填充模式改 backwards，避免动画失败时文字不可见
- 俄罗斯方块启动不生成首块
- 计分触发弹窗清理副作用，销毁游戏实例
- 新增错误边界与全局错误提示，避免白屏
- Tailwind 扫描排除 docs 只读素材，清理生产 CSS 泄漏类

### 文档 Docs

- 流程规范 v0.1~~v0.7（决策记录 #1~~#26）、架构约定与 ADR-0001~~0007、设计语言 v0.2~~v0.6
- AGENTS.md 协作手册、skills 工作技能、agents 角色化代理
- 发布与部署手册 v0.2（Cloudflare Pages：Direct Upload 或 Git 连接 + 关闭自动部署，发布手动触发）
