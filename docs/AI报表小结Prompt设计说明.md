# AI 报表小结 Prompt 设计说明

## 功能选择

本项目选择“AI 报表小结”作为 AI 功能。在生产报表页点击“AI 生成分析小结”后，前端会整理当前工单、设备、产量、异常等模拟数据，并调用 DeepSeek Chat Completions API 生成生产日报。

## DeepSeek API 配置

项目使用 DeepSeek 官方 OpenAI 兼容接口：

- Base URL：`https://api.deepseek.com`
- Endpoint：`/chat/completions`
- 默认模型：`deepseek-v4-flash`
- 可选模型：`deepseek-v4-pro`
- 输出方式：`stream: true`，用于展示流式打字机效果

本地配置文件参考 `.env.example`：

```text
DEEPSEEK_API_KEY=
DEEPSEEK_BASE_URL=https://api.deepseek.com
VITE_DEEPSEEK_MODEL=deepseek-v4-flash
VITE_DEEPSEEK_USE_PROXY=true
```

说明：项目默认使用 Vite 本地代理 `/api/deepseek/chat/completions` 调用 DeepSeek，API Key 保存在开发服务环境变量 `DEEPSEEK_API_KEY` 中，不暴露到浏览器代码。`.env.example` 中保留 `VITE_DEEPSEEK_API_KEY` 仅用于静态页面演示兜底，不建议真实使用。

## Prompt 输入数据

Prompt 会包含以下业务数据：

- 累计产出、计划产出、完成率
- 异常工单数、首要风险
- 平均设备利用率
- 未完成任务、加急任务、异常任务
- 风险设备和异常类型

## Prompt 输出约束

为了让结果适合实训报告和业务页面展示，Prompt 要求 AI：

- 使用 Markdown 格式
- 固定输出四个小标题：整体表现、主要风险、设备情况、下一步建议
- 每个小标题下输出 1 到 3 条要点
- 不编造不存在的工单、设备或人员
- 字数控制在 180 字以内
- 只回答与生产任务、工单、设备、工序、产量、异常处理相关的内容

## 三种 Prompt 模式对比

| 模式 | 目标 | 适用场景 |
| --- | --- | --- |
| 标准日报 | 平衡描述产出、风险、设备和建议 | 常规生产日报 |
| 风险优先 | 优先突出异常工单、加急任务和设备风险 | 班组长晨会、异常跟进 |
| 管理层摘要 | 突出完成率、产出、资源利用和管理动作 | 汇报和答辩展示 |

## 加分项实现

本项目完成以下 AI 加分项：

- 流式输出：DeepSeek 请求使用 `stream: true`，mock 兜底也按字符逐步输出。
- Markdown 渲染：AI 返回的 Markdown 会渲染为标题和列表。
- 提示词对比：页面提供“标准日报 / 风险优先 / 管理层摘要”三种 Prompt 模式。
- 失败状态：通过 `/reports?fail=1` 可演示 AI 请求失败提示。
