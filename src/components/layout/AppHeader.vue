<script setup>
const today = new Intl.DateTimeFormat('zh-CN', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  weekday: 'short',
}).format(new Date())
</script>

<template>
  <header class="topbar">
    <div>
      <p class="eyebrow">Smart Manufacturing MOM</p>
      <h1>智造孪生 MOM 生产任务管理系统</h1>
    </div>
    <div class="topbar-actions">
      <input type="search" placeholder="搜索工单、设备、产线" aria-label="搜索" />
      <span>{{ today }}</span>
      <strong>实训用户</strong>
    </div>
  </header>
</template>
