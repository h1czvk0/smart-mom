<script setup>
import KpiCard from '../components/dashboard/KpiCard.vue'
import WorkshopMap from '../components/dashboard/WorkshopMap.vue'
import { kpis, tasks } from '../data/mock'
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
        <span>3 条待处理</span>
      </div>
      <ul class="alert-list">
        <li>设备 C02 温度异常，建议检查冷却系统。</li>
        <li>WO-20260606-009 报工不良率高于阈值。</li>
        <li>A03 节拍延迟，需调整工序排程。</li>
      </ul>
    </section>

    <section class="panel table-panel">
      <div class="section-title">
        <h2>生产任务概览</h2>
        <span>mock 数据动态渲染</span>
      </div>
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
          <tr v-for="task in tasks" :key="task.id">
            <td data-label="工单号">{{ task.id }}</td>
            <td data-label="产品">{{ task.product }}</td>
            <td data-label="产线">{{ task.line }}</td>
            <td data-label="状态">
              <span class="status-tag">{{ task.status }}</span>
            </td>
            <td data-label="进度">
              <div class="progress-bar"><span :style="{ width: `${task.progress}%` }"></span></div>
            </td>
          </tr>
        </tbody>
      </table>
    </section>
  </section>
</template>
