<script setup>
import {
  Bot,
  Database,
  FileText,
  GitCompareArrows,
  MessageCircleQuestionMark,
  MessageSquarePlus,
  MessagesSquare,
  Pin,
  PinOff,
  Settings,
  TriangleAlert,
} from '@lucide/vue'
import MarkdownIt from 'markdown-it'
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
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

const markdown = new MarkdownIt({
  breaks: true,
  html: false,
  linkify: true,
  typographer: false,
})
const WORKBAR_PIN_KEY = 'smart-mom-ai-workbar-pinned'

const chatProfiles = {
  dispatch: {
    label: '班组长问答',
    icon: MessageCircleQuestionMark,
    description: '围绕工单、产线、加急任务和当班处置顺序回答。',
    system:
      '你是智造孪生 MOM 系统的班组长 AI 助手。只能回答与本系统生产任务、工单、产线、设备、工序、报工、异常闭环、生产报表相关的问题。请基于提供的业务上下文回答，不要编造不存在的工单、设备或人员。',
  },
  abnormal: {
    label: '异常处置顾问',
    icon: TriangleAlert,
    description: '优先分析异常工单、风险设备和处置动作。',
    system:
      '你是制造车间异常处置顾问。请优先识别异常工单、加急任务、风险设备、影响范围和下一步闭环动作。回答必须包含优先级和责任建议，格式使用 Markdown。',
  },
  manager: {
    label: '管理汇报助手',
    icon: FileText,
    description: '用管理层视角总结完成率、产出、资源和风险。',
    system:
      '你是制造运营经理助理。请面向管理层输出简洁、可汇报的 Markdown 摘要，突出完成率、产出、设备利用率、异常风险和管理动作。',
  },
}

const promptMode = ref('dispatch')
const activeTool = ref('chat')
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
      '### 你好，我是你的智能助手\n- 我可以帮你梳理异常工单、加急任务、设备风险和班组处置顺序。\n- 直接把问题发给我，我会结合当前 MOM 数据给出可执行建议。',
  },
])
const comparisonItems = ref(buildComparisonItems())
const comparisonLoading = ref(false)
const chatFeed = ref(null)
const shouldFollowMessages = ref(true)
const workbarPinned = ref(window.localStorage.getItem(WORKBAR_PIN_KEY) === 'true')
const suppressWorkbarHover = ref(false)
let messageId = 2
let abortController = null
let comparisonAbortController = null
let scrollFrame = null

