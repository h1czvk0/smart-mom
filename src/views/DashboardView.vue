<script setup>
import { computed } from 'vue'
import ProgressBar from '../components/common/ProgressBar.vue'
import StatusTag from '../components/common/StatusTag.vue'
import KpiCard from '../components/dashboard/KpiCard.vue'
import WorkshopMap from '../components/dashboard/WorkshopMap.vue'
import { buildKpis } from '../data/mock'
import { productionState } from '../stores/productionStore'

const kpis = computed(() => buildKpis(productionState.tasks, productionState.devices))
const abnormalTasks = computed(() => productionState.tasks.filter((task) => task.status === '异常'))
const urgentTasks = computed(() => productionState.tasks.filter((task) => task.urgent && task.status !== '已完成'))
const deviceRisks = computed(() =>
  productionState.devices.filter((device) => device.status === '异常' || device.status === '预警'),
)
</script>

<template>
  <section class="page-grid">
    <div class="kpi-grid">
      <KpiCard v-for="item in kpis" :key="item.label" v-bind="item" />
    </div>

    <WorkshopMap />

    <section class="panel">
      <div class="section-title">
        <h2>异常预警</h2>
        <span>{{ abnormalTasks.length + deviceRisks.length }} 条待处理</span>
      </div>
      <ul class="alert-list">
        <li v-for="task in abnormalTasks" :key="task.id">
          {{ task.id }} {{ task.product }}：{{ task.abnormalType || '生产异常' }}
        </li>
        <li v-for="device in deviceRisks" :key="device.code">
          设备 {{ device.code }} {{ device.name }} 状态为 {{ device.status }}，建议复核维护计划。
        </li>
      </ul>
    </section>

    <section class="panel">
      <div class="section-title">
        <h2>加急任务</h2>
        <span>{{ urgentTasks.length }} 单</span>
      </div>
      <div class="task-cards compact-cards">
        <article v-for="task in urgentTasks" :key="task.id" class="task-card">
          <strong>{{ task.id }}</strong>
          <span>{{ task.product }} / {{ task.line }}</span>
          <ProgressBar :value="task.progress" />
          <small>截止：{{ task.deadline }}</small>
        </article>
      </div>
    </section>

    <section class="panel table-panel">
      <div class="section-title">
        <h2>生产任务概览</h2>
        <span>store 数据动态渲染</span>
      </div>
      <div class="table-scroll">
        <table>
          <thead>
            <tr>
              <th>工单号</th>
              <th>产品</th>
              <th>产线</th>
              <th>状态</th>
              <th>进度</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="task in productionState.tasks.slice(0, 8)" :key="task.id">
              <td data-label="工单号">{{ task.id }}</td>
              <td data-label="产品">{{ task.product }}</td>
              <td data-label="产线">{{ task.line }}</td>
              <td data-label="状态"><StatusTag :value="task.status" /></td>
              <td data-label="进度"><ProgressBar :value="task.progress" /></td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </section>
</template>
