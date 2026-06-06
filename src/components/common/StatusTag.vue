<script setup>
const props = defineProps({
  value: {
    type: String,
    required: true,
  },
})

const toneMap = {
  待生产: 'pending',
  生产中: 'running',
  已完成: 'done',
  异常: 'abnormal',
  运行: 'running',
  待机: 'pending',
  预警: 'warning',
  正常: 'done',
}
</script>

<template>
  <span class="status-tag" :class="`status-${toneMap[props.value] ?? 'default'}`">{{ value }}</span>
</template>
