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
- 大文件拆分按业务职责，不按“一个组件一个文件”机械拆；当一个文件同时管理多个交互、状态或 effect 时，应拆到同一 feature/widget 子树下。

## Kratos 页面

`src/pages/kratos` 下每个主要页面都有独立入口：

- `KratosPage.tsx`：应用壳，负责侧边栏、全局状态和页面切换。
- `NewConversationPage.tsx`：新建对话页面。
- `ConversationDetailPage.tsx`：某个历史对话的详情页面。
- `TrainingPlanPage.tsx`：训练计划页面。
- `BodyDataPage.tsx`：数据中心页面。
- `SkillPanelPage.tsx`：Skill 管理面板。
- `EvaluationPage.tsx`：评估平台入口页面。

`src/widgets/kratos` 只保留跨页面可复用区块：

- `sidebar/`：Kratos 侧边栏壳、主导航、历史对话列表和历史对话行。
- `conversation/`：对话工作区、顶部通知、消息气泡、思考轨迹、空状态、输入框和训练计划建议卡片。
- `modals/`：认证、建档、数据中心、训练计划、训练反馈和详情弹窗；共享表单控件放在 `ModalFormFields.tsx`。
- `layout/`：Kratos 页面内共享布局组件。

`src/features/kratos/profile` 放个人资料入口和编辑弹窗。侧边栏只接收 footer slot，不直接知道个人资料 dialog 的状态和表单细节。

## shadcn/ui

组件目录已迁移到 `src/shared/ui`，`components.json` 已同步更新。新增 shadcn 组件后使用：

```tsx
import { Button } from "@/shared/ui/button"
```
