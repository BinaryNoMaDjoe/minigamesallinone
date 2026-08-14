# Skill：skill-add-game（新增一个小游戏）

> **版本**：v0.1
> **变更记录**：v0.1 初稿（2026-08-15）

## 触发条件

用户要求新增/开发一个小游戏（"加个XX游戏"、"实现XX"）。

## 前置阅读（按序）

1. `AGENTS.md`（红线与工作流）
2. `docs/design-language.md` §15（弹窗运行模式与分区规则）
3. `docs/architecture/README.md` §3（分层依赖规则）
4. `src/games/` 现有实现与类型定义（`games/shared/` 类型、任一现有游戏目录）——**以代码为准**，不得凭空假设接口

## 核心纪律

- **玩法必须来自用户**：用户描述缺细节时，列出问题清单问用户；禁止自行脑补规则、数值、名称
- 未确认的设计点一律标注「待定」并汇报，不静默决策

## 步骤

1. 读前置材料；整理用户未交代的信息 → 问用户
2. 创建 `src/games/<game-id>/`（id 用 kebab-case，如 `snake`、`match-3`）
3. 写 `manifest.ts`：
   - 双语 `name` / `description`（zh、en 都写，缺一不可）
   - `category`、`theme`（accent 色必须来自 design-language.md 令牌或用户确认值）
   - 画布比例、是否支持暂停/重开、控制方式说明
4. 写 `Game.tsx`，实现 `GameInstance` 接口（以 `games/shared` 类型定义为准）：挂载、启动、暂停、恢复、重启、销毁
5. 分数/进度统一走 `ScoreService`，禁止游戏直写 localStorage
6. 注册表自动汇总，**不得手工改 registry.ts**；如需自定义入口信息，只改 manifest
7. 自测：`typecheck` + `build`（以骨架脚本名为准）；大厅打开游戏弹窗手动玩一遍
8. 按 `skill-code-review.md` 自检
9. 按规范拆分提交：`feat(games): 新增<游戏名>`（涉及文档更新时 docs 单独提交）

## 检查清单

- [ ] manifest 双语齐全（zh/en）
- [ ] theme 色值有出处（令牌/用户确认），无自造 hex
- [ ] 只 import 白名单：theme、i18n、services、games/shared；无对其他游戏/壳层/pages 的 import
- [ ] 分数走 ScoreService；无直写 localStorage
- [ ] 暂停/重启正常；销毁时 rAF/定时器/事件监听全部清理（防内存泄漏）
- [ ] 亮色/暗色下均清晰可读
- [ ] 键盘可达、focus 可见（无障碍底线）
- [ ] typecheck + build 通过
- [ ] 提交信息符合规范（中文、feat(games) 作用域）

## 输出

实现 + 自检报告（清单勾选结果 + 验证命令结果 + 「待定」问题列表）。

## 红线

- 不得编造游戏设计
- 不得修改 `docs/design-language.md`、`AGENTS.md`、process 规范（可提提案）
- 不得改动大厅/弹窗壳层来迁就单个游戏（壳层需求走 ui 变更流程）
