<script setup>
import * as echarts from 'echarts'
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import {
  abnormalTypes,
  buildReportStats,
  devices,
  productionTrend,
  reportStats as initialReportStats,
  tasks,
} from '../data/mock'

const route = useRoute()
const loading = ref(false)
const error = ref('')
const summary = ref(route.query.demo === 'ai' ? buildSummary(initialReportStats) : '')
const stats = computed(() => buildReportStats())
const trendChart = ref(null)
const statusChart = ref(null)
const deviceChart = ref(null)
let chartInstances = []

const statusData = computed(() =>
  ['待生产', '生产中', '已完成', '异常'].map((status) => ({
    name: status,
    value: tasks.filter((task) => task.status === status).length,
  })),
)

function buildSummary(currentStats = stats.value) {
  const urgentTasks = tasks.filter((task) => task.urgent && task.status !== '已完成')
  const abnormalDevices = devices.filter((device) => device.status === '异常' || device.status === '预警')
  const riskText =
    urgentTasks.length > 0
      ? `${urgentTasks.map((task) => task.id).join('、')} 需要优先跟进`
      : '当前无加急未完成工单'

  return `今日累计产出 ${currentStats.totalOutput} 件，整体完成率 ${currentStats.completionRate}%，平均设备利用率 ${currentStats.deviceUtilization}%。主要风险为 ${currentStats.topRisk}，${riskText}。建议先处理 ${abnormalDevices.map((device) => device.code).join('、') || '无异常设备'} 的维护和复核，再保持 A/B 产线节拍稳定。`
}

function generateSummary() {
  loading.value = true
  error.value = ''
  summary.value = ''

  window.setTimeout(() => {
    loading.value = false

    if (route.query.fail === '1') {
      error.value = 'AI 小结生成失败：当前演示环境未配置真实模型接口，请稍后重试或查看 mock 兜底结果。'
      return
    }

    summary.value = buildSummary()
  }, 650)
}

function renderCharts() {
  chartInstances.forEach((chart) => chart.dispose())
  chartInstances = [
    echarts.init(trendChart.value),
    echarts.init(statusChart.value),
    echarts.init(deviceChart.value),
  ]

  chartInstances[0].setOption({
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
    color: ['#67e8f9'],
    tooltip: { trigger: 'axis' },
    grid: { left: 48, right: 18, top: 22, bottom: 42 },
    xAxis: {
      type: 'category',
      data: devices.map((device) => device.code),
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
        data: devices.map((device) => device.utilization),
      },
    ],
  })
}

function resizeCharts() {
  chartInstances.forEach((chart) => chart.resize())
}

onMounted(async () => {
  await nextTick()
  renderCharts()
  window.addEventListener('resize', resizeCharts)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', resizeCharts)
  chartInstances.forEach((chart) => chart.dispose())
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
        <span>模拟统计数据 + ECharts + AI 小结</span>
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
          <small>13 台设备平均值</small>
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
          <span>{{ tasks.length }} 条工单</span>
        </div>
        <div ref="statusChart" class="chart-box"></div>
      </article>

      <article class="panel chart-card wide">
        <div class="section-title compact-title">
          <h2>设备利用率排行</h2>
          <span>{{ devices.length }} 台设备</span>
        </div>
        <div ref="deviceChart" class="chart-box"></div>
      </article>

      <article class="panel chart-card">
        <div class="section-title compact-title">
          <h2>异常类型</h2>
          <span>{{ abnormalTypes.length }} 类风险</span>
        </div>
        <ul class="alert-list">
          <li v-for="item in abnormalTypes" :key="item.name">
            {{ item.name }}：{{ item.value }} 次
          </li>
        </ul>
      </article>
    </section>

    <section class="panel">
      <div class="section-title">
        <h2>AI 报表小结</h2>
        <button :disabled="loading" @click="generateSummary">
          {{ loading ? '正在生成...' : 'AI 生成分析小结' }}
        </button>
      </div>
      <p v-if="error" class="feedback error">{{ error }}</p>
      <article v-if="summary" class="ai-summary">
        <strong>AI 生产日报小结</strong>
        <span>{{ summary }}</span>
      </article>
      <article v-if="!summary && !loading && !error" class="panel-inline">
        <strong>等待生成</strong>
        <span>点击按钮后会根据当前工单、设备利用率和异常数据生成一段生产日报说明。</span>
      </article>
    </section>
  </section>
</template>
