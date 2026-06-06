<script setup>
import { RouterView } from 'vue-router'
import AppFooter from './components/layout/AppFooter.vue'
import AppHeader from './components/layout/AppHeader.vue'
import AppSidebar from './components/layout/AppSidebar.vue'
</script>

<template>
  <div class="app-shell">
    <AppSidebar />
    <main class="workspace">
      <AppHeader />
      <RouterView />
      <AppFooter />
    </main>
  </div>
</template>
