<script setup>
import { ref } from 'vue'
import { useRoute } from 'vue-router'
import { reportStats } from '../data/mock'

const route = useRoute()
const loading = ref(false)
const error = ref('')
const summary = ref(route.query.demo === 'ai' ? buildSummary() : '')

function buildSummary() {
  return `今日累计产量 ${reportStats.totalOutput} 件，整体完成率 ${reportStats.completionRate}%，设备利用率 ${reportStats.deviceUtilization}%。当前主要风险为：${reportStats.topRisk}。建议优先复核异常工单并安排 C02 设备维护，同时保持 A、D 产线节拍稳定。`
}

function generateSummary() {
  loading.value = true
  error.value = ''
  summary.value = ''

  window.setTimeout(() => {
    loading.value = false
    summary.value = buildSummary()
  }, 600)
}
</script>

<template>
  <section class="panel">
    <div class="section-title">
      <h2>生产报表 / 统计</h2>
      <span>模拟统计数据 + AI 小结</span>
    </div>
    <div class="chart-placeholder">
      今日产量 {{ reportStats.totalOutput }} 件 / 完成率 {{ reportStats.completionRate }}% / 设备利用率
      {{ reportStats.deviceUtilization }}%
    </div>
    <button :disabled="loading" @click="generateSummary">
      {{ loading ? '正在生成...' : 'AI 生成分析小结' }}
    </button>
    <p v-if="error" class="feedback error">{{ error }}</p>
    <article v-if="summary" class="ai-summary">
      <strong>AI 生产日报小结</strong>
      <span>{{ summary }}</span>
    </article>
  </section>
</template>
