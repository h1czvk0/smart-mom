<script setup>
import { computed, onBeforeUnmount, ref } from 'vue'
import { abnormalTypes, buildReportStats } from '../data/mock'
import {
  buildReportPrompt,
  generateDeepSeekReportSummary,
  getDeepSeekConnectionLabel,
  getDeepSeekConfig,
  hasDeepSeekApiKey,
  promptProfiles,
  streamDeepSeekMessages,
} from '../services/deepseekReportService'
import { productionState } from '../stores/productionStore'

const chatProfiles = {
  dispatch: {
    label: '班组长问答',
    description: '围绕工单、产线、加急任务和当班处置顺序回答。',
    system:
      '你是智造孪生 MOM 系统的班组长 AI 助手。只能回答与本系统生产任务、工单、产线、设备、工序、报工、异常闭环、生产报表相关的问题。请基于提供的业务上下文回答，不要编造不存在的工单、设备或人员。',
  },
  abnormal: {
    label: '异常处置顾问',
    description: '优先分析异常工单、风险设备和处置动作。',
    system:
      '你是制造车间异常处置顾问。请优先识别异常工单、加急任务、风险设备、影响范围和下一步闭环动作。回答必须包含优先级和责任建议，格式使用 Markdown。',
  },
  manager: {
    label: '管理汇报助手',
    description: '用管理层视角总结完成率、产出、资源和风险。',
    system:
      '你是制造运营经理助理。请面向管理层输出简洁、可汇报的 Markdown 摘要，突出完成率、产出、设备利用率、异常风险和管理动作。',
  },
}

const promptMode = ref('dispatch')
const input = ref('请帮我判断今天优先处理哪些异常工单，并给出下一步动作。')
const status = ref('idle')
const error = ref('')
const aiSource = ref(getDeepSeekConnectionLabel())
const chatProfileOptions = Object.entries(chatProfiles).map(([value, profile]) => ({
  value,
  ...profile,
}))
const reportPromptOptions = Object.entries(promptProfiles).map(([value, profile]) => ({
  value,
  ...profile,
}))
const messages = ref([
  {
    id: 1,
    role: 'assistant',
    content:
      '### 可以开始提问\n- 我会基于当前 MOM 工单、设备和报表数据回答。\n- 回答会使用真实 DeepSeek / OpenAI 兼容接口生成。',
  },
])
const comparisonItems = ref(buildComparisonItems())
const comparisonLoading = ref(false)
let messageId = 2
let abortController = null
let comparisonAbortController = null

const activeProfile = computed(() => chatProfiles[promptMode.value] ?? chatProfiles.dispatch)
const visibleMessages = computed(() => messages.value.filter((message) => message.content.trim()))
const stats = computed(() => buildReportStats(productionState.tasks, productionState.devices))
const statusText = computed(() => {
  if (status.value === 'loading') return '加载中'
  if (status.value === 'success') return '成功'
  if (status.value === 'error') return '失败'
  return '待提问'
})
const activeTasks = computed(() => productionState.tasks.filter((task) => task.status !== '已完成'))
const urgentTasks = computed(() => activeTasks.value.filter((task) => task.urgent))
const abnormalTasks = computed(() => productionState.tasks.filter((task) => task.status === '异常'))
const riskyDevices = computed(() =>
  productionState.devices.filter((device) => device.status === '异常' || device.status === '预警'),
)
const contextPreview = computed(() => buildBusinessContext())
const currentPromptPreview = computed(() => [
  activeProfile.value.system,
  '',
  '业务上下文：',
  contextPreview.value,
].join('\n'))
const deepSeekConfig = computed(() => getDeepSeekConfig())

async function sendMessage() {
  const content = input.value.trim()

  if (!content) {
    error.value = '请输入需要 AI 分析的生产问题。'
    status.value = 'error'
    return
  }

  abortController?.abort()
  abortController = new AbortController()
  error.value = ''
  status.value = 'loading'
  aiSource.value = `${getDeepSeekConnectionLabel()} · ${deepSeekConfig.value.model}`

  const userContent = content
  messages.value.push({ id: messageId++, role: 'user', content: userContent })
  messages.value.push({ id: messageId++, role: 'assistant', content: '' })
  const assistantIndex = messages.value.length - 1
  input.value = ''

  try {
    await streamDeepSeekMessages({
      messages: buildChatMessages(),
      maxTokens: 900,
      temperature: 0.25,
      signal: abortController.signal,
      onDelta(delta) {
        appendAssistantDelta(assistantIndex, delta)
      },
    })

    status.value = 'success'
  } catch (err) {
    if (err.name === 'AbortError') {
      error.value = 'AI 对话已取消。'
    } else {
      error.value = err.message || 'AI 请求失败，请检查 API Key、网络或本地代理配置。'
    }

    if (!messages.value[assistantIndex].content) {
      messages.value[assistantIndex].content = '### 请求未完成\n- 当前 AI 请求失败或被取消，请查看上方错误提示。'
    }
    status.value = 'error'
  }
}

