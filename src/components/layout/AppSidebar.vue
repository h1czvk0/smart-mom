<script setup>
import {
  Bot,
  ChartColumn,
  CircleAlert,
  ClipboardList,
  Factory,
  LayoutDashboard,
  Pin,
  PinOff,
} from '@lucide/vue'
import { RouterLink, useRoute } from 'vue-router'

defineProps({
  pinned: {
    type: Boolean,
    required: true,
  },
})

const emit = defineEmits(['toggle-pin'])

const route = useRoute()
const menus = [
  { to: '/dashboard', label: '控制台首页', name: 'dashboard', icon: LayoutDashboard },
  { to: '/tasks', label: '生产任务', name: 'tasks', icon: ClipboardList },
  { to: { path: '/tasks', query: { keyword: '异常' } }, label: '异常跟进', name: 'abnormal', icon: CircleAlert },
  { to: '/devices', label: '设备工序', name: 'devices', icon: Factory },
  { to: '/ai', label: '智能助手', name: 'ai', icon: Bot },
  { to: '/reports', label: '生产报表', name: 'reports', icon: ChartColumn },
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

function collapseAfterSelection(event) {
  if (event.detail > 0) {
    event.currentTarget.blur()
  }
}

function togglePin(event) {
  if (event.detail > 0) {
    event.currentTarget.blur()
  }

  emit('toggle-pin')
}
</script>

<template>
  <aside class="sidebar">
    <div class="brand">
      <span class="brand-mark">M</span>
      <div class="sidebar-copy">
        <strong>智造孪生</strong>
        <small>MOM Workbench</small>
      </div>
    </div>
    <div class="sidebar-controls">
      <button
        type="button"
        class="sidebar-pin"
        :class="{ active: pinned }"
        :title="pinned ? '取消固定主导航' : '固定主导航'"
        :aria-label="pinned ? '取消固定主导航' : '固定主导航'"
        @click="togglePin"
      >
        <PinOff v-if="pinned" :size="18" />
        <Pin v-else :size="18" />
        <span class="sidebar-copy">{{ pinned ? '取消固定' : '固定导航' }}</span>
      </button>
    </div>
    <nav>
      <RouterLink
        v-for="item in menus"
        :key="item.name"
        :class="{ 'is-active': isActive(item) }"
        :to="item.to"
        :title="item.label"
        @click="collapseAfterSelection"
      >
        <component :is="item.icon" :size="20" />
        <span class="sidebar-copy">{{ item.label }}</span>
      </RouterLink>
    </nav>
  </aside>
</template>
