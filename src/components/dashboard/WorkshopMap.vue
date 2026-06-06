<script setup>
import { computed } from 'vue'
import { productionState } from '../../stores/productionStore'

const lines = ['A 产线', 'B 产线', 'C 产线', 'D 产线']

const productionLines = computed(() =>
  lines.map((line) => ({
    name: line,
    task: productionState.tasks.find((task) => task.line === line && task.status !== '已完成')?.id ?? '暂无待执行任务',
    devices: productionState.devices
      .filter((device) => device.line === line)
      .slice(0, 4)
      .map((device) => ({
        code: device.code,
        status: mapDeviceStatus(device.status),
      })),
  })),
)

function mapDeviceStatus(status) {
  return {
    运行: 'running',
    待机: 'idle',
    预警: 'warning',
    异常: 'down',
  }[status]
}
</script>

<template>
  <section class="panel workshop-panel">
    <div class="section-title">
      <div>
        <p class="eyebrow">Digital Twin Workshop</p>
        <h2>数字孪生车间态势图</h2>
      </div>
      <span class="live-dot">实时模拟</span>
    </div>
    <div class="workshop-map">
      <div v-for="line in productionLines" :key="line.name" class="line-row">
        <strong>{{ line.name }}</strong>
        <div class="line-track">
          <span
            v-for="device in line.devices"
            :key="device.code"
            class="device-node"
            :class="device.status"
          >
            {{ device.code }}
          </span>
        </div>
        <em>{{ line.task }}</em>
      </div>
    </div>
  </section>
</template>
