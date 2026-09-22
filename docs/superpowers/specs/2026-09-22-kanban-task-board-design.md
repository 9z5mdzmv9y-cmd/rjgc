# 看板待办事项应用 · 设计文档

> 日期：2026-09-22
> 状态：已与用户确认设计

## 1. 目标与范围

构建一个单页看板待办事项应用（纯前端、无后端），核心能力：

- 任务的增删改查（创建、编辑、删除、展示）。
- 三列看板视图，卡片拖拽跨列即改状态。
- 深色模式一键切换，记住选择；首次默认跟随系统偏好。
- 数据存于浏览器 localStorage，刷新不丢失。

**范围外（YAGNI）**：用户登录、多项目、云端同步、多人协作、列内排序、拖拽排序依赖库、状态管理库。

## 2. 需求明细

### 2.1 功能需求

| 项 | 要求 |
|---|---|
| 主界面 | 仅看板视图，三列（待办 / 进行中 / 完成），卡片拖拽 |
| 任务字段 | 标题（必填）、描述（选填）、优先级（高/中/低）、标签（多个）、创建时间（自动） |
| 状态 | 三档：待办 / 进行中 / 完成 |
| 优先级 | 高（红）、中（黄）、低（绿） |
| 深色模式 | 一键切换；首次默认跟随系统偏好，手动切换后覆盖并持久化 |
| 数据存储 | localStorage，刷新不丢失 |

### 2.2 澄清确认

- 仅看板视图，不支持列内排序，拖拽仅跨列改状态。
- 任务字段含「创建时间」「标签」，无「截止日期」。
- 删除操作需确认提示。
- 新建/编辑后卡片常驻，删除后卡片消失。

## 3. 技术选型

| 项 | 选择 | 理由 |
|---|---|---|
| 前端框架 | Vue 3（Composition API） | 需求指定 |
| 构建工具 | Vite | 需求指定，开发体验快 |
| 样式方案 | Tailwind CSS | 需求指定，快速构建三列+主题切换 |
| 数据存储 | localStorage | 需求指定，无后端 |
| 拖拽 | 原生 HTML5 Drag & Drop | 仅跨列改状态，无需库，YAGNI |

## 4. 数据模型

```ts
type Status = 'todo' | 'doing' | 'done';
type Priority = 'high' | 'medium' | 'low';

interface Task {
  id: string;          // crypto.randomUUID() 生成
  title: string;       // 必填，非空
  description: string; // 选填，可为空
  status: Status;
  priority: Priority;
  tags: string[];      // 多个自由输入
  createdAt: number;   // Date.now() 时间戳
}
```

- 存储键：`kanban.tasks`（Task[]），`kanban.theme`（'light' | 'dark'，缺省即跟随系统）。

## 5. 架构与组件

```
App
├─ 顶栏（标题、深色模式切换按钮）
└─ KanbanBoard
   ├─ TaskColumn (todo)
   │   └─ TaskCard × N
   ├─ TaskColumn (doing)
   │   └─ TaskCard × N
   ├─ TaskColumn (done)
   │   └─ TaskCard × N
   └─ TaskForm（模态：新建 / 编辑共用）
```

| 单元 | 职责 |
|---|---|
| `App` | 布局、主题状态与持久化、顶层任务状态 |
| `KanbanBoard` | 三列容器、拖拽目标分发 |
| `TaskColumn` | 单列渲染、接受拖放、触发状态更新 |
| `TaskCard` | 展示任务、拖拽源、编辑/删除入口、优先级配色 |
| `TaskForm` | 新建/编辑表单、校验（标题非空） |

## 6. 数据流

- **加载**：App 挂载时读取 `kanban.tasks`（缺失/解析失败 → 空数组）与 `kanban.theme`（缺失 → 跟随 `prefers-color-scheme`）。
- **创建**：表单提交 → 生成 Task → 追加并写回 localStorage。
- **编辑**：表单回填 → 提交后替换对应 Task → 写回。
- **删除**：确认后移除 → 写回。
- **拖拽改状态**：`dragstart` 记录 task id → 目标列 `dragover/drop` 更新 `status` → 写回。
- **主题切换**：更新 `kanban.theme` → 切换 class/根元素 → 写回。

## 7. 错误处理与边界

- localStorage 读取异常 / JSON 解析失败：回退为空数据，不崩溃。
- localStorage 空间不足：捕获写入失败，提示用户（不阻塞操作）。
- 标题为空：表单拒绝提交并提示。
- 拖拽至非列区域：忽略，状态不变。

## 8. 测试策略

- 单元/组件测试聚焦：任务状态流转（拖拽改状态）、localStorage 读写、表单校验（标题非空）、主题切换逻辑。
- 浏览器验证：手工走查创建、编辑、删除、拖拽、刷新持久化、深色模式切换。