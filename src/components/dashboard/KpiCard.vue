<script setup>
defineProps({
  label: String,
  value: [String, Number],
  unit: String,
  tone: {
    type: String,
    default: 'cyan',
  },
})
</script>

<template>
  <article class="kpi-card" :class="`tone-${tone}`">
    <span>{{ label }}</span>
    <strong
      >{{ value }}<small>{{ unit }}</small></strong
    >
  </article>
</template>
