# ADR 索引与模板（Architecture Decision Records）

> **版本**：v0.1
> **变更记录**：v0.1 初稿（2026-08-15）

## 索引

| 编号 | 标题                                                       | 状态     | 日期       |
| ---- | ---------------------------------------------------------- | -------- | ---------- |
| 0001 | 游戏注册表模式（Registry Pattern）                         | accepted | 2026-08-15 |
| 0002 | 游戏弹窗运行模式（GameWindow）                             | accepted | 2026-08-15 |
| 0003 | 设计令牌落地：Tailwind v4 CSS-first + 亮暗两套             | accepted | 2026-08-15 |
| 0004 | 轻量自研 i18n                                              | accepted | 2026-08-15 |
| 0005 | 本地存储 + ScoreService 抽象                               | accepted | 2026-08-15 |
| 0006 | 文档即真相源与规范生长机制                                 | accepted | 2026-08-15 |
| 0007 | 游戏阶段状态机（menu/playing/paused/over）与壳层控制条适配 | accepted | 2026-08-15 |

## 生命周期

`proposed` → `accepted` → `superseded`（被新 ADR 推翻时，须注明新编号；详见 docs/process/evolution.md §4）

## 模板

```markdown
# ADR-NNNN：<标题>

- **状态**：proposed / accepted / superseded（by ADR-XXXX）
- **日期**：YYYY-MM-DD
- **背景**：要解决什么问题
- **决策**：采用什么方案
- **理由**：为什么（证据/出处）
- **后果**：带来的约束与代价（正负都写）
```

## 写作纪律（反幻觉）

- 背景与理由必须给出出处（用户指令 / 已有文档 / 明确标注的推断）
- 无法溯源的选项不进 ADR
- 推翻旧决策必须新开 ADR，并在旧 ADR 状态栏注明
