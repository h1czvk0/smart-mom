<script setup>
import { computed, ref, watch } from 'vue'
import { RouterView, useRoute } from 'vue-router'
import AppFooter from './components/layout/AppFooter.vue'
import AppHeader from './components/layout/AppHeader.vue'
import AppSidebar from './components/layout/AppSidebar.vue'

const SIDEBAR_PIN_KEY = 'smart-mom-sidebar-pinned'
const route = useRoute()
const isAiWorkspace = computed(() => route.path === '/ai')
const sidebarPinned = ref(window.localStorage.getItem(SIDEBAR_PIN_KEY) === 'true')

watch(sidebarPinned, (value) => {
  window.localStorage.setItem(SIDEBAR_PIN_KEY, String(value))
})
</script>

<template>
  <div :class="['app-shell', { 'sidebar-pinned': sidebarPinned }]">
    <AppSidebar :pinned="sidebarPinned" @toggle-pin="sidebarPinned = !sidebarPinned" />
    <main :class="['workspace', { 'ai-workspace': isAiWorkspace }]">
      <AppHeader />
      <RouterView v-slot="{ Component, route }">
        <Transition name="page-fade" mode="out-in">
          <component :is="Component" :key="route.fullPath" />
        </Transition>
      </RouterView>
      <AppFooter />
    </main>
  </div>
</template>
