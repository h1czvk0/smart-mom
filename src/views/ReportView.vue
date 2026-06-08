<script setup>
import { BarChart, LineChart, PieChart } from 'echarts/charts'
import { GridComponent, LegendComponent, TooltipComponent } from 'echarts/components'
import { init, use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { abnormalTypes, buildReportStats, productionTrend } from '../data/mock'
import { productionState } from '../stores/productionStore'
import { isLightTheme } from '../stores/themeStore'

use([CanvasRenderer, LineChart, BarChart, PieChart, GridComponent, LegendComponent, TooltipComponent])

const stats = computed(() => buildReportStats(productionState.tasks, productionState.devices))
const trendChart = ref(null)
const statusChart = ref(null)
const deviceChart = ref(null)
const lineChart = ref(null)
const abnormalChart = ref(null)
let chartInstances = []
const appScale = 0.8

const statusData = computed(() =>
  ['待生产', '生产中', '已完成', '异常'].map((status) => ({
    name: status,
    value: productionState.tasks.filter((task) => task.status === status).length,
  })),
)

const chartVersion = computed(() =>
  [
    productionState.tasks.map((task) => `${task.id}:${task.status}:${task.progress}:${task.finishedQty}`).join('|'),
    productionState.devices.map((device) => `${device.code}:${device.status}:${device.utilization}`).join('|'),
  ].join('::'),
)

const lineCompletionData = computed(() =>
  ['A 产线', 'B 产线', 'C 产线', 'D 产线'].map((line) => {
    const lineTasks = productionState.tasks.filter((task) => task.line === line)

    return {
      line,
      rate:
        lineTasks.length === 0
          ? 0
          : Math.round(lineTasks.reduce((sum, task) => sum + task.progress, 0) / lineTasks.length),
    }
  }),
)

const chartTheme = computed(() =>
  isLightTheme.value
    ? {
        text: '#26364a',
        muted: '#52677e',
        axis: '#7f95ac',
        split: '#c7d4e2',
        tooltipBg: '#ffffff',
        tooltipBorder: '#b9c7d6',
      }
    : {
        text: '#dbeafe',
        muted: '#b7c6d8',
        axis: '#4b6682',
        split: '#1d3954',
        tooltipBg: '#0b1d2f',
        tooltipBorder: '#2a4865',
      },
)

function chartTooltip() {
  return {
    backgroundColor: chartTheme.value.tooltipBg,
    borderColor: chartTheme.value.tooltipBorder,
    textStyle: { color: chartTheme.value.text, fontWeight: 500 },
  }
}

function chartAxisLabel(extra = {}) {
  return { color: chartTheme.value.muted, fontWeight: 600, ...extra }
}

function chartLegend(extra = {}) {
  return { textStyle: { color: chartTheme.value.muted, fontWeight: 600 }, ...extra }
}

function renderCharts() {
  if (!trendChart.value || !statusChart.value || !deviceChart.value || !lineChart.value || !abnormalChart.value) {
    return
  }

  if (chartInstances.length === 0) {
    chartInstances = [
      init(trendChart.value, null, { devicePixelRatio: window.devicePixelRatio / appScale }),
      init(statusChart.value, null, { devicePixelRatio: window.devicePixelRatio / appScale }),
      init(deviceChart.value, null, { devicePixelRatio: window.devicePixelRatio / appScale }),
      init(lineChart.value, null, { devicePixelRatio: window.devicePixelRatio / appScale }),
      init(abnormalChart.value, null, { devicePixelRatio: window.devicePixelRatio / appScale }),
    ]
  }

  chartInstances[0].setOption({
    animationDuration: 900,
    animationEasing: 'cubicOut',
    color: ['#5eead4', '#f59e0b'],
    tooltip: { trigger: 'axis', ...chartTooltip() },
    legend: chartLegend(),
    grid: { left: 42, right: 18, top: 38, bottom: 32 },
    xAxis: {
      type: 'category',
      data: productionTrend.map((item) => item.time),
      axisLabel: chartAxisLabel(),
      axisLine: { lineStyle: { color: chartTheme.value.axis } },
    },
    yAxis: {
      type: 'value',
      axisLabel: chartAxisLabel(),
      splitLine: { lineStyle: { color: chartTheme.value.split } },
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
    tooltip: { trigger: 'item', ...chartTooltip() },
    legend: chartLegend({ bottom: 0 }),
    series: [
      {
        name: '任务状态',
        type: 'pie',
        radius: ['42%', '68%'],
        center: ['50%', '43%'],
        label: { color: chartTheme.value.text, fontWeight: 600 },
        data: statusData.value,
      },
    ],
  })

  chartInstances[2].setOption({
    animationDuration: 900,
    animationEasing: 'cubicOut',
    color: ['#67e8f9'],
    tooltip: { trigger: 'axis', ...chartTooltip() },
    grid: { left: 48, right: 18, top: 22, bottom: 42 },
    xAxis: {
      type: 'category',
      data: productionState.devices.map((device) => device.code),
      axisLabel: chartAxisLabel({ interval: 0 }),
      axisLine: { lineStyle: { color: chartTheme.value.axis } },
    },
    yAxis: {
      type: 'value',
      max: 100,
      axisLabel: chartAxisLabel({ formatter: '{value}%' }),
      splitLine: { lineStyle: { color: chartTheme.value.split } },
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
    tooltip: { trigger: 'axis', ...chartTooltip() },
    grid: { left: 48, right: 18, top: 24, bottom: 42 },
    xAxis: {
      type: 'category',
      data: lineCompletionData.value.map((item) => item.line),
      axisLabel: chartAxisLabel(),
      axisLine: { lineStyle: { color: chartTheme.value.axis } },
    },
    yAxis: {
      type: 'value',
      max: 100,
      axisLabel: chartAxisLabel({ formatter: '{value}%' }),
      splitLine: { lineStyle: { color: chartTheme.value.split } },
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
    tooltip: { trigger: 'item', ...chartTooltip() },
    legend: chartLegend({ bottom: 0 }),
    series: [
      {
        name: '异常类型',
        type: 'pie',
        radius: ['38%', '66%'],
        center: ['50%', '43%'],
        label: { color: chartTheme.value.text, fontWeight: 600 },
        data: abnormalTypes,
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

watch(chartVersion, async () => {
  await nextTick()
  renderCharts()
})

watch(isLightTheme, async () => {
  await nextTick()
  renderCharts()
})

onBeforeUnmount(() => {
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
          <small>按全部工单的工序节点进度计算</small>
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
          <h2>产线工序进度</h2>
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

  </section>
</template>
