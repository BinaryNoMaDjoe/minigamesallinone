# ADR-0003：设计令牌落地：Tailwind v4 CSS-first + 亮暗两套

- **状态**：accepted
- **日期**：2026-08-15

## 背景

设计语言规范（Inked Kinetic，design-language.md v0.2）定义了完整令牌体系（色彩/字体/间距）与纹理配方，且包含亮、暗两套主题。需要确定落地技术形式，且文档与代码必须一一对应。

## 决策

- 设计令牌落地为 `src/theme/tokens.css`：CSS 自定义属性，亮色一套 + `html.dark` 覆盖一套；键名与 design-language.md 附录 A/C 一致
- Tailwind v4 采用 **CSS-first `@theme`** 映射同一套令牌（colors / spacing / fontFamily / fontSize），不再使用 JS 版 `tailwind.config`
- 纹理与阴影（halftone / speed-lines / comic-border / comic-shadow 系列 / comic-bubble）落地为工具类，颜色全部令牌化
- 代码中**禁止**出现令牌表之外的硬编码色值/字号/间距

## 理由

- 规范即代码：键名一致使审查可机械核对（design-language.md §13）
- Tailwind v4 已转向 CSS-first 配置，JS 配置方式被废弃
- 亮暗两套共用同一键名，组件只需引用变量，无需双份样式

## 后果

- 约束：新色值/新令牌必须走规范生长流程（docs/process/evolution.md），禁止随手加色
- 约束：Tailwind v4 相对 v3 的写法差异需在脚手架阶段一次性适配