function appendAssistantDelta(index, delta) {
  messages.value[index].content += delta
}

function buildChatMessages() {
  const history = messages.value
    .filter((message) => message.role === 'user' || message.role === 'assistant')
    .filter((message) => message.content.trim())
    .slice(-8)
    .map((message) => ({
      role: message.role,
      content: message.content,
    }))

  return [
    { role: 'system', content: activeProfile.value.system },
    {
      role: 'user',
      content: `以下是当前 MOM 系统业务上下文，后续回答必须优先参考这些数据：\n${contextPreview.value}`,
    },
    ...history,
  ]
}

function cancelMessage() {
  abortController?.abort()
}

function clearMessages() {
  abortController?.abort()
  status.value = 'idle'
  error.value = ''
  input.value = '请帮我判断今天优先处理哪些异常工单，并给出下一步动作。'
  messages.value = [
    {
      id: messageId++,
      role: 'assistant',
      content: '### 已清空上下文\n- 可以重新选择 Prompt 模式并开始新的多轮对话。',
    },
  ]
}

async function generatePromptComparison() {
  comparisonAbortController?.abort()
  comparisonAbortController = new AbortController()
  comparisonLoading.value = true
  comparisonItems.value = buildComparisonItems('loading')

  for (const item of comparisonItems.value) {
    item.output = ''

    try {
      await generateDeepSeekReportSummary({
        stats: stats.value,
        tasks: productionState.tasks,
        devices: productionState.devices,
        abnormalTypes,
        promptMode: item.value,
        signal: comparisonAbortController.signal,
        onDelta(delta) {
          item.output += delta
        },
      })
      item.status = 'success'
    } catch (err) {
      item.status = 'error'
      item.output = err.name === 'AbortError' ? '提示词对比已取消。' : err.message || '生成失败。'
      break
    }
  }

  comparisonLoading.value = false
}

function cancelComparison() {
  comparisonAbortController?.abort()
}

function buildComparisonItems(initialStatus = 'idle') {
  return reportPromptOptions.map((item) => ({
    ...item,
    status: initialStatus,
    output: '',
  }))
}

function buildBusinessContext() {
  return [
    `统计：累计产出 ${stats.value.totalOutput} 件，计划 ${stats.value.plannedOutput} 件，完成率 ${stats.value.completionRate}%，异常工单 ${stats.value.abnormalCount} 单，设备平均利用率 ${stats.value.deviceUtilization}%。`,
    `加急任务：${urgentTasks.value.map((task) => `${task.id}/${task.product}/${task.line}/${task.progress}%`).join('；') || '无'}`,
    `异常任务：${abnormalTasks.value.map((task) => `${task.id}/${task.product}/${task.abnormalType || '生产异常'}/${task.dueDate}`).join('；') || '无'}`,
    `风险设备：${riskyDevices.value.map((device) => `${device.code}/${device.name}/${device.status}/${device.utilization}%`).join('；') || '无'}`,
  ].join('\n')
}

function renderMarkdown(value) {
  const escaped = escapeHtml(value)
  const lines = escaped.split('\n')
  let html = ''
  let inList = false

  for (const line of lines) {
    if (line.startsWith('### ')) {
      if (inList) {
        html += '</ul>'
        inList = false
      }

      html += `<h3>${line.slice(4)}</h3>`
      continue
    }

    if (line.startsWith('- ')) {
      if (!inList) {
        html += '<ul>'
        inList = true
      }

      html += `<li>${formatInlineMarkdown(line.slice(2))}</li>`
      continue
    }

    if (line.trim()) {
      if (inList) {
        html += '</ul>'
        inList = false
      }

      html += `<p>${formatInlineMarkdown(line)}</p>`
    }
  }

  if (inList) {
    html += '</ul>'
  }

  return html
}

function formatInlineMarkdown(value) {
  return value.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
}

function escapeHtml(value) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

onBeforeUnmount(() => {
  abortController?.abort()
  comparisonAbortController?.abort()
})
</script>

