export const promptProfiles = {
  standard: {
    label: '标准日报',
    description: '按整体表现、风险、设备、建议四段生成生产日报。',
    system:
      '你是一个制造企业 MOM 生产管理系统的数据分析助手。请只回答与生产任务、工单、设备、工序、产量、异常处理相关的内容。',
  },
  risk: {
    label: '风险优先',
    description: '优先指出异常工单、加急任务和设备风险，适合班组长晨会。',
    system:
      '你是一个制造车间异常处置顾问。请优先识别异常工单、加急任务、低利用率设备和下一步处置顺序，语气专业、简洁。',
  },
  manager: {
    label: '管理层摘要',
    description: '突出完成率、产出、资源利用和管理建议，适合汇报。',
    system:
      '你是一个制造运营经理助理。请面向管理层输出简洁摘要，突出产出、完成率、资源利用、主要风险和管理动作。',
  },
}

export function getDeepSeekConfig() {
  return {
    apiKey: import.meta.env.VITE_DEEPSEEK_API_KEY?.trim() ?? '',
    baseUrl: (import.meta.env.VITE_DEEPSEEK_BASE_URL?.trim() || 'https://api.deepseek.com').replace(/\/$/, ''),
    model: import.meta.env.VITE_DEEPSEEK_MODEL?.trim() || 'deepseek-v4-flash',
    proxyUrl: '/api/deepseek/chat/completions',
    useProxy: import.meta.env.VITE_DEEPSEEK_USE_PROXY !== 'false',
  }
}

export function hasDeepSeekApiKey() {
  return Boolean(getDeepSeekConfig().apiKey)
}

export function getDeepSeekConnectionLabel() {
  const config = getDeepSeekConfig()

  if (config.useProxy) {
    return 'DeepSeek 本地代理'
  }

  return config.apiKey ? 'DeepSeek 浏览器直连' : '未配置 API Key'
}

export function buildReportPrompt({ stats, tasks, devices, abnormalTypes, promptMode = 'standard' }) {
  const profile = promptProfiles[promptMode] ?? promptProfiles.standard
  const activeTasks = tasks.filter((task) => task.status !== '已完成')
  const urgentTasks = tasks.filter((task) => task.urgent && task.status !== '已完成')
  const abnormalTasks = tasks.filter((task) => task.status === '异常')
  const riskyDevices = devices.filter((device) => device.status === '异常' || device.status === '预警')

  const userPrompt = [
    '请根据以下 MOM 生产统计数据生成一段 Markdown 格式的生产日报小结。',
    '',
    '输出要求：',
    '- 使用 4 个小标题：整体表现、主要风险、设备情况、下一步建议。',
    '- 每个小标题下用 1 到 3 条要点。',
    '- 不要编造不存在的工单、设备或人员。',
    '- 字数控制在 180 字以内。',
    '',
    `提示词模式：${profile.label} - ${profile.description}`,
    '',
    '统计指标：',
    `- 累计产出：${stats.totalOutput} 件`,
    `- 计划产出：${stats.plannedOutput} 件`,
    `- 完成率：${stats.completionRate}%`,
    `- 异常工单数：${stats.abnormalCount}`,
    `- 平均设备利用率：${stats.deviceUtilization}%`,
    `- 当前首要风险：${stats.topRisk}`,
    '',
    `未完成任务：${activeTasks.map((task) => `${task.id}/${task.product}/${task.status}/${task.progress}%`).join('；') || '无'}`,
    `加急任务：${urgentTasks.map((task) => task.id).join('、') || '无'}`,
    `异常任务：${abnormalTasks.map((task) => `${task.id}/${task.abnormalType || '生产异常'}`).join('；') || '无'}`,
    `风险设备：${riskyDevices.map((device) => `${device.code}/${device.name}/${device.status}/${device.utilization}%`).join('；') || '无'}`,
    `异常类型：${abnormalTypes.map((item) => `${item.name}${item.value}次`).join('、') || '无'}`,
  ].join('\n')

  return {
    system: profile.system,
    user: userPrompt,
  }
}

export async function generateDeepSeekReportSummary({
  stats,
  tasks,
  devices,
  abnormalTypes,
  promptMode,
  onDelta,
  signal,
  forceFail = false,
}) {
  if (forceFail) {
    throw new Error('AI 小结生成失败：当前路由启用了失败状态演示。')
  }

  const prompt = buildReportPrompt({ stats, tasks, devices, abnormalTypes, promptMode })

  return streamDeepSeekMessages({
    messages: [
      { role: 'system', content: prompt.system },
      { role: 'user', content: prompt.user },
    ],
    maxTokens: 700,
    temperature: 0.3,
    signal,
    onDelta,
  })
}

