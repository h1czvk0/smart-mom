<script setup>
defineProps({
  value: {
    type: Number,
    required: true,
  },
})
</script>

<template>
  <div class="progress-wrap">
    <div class="progress-bar">
      <span :style="{ width: `${Math.min(Math.max(value, 0), 100)}%` }"></span>
    </div>
    <strong>{{ value }}%</strong>
  </div>
</template>