const workspaceTools = [
  { value: 'chat', label: '对话', icon: MessagesSquare },
  { value: 'context', label: '业务上下文', icon: Database },
  { value: 'prompt', label: 'Prompt', icon: Settings },
  { value: 'compare', label: '提示词对比', icon: GitCompareArrows },
]
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
const workspaceTitle = computed(() => workspaceTools.find((tool) => tool.value === activeTool.value)?.label ?? '对话')

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
  shouldFollowMessages.value = true
  scheduleScrollToBottom()

  try {
    await streamDeepSeekMessages({
      messages: buildChatMessages(),
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
  scheduleScrollToBottom()
}

function handleChatScroll() {
  const feed = chatFeed.value
  if (!feed) return

  const distanceFromBottom = feed.scrollHeight - feed.scrollTop - feed.clientHeight
  shouldFollowMessages.value = distanceFromBottom <= 48

  if (!shouldFollowMessages.value && scrollFrame !== null) {
    cancelAnimationFrame(scrollFrame)
    scrollFrame = null
  }
}

function scheduleScrollToBottom(force = false) {
  if (!force && !shouldFollowMessages.value) return

  if (scrollFrame !== null) {
    cancelAnimationFrame(scrollFrame)
  }

  scrollFrame = requestAnimationFrame(async () => {
    scrollFrame = null
    await nextTick()

    const feed = chatFeed.value
    if (feed) {
      feed.scrollTop = feed.scrollHeight
    }
  })
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
  activeTool.value = 'chat'
  status.value = 'idle'
  error.value = ''
  input.value = '请帮我判断今天优先处理哪些异常工单，并给出下一步动作。'
  messages.value = [
    {
      id: messageId++,
      role: 'assistant',
      content: '### 已开启新的对话\n- 你可以继续问我工单、设备、异常或报表相关的问题。',
    },
  ]
  shouldFollowMessages.value = true
  scheduleScrollToBottom(true)
}

function collapseWorkbarAfterAction(event) {
  event.currentTarget.blur()

  if (!workbarPinned.value) {
    suppressWorkbarHover.value = true
  }
}

function startNewChat(event) {
  clearMessages()
  collapseWorkbarAfterAction(event)
}

function selectProfile(value, event) {
  promptMode.value = value
  activeTool.value = 'chat'
  collapseWorkbarAfterAction(event)
}

function selectTool(value, event) {
  activeTool.value = value
  collapseWorkbarAfterAction(event)
}

function toggleWorkbarPin(event) {
  const wasPinned = workbarPinned.value
  event.currentTarget.blur()
  workbarPinned.value = !workbarPinned.value
  suppressWorkbarHover.value = wasPinned
}

watch(activeTool, (tool) => {
  if (tool === 'chat') {
    shouldFollowMessages.value = true
    scheduleScrollToBottom(true)
  }
})

watch(workbarPinned, (value) => {
  window.localStorage.setItem(WORKBAR_PIN_KEY, String(value))
})

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
  return markdown.render(value)
}

onBeforeUnmount(() => {
  abortController?.abort()
  comparisonAbortController?.abort()
  if (scrollFrame !== null) {
    cancelAnimationFrame(scrollFrame)
  }
})
</script>

<template>
  <section :class="['ai-chat-shell', { 'workbar-pinned': workbarPinned }]">
    <aside
      :class="['ai-workbar', { 'workbar-suppress-hover': suppressWorkbarHover }]"
      @mouseleave="suppressWorkbarHover = false"
    >
      <div class="ai-workbar-head">
        <button
          type="button"
          class="workbar-pin"
          :class="{ active: workbarPinned }"
          :title="workbarPinned ? '取消固定工具栏' : '固定工具栏'"
          :aria-label="workbarPinned ? '取消固定工具栏' : '固定工具栏'"
          @click="toggleWorkbarPin"
        >
          <PinOff v-if="workbarPinned" :size="18" />
          <Pin v-else :size="18" />
        </button>
        <div class="workbar-title">
          <Bot :size="20" />
          <strong class="workbar-label">智能助手</strong>
        </div>
      </div>

      <button type="button" class="workbar-primary" title="新对话" @click="startNewChat">
        <MessageSquarePlus :size="20" />
        <span class="workbar-label">新对话</span>
      </button>

      <div class="workbar-group">
        <span class="workbar-label">场景</span>
        <button
          v-for="item in chatProfileOptions"
          :key="item.value"
          type="button"
          :class="{ active: promptMode === item.value && activeTool === 'chat' }"
          :title="item.label"
          @click="selectProfile(item.value, $event)"
        >
          <component :is="item.icon" :size="20" />
          <span class="workbar-label">{{ item.label }}</span>
        </button>
      </div>

      <div class="workbar-group">
        <span class="workbar-label">工具</span>
        <button
          v-for="item in workspaceTools"
          :key="item.value"
          type="button"
          :class="{ active: activeTool === item.value }"
          :title="item.label"
          @click="selectTool(item.value, $event)"
        >
          <component :is="item.icon" :size="20" />
          <span class="workbar-label">{{ item.label }}</span>
        </button>
      </div>

      <div class="workbar-status">
        <span :class="['status-dot', `state-${status}`]" :title="statusText"></span>
        <div class="workbar-label">
          <span :class="['ai-state', `state-${status}`]">{{ statusText }}</span>
          <small>{{ aiSource }}</small>
        </div>
      </div>
    </aside>

    <section class="ai-chat-main">
      <header class="ai-chat-header">
        <div>
          <p class="eyebrow">Smart Assistant</p>
          <h2>{{ workspaceTitle }}</h2>
          <span v-if="activeTool === 'chat'">{{ activeProfile.description }}</span>
        </div>
        <button v-if="activeTool === 'chat'" type="button" class="secondary-button" @click="clearMessages">清空对话</button>
      </header>

      <p v-if="error && activeTool === 'chat'" class="feedback error">{{ error }}</p>

      <template v-if="activeTool === 'chat'">
        <div ref="chatFeed" class="chat-feed" @scroll.passive="handleChatScroll">
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
            rows="3"
            placeholder="输入与生产任务、异常、设备或报表相关的问题"
            aria-label="AI 对话输入"
          ></textarea>
          <div class="composer-actions">
            <button type="submit" :disabled="status === 'loading'">
              {{ status === 'loading' ? '生成中...' : '发送' }}
            </button>
            <button v-if="status === 'loading'" type="button" class="secondary-button" @click="cancelMessage">取消</button>
          </div>
        </form>
      </template>

      <section v-else-if="activeTool === 'context'" class="ai-tool-panel">
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
        <div class="prompt-preview">
          <pre>{{ contextPreview }}</pre>
        </div>
      </section>

      <section v-else-if="activeTool === 'prompt'" class="ai-tool-panel">
        <div class="ai-settings-card">
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
            <span>{{ hasDeepSeekApiKey() ? '浏览器直连 Key 已配置' : '本地代理 Key' }}</span>
          </div>
        </div>
        <div class="prompt-preview">
          <pre>{{ currentPromptPreview }}</pre>
        </div>
      </section>

      <section v-else class="ai-tool-panel">
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
      </section>
    </section>
  </section>
</template>