export async function streamDeepSeekMessages({
  messages,
  onDelta,
  signal,
  maxTokens = 800,
  maxContinuations = 1,
  temperature = 0.3,
  forceFail = false,
}) {
  if (forceFail) {
    throw new Error('AI 请求失败：当前操作用于验证失败状态提示。')
  }

  const config = getDeepSeekConfig()

  if (!config.useProxy && !config.apiKey) {
    throw new Error('未配置 DeepSeek API Key。请在 .env 中配置 DEEPSEEK_API_KEY，或设置 VITE_DEEPSEEK_USE_PROXY=false 并配置 VITE_DEEPSEEK_API_KEY。')
  }

  let fullText = ''
  let requestMessages = messages

  for (let continuation = 0; continuation <= maxContinuations; continuation += 1) {
    const response = await requestWithFallback({
      config,
      messages: requestMessages,
      signal,
      maxTokens,
      temperature,
    })
    const result = response.body
      ? await readSseStream(response.body, onDelta)
      : await readJsonResponse(response, onDelta)

    fullText += result.content

    if (result.finishReason !== 'length' || continuation === maxContinuations) {
      return fullText
    }

    requestMessages = [
      ...messages,
      { role: 'assistant', content: fullText },
      {
        role: 'user',
        content: '上一条回答因长度限制中断。请从中断位置直接续写，保持原有 Markdown 结构，不要重复已经生成的内容。',
      },
    ]
  }

  return fullText
}

async function requestWithFallback({ config, messages, signal, maxTokens, temperature }) {
  let response = await requestDeepSeek({
    url: config.useProxy ? config.proxyUrl : `${config.baseUrl}/chat/completions`,
    apiKey: config.useProxy ? '' : config.apiKey,
    model: config.model,
    messages,
    signal,
    maxTokens,
    temperature,
  })

  if (config.useProxy && [404, 501].includes(response.status)) {
    if (!config.apiKey) {
      const detail = await response.text()
      throw new Error(`DeepSeek 本地代理未配置 API Key：${detail.slice(0, 120)}`)
    }

    response = await requestDeepSeek({
      url: `${config.baseUrl}/chat/completions`,
      apiKey: config.apiKey,
      model: config.model,
      messages,
      signal,
      maxTokens,
      temperature,
    })
  }

  if (!response.ok) {
    const detail = await response.text()
    throw new Error(`DeepSeek API 请求失败：${response.status} ${detail.slice(0, 120)}`)
  }

  return response
}

async function readJsonResponse(response, onDelta) {
  const data = await response.json()
  const choice = data.choices?.[0]
  const content = choice?.message?.content ?? ''
  onDelta?.(content)

  return {
    content,
    finishReason: choice?.finish_reason ?? 'stop',
  }
}

function requestDeepSeek({ url, apiKey, model, messages, signal, maxTokens, temperature }) {
  const headers = {
    'Content-Type': 'application/json',
  }

  if (apiKey) {
    headers.Authorization = `Bearer ${apiKey}`
  }

  return fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model,
      messages,
      thinking: { type: 'disabled' },
      stream: true,
      temperature,
      max_tokens: maxTokens,
    }),
    signal,
  })
}

async function readSseStream(body, onDelta) {
  const reader = body.getReader()
  const decoder = new TextDecoder('utf-8')
  let buffer = ''
  let fullText = ''
  let finishReason = null

  while (true) {
    const { done, value } = await reader.read()

    if (done) {
      break
    }

    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() ?? ''

    for (const rawLine of lines) {
      const line = rawLine.trim()

      if (!line.startsWith('data:')) {
        continue
      }

      const payload = line.slice(5).trim()

      if (payload === '[DONE]') {
        return {
          content: fullText,
          finishReason: finishReason ?? 'stop',
        }
      }

      try {
        const event = JSON.parse(payload)
        const choice = event.choices?.[0]
        const delta = choice?.delta?.content ?? ''

        if (choice?.finish_reason) {
          finishReason = choice.finish_reason
        }

        if (delta) {
          fullText += delta
          onDelta?.(delta)
        }
      } catch {
        // Ignore incomplete SSE chunks; the next chunk may complete the payload.
      }
    }
  }

  return {
    content: fullText,
    finishReason: finishReason ?? 'stop',
  }
}
