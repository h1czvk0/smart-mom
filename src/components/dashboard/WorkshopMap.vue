<script setup>
import { productionLines } from '../../data/mock'
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