<template>
  <section class="ai-workbench">
    <section class="ai-page-head">
      <div>
        <p class="eyebrow">AI Workbench</p>
        <h2>AI 工作台</h2>
      </div>
      <div class="ai-state-strip">
        <span :class="['ai-state', `state-${status}`]">{{ statusText }}</span>
        <span>{{ aiSource }}</span>
      </div>
    </section>

    <section class="ai-workbench-grid">
      <section class="panel ai-chat-panel">
        <div class="section-title">
          <div>
            <h2>业务多轮对话</h2>
            <span>{{ activeProfile.description }}</span>
          </div>
          <button type="button" class="secondary-button" @click="clearMessages">清空对话</button>
        </div>

        <p v-if="error" class="feedback error">{{ error }}</p>

        <div class="chat-feed">
          <article v-for="message in visibleMessages" :key="message.id" :class="['chat-bubble', message.role]">
            <span>{{ message.role === 'user' ? '我' : 'AI' }}</span>
            <div class="markdown-summary" v-html="renderMarkdown(message.content)"></div>
          </article>
          <article v-if="status === 'loading'" class="chat-bubble assistant typing">
            <span>AI</span>
            <div class="typing-dots" aria-label="AI 正在生成">
              <i></i>
              <i></i>
              <i></i>
            </div>
          </article>
        </div>

        <form class="chat-composer" @submit.prevent="sendMessage()">
          <textarea
            v-model="input"
            :disabled="status === 'loading'"
            rows="4"
            placeholder="输入与生产任务、异常、设备或报表相关的问题"
            aria-label="AI 对话输入"
          ></textarea>
          <div class="composer-actions">
            <button type="submit" :disabled="status === 'loading'">
              {{ status === 'loading' ? '流式生成中...' : '发送问题' }}
            </button>
            <button v-if="status === 'loading'" type="button" class="secondary-button" @click="cancelMessage">取消</button>
          </div>
        </form>
      </section>

      <aside class="ai-side-stack">
        <section class="panel ai-settings-card">
          <div class="section-title compact-title">
            <h2>AI 设置</h2>
            <span>{{ hasDeepSeekApiKey() ? '浏览器直连 Key 已配置' : '建议使用本地代理 Key' }}</span>
          </div>
          <label>
            <span>Prompt 模式</span>
            <select v-model="promptMode" :disabled="status === 'loading'" aria-label="AI Prompt 模式">
              <option v-for="item in chatProfileOptions" :key="item.value" :value="item.value">
                {{ item.label }}
              </option>
            </select>
          </label>
          <div class="ai-config-list">
            <span>模型：{{ deepSeekConfig.model }}</span>
            <span>连接：{{ getDeepSeekConnectionLabel() }}</span>
            <span>接口：{{ deepSeekConfig.useProxy ? deepSeekConfig.proxyUrl : `${deepSeekConfig.baseUrl}/chat/completions` }}</span>
          </div>
        </section>

        <section class="panel">
          <div class="section-title compact-title">
            <h2>业务上下文</h2>
            <span>随问题一起发送</span>
          </div>
          <div class="context-cards">
            <article>
              <span>异常工单</span>
              <strong>{{ abnormalTasks.length }}</strong>
            </article>
            <article>
              <span>加急未完成</span>
              <strong>{{ urgentTasks.length }}</strong>
            </article>
            <article>
              <span>风险设备</span>
              <strong>{{ riskyDevices.length }}</strong>
            </article>
          </div>
        </section>

        <details class="prompt-preview">
          <summary>查看当前对话 Prompt</summary>
          <pre>{{ currentPromptPreview }}</pre>
        </details>
      </aside>
    </section>

    <details class="panel prompt-compare-panel">
      <summary>
        <span>提示词对比报告</span>
      </summary>
      <div class="prompt-compare-body">
        <div class="ai-actions">
          <button type="button" :disabled="comparisonLoading" @click="generatePromptComparison">
            {{ comparisonLoading ? '对比生成中...' : '生成提示词对比' }}
          </button>
          <button v-if="comparisonLoading" type="button" class="secondary-button" @click="cancelComparison">取消</button>
        </div>

        <div class="prompt-compare-grid">
          <article v-for="item in comparisonItems" :key="item.value" class="prompt-card">
            <div>
              <strong>{{ item.label }}</strong>
              <span>{{ item.description }}</span>
            </div>
            <small :class="['ai-state', `state-${item.status}`]">{{ item.status === 'success' ? '成功' : item.status === 'loading' ? '加载中' : item.status === 'error' ? '失败' : '待生成' }}</small>
            <div v-if="item.output" class="ai-summary markdown-summary" v-html="renderMarkdown(item.output)"></div>
            <p v-else>点击生成后展示该提示词对生产日报的影响。</p>
            <details class="prompt-preview compact-prompt">
              <summary>查看 Prompt</summary>
              <pre>{{ buildReportPrompt({ stats, tasks: productionState.tasks, devices: productionState.devices, abnormalTypes, promptMode: item.value }).system }}</pre>
            </details>
          </article>
        </div>
      </div>
    </details>
  </section>
</template>
