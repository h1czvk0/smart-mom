# 智造孪生 MOM 前端项目

基于 Vue 3 + Vite 开发的数字化车间生产任务管理前端系统，用于《前端技术开发项目实训》。项目围绕工单、产线、设备、工序、报工、生产报表和 AI 工作台构建，重点展示 Vue 单页应用、组件化页面、Vue Router、核心交互功能、响应式适配、AI 接入和项目联调测试。

## 项目功能

- 控制台首页：展示今日工单、生产中任务、异常任务、完成率、设备利用率和数字孪生车间态势。
- 生产任务列表：支持关键词搜索、状态筛选、加急筛选和排序。
- 任务详情 / 报工：支持表单双向绑定、数量校验、异常说明校验和报工记录追加。
- 设备工序页面：展示产线设备运行、空闲、预警和停机状态。
- AI 工作台：独立侧边栏入口，支持 DeepSeek / OpenAI 兼容对话 API、加载中 / 成功 / 失败状态、业务 Prompt、多轮上下文、流式输出、Markdown 展示和提示词对比。
- 生产报表页面：展示模拟统计数据，并支持生成 AI 生产日报小结。
- 404 页面：处理未匹配路由。
- 响应式适配：支持 PC、平板和手机视口，移动端无明显横向溢出。

## 技术栈

- Vue 3
- Vue Router
- Vite
- ECharts
- JavaScript
- CSS Grid / Flex / Media Query

## 目录结构

```text
smart-mom/
├── public/
│   └── favicon.ico
├── src/
│   ├── assets/
│   │   ├── base.css
│   │   └── main.css
│   ├── components/
│   │   ├── dashboard/
│   │   └── layout/
│   ├── data/
│   │   └── mock.js
│   ├── router/
│   │   └── index.js
│   ├── views/
│   │   ├── AiWorkbenchView.vue
│   │   ├── DashboardView.vue
│   │   ├── DeviceProcessView.vue
│   │   ├── NotFoundView.vue
│   │   ├── ReportView.vue
│   │   ├── TaskDetailView.vue
│   │   └── TaskListView.vue
│   ├── App.vue
│   └── main.js
├── index.html
├── package.json
└── vite.config.js
```

## 路由说明

| 路径 | 页面 | 说明 |
| --- | --- | --- |
| `/` | 重定向 | 默认跳转到 `/dashboard` |
| `/dashboard` | 控制台首页 | KPI、车间态势、异常预警、任务概览 |
| `/tasks` | 生产任务列表 | 搜索、筛选、排序、加急任务展示 |
| `/tasks/:id` | 任务详情 / 报工 | 动态任务详情与报工表单 |
| `/devices` | 设备工序 | 设备与工序状态展示 |
| `/ai` | AI 工作台 | 对话 API、业务 Prompt、流式输出、Markdown、多轮上下文和提示词对比 |
| `/reports` | 生产报表 | 统计数据与 AI 小结 |
| `/:pathMatch(.*)*` | 404 页面 | 未匹配路径兜底页面 |

## 运行环境

建议使用 Node.js 20.19.0 及以上版本，或 Node.js 22.12.0 及以上版本。

安装依赖：

```sh
npm install
```

启动开发服务：

```sh
npm run dev
```

构建生产版本：

```sh
npm run build
```

预览构建结果：

```sh
npm run preview
```

代码检查：

```sh
npm run lint
```

## AI 接入配置

AI 工作台和 AI 报表小结使用 DeepSeek Chat Completions，接口路径为 `/chat/completions`，默认模型为 `deepseek-v4-flash`。

推荐使用本地代理，避免在浏览器中暴露 Key：

```sh
DEEPSEEK_API_KEY=你的 DeepSeek Key
DEEPSEEK_BASE_URL=https://api.deepseek.com
VITE_DEEPSEEK_MODEL=deepseek-v4-flash
VITE_DEEPSEEK_USE_PROXY=true
```

如需静态演示直连，可设置 `VITE_DEEPSEEK_USE_PROXY=false` 并配置 `VITE_DEEPSEEK_API_KEY`。未配置 Key 时，页面会显示失败状态，不再使用模拟生成结果。

## 测试记录

已完成以下联调测试：

- 项目启动测试
- 首页展示测试
- 路由跳转测试
- 404 页面测试
- 任务关键词搜索测试
- 任务状态筛选测试
- 加急任务筛选测试
- 任务排序测试
- 报工表单提交测试
- 报工表单校验测试
- AI 工作台对话状态测试
- AI 流式输出与 Markdown 展示测试
- AI 提示词对比测试
- 生产报表展示测试
- AI 报表小结测试
- PC / 平板 / 手机响应式测试
- 浏览器控制台报错检查

当前 `npm run build` 已通过，主要页面和核心交互功能可正常运行。

## 实训阶段对应

- 01 项目选题与 Vue 项目初始化
- 02 首页开发
- 03 组件化页面开发
- 04 Vue Router
- 05 网站核心交互功能开发
- 06 响应式页面开发与优化
- 07 项目联调与测试

## 项目说明

本项目使用本地 mock 数据模拟生产任务、设备状态和报表统计数据，暂未接入真实后端业务接口。AI 工作台和 AI 报表小结通过 Vite 本地代理或浏览器直连调用 DeepSeek Chat Completions；未配置 Key 时会显示失败提示，便于演示加载中、成功、失败、流式输出、Markdown 渲染、多轮上下文和提示词对比效果。
