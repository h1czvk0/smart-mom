<script setup>
import { computed } from 'vue'
import { RouterView, useRoute } from 'vue-router'
import AppFooter from './components/layout/AppFooter.vue'
import AppHeader from './components/layout/AppHeader.vue'
import AppSidebar from './components/layout/AppSidebar.vue'

const route = useRoute()
const isAiWorkspace = computed(() => route.path === '/ai')
</script>

<template>
  <div class="app-shell">
    <AppSidebar />
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
