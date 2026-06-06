<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const searchText = ref('')
const today = new Intl.DateTimeFormat('zh-CN', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  weekday: 'short',
}).format(new Date())

function submitSearch() {
  const keyword = searchText.value.trim()

  if (!keyword) {
    router.push('/tasks')
    return
  }

  router.push({
    path: '/tasks',
    query: { keyword },
  })
}
</script>

<template>
  <header class="topbar">
    <div>
      <p class="eyebrow">Smart Manufacturing MOM</p>
      <h1>智造孪生 MOM 生产任务管理系统</h1>
    </div>
    <form class="topbar-actions" @submit.prevent="submitSearch">
      <input v-model="searchText" type="search" placeholder="搜索工单、设备、产线" aria-label="搜索" />
      <button type="submit" class="secondary-button">搜索</button>
      <span>{{ today }}</span>
      <strong>实训用户</strong>
    </form>
  </header>
</template>
