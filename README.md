# Agent Frontend

Kratos Agent 的 React + TypeScript 前端项目，基于 Vite、Tailwind CSS 和 shadcn/ui。

## 开发命令

```bash
npm run dev
npm run typecheck
npm run build
npm run lint
```

## 目录结构

```text
src/
  app/                 # 应用入口、全局 Provider、跨页面装配
  pages/               # 路由级页面；当前主页面族是 pages/kratos
  widgets/             # 页面内的大块复合 UI，如侧边栏、对话区、仪表盘
  features/            # 具体业务行为和流程工具，如导出、缓存、表单 payload
  entities/            # 领域模型、API client、领域数据转换
  shared/              # 与业务无关的 UI、hooks、通用工具
  assets/              # 静态资源
```

## 分层约定

- `app` 只负责装配，不写具体业务流程。
- `pages` 负责页面级状态编排和模块组合。
- `widgets` 放可复用的页面区块，不直接处理 API 细节。
- `features` 放用户动作背后的业务流程、缓存、导出、表单校验等。
- `entities` 放后端资源类型、API 请求和领域数据转换。
- `shared` 放 shadcn/ui、通用 hooks 和纯工具函数，不能依赖业务层。

## Kratos 页面

`src/pages/kratos` 下每个主要页面都有独立入口：

- `KratosPage.tsx`：应用壳，负责侧边栏、全局状态和页面切换。
- `NewConversationPage.tsx`：新建对话页面。
- `ConversationDetailPage.tsx`：某个历史对话的详情页面。
- `TrainingPlanPage.tsx`：训练计划页面。
- `BodyDataPage.tsx`：身体数据页面。
- `SkillPanelPage.tsx`：Skill 管理面板。
- `EvaluationPage.tsx`：评估平台入口页面。

`src/widgets/kratos` 只保留跨页面可复用区块：

- `sidebar/`：Kratos 侧边栏。
- `conversation/`：对话工作区、Markdown 渲染等。
- `modals/`：认证、建档、身体数据、训练计划等弹窗。
- `layout/`：Kratos 页面内共享布局组件。

## shadcn/ui

组件目录已迁移到 `src/shared/ui`，`components.json` 已同步更新。新增 shadcn 组件后使用：

```tsx
import { Button } from "@/shared/ui/button"
```
