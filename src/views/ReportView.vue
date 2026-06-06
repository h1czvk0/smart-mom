<script setup>
import { BarChart, LineChart, PieChart } from 'echarts/charts'
import { GridComponent, LegendComponent, TooltipComponent } from 'echarts/components'
import { init, use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { abnormalTypes, buildReportStats, productionTrend } from '../data/mock'
import {
  buildReportPrompt,
  generateDeepSeekReportSummary,
  getDeepSeekConnectionLabel,
  getDeepSeekConfig,
  hasDeepSeekApiKey,
  promptProfiles,
} from '../services/deepseekReportService'
import { productionState } from '../stores/productionStore'

use([CanvasRenderer, LineChart, BarChart, PieChart, GridComponent, LegendComponent, TooltipComponent])

const route = useRoute()
const loading = ref(false)
const error = ref('')
const summary = ref('')
const promptMode = ref('standard')
const aiSource = ref(getDeepSeekConnectionLabel())
const stats = computed(() => buildReportStats(productionState.tasks, productionState.devices))
const trendChart = ref(null)
const statusChart = ref(null)
const deviceChart = ref(null)
const lineChart = ref(null)
const abnormalChart = ref(null)
let chartInstances = []
let abortController = null

const promptOptions = Object.entries(promptProfiles).map(([value, profile]) => ({
  value,
  ...profile,
}))

const statusData = computed(() =>
  ['待生产', '生产中', '已完成', '异常'].map((status) => ({
    name: status,
    value: productionState.tasks.filter((task) => task.status === status).length,
  })),
)

const chartVersion = computed(() =>
  [
    productionState.tasks.map((task) => `${task.id}:${task.status}:${task.finishedQty}`).join('|'),
    productionState.devices.map((device) => `${device.code}:${device.status}:${device.utilization}`).join('|'),
  ].join('::'),
)

const lineCompletionData = computed(() =>
  ['A 产线', 'B 产线', 'C 产线', 'D 产线'].map((line) => {
    const lineTasks = productionState.tasks.filter((task) => task.line === line)
    const planned = lineTasks.reduce((sum, task) => sum + task.planQty, 0)
    const finished = lineTasks.reduce((sum, task) => sum + task.finishedQty, 0)

    return {
      line,
      rate: planned === 0 ? 0 : Math.round((finished / planned) * 100),
    }
  }),
)

const promptPreview = computed(() =>
  buildReportPrompt({
    stats: stats.value,
    tasks: productionState.tasks,
    devices: productionState.devices,
    abnormalTypes,
    promptMode: promptMode.value,
  }),
)

const renderedSummary = computed(() => renderMarkdown(summary.value))
const deepSeekConfig = computed(() => getDeepSeekConfig())

async function generateSummary() {
  loading.value = true
  error.value = ''
  summary.value = ''
  aiSource.value = `${getDeepSeekConnectionLabel()} · ${deepSeekConfig.value.model}`
  abortController?.abort()
  abortController = new AbortController()

  try {
    await generateDeepSeekReportSummary({
      stats: stats.value,
      tasks: productionState.tasks,
      devices: productionState.devices,
      abnormalTypes,
      promptMode: promptMode.value,
      forceFail: route.query.fail === '1',
      signal: abortController.signal,
      onDelta(delta) {
        summary.value += delta
      },
    })
  } catch (err) {
    if (err.name === 'AbortError') {
      error.value = 'AI 小结生成已取消。'
    } else {
      error.value = err.message || 'AI 小结生成失败，请检查 API Key、网络或模型配置。'
    }
  } finally {
    loading.value = false
  }
}

function cancelSummary() {
  abortController?.abort()
}

function renderCharts() {
  if (!trendChart.value || !statusChart.value || !deviceChart.value || !lineChart.value || !abnormalChart.value) {
    return
  }

  if (chartInstances.length === 0) {
    chartInstances = [
      init(trendChart.value),
      init(statusChart.value),
      init(deviceChart.value),
      init(lineChart.value),
      init(abnormalChart.value),
    ]
  }

  chartInstances[0].setOption({
    animationDuration: 900,
    animationEasing: 'cubicOut',
    color: ['#5eead4', '#f59e0b'],
    tooltip: { trigger: 'axis' },
    legend: { textStyle: { color: '#9fb2c6' } },
    grid: { left: 42, right: 18, top: 38, bottom: 32 },
    xAxis: {
      type: 'category',
      data: productionTrend.map((item) => item.time),
      axisLabel: { color: '#9fb2c6' },
      axisLine: { lineStyle: { color: '#27445f' } },
    },
    yAxis: {
      type: 'value',
      axisLabel: { color: '#9fb2c6' },
      splitLine: { lineStyle: { color: '#17314a' } },
    },
    series: [
      {
        name: '实际产出',
        type: 'line',
        smooth: true,
        data: productionTrend.map((item) => item.output),
      },
      {
        name: '计划目标',
        type: 'line',
        smooth: true,
        data: productionTrend.map((item) => item.target),
      },
    ],
  })

  chartInstances[1].setOption({
    animationDuration: 1000,
    animationEasing: 'quarticOut',
    color: ['#94a3b8', '#38bdf8', '#22c55e', '#ef4444'],
    tooltip: { trigger: 'item' },
    legend: { bottom: 0, textStyle: { color: '#9fb2c6' } },
    series: [
      {
        name: '任务状态',
        type: 'pie',
        radius: ['42%', '68%'],
        center: ['50%', '43%'],
        label: { color: '#dbeafe' },
        data: statusData.value,
      },
    ],
  })

  chartInstances[2].setOption({
    animationDuration: 900,
    animationEasing: 'cubicOut',
    color: ['#67e8f9'],
    tooltip: { trigger: 'axis' },
    grid: { left: 48, right: 18, top: 22, bottom: 42 },
    xAxis: {
      type: 'category',
      data: productionState.devices.map((device) => device.code),
      axisLabel: { color: '#9fb2c6', interval: 0 },
      axisLine: { lineStyle: { color: '#27445f' } },
    },
    yAxis: {
      type: 'value',
      max: 100,
      axisLabel: { color: '#9fb2c6', formatter: '{value}%' },
      splitLine: { lineStyle: { color: '#17314a' } },
    },
    series: [
      {
        name: '利用率',
        type: 'bar',
        barWidth: 16,
        data: productionState.devices.map((device) => device.utilization),
      },
    ],
  })

  chartInstances[3].setOption({
    animationDuration: 900,
    animationEasing: 'cubicOut',
    color: ['#22c55e'],
    tooltip: { trigger: 'axis' },
    grid: { left: 48, right: 18, top: 24, bottom: 42 },
    xAxis: {
      type: 'category',
      data: lineCompletionData.value.map((item) => item.line),
      axisLabel: { color: '#9fb2c6' },
      axisLine: { lineStyle: { color: '#27445f' } },
    },
    yAxis: {
      type: 'value',
      max: 100,
      axisLabel: { color: '#9fb2c6', formatter: '{value}%' },
      splitLine: { lineStyle: { color: '#17314a' } },
    },
    series: [
      {
        name: '完成率',
        type: 'bar',
        barWidth: 28,
        data: lineCompletionData.value.map((item) => item.rate),
      },
    ],
  })

  chartInstances[4].setOption({
    animationDuration: 1000,
    animationEasing: 'quarticOut',
    color: ['#ef4444', '#f59e0b', '#8b5cf6'],
    tooltip: { trigger: 'item' },
    legend: { bottom: 0, textStyle: { color: '#9fb2c6' } },
    series: [
      {
        name: '异常类型',
        type: 'pie',
        radius: ['38%', '66%'],
        center: ['50%', '43%'],
        label: { color: '#dbeafe' },
        data: abnormalTypes,
      },
    ],
  })
}

function resizeCharts() {
  chartInstances.forEach((chart) => chart.resize())
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

onMounted(async () => {
  await nextTick()
  renderCharts()
  window.addEventListener('resize', resizeCharts)
})

watch(chartVersion, async () => {
  await nextTick()
  renderCharts()
})

onBeforeUnmount(() => {
  abortController?.abort()
  window.removeEventListener('resize', resizeCharts)
  chartInstances.forEach((chart) => chart.dispose())
  chartInstances = []
})
</script>

<template>
  <section class="report-page">
    <section class="panel">
      <div class="section-title">
        <div>
          <p class="eyebrow">Production Analytics</p>
          <h2>生产报表 / 统计</h2>
        </div>
        <span>模拟统计数据 + ECharts + DeepSeek AI</span>
      </div>

      <div class="report-kpis">
        <article>
          <span>累计产出</span>
          <strong>{{ stats.totalOutput }}</strong>
          <small>件 / 计划 {{ stats.plannedOutput }} 件</small>
        </article>
        <article>
          <span>完成率</span>
          <strong>{{ stats.completionRate }}%</strong>
          <small>按工单完成数量计算</small>
        </article>
        <article>
          <span>异常工单</span>
          <strong>{{ stats.abnormalCount }}</strong>
          <small>{{ stats.topRisk }}</small>
        </article>
        <article>
          <span>设备利用率</span>
          <strong>{{ stats.deviceUtilization }}%</strong>
          <small>{{ productionState.devices.length }} 台设备平均值</small>
        </article>
      </div>
    </section>

    <section class="chart-grid">
      <article class="panel chart-card">
        <div class="section-title compact-title">
          <h2>产量趋势</h2>
          <span>实际 / 计划</span>
        </div>
        <div ref="trendChart" class="chart-box"></div>
      </article>

      <article class="panel chart-card">
        <div class="section-title compact-title">
          <h2>任务状态占比</h2>
          <span>{{ productionState.tasks.length }} 条工单</span>
        </div>
        <div ref="statusChart" class="chart-box"></div>
      </article>

      <article class="panel chart-card wide">
        <div class="section-title compact-title">
          <h2>设备利用率排行</h2>
          <span>{{ productionState.devices.length }} 台设备</span>
        </div>
        <div ref="deviceChart" class="chart-box"></div>
      </article>

      <article class="panel chart-card">
        <div class="section-title compact-title">
          <h2>产线完成率</h2>
          <span>A / B / C / D</span>
        </div>
        <div ref="lineChart" class="chart-box"></div>
      </article>

      <article class="panel chart-card">
        <div class="section-title compact-title">
          <h2>异常类型分布</h2>
          <span>{{ abnormalTypes.length }} 类风险</span>
        </div>
        <div ref="abnormalChart" class="chart-box"></div>
      </article>
    </section>

    <section class="panel ai-panel">
      <div class="section-title">
        <div>
          <h2>AI 报表小结</h2>
          <span>{{ aiSource }}</span>
        </div>
        <div class="ai-actions">
          <select v-model="promptMode" :disabled="loading" aria-label="Prompt 模式">
            <option v-for="item in promptOptions" :key="item.value" :value="item.value">
              {{ item.label }}
            </option>
          </select>
          <button type="button" :disabled="loading" @click="generateSummary">
            {{ loading ? '流式生成中...' : 'AI 生成分析小结' }}
          </button>
          <button v-if="loading" type="button" class="secondary-button" @click="cancelSummary">取消</button>
        </div>
      </div>

      <div class="ai-meta">
        <span>模型：{{ deepSeekConfig.model }}</span>
        <span>Base URL：{{ deepSeekConfig.baseUrl }}</span>
        <span>{{ hasDeepSeekApiKey() ? '已配置浏览器直连 Key' : '推荐使用本地代理环境变量 DEEPSEEK_API_KEY' }}</span>
      </div>

      <p v-if="error" class="feedback error">{{ error }}</p>
      <article v-if="summary" class="ai-summary markdown-summary" v-html="renderedSummary"></article>
      <article v-if="!summary && !loading && !error" class="panel-inline">
        <strong>等待生成</strong>
        <span>点击按钮后会优先通过本地代理调用 DeepSeek API；未配置 Key 时自动使用 mock 流式兜底，仍可展示打字机效果。</span>
      </article>

      <details class="prompt-preview">
        <summary>查看当前 Prompt 设计</summary>
        <pre>{{ promptPreview.system }}</pre>
        <pre>{{ promptPreview.user }}</pre>
      </details>
    </section>
  </section>
</template>
