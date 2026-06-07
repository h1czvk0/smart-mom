<script setup>
import { RouterLink, useRoute } from 'vue-router'

const route = useRoute()
const menus = [
  { to: '/dashboard', label: '控制台首页', name: 'dashboard' },
  { to: '/tasks', label: '生产任务', name: 'tasks' },
  { to: { path: '/tasks', query: { keyword: '异常' } }, label: '异常跟进', name: 'abnormal' },
  { to: '/devices', label: '设备工序', name: 'devices' },
  { to: '/ai', label: 'AI 工作台', name: 'ai' },
  { to: '/reports', label: '生产报表', name: 'reports' },
]

function isActive(item) {
  if (item.name === 'tasks') {
    return route.path === '/tasks' && !route.query.keyword
  }

  if (item.name === 'abnormal') {
    return route.path === '/tasks' && route.query.keyword === '异常'
  }

  return route.path === item.to
}
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
      <RouterLink v-for="item in menus" :key="item.name" :class="{ 'is-active': isActive(item) }" :to="item.to">
        {{ item.label }}
      </RouterLink>
    </nav>
  </aside>
</template>
