# 发布与部署手册（Release Runbook）

> **版本**：v0.1
> **变更记录**：v0.1 初稿（2026-08-15，首发前建立，用户指令）
> **性质**：操作性文档。纪律依据：docs/process/README.md §5（版本与发布）、决策 #16（CI/自动部署默认禁止）、决策 #17（版权声明）。

## 1. 铁律

1. **发布与部署默认禁止**，仅由用户人工命令发起（决策 #16）
2. **禁止 CI / 自动部署**：Cloudflare Pages 只能走 Direct Upload（本地上传产物），**不得**连接 Git 仓库
3. 域名：minigamesallinone.binarynomad.io（决策 #4）；托管在子域根路径，Vite base 保持默认 /，无需改动
4. 版权：仅用于学习研究，禁止商用与传播（决策 #17）；站点 robots.txt 与 <meta name="robots"> 默认禁收录
5. 产物 = dist/（纯静态，无后端、无 URL 路由、无 SPA 回退需求）

## 2. 发布门（每次发布前，全部通过才可发布）

1. pnpm typecheck
2. pnpm build（含 tsc -b；构建警告必须为 0）
3. 冒烟测试（决策 #25，手动触发）：
   - node src/games/tetris/engine.test.ts
   - node src/games/lianliankan/engine.test.ts
4. pnpm preview 本地走查全链路

## 3. 版本动作

1. 手写整理 CHANGELOG.md（按 Conventional Commits 分组，中文）
2. git tag -a vX.Y.Z -m "发布 vX.Y.Z"（首版 v0.1.0）
3. 确认 git status 干净

## 4. 部署（Cloudflare Pages · 手动上传）

1. 本机通过 §2 发布门并构建出 dist/
2. Cloudflare Dashboard → Workers & Pages → Create → Pages → **Upload assets（Direct Upload）**
   - 注意：不要选择 "Connect to Git"（会引入自动部署，违反决策 #16）
3. 项目名 minigamesallinone，把整个 dist/ 文件夹拖入上传 → Deploy
   - 得到初始地址 https://minigamesallinone.pages.dev
4. 项目 → Custom domains → Set up a custom domain → 输入 minigamesallinone.binarynomad.io
   - 域名在 Cloudflare 管理时，会自动创建 CNAME 记录并签发 HTTPS 证书（生效约 1~10 分钟）
5. 按 §5 验证清单逐项确认

## 5. 上线验证清单

- [ ] HTTPS 证书有效，无混合内容告警
- [ ] 欢迎页 → 大厅 → 各游戏弹窗（开始/暂停/重开/关闭/返回）全链路
- [ ] 最高分经 ScoreService 写入 localStorage 并回显（ADR-0005）
- [ ] 中英切换持久化；明暗主题跟随系统 + 手动开关（决策 #10）
- [ ] 移动端竖屏提示与横屏硬约束（决策 #18）
- [ ] /favicon.svg、/robots.txt、/og.png 可直访；社交卡片抓取正常（og:image 指向线上 URL）
- [ ] 浏览器控制台无报错；懒加载 chunk 正常加载

## 6. 回滚

- Pages → Deployments → 历史部署 **Rollback**（推荐，秒级）
- 或本地 git checkout vX.Y.Z 重建 dist/ 后重新上传

## 7. 后续版本更新

1. 本地通过 §2 发布门 → §3 版本动作
2. Pages 项目内 → Create new deployment → 上传新 dist/
3. 按 §5 验证；出问题按 §6 回滚
