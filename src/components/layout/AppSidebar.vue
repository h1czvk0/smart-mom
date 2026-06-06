<script setup>
import { RouterLink } from 'vue-router'

const menus = [
  { path: '/dashboard', label: '控制台首页' },
  { path: '/tasks', label: '生产任务' },
  { path: '/tasks/WO-20260606-001', label: '任务报工' },
  { path: '/devices', label: '设备工序' },
  { path: '/reports', label: '生产报表' },
]
</script>

<template>
  <aside class="sidebar">
    <div class="brand">
      <span class="brand-mark">M</span>
      <div>
        <strong>智造孪生</strong>
        <small>MOM Workbench</small>
      </div>
    </div>
    <nav>
      <RouterLink v-for="item in menus" :key="item.path" :to="item.path">
        {{ item.label }}
      </RouterLink>
    </nav>
  </aside>
</template>
